"use strict";
exports.__esModule = true;
var Terminal_1 = require("./Terminal");
var Grammar = /** @class */ (function () {
    function Grammar(inputStr) {
        this.m_terminals = new Array();
        this.m_symbols = new Set();
        this.m_nonterminals = new Map();
        this.m_usedterminals = new Set();
        var terminal_section = true;
        var varList = inputStr.split("\n");
        var _loop_1 = function (i) {
            if (terminal_section) {
                var splitList = varList[i].split(" -> ", 2);
                var symbol = null;
                var regex = null;
                if (splitList.length == 2) {
                    symbol = splitList[0];
                    regex = splitList[1];
                    var terminalRegex = RegExp(regex, "gy");
                    var term = new Terminal_1.Terminal(symbol, terminalRegex);
                    if (this_1.m_symbols.has(symbol)) {
                        throw new Error("Error: variable redeclaration " + term.sym);
                    }
                    this_1.m_terminals.push(term);
                    this_1.m_symbols.add(symbol);
                    console.log(term.sym + " : " + term.rex);
                }
                else {
                    if (varList[i].length === 0) {
                        this_1.m_terminals.push(new Terminal_1.Terminal("WHITESPACE", new RegExp("\\s+", "gy")));
                        terminal_section = false;
                        console.log("Terminal section over");
                    }
                    else {
                        throw Error("Syntax error: " + varList[i] + " is invalid declaration");
                    }
                }
            }
            else {
                // Non terminal section
                var splitList = varList[i].split(" -> ", 2);
                var leftSide = splitList[0];
                var alternation = splitList[1].split(" | "); // splits rhs into different | terms
                var newProdArray_1 = new Array();
                alternation.forEach(function (production) {
                    var productionList = new Array();
                    var nonTermsRightSide = production.split(" "); //splits each equation into individual terms seperated by space character.
                    nonTermsRightSide.forEach(function (nonTerm) {
                        var nTerm = nonTerm.trim();
                        if (nTerm !== '')
                            productionList.push(nTerm);
                    });
                    newProdArray_1.push(productionList);
                });
                if (this_1.m_nonterminals.has(leftSide)) {
                    //concat new productions to an existing nonterminal
                    var oldList = this_1.m_nonterminals.get(leftSide);
                    var newList = oldList.concat(newProdArray_1);
                    this_1.m_nonterminals.set(leftSide, newList);
                }
                else {
                    if (this_1.m_nonterminals.size == 0)
                        this_1.m_nonterminalStart = leftSide;
                    //Create new nonterminal
                    this_1.m_nonterminals.set(leftSide, newProdArray_1);
                }
            }
        };
        var this_1 = this;
        for (var i = 0; i < varList.length - 1; i++) {
            _loop_1(i);
        }
        this.check_valid();
    }
    Grammar.prototype.check_valid = function () {
        var _this = this;
        console.log(this.m_nonterminals);
        var neighborSet = new Set();
        this.depth_first_search(this.m_nonterminalStart, neighborSet);
        console.log(neighborSet);
        //nonterminal usage check
        this.m_nonterminals.forEach(function (value, symbol) {
            if (!neighborSet.has(symbol)) {
                throw Error("Error: there is an unreachable nonterminal: " + symbol);
            }
        });
        //terminal usage check
        this.m_symbols.forEach(function (symbol) {
            if (!_this.m_usedterminals.has(symbol)) {
                throw Error("Error: this is an unused terminal: " + symbol);
            }
        });
    };
    Grammar.prototype.depth_first_search = function (label, neighborSet) {
        var _this = this;
        //When entering the search, add the label to the set of neighbors and then visit all of its neighbors
        neighborSet.add(label);
        var productionList = this.m_nonterminals.get(label);
        productionList.forEach(function (production) {
            //Go through each production, which is a list of symbols representing terminals/nonterminals
            production.forEach(function (symbol) {
                //Each symbol in a single production, will either be a terminal or nonterminal
                if (!_this.m_symbols.has(symbol) && !_this.m_nonterminals.has(symbol)) {
                    throw Error("Error: symbol not defined: " + symbol);
                }
                else if (_this.m_nonterminals.has(symbol) && !neighborSet.has(symbol)) {
                    //recursively check this new symbols neighbors
                    _this.depth_first_search(symbol, neighborSet);
                }
                else if (_this.m_symbols.has(symbol)) {
                    //add a terminal to the used terminals list
                    _this.m_usedterminals.add(symbol);
                }
            });
        });
    };
    return Grammar;
}());
exports.Grammar = Grammar;
//# sourceMappingURL=Grammar.js.map