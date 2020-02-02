"use strict";
exports.__esModule = true;
var Terminal_1 = require("./Terminal");
var Grammar = /** @class */ (function () {
    function Grammar(inputStr) {
        this.m_terminals = new Array();
        this.m_symbols = new Set();
        var varList = inputStr.split("\n");
        for (var i = 0; i < varList.length - 1; i++) {
            var splitList = varList[i].split(" -> ", 2);
            var symbol = "null";
            var regex = "null";
            if (splitList.length == 2) {
                symbol = splitList[0];
                regex = splitList[1];
                var terminalRegex = RegExp(regex, "gy");
                var term = new Terminal_1.Terminal(symbol, terminalRegex);
                if (this.m_symbols.has(symbol)) {
                    throw new Error("Error: variable redeclaration " + term.sym);
                }
                this.m_terminals.push(term);
                this.m_symbols.add(symbol);
                console.log(term.sym + " : " + term.rex);
            }
            else {
                throw new Error("Invalid syntax, -> not found with the variable declaration " + varList[i]);
            }
        }
        this.m_terminals.push(new Terminal_1.Terminal("WHITESPACE", new RegExp("\\s+", "gy")));
    }
    return Grammar;
}());
exports.Grammar = Grammar;
//# sourceMappingURL=Grammar.js.map