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


//ASM 5
class VarType {
    protected constructor() {
    }
    //convenience objects so we don't have to change
    //our existing code
    static readonly INTEGER = new VarType();
    static readonly STRING = new VarType();
    static readonly DOUBLE = new VarType();
    static readonly VOID = new VarType();
}

class FuncVarType extends VarType {
    readonly argTypes: VarType[];
    readonly argNames: string[];
    readonly retType: VarType;
    constructor(argTypes: VarType[], argNames: string[], retType: VarType) {
        super();
        this.retType = retType;
        this.argTypes = argTypes;
        this.argNames = argNames;
    }
}
//ASM5

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
    emit("%include \"doCall.asm\"");
    emit("default rel");
    emit("section .text");
    emit("global main");
    emit("main:");
    //ASM4 Code
    emit("mov arg0, 0");
    emit("mov arg1, string_r");
    emit("ffcall fdopen");
    emit("mov[stdin], rax");
    emit("mov arg0, 1");
    emit("mov arg1, string_w");
    emit("ffcall fdopen");
    emit("mov[stdout], rax");
    //ASM4 End Code
    programNodeCode(root, true);
    programNodeCode(root, false);
    emit("ret");
    emit("section .data");
    //ASM4 DATA SECTION
    emit("stdin: dq 0");
    emit("stdout: dq 0");
    emit("string_r: db 'r', 0");
    emit("string_w: db 'w', 0");
    emit("string_a: db 'a', 0");
    emit("string_rplus: db 'r+', 0");
    emit("string_percent_s: db '%s', 0");
    emit("string_percent_d: db '%d', 0");
    emit("fgets_buffer: times 64 db 0");
    //ASM4 END DATA SECTION
    outputSymbolTableInfo();
    outputStringPoolInfo();
    stringPool = new Map<string, string>();
    symtable = new SymbolTable();
    return asmCode.join("\n");
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
        case "func_call":
            funccallNodeCode(c);
            break;
        case "return_stmt":
            returnstmtNodeCode(c);
            break;
        default:
            console.log("Error  in stmtNode");
            ICE();
    }
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
    syntaxError(rec: any, sym: any, line: number, column: number, msg: string, e: any) {
        throw new Error("Syntax error:" + msg + "on line" + line + "at column" + column);
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
        case "func_call":
            let type = funccallNodeCode(n.children[0]);
            if (type === VarType.VOID) {
                generalError("error: Can't use void in expression");
            }
            emit("push rax");
            return type;
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

function typeNodeCode(n: TreeNode): VarType {
    let l_type = n.token.lexeme;
    let f_type = VarType.INTEGER;
    if (l_type === "int")
        f_type = VarType.INTEGER;
    else if (l_type === "string")
        f_type = VarType.STRING;
    else if (l_type === "void")
        f_type = VarType.VOID;
    else if (l_type === "double")
        f_type = VarType.DOUBLE;
    return f_type;
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
    let ns = s;
    let slash_counter = 0;
    let final_str = "";
    for (let i = 0; i < ns.length; i++) {
        let cur_char = ns[i];
        if (cur_char === "\\") {
            slash_counter += 1;
        }
        else {
            if (slash_counter % 2 === 0) {
                // If slashes are even, then keep literal character, else use the escape seq
                let tmp = "";
                for (let j = 0; j < slash_counter / 2; j++) {
                    tmp += "\\";
                }
                tmp += cur_char;
                final_str += tmp;
            }
            else {
                let tmp = "";
                for (let j = 0; j < (slash_counter - 1) / 2; j++) {
                    tmp += "\\";
                }
                switch (cur_char) {
                    case "n":
                        tmp += "\n";
                        break;
                    case "\"":
                        tmp += "\"";
                        break;
                    case ">":
                        tmp += "\>";
                        break;
                    default:
                        break;
                }
                final_str += tmp;
            }
            slash_counter = 0;
        }
    }

    if (!stringPool.has(final_str))
        stringPool.set(final_str, label());
    return stringPool.get(final_str);   //return the label
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

// ASM 4

function builtinfunccallNodeCode(n: TreeNode): VarType {
    //builtin-func-call -> PRINT LP expr RP | INPUT LP RP |
    //OPEN LP expr RP | READ LP expr RP | WRITE LP expr CMA expr RP |
    //CLOSE LP expr RP
    switch (n.children[0].sym) {
        //code
        case "PRINT":
            {
                emit("; Starting PRINT");
                let type = exprNodeCode(n.children[2]);
                let fmt: string;
                if (type === VarType.INTEGER) {
                    fmt = "string_percent_d";
                }
                else if (type === VarType.STRING) {
                    fmt = "string_percent_s";
                }
                else {
                    generalError("Attempting to print invalid type...");
                }

                emit("pop arg1");   //the thing to print
                emit(`mov arg0, ${fmt}`); // format, %s or %d
                emit("ffvcall printf, 0");
                //need to call fflush(NULL)
                emit("mov arg0, 0");
                emit("ffcall fflush");
                emit("; Ending PRINT");
            }
        case "INPUT":
            {
                //INPUT LP RP
                //fgets( ptr, size, stream)
                //strtol( ptr, eptr, base )
                emit("mov arg0, fgets_buffer");
                emit("mov arg1, 64");
                emit("mov arg2, [stdin]");
                emit("ffcall fgets");
                //should do error checking...
                emit("mov arg0, fgets_buffer");
                emit("mov arg1, 0");
                emit("mov arg2, 10");
                emit("ffcall strtol");  //result is in rax
                return VarType.INTEGER;
            }
        case "OPEN":
            {
                emit("; Start Open")
                let type = exprNodeCode(n.children[2]);
                if (type !== VarType.STRING)
                    generalError(`Invalid parameter passed to open function. ${type}, expected ${VarType.STRING} (string)`);
                //tmp = fopen( filename, "a" );
                emit("mov arg0, [rsp]");        //filename (string)
                emit("mov arg1, string_a");    //next slide
                emit("ffcall fopen");
                //fclose(tmp)
                emit("mov arg0, rax")
                emit("ffcall fclose");
                //fopen( filename, "r+" )
                emit("pop arg0");        //filename; remove from stack
                emit("mov arg1, string_rplus"); //next slide
                emit("ffcall fopen");     //result is in rax
                emit("; End Open");
                return VarType.INTEGER;
            }
        case "READ":
            {
                emit("; Start Read")
                let type = exprNodeCode(n.children[2]);
                if (type !== VarType.INTEGER)
                    generalError(`Invalid parameter passed to open function. ${type}, expected ${VarType.INTEGER} (integer)`);
                //fgets( ptr, size, handle)
                //strtol( ptr, eptr, base )
                
                emit("mov arg0, fgets_buffer");
                emit("mov arg1, 64");
                emit("pop arg2");
                emit("ffcall fgets");
                //should do error checking...
                emit("mov arg0, fgets_buffer");
                emit("mov arg1, 0");
                emit("mov arg2, 10");
                emit("ffcall strtol");  //result is in rax
                emit("; End read");
                return VarType.INTEGER;
            }
        case "WRITE":
            {
                // WRITE LP expr CMA expr RP
                // fprintf( fp, "%s", str )  or  fprintf( fp, "%d", num )
                emit("; Begin Write");
                let handletype = exprNodeCode(n.children[2]);
                if (handletype !== VarType.INTEGER)
                    generalError("error invalid type");
                let outputtype = exprNodeCode(n.children[4]);
                let fmt: string;
                if (outputtype === VarType.INTEGER)
                    fmt = "string_percent_d";
                else if (outputtype === VarType.STRING)
                    fmt = "string_percent_s";
                else
                    generalError("error invalid type");
                emit("pop arg2");   //the thing to print
                emit(`mov arg1, ${fmt}`);
                emit("pop arg0");   //the handle
                emit("ffvcall fprintf,0");
                //need to call fflush(NULL)
                emit("mov arg0, 0");
                emit("ffcall fflush");
                emit("; End Write");
                return VarType.VOID;
            }
        case "CLOSE":
            {
                emit("; Begin Close");
                let type = exprNodeCode(n.children[2]);
                if (type !== VarType.INTEGER)
                    throw generalError("error: Close requires numeric arg");
                emit("pop arg0"); //argument for fclose
                emit("ffcall fclose");
                emit("; End Close");
                return VarType.VOID;
            }
        case "NOW":
            {

            }
        default:
            ICE();
            break;
        
    }
    return null;
}

// ASM 5

function programNodeCode(n: TreeNode, firstPass: boolean) {
    //program -> var_decl_list braceblock
    if (n.sym !== "program")
        ICE();
    declListNodeCode(n.children[0], firstPass);
}

function declListNodeCode(n: TreeNode, firstPass: boolean) {
    //decl-list ? func-decl decl-list | var-decl SEMI decl-list | ?
    if (n.children.length == 2) {
        funcdeclNodeCode(n.children[0], firstPass);
        declListNodeCode(n.children[1], firstPass);
    }
    else if (n.children.length == 3) {
        vardeclNodeCode(n.children[0], firstPass);
        declListNodeCode(n.children[2], firstPass);
    }

}

function getVarTypeFromToken(n: TreeNode): VarType {
    return typeNodeCode(n);
}

function vardeclNodeCode(n: TreeNode, firstPass: boolean) {
    //var-decl -> TYPE ID
    if (firstPass) {
        vardeclFirstPass(n);
    }
    else {
        vardeclSecondPass(n);
    }
    
}

function vardeclFirstPass(n: TreeNode) {
    let vname = n.children[1].token.lexeme;
    let vtype = typeNodeCode(n.children[0]);
    symtable.set(vname, new VarInfo(vtype, label()));
}

function vardeclSecondPass(n: TreeNode) {

}

function funcdeclNodeCode(n: TreeNode, firstPass: boolean) {
    //func-decl -> TYPE ID LP optional-param-list RP braceblock
    if (firstPass) {
        funcdeclFirstPass(n);
    } else {
        funcdeclSecondPass(n);
    }
}

function funcdeclFirstPass(n: TreeNode) {
    //func-decl -> TYPE ID LP optional-param-list RP braceblock
    let funcName = n.children[1].token.lexeme;
    let returnType = getVarTypeFromToken(n.children[0]);
    let argTypes: VarType[] = [];
    let argNames: string[] = [];
    let lbl = label();
    let vtype = new FuncVarType(argTypes, argNames, returnType);
    //throws error if duplicate name
    symtable.set(funcName, new VarInfo(vtype, lbl));
}

function funcdeclSecondPass(n: TreeNode) {
    //func-decl ? TYPE ID LP optional-param-list RP braceblock
    let funcName = n.children[1].token.lexeme;
    let vinfo: VarInfo = symtable.get(funcName);
    emit(`${vinfo.location}:`);
    braceblockNodeCode(n.children[5]);
}

function funccallNodeCode(n: TreeNode): VarType {
    //func-call -> ID LP optional-expr-list RP | builtin-func-call
    if (n.children.length === 1)
        return builtinfunccallNodeCode(n);
    else {
        let funcname = n.children[0].token.lexeme;
        //throws exception if not found
        let info: VarType = symtable.get(funcname).type;
        if (!(info instanceof FuncVarType)) {
            generalError("error: Can't call a non-function");
        }
        let funcInfo = (info as FuncVarType);
        emit(`call ${symtable.get(funcname).location}`);
        return funcInfo.retType;
    }
}

function returnstmtNodeCode(n: TreeNode) {
    //return-stmt ? RETURN expr | RETURN
    if (n.children.length == 1) {
        emit("ret");
    }
    else {
        exprNodeCode(n.children[1]);
        emit("pop rax");
        emit("ret");
    }
}
