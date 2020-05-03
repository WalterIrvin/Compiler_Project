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
        this.peek_idx = 0;
    }
    Tokenizer.prototype.next_peek = function () {
        return this.peek();
    };
    Tokenizer.prototype.peek = function () {
        if (this.peek_idx >= this.inputData.length - 1) {
            this.peek_idx = this.idx; //reached eof, update peek_idx to match cur idx.
            return "$";
        }
        for (var i = 0; i < this.grammar.m_terminals.length; i++) {
            var terminal = this.grammar.m_terminals[i];
            var sym = terminal.sym;
            var rex = terminal.rex;
            rex.lastIndex = this.peek_idx;
            try {
                var m = rex.exec(this.inputData);
                if (m) {
                    var lexeme = m[0];
                    this.peek_idx += lexeme.length;
                    if (sym !== "WHITESPACE" && sym !== "COMMENT") {
                        //return new token using sym, lexeme, and line num
                        this.peek_idx = this.idx; // done with one peek, return peek_idx back to normal.
                        return terminal.sym;
                    }
                    else {
                        //skip whitespace and get next real token
                        var ret_token = this.next_peek();
                        this.peek_idx = this.idx; // done going ahead, reset the peek_idx
                        return ret_token;
                    }
                }
            }
            catch (e) {
                console.log("regex failed");
                console.log(this.inputData);
            }
        }
        //no match; syntax error
        this.peek_idx = this.idx;
        throw new Error("Peek failed");
    };
    Tokenizer.prototype.peek2 = function () {
        return this.peek();
    };
    Tokenizer.prototype.expect = function (x) {
        var next_token = this.next();
        if (next_token.sym !== x) {
            throw new Error("Error, symbols do not match: " + x + " expected, " + next_token.sym + " received.");
        }
        return next_token;
    };
    Tokenizer.prototype.next = function () {
        this.peek_idx = this.idx;
        if (this.idx >= this.inputData.length - 1) {
            return new Token_1.Token("$", undefined, this.lineNumber);
        }
        this.previous = this.current;
        for (var i = 0; i < this.grammar.m_terminals.length; i++) {
            var terminal = this.grammar.m_terminals[i];
            var sym = terminal.sym;
            var rex = terminal.rex;
            rex.lastIndex = this.idx;
            var m = rex.exec(this.inputData);
            if (m) {
                var lexeme = m[0];
                this.idx += lexeme.length;
                this.peek_idx = this.idx;
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
        console.log(inputData);
        this.inputData = inputData;
        this.lineNumber = 1;
        this.idx = 0;
    };
    return Tokenizer;
}());
exports.Tokenizer = Tokenizer;
//# sourceMappingURL=Tokenizer.js.map