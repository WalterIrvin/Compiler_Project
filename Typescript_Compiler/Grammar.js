"use strict";
exports.__esModule = true;
var Terminal_1 = require("./Terminal");
var Grammar = /** @class */ (function () {
    function Grammar(inputStr, tokenOnlyFlag) {
        if (tokenOnlyFlag === void 0) { tokenOnlyFlag = false; }
        this.m_terminals = new Array();
        this.m_symbols = new Set();
        this.m_nonterminals = new Map();
        this.m_usedterminals = new Set();
        this.m_startVar = null;
        var terminal_section = true;
        var varList = inputStr.split("\n");
        this.m_terminals.push(new Terminal_1.Terminal("WHITESPACE", new RegExp("\\s+", "gy")));
        var _loop_1 = function (i) {
            if (terminal_section) {
                var splitList = varList[i].split("->", 2);
                var symbol = null;
                var regex = null;
                if (splitList.length == 2) {
                    symbol = splitList[0].trim();
                    regex = splitList[1].trim();
                    var terminalRegex = RegExp(regex, "gy");
                    var term = new Terminal_1.Terminal(symbol, terminalRegex);
                    if (this_1.m_symbols.has(symbol)) {
                        throw new Error("Error: variable redeclaration " + term.sym);
                    }
                    this_1.m_terminals.push(term);
                    this_1.m_symbols.add(symbol);
                }
                else { // split len != 2
                    if (!tokenOnlyFlag) {
                        if (varList[i].length === 0) {
                            terminal_section = false;
                        }
                        else {
                            throw Error("Syntax error: " + varList[i] + " is invalid declaration");
                        }
                    }
                }
            }
            else {
                // Non terminal section
                var splitList = varList[i].split(" -> ", 2);
                if (splitList.length != 2)
                    return "continue";
                var leftSide = splitList[0];
                if (this_1.m_startVar === null) {
                    //Sets the name of the start variable
                    this_1.m_startVar = leftSide;
                }
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
        for (var i = 0; i < varList.length; i++) {
            _loop_1(i);
        }
        this.check_valid();
    }
    Grammar.prototype.check_valid = function () {
        var _this = this;
        var neighborSet = new Set();
        this.depth_first_search(this.m_nonterminalStart, neighborSet);
        //nonterminal usage check
        this.m_nonterminals.forEach(function (value, symbol) {
            if (!neighborSet.has(symbol)) {
                throw Error("Error: there is an unreachable nonterminal: " + symbol);
            }
        });
        //terminal usage check
        this.m_symbols.forEach(function (symbol) {
            if (!_this.m_usedterminals.has(symbol) && symbol !== "COMMENT") {
                throw Error("Error: this is an unused terminal: " + symbol);
            }
        });
    };
    Grammar.prototype.depth_first_search = function (label, neighborSet) {
        var _this = this;
        //When entering the search, add the label to the set of neighbors and then visit all of its neighbors
        neighborSet.add(label);
        var productionList = this.m_nonterminals.get(label);
        if (productionList !== undefined) {
            productionList.forEach(function (production) {
                //Go through each production, which is a list of symbols representing terminals/nonterminals
                production.forEach(function (symbol) {
                    //Each symbol in a single production, will either be a terminal or nonterminal
                    if (!_this.m_symbols.has(symbol) && !_this.m_nonterminals.has(symbol) && symbol !== "lambda") {
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
        }
    };
    Grammar.prototype.getNullable = function () {
        var null_set = new Set();
        var _loop_2 = function () {
            var flag = true;
            this_2.m_nonterminals.forEach(function (productionList, N) {
                //production list is the entire production list, with possibly multiple production lists
                productionList.forEach(function (termList) {
                    //list of individual terms in a production     Ex: ["lamba"], ["A", "B", "C"]
                    if (termList.length === 1) {
                        if (termList[0] === "lambda") {
                            termList = new Array();
                        }
                    }
                    var allNullable = termList.every(function (sym) {
                        return null_set.has(sym);
                    });
                    if (allNullable) {
                        if (!null_set.has(N)) {
                            null_set.add(N);
                            flag = false;
                        }
                    }
                });
            });
            if (flag) {
                return "break";
            }
        };
        var this_2 = this;
        while (true) {
            var state_1 = _loop_2();
            if (state_1 === "break")
                break;
        }
        return null_set;
    };
    Grammar.prototype.getFirst = function () {
        //Pre-init section
        var null_set = this.getNullable();
        var first = new Map();
        this.m_nonterminals.forEach(function (prodlist, N) {
            first.set(N, new Set());
        });
        this.m_terminals.forEach(function (term) {
            first.set(term.sym, new Set());
            first.get(term.sym).add(term.sym);
        });
        first["delete"]("WHITESPACE"); // ignore whitespace
        //console.log("----BEFORE-----");
        //console.log(first);
        //console.log("----LOOP-------");
        var flag = true;
        //Normal section
        while (flag) { // repeat until it stabilizes
            flag = false;
            this.m_nonterminals.forEach(function (productionList, N) {
                //production list is the entire production list, with possibly multiple production lists
                productionList.forEach(function (P) {
                    //list of individual terms in a production     Ex: ["lamba"], ["A", "B", "C"]
                    P.every(function (sym) {
                        if (sym !== "lambda") {
                            first.get(sym).forEach(function (x) {
                                if (!first.get(N).has(x)) {
                                    first.get(N).add(x);
                                    flag = true;
                                }
                            });
                        }
                        if (null_set.has(sym)) {
                            return true;
                        }
                        else {
                            return false;
                        }
                    });
                });
            });
        }
        //console.log("------AFTER-----");
        //console.log(first);
        //console.log("------LOOP------");
        return first;
    };
    Grammar.prototype.getFollow = function () {
        var _this = this;
        var null_set = this.getNullable();
        var first = this.getFirst();
        var follow = new Map();
        this.m_nonterminals.forEach(function (prodlist, N) {
            follow.set(N, new Set());
        });
        follow["delete"]("WHITESPACE"); // ignore whitespace
        follow.set(this.m_startVar, new Set("$"));
        var flag = true;
        while (flag) {
            flag = false;
            this.m_nonterminals.forEach(function (productionList, N) {
                //production list is the entire production list, with possibly multiple production lists
                productionList.forEach(function (P) {
                    var _loop_3 = function (i) {
                        var broke_loop = false;
                        var sym = P[i];
                        if (_this.m_nonterminals.has(sym)) {
                            for (var y = i + 1; y < P.length; y++) {
                                var y_sym = P[y];
                                //union(follow[x], first[y])
                                first.get(y_sym).forEach(function (y_str) {
                                    //check for each string in first[y], if it isn't in follow[x] then add it to the set
                                    if (!follow.get(sym).has(y_str)) {
                                        follow.get(sym).add(y_str);
                                        flag = true;
                                    }
                                });
                                if (!null_set.has(y_sym)) {
                                    //If y is not nullable, break loop
                                    broke_loop = true;
                                    break;
                                }
                            }
                            if (!broke_loop) {
                                //If we didn't break from loop, union follow[x] and follow[N] together.
                                //What this means is that follow[x] currently has no non-nullable items in it, and such can be unioned.
                                //union(follow[N], follow[x])
                                follow.get(N).forEach(function (x) {
                                    if (!follow.get(sym).has(x)) {
                                        follow.get(sym).add(x);
                                        flag = true;
                                    }
                                });
                            }
                        }
                    };
                    //list of individual terms in a production     Ex: ["lamba"], ["A", "B", "C"]    
                    for (var i = 0; i < P.length; i++) {
                        _loop_3(i);
                    }
                });
            });
        }
        return follow;
    };
    return Grammar;
}());
exports.Grammar = Grammar;
//# sourceMappingURL=Grammar.js.map