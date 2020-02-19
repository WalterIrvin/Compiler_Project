"use strict";
exports.__esModule = true;
var Token_1 = require("./Token");
var Tokenizer = /** @class */ (function () {
    function Tokenizer(grammar) {
        this.grammar = grammar;
        this.lineNumber = 1;
        this.idx = 0;
        this.inputData = "";
        this.previous = undefined;
        this.current = undefined;
    }
    Tokenizer.prototype.next = function () {
        if (this.idx >= this.inputData.length - 1) {
            return new Token_1.Token("$", undefined, this.lineNumber);
        }
        this.previous = this.current; // function returns the next token, so the current token is the previous to that.
        for (var i = 0; i < this.grammar.m_terminals.length; i++) {
            var terminal = this.grammar.m_terminals[i];
            var sym = terminal.sym;
            var rex = terminal.rex;
            rex.lastIndex = this.idx;
            var m = rex.exec(this.inputData);
            if (m) {
                var lexeme = m[0];
                this.idx += lexeme.length;
                if (sym !== "WHITESPACE" && sym !== "COMMENT") {
                    //return new token using sym, lexeme, and line num
                    this.current = new Token_1.Token(terminal.sym, lexeme, this.lineNumber);
                    var lineSplitter = lexeme.split("\n");
                    this.lineNumber += lineSplitter.length - 1;
                    return this.current;
                }
                else {
                    //skip whitespace and get next real token
                    var lineSplitter = lexeme.split("\n");
                    this.lineNumber += lineSplitter.length - 1;
                    var ret_token = this.next();
                    return ret_token;
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
//# sourceMappingURL=Tokenizer.js.map