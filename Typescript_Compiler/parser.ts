import { TreeNode } from "./shuntingyard";
import { Token } from "./Token";

declare var require: any;
let antlr4 = require("./antlr4");
let Lexer = require("./gramLexer.js").gramLexer;
let Parser = require("./gramParser.js").gramParser;
let asmCode: string[] = []; 

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
    return null;
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
    return asmCode.join("\n");
}

function programNodeCode(n: TreeNode) {
    //program -> braceblock
    if (n.sym !== "program")
        ICE();
    braceblockNodeCode(n.children[0]);
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
        default:
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
    throw new Error("Error");
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
        default:
            ICE();
    }
}

function exprNodeCode(n: TreeNode): VarType {
    return orexpNodeCode(n.children[0]);
}
//function exprNodeCode(n: TreeNode) {
    //expr -> NUM
    //let d = parseInt(n.children[0].token.lexeme, 10);   //ERROR UNDEFINED
    //emit(`push qword ${d}`);
//}
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

function andexpNodeCode(n: TreeNode): VarType {
    return notexpNodeCode(n.children[0]);
}

function notexpNodeCode(n: TreeNode): VarType {
    return relexpNodeCode(n.children[0]);
}

function relexpNodeCode(n: TreeNode): VarType {
    return sumNodeCode(n.children[0]);
}

function sumNodeCode(n: TreeNode): VarType {
    //sum -> sum PLUS term | sum MINUS term | term
    if (n.children.length === 1) {
        return termNodeCode(n.children[0]);
    }
    else {
        let sumType = sumNodeCode(n.children[0]);
        let termType = termNodeCode(n.children[2]);
        if (sumType !== VarType.INTEGER || termType != VarType.INTEGER) {
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
            return VarType.INTEGER;
        }
    }
}

function relNodeCode(n: TreeNode): VarType {
    //rel |rarr| sum RELOP sum | sum
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
            default: ICE()
        }
        emit("movzx qword rax, al");   //move with zero extend
        emit("mov [rsp], rax");
        return VarType.INTEGER;
    }
}

function convertStackTopToZeroOrOneInteger(type: VarType) {
    if (type == VarType.INTEGER) {
        emit("cmp qword [rsp], 0");
        emit("setne al");
        emit("movzx rax, al");
        emit("mov [rsp], rax");
    } else {
        //error
    }
}

function termNodeCode(n: TreeNode): VarType {
    //TODO
    return null;
}

function negNodeCode(n: TreeNode): VarType {
    //TODO
    return null;
}