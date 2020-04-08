import { TreeNode } from "./shuntingyard";
import { Token } from "./Token";
import { PassThrough } from "stream";

declare var require: any;
let antlr4 = require("./antlr4");
let Lexer = require("./gramLexer.js").gramLexer;
let Parser = require("./gramParser.js").gramParser;
let asmCode: string[] = []; 

//<ASM3>
class VarInfo {
    type: VarType;
    location: string;  //asm label
    //also the line number, if you want
    constructor(t: VarType, location: string) {
        this.location = location;
        this.type = t;
    }
}

class SymbolTable {
    table: Map<string, VarInfo>;
    constructor() {
        this.table = new Map();
    }
    get(name: string) {
        if (!this.table.has(name))
            generalError("Does not exist");
        return this.table.get(name);
    }
    set(name: string, v: VarInfo) {
        if (this.table.has(name))
            generalError("Redeclaration");
        this.table.set(name, v);
    }
    has(name: string) {
        return this.table.has(name);
    }
}
//</ ASM3>

export enum VarType {
    STRING,
    INTEGER,
    FLOAT,
} 

export function parse(txt: string) : string
{
    let stream = new antlr4.InputStream(txt);
    let lexer = new Lexer(stream);
    let tokens = new antlr4.CommonTokenStream(lexer);
    let parser = new Parser(tokens);
    parser.buildParseTrees = true;
    //Change the error handling
    let handler = new ErrorHandler();
    lexer.removeErrorListeners();
    lexer.addErrorListener(handler);
    parser.removeErrorListeners();
    parser.addErrorListener(handler);
    //Assumes that start symbol is 'start'
    let antlr_root = parser.start();
    //convert antlr tree to custom format
    let root: TreeNode = walk(parser, antlr_root);
    //Generate asm from the parse tree
    let asm = makeAsm(root.children[0]); // should get program
    return asm;
}

function walk(parser: any, node: any) : TreeNode
{
    let p: any = node.getPayload();
    if (p.ruleIndex === undefined) {
        let line: number = p.line;
        let lexeme: string = p.text;
        let ty: number = p.type;
        let sym: string = parser.symbolicNames[ty];
        if (sym === null) {
            sym = lexeme.toUpperCase();
        }
        let T = new Token(sym, lexeme, line);
        return new TreeNode(sym, T);
    }
    else
    {
        let idx: number = p.ruleIndex;
        let sym: string = parser.ruleNames[idx];
        let N = new TreeNode(sym, undefined);
        for (let i = 0; i < node.getChildCount(); i++)
        {
            let child: any = node.getChild(i);
            N.children.push(walk(parser, child));
        }
        return N;
    }
}

let labelCounter = 0;
function label() {
    let s = "lbl" + labelCounter;
    labelCounter++;
    return s;
}

function makeAsm(root: TreeNode) {
    asmCode = [];
    labelCounter = 0;
    emit("default rel");
    emit("section .text");
    emit("global main");
    emit("main:");
    programNodeCode(root);
    emit("ret");
    emit("section .data");
    outputSymbolTableInfo();
    outputStringPoolInfo();
    stringPool = new Map<string, string>();
    symtable = new SymbolTable();
    return asmCode.join("\n");
}

function programNodeCode(n: TreeNode) {
    //program -> var_decl_list braceblock
    if (n.sym !== "program")
        ICE();
    vardeclListNodeCode(n.children[0]);
    braceblockNodeCode(n.children[1]);
}

function braceblockNodeCode(n: TreeNode) {
    //braceblock -> LBR stmts RBR
    stmtsNodeCode(n.children[1]);
}

function stmtsNodeCode(n: TreeNode) {
    //stmts -> stmt stmts | lambda
    if (n.children.length == 0)
        return;
    stmtNodeCode(n.children[0]);
    stmtsNodeCode(n.children[1]);
}

function stmtNodeCode(n: TreeNode) {
    //stmt -> cond | loop | return-stmt SEMI
    let c = n.children[0];
    switch (c.sym) {
        case "cond":
            condNodeCode(c); 
            break;
        case "loop":
            loopNodeCode(c);
            break;
        case "return_stmt":
            returnstmtNodeCode(c);
            break;
        case "assign":
            assignNodeCode(c);
            break;
        default:
            console.log("Error  in stmtNode");
            ICE();
    }
}

