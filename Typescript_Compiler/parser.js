"use strict";
exports.__esModule = true;
var shuntingyard_1 = require("./shuntingyard");
var Token_1 = require("./Token");
var antlr4 = require("./antlr4");
var Lexer = require("./gramLexer.js").gramLexer;
var Parser = require("./gramParser.js").gramParser;
var asmCode = [];
function parse(txt) {
    var stream = new antlr4.InputStream(txt);
    var lexer = new Lexer(stream);
    var tokens = new antlr4.CommonTokenStream(lexer);
    var parser = new Parser(tokens);
    parser.buildParseTrees = true;
    //Change the error handling
    var handler = new ErrorHandler();
    lexer.removeErrorListeners();
    lexer.addErrorListener(handler);
    parser.removeErrorListeners();
    parser.addErrorListener(handler);
    //Assumes that start symbol is 'start'
    var antlr_root = parser.start();
    //convert antlr tree to custom format
    var root = walk(parser, antlr_root);
    //Generate asm from the parse tree
    var asm = makeAsm(root.children[0]); // should get program
    return asm;
}
exports.parse = parse;
function walk(parser, node) {
    var p = node.getPayload();
    if (p.ruleIndex === undefined) {
        var line = p.line;
        var lexeme = p.text;
        var ty = p.type;
        var sym = parser.symbolicNames[ty];
        if (sym === null) {
            sym = lexeme.toUpperCase();
        }
        var T = new Token_1.Token(sym, lexeme, line);
        return new shuntingyard_1.TreeNode(sym, T);
    }
    else {
        var idx = p.ruleIndex;
        var sym = parser.ruleNames[idx];
        var N = new shuntingyard_1.TreeNode(sym, undefined);
        for (var i = 0; i < node.getChildCount(); i++) {
            var child = node.getChild(i);
            N.children.push(walk(parser, child));
        }
        return N;
    }
    return null;
}
var labelCounter = 0;
function label() {
    var s = "lbl" + labelCounter;
    labelCounter++;
    return s;
}
function makeAsm(root) {
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
function programNodeCode(n) {
    //program -> braceblock
    if (n.sym !== "program")
        ICE();
    braceblockNodeCode(n.children[0]);
}
function braceblockNodeCode(n) {
    //braceblock -> LBR stmts RBR
    stmtsNodeCode(n.children[1]);
}
function stmtsNodeCode(n) {
    //stmts -> stmt stmts | lambda
    if (n.children.length == 0)
        return;
    stmtNodeCode(n.children[0]);
    stmtsNodeCode(n.children[1]);
}
function stmtNodeCode(n) {
    //stmt -> cond | loop | return-stmt SEMI
    var c = n.children[0];
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
function returnstmtNodeCode(n) {
    //return-stmt -> RETURN expr
    exprNodeCode(n.children[1]);
    emit("pop rax");
    emit("ret");
}
function exprNodeCode(n) {
    //expr -> NUM
    var d = parseInt(n.children[0].token.lexeme, 10);
    emit("push qword " + d);
}
function loopNodeCode(n) {
    // loop -> WHILE LP expr RP braceblock;
    var startLoopLabel = label();
    var endLoopLabel = label();
    emit(startLoopLabel + ":");
    emit("; While Section");
    exprNodeCode(n.children[2]); //leaves result in rax
    emit("pop rax");
    emit("cmp rax, 0");
    emit("; break out of loop if cond is false");
    emit("je " + endLoopLabel); //break out of loop if condition is false
    braceblockNodeCode(n.children[4]);
    emit("; Return to top of loop");
    emit("jmp " + startLoopLabel);
    emit("; End loop section");
    emit(endLoopLabel + ":");
}
function condNodeCode(n) {
    //cond -> IF LP expr RP braceblock |
    //  IF LP expr RP braceblock ELSE braceblock
    if (n.children.length === 5) {
        //no 'else'
        exprNodeCode(n.children[2]); //leaves result in rax
        emit("pop rax");
        emit("cmp rax, 0");
        var endifLabel = label();
        emit("je " + endifLabel);
        braceblockNodeCode(n.children[4]);
        emit(endifLabel + ":");
    }
    else {
        exprNodeCode(n.children[2]); //leaves result in rax
        emit("pop rax");
        emit("cmp rax, 0");
        var elseLabel = label(); // if cmp fails, we go to else
        var endCondLabel = label(); // if cmp succeeds, we skip else
        emit("je " + elseLabel);
        emit("; If section");
        braceblockNodeCode(n.children[4]);
        emit("jmp " + endCondLabel);
        emit(elseLabel + ":");
        emit("; Else section");
        braceblockNodeCode(n.children[6]);
        emit(endCondLabel + ":");
        emit("; End cond");
    }
}
function emit(instr) {
    //Emits strings of assembly code
    asmCode.push(instr);
}
function ICE() {
    //Internal compiler error
    throw new Error("Error");
}
var ErrorHandler = /** @class */ (function () {
    function ErrorHandler() {
    }
    ErrorHandler.prototype.syntaxError = function (rec, sym, line, column, msg, e) {
        console.log("Syntax error: ", msg, " on line ", line, " at column ", column);
        throw new Error("Syntax error in ANTLR parse");
    };
    return ErrorHandler;
}());
//# sourceMappingURL=parser.js.map