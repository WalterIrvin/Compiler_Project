"use strict";
exports.__esModule = true;
var Token_1 = require("./Token");
var Tokenizer = /** @class */ (function () {
    function Tokenizer(grammar) {
        this.grammar = grammar;
        this.lineNumber = 1;
        this.idx = 0;
        this.inputData = "";
    }
    Tokenizer.prototype.next = function () {
        if (this.idx >= this.inputData.length - 1) {
            return new Token_1.Token("$", undefined, this.lineNumber);
        }
        for (var i = 0; i < this.grammar.m_terminals.length; i++) {
            var terminal = this.grammar.m_terminals[i];
            var sym = terminal.sym;
            var rex = terminal.rex;
            rex.lastIndex = this.idx;
            var m = rex.exec(this.inputData);
            if (m) {
                var lexeme = m[0];
                this.idx += lexeme.length;
                var lineSplitter = lexeme.split("\n");
                this.lineNumber += lineSplitter.length - 1;
                if (sym !== "WHITESPACE" && sym !== "COMMENT") {
                    //return new token using sym, lexeme, and line num
                    return new Token_1.Token(terminal.sym, lexeme, this.lineNumber);
                }
                else {
                    //skip whitespace and get next real token
                    return this.next();
                }
            }
        }
        //no match; syntax error
        throw new Error("Syntax error on line: " + this.lineNumber);
    };
    Tokenizer.prototype.setInput = function (inputData) {
        this.inputData = inputData;
        this.lineNumber = 1;
        this.idx = 0;
    };
    return Tokenizer;
}());
exports.Tokenizer = Tokenizer;