function returnstmtNodeCode(n: TreeNode) {
    //return-stmt -> RETURN expr
    exprNodeCode(n.children[1]);
    emit("pop rax");
    emit("ret");
}

function loopNodeCode(n: TreeNode) {
    // loop -> WHILE LP expr RP braceblock;
    var startLoopLabel = label();
    var endLoopLabel = label();
    emit(`${startLoopLabel}:`);
    emit("; While Section");
    exprNodeCode(n.children[2]);    //leaves result in rax
    emit("pop rax"); 
    emit("cmp rax, 0");
    emit("; break out of loop if cond is false");
    emit(`je ${endLoopLabel}`);  //break out of loop if condition is false
    braceblockNodeCode(n.children[4]);
    emit("; Return to top of loop");
    emit(`jmp ${startLoopLabel}`);
    emit("; End loop section");
    emit(`${endLoopLabel}:`);
}

function condNodeCode(n: TreeNode) {
    //cond -> IF LP expr RP braceblock |
    //  IF LP expr RP braceblock ELSE braceblock

    if (n.children.length === 5) {
        //no 'else'
        exprNodeCode(n.children[2]);    //leaves result in rax
        emit("pop rax"); 
        emit("cmp rax, 0");
        var endifLabel = label();
        emit(`je ${endifLabel}`);
        braceblockNodeCode(n.children[4]);
        emit(`${endifLabel}:`);
    } else {
        exprNodeCode(n.children[2]);    //leaves result in rax
        emit("pop rax"); 
        emit("cmp rax, 0");
        var elseLabel = label(); // if cmp fails, we go to else
        var endCondLabel = label(); // if cmp succeeds, we skip else
        emit(`je ${elseLabel}`);
        emit("; If section");
        braceblockNodeCode(n.children[4]);
        emit(`jmp ${endCondLabel}`);
        emit(`${elseLabel}:`);
        emit("; Else section");
        braceblockNodeCode(n.children[6]);
        emit(`${endCondLabel}:`);
        emit("; End cond");
    }
}

function emit(instr: string) {
    //Emits strings of assembly code
    asmCode.push(instr);
}

function ICE() {
    //Internal compiler error
    generalError("Internal Compiler Error");
}
class ErrorHandler
{
    syntaxError(rec: any, sym: any, line: number,
        column: number, msg: string, e: any) {
        console.log("Syntax error: ", msg, " on line ", line,
            " at column ", column);
        throw new Error("Syntax error in ANTLR parse");
    }
}

//ASM 2

function factorNodeCode(n: TreeNode): VarType {
    //factor -> NUM | LP expr RP
    let child = n.children[0];
    switch (child.sym) {
        case "NUM":
            let v = parseInt(child.token.lexeme, 10);
            emit(`push qword ${v}`)
            return VarType.INTEGER;
        case "LP":
            return exprNodeCode(n.children[1]);
        case "ID":
            let variable = symtable.get(child.token.lexeme);
            emit(`push qword [${variable.location}]`);
            return variable.type;
        case "STRING_CONSTANT":
            let add = stringconstantNodeCode(child);
            emit(`push ${add}`);
            return VarType.STRING;
        default:
            console.log("error in factorNode");
            ICE();
    }
}

function exprNodeCode(n: TreeNode): VarType {
    return orexpNodeCode(n.children[0]);
}

function orexpNodeCode(n: TreeNode): VarType {
    //orexp -> orexp OR andexp | andexp
    if (n.children.length === 1) {
        return andexpNodeCode(n.children[0]);
    } else {
        let orexpType = orexpNodeCode(n.children[0]);
        convertStackTopToZeroOrOneInteger(orexpType);


        let lbl = label();
        emit("cmp qword [rsp], 0");
        emit(`jne ${lbl}`);
        emit("add rsp,8");      //discard left result (0)
        let andexpType = andexpNodeCode(n.children[2]);
        convertStackTopToZeroOrOneInteger(andexpType);
        emit(`${lbl}:`);
        return VarType.INTEGER;   //always integer, even if float operands
    }
}

