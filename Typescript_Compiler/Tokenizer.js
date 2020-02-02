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
        var _this = this;
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
                var lastEnd = false; // used to determine if the last substring does not have a string following it
                var notAString = true; // if not even string at all, ignore following checks
                var notInString = true; // determines if we should process \n as end of line, or a component of a string
                var startIdx = 0; // when to start the substring for checking \n if we encounter a string section and it closes before end of lexeme
                var endIdx = lexeme.length; // where to stop searching in substring for \n
                var subList = new Array();
                for (var idx = 0; idx < lexeme.length; idx++) {
                    var ch = lexeme.charAt(idx);
                    if (ch === "\"") {
                        notAString = false;
                        if (notInString) {
                            // " detected and we are not in string, start idx will whatever it was when we last exited a string
                            // end idx will be the point at which we detect the new string
                            endIdx = idx;
                            var dist = endIdx - startIdx;
                            if (dist > 0) {
                                var tmp = lexeme.substring(startIdx, endIdx);
                                subList.push(tmp);
                            }
                            lastEnd = false;
                        }
                        else {
                            // " detected and we are currently in string, start idx will be the current idx
                            // endIdx has yet to be determined, but can be assumed the lexeme length until we encounter another "
                            startIdx = idx;
                            endIdx = lexeme.length;
                            lastEnd = true;
                        }
                        notInString = !notInString;
                    }
                }
                if (notAString) {
                    var lineSplitter = lexeme.split("\n");
                    this.lineNumber += lineSplitter.length - 1;
                }
                else {
                    //split for every \n found in non-string section
                    subList.forEach(function (substr) {
                        var lineSplitter = substr.split("\n");
                        _this.lineNumber += lineSplitter.length - 1;
                    });
                    if (lastEnd) {
                        var endString = lexeme.substring(startIdx, endIdx);
                        var lineSplitter = endString.split("\n");
                        this.lineNumber += lineSplitter.length - 1;
                    }
                }
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
//# sourceMappingURL=Tokenizer.js.map