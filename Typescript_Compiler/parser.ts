import { TreeNode } from "./shuntingyard";
import { Token } from "./Token";

declare var require: any;
let antlr4 = require("./antlr4");
let Lexer = require("./gramLexer.js").gramLexer;
let Parser = require("./gramParser.js").gramParser;
let asmCode: string[] = []; 

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
    programNodeCode(root);
    // ASM GENERATOR SECTION
    return "null";
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

function programNodeCode(n: TreeNode) {
    //program -> braceblock
    if (n.sym != "program")
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
            condNodeCode(c); break;
        case "loop":
            loopNodeCode(c); break;
        case "return-stmt":
            returnstmtNodeCode(c); break;
        default:
            ICE();
    }
}

function emit(instr: string) {
    //Emits strings of assembly code
    asmCode.push(instr);
}

function ICE() {
    //Internal compiler error
    throw new Error("Oof");
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