function sumNodeCode(n: TreeNode): VarType {
    //sum -> sum PLUS term | sum MINUS term | term
    if (n.children.length === 1) {
        return termNodeCode(n.children[0]);
    }
    else {
        //emit("; in sumNodeCode; doing sum");
        let sumType = sumNodeCode(n.children[0]);
        //emit("; in sumNodeCode; doing term");
        let termType = termNodeCode(n.children[2]);
        if (sumType !== VarType.INTEGER || termType != VarType.INTEGER) {
            console.log("Error in sumNode");
            ICE();
            //error!
        } else {
            emit("pop rbx");    //second operand
            emit("pop rax");    //first operand
            switch (n.children[1].sym) {
                case "PLUS":
                    emit("add rax, rbx");
                    break;
                case "MINUS":
                    emit("sub rax, rbx");
                    break;
                default:
                    ICE();
            }
            emit("push rax");
            //emit("; done with sumNodeCode");
            return VarType.INTEGER;
        }
    }
}

function convertStackTopToZeroOrOneInteger(type: VarType) {
    if (type === VarType.INTEGER) {
        emit("cmp qword [rsp], 0");
        emit("setne al");
        emit("movzx rax, al");
        emit("mov [rsp], rax");
    } else {
        //error
        generalError("Invalid type");
    }
}

function andexpNodeCode(n: TreeNode): VarType {
    //andexp AND notexp | notexp;
    if (n.children.length === 1) {
        return notexpNodeCode(n.children[0]);
    } else {
        let andexp = andexpNodeCode(n.children[0]);
        convertStackTopToZeroOrOneInteger(andexp);
        let lbl_false = label();
        let lbl_end = label();
        emit("cmp qword [rsp], 1");
        emit(`jne ${lbl_false}`);  // first case false, jump to end-and
        emit("add rsp,8");      //discard left result (0)
        let notexp = notexpNodeCode(n.children[2]);
        convertStackTopToZeroOrOneInteger(notexp);
        emit("cmp qword [rsp], 1");
        emit(`jne ${lbl_false}`);  //second case false, jump to end-and
        emit("pop rax");
        emit("mov rax, 1");
        emit("push rax");
        emit(`jmp ${lbl_end}`);
        emit(`${lbl_false}:`);
        emit("pop rax");
        emit("mov rax, 0");
        emit("push rax");
        emit(`${lbl_end}:`);
        return VarType.INTEGER;
    }
}

function notexpNodeCode(n: TreeNode): VarType {
    //NOT notexp | rel;
    if (n.children.length == 1) {
        return relexpNodeCode(n.children[0]);
    }
    else {
        let result = notexpNodeCode(n.children[1]);
        convertStackTopToZeroOrOneInteger(result); //convert value to 0-1, easier to work with
        //NOT
        let lbl = label();
        let lbl_end = label();
        emit("cmp qword [rsp], 1"); //check if true
        emit(`je ${lbl}`);
        emit("; If 0, make 1");
        emit("pop rax");
        emit("mov rax, 1");
        emit("push rax");
        emit(`jmp ${lbl_end}`);
        emit(`${lbl}:`); //if true, make false
        emit("; If 1, make 0");
        emit("pop rax");
        emit("mov rax, 0");
        emit("push rax");
        emit(`${lbl_end}:`);
        return result;
    }
    
}

function relexpNodeCode(n: TreeNode): VarType {
    //sum RELOP sum | sum
    if (n.children.length === 1)
        return sumNodeCode(n.children[0]);
    else {
        let sum1Type = sumNodeCode(n.children[0]);
        let sum2Type = sumNodeCode(n.children[2]);
        if (sum1Type !== VarType.INTEGER || sum2Type != VarType.INTEGER) {
            //error
        }
        emit("pop rax");    //second operand
        //first operand is on stack
        emit("cmp [rsp],rax");    //do the compare
        switch (n.children[1].token.lexeme) {
            case ">=": emit("setge al"); break;
            case "<=": emit("setle al"); break;
            case ">": emit("setg  al"); break;
            case "<": emit("setl  al"); break;
            case "==": emit("sete  al"); break;
            case "!=": emit("setne al"); break;
            default: console.log("Error relexp"); ICE();
        }
        emit("movzx qword rax, al");   //move with zero extend
        emit("mov [rsp], rax");
        return VarType.INTEGER;
    }
}

