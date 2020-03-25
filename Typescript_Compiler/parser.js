"use strict";
exports.__esModule = true;
var shuntingyard_1 = require("./shuntingyard");
var Token_1 = require("./Token");
var antlr4 = require("./antlr4");
var Lexer = require("./gramLexer.js").gramLexer;
var Parser = require("./gramParser.js").gramParser;
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
    // ASM GENERATOR SECTION
    return "null";
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