function termNodeCode(n: TreeNode): VarType {
    //term MULOP neg | neg;
    //sum -> sum PLUS term | sum MINUS term | term
    if (n.children.length === 1) {
        //if only one child, send term to neg
        //emit("; inside termNodeCode, n.children.length === 1, going to negNodeCode");
        return negNodeCode(n.children[0]);
    }
    else {
        //else send it to term mulop then neg
        console.log(n.children[1]);
        let val1 = termNodeCode(n.children[0]);
        let val = negNodeCode(n.children[2]);
        if (val !== val1) {
            generalError("Error invalid types");
        }

        if (n.children[1].token.lexeme === "*") {
            emit("pop rbx");    //second operand
            emit("pop rax");    //first operand
            emit("imul rbx");
            emit("push rax");
        }
        else if (n.children[1].token.lexeme === "/") {
            emit("mov rdx, 0");
            emit("pop rbx");
            emit("pop rax");
            emit("idiv rbx");
            emit("push rax");
        }
        else if (n.children[1].token.lexeme === "%") {
            emit("mov rdx, 0");
            emit("pop rbx");
            emit("pop rax");
            emit("idiv rbx");
            emit("push rdx");
        }
        return val;
    }
}

function negNodeCode(n: TreeNode): VarType {
    //neg : MINUS neg | factor;
    if (n.children.length === 1) {
        //If len is just one, then it goes to factor
        return factorNodeCode(n.children[0]);
    }
    else {
        
        let val = negNodeCode(n.children[1]);
        emit("pop rax")  // get value off of stack
        emit("neg rax");
        emit("push rax"); // push back onto stack
        return val;
    }
}

//ASM 3
let stringPool: Map<string, string> = new Map<string, string>();
let symtable = new SymbolTable();

function vardeclListNodeCode(n: TreeNode) {
    //var_decl_list : var_decl SEMI var_decl_list | 
    if (n.children.length !== 3)
        return;
    vardeclNodeCode(n.children[0]);
    vardeclListNodeCode(n.children[2]);
}

function typeNodeCode(n: TreeNode): VarType {
    let l_type = n.token.lexeme;
    let f_type = VarType.INTEGER;
    if (l_type === "int")
        f_type = VarType.INTEGER;
    else if (l_type === "string")
        f_type = VarType.STRING;
    return f_type;
}

function vardeclNodeCode(n: TreeNode) {
    //var-decl -> TYPE ID
    let vname = n.children[1].token.lexeme;
    let vtype = typeNodeCode(n.children[0]);
    symtable.set(vname, new VarInfo(vtype, label()));
}

function assignNodeCode(n: TreeNode) {
    // assign -> ID EQ expr
    let t: VarType = exprNodeCode(n.children[2]);
    let vname = n.children[0].token.lexeme;
    if (symtable.get(vname).type !== t)
        generalError("Type mismatch");
    moveBytesFromStackToLocation(symtable.get(vname).location);
}

function moveBytesFromStackToLocation(loc: string) {
    emit("pop rax");
    emit(`mov [${loc}], rax`);
}

function stringconstantNodeCode(n: TreeNode) {
    let s = n.token.lexeme;
    //...strip leading and trailing quotation marks...
    s = s.slice(1, -1);
    //...handle backslash escapes... \" \n \\

    if (!stringPool.has(s))
        stringPool.set(s, label());
    return stringPool.get(s);   //return the label
}

function outputSymbolTableInfo() {
    for (let vname of symtable.table.keys()) {
        let vinfo = symtable.get(vname);
        emit(`${vinfo.location}:`);
        emit("dq 0");
    }
}

function outputStringPoolInfo() {
    stringPool.forEach((value: string, key: string) => {
        emit(`${value}:`);
        for (let i = 0; i < key.length; ++i) {
            emit(`db ${key.charCodeAt(i)}`);
        }
        emit("db 0");
    });
    /* Doesn't work for some reason
    for (let key in stringPool.keys()) {
        let lbl = stringPool.get(key);
        emit(`${lbl}:`);
        for (let i = 0; i < key.length; ++i) {
            emit(`db ${key.charCodeAt(i)}`);
        }
        emit("db 0");   //null terminator
    }
    */
}

function generalError(message: string) {
    //Allows compiler to error while also clearing out any globals.
    symtable = new SymbolTable();
    stringPool = new Map<string, string>();
    labelCounter = 0;
    throw Error(message);
}