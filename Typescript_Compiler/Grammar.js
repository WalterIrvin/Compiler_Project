"use strict";
exports.__esModule = true;
var Terminal_1 = require("./Terminal");
var NonTerminal_1 = require("./NonTerminal");
var Grammar = /** @class */ (function () {
    function Grammar(inputStr) {
        this.m_terminals = new Array();
        this.m_symbols = new Set();
        this.m_leftNonTerm = new Map(); // terminals defined on left side
        this.m_allNonTerms = new Map(); // total terminals found on left-right side
        this.m_startVar = null;
        var terminal_section = true;
        var varList = inputStr.split("\n");
        for (var i = 0; i < varList.length; i++) {
            if (terminal_section) {
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
                    if (varList[i].length === 0) {
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
                var alternation = splitList[1].split("|"); // splits rhs into different | terms
                for (var a = 0; a < alternation.length; a++) {
                    var neighbor_list = alternation[a].split(" ");
                    var n_set = new Set(); // the local relative neighbors to this current NonTerminal
                    for (var b = 0; b < neighbor_list.length; b++) {
                        if (!n_set.has(neighbor_list[b]) && neighbor_list[b] !== "") {
                            n_set.add(neighbor_list[b]);
                        }
                    }
                    // construct the non Terminal and add to set if not already existing, if it already exists, add the two neighborlists together
                    if (!this.m_leftNonTerm.has(leftSide)) {
                        this.add_new_nonTerminal(leftSide, n_set);
                    }
                    else {
                        this.existing_terminal(leftSide, n_set);
                    }
                }
            }
        }
        this.m_terminals.push(new Terminal_1.Terminal("WHITESPACE", new RegExp("\\s+", "gy")));
        this.check_valid();
    }
    Grammar.prototype.check_valid = function () {
        var _this = this;
        var terminalChecker = new Set(); //gets the set of all reachable vars from the start variable
        depth_first_search(this.m_startVar, terminalChecker);
        // check if all non-terminals are defined
        this.m_allNonTerms.forEach(function (value, key) {
            if (!_this.m_leftNonTerm.has(key)) {
                throw Error("Error: Undefined non-terminal: " + key);
            }
        });
        //check that all non-terminals are reachable from the start variable
        this.m_leftNonTerm.forEach(function (value, key) {
            if (!terminalChecker.has(key)) {
                // If the terminal is not within the group which can be reached from start, error
                throw Error("Error: Unreachable non-terminal: " + key);
            }
        });
    };
    Grammar.prototype.existing_terminal = function (leftSide, n_set) {
        var _this = this;
        if (this.m_symbols.has(leftSide)) {
            //Attempting to redefine a terminal in non-terminal section, error
            throw Error("Error: Attempting to redefine a terminal in non-terminal section: " + leftSide);
        }
        if (!this.m_leftNonTerm.has(leftSide)) {
            //definition is not currently on left - side, so add existing var to the leftside map.
            var nTerm = this.m_allNonTerms.get(leftSide);
            this.m_leftNonTerm.set(leftSide, nTerm);
        }
        var tmp_list = new Array(); //tmp list to add new neighbors / referenced neighbors
        // this nonterminal already exists in the nonTermLabel set, so append all unique terms to the neighbor set of this variable
        n_set.forEach(function (label) {
            if (!_this.m_allNonTerms.has(label)) {
                //Neighbor hasn't yet been seen in the label set, so create new NonTerminal
                if (!_this.m_symbols.has(label)) {
                    //If this thing is not a terminal, then add to all non-terminal map.
                    var nTerm = new NonTerminal_1.NonTerminal(label);
                    _this.m_allNonTerms.set(label, nTerm);
                    tmp_list.push(nTerm);
                }
            }
            else {
                //Neighbor already exists
                var nTerm = _this.m_allNonTerms.get(label);
                tmp_list.push(nTerm);
            }
        });
        //append new found neighbors to existing item
        this.m_leftNonTerm.get(leftSide).addNeighbors(tmp_list);
    };
    Grammar.prototype.add_new_nonTerminal = function (leftSide, n_set) {
        var _this = this;
        if (this.m_symbols.has(leftSide)) {
            //Attempting to redefine a terminal in non-terminal section, error
            throw Error("Error: Attempting to redefine a terminal in non-terminal section: " + leftSide);
        }
        var tmp_list = new Array(); //tmp list to add new neighbors / referenced neighbors
        // The nonTerm has not been created yet, so its neighbor list is whatever it is created with
        var nonTerm = new NonTerminal_1.NonTerminal(leftSide);
        if (this.m_leftNonTerm.size == 0) // checks if this is the first non terminal, if so sets it to be the start variable
         {
            this.m_startVar = nonTerm;
        }
        this.m_leftNonTerm.set(leftSide, nonTerm); //Adds defined non terminal to the left side map.
        this.m_allNonTerms.set(leftSide, nonTerm); //Adds to list of all non-terminals
        n_set.forEach(function (label) {
            if (!_this.m_allNonTerms.has(label)) {
                //Neighbor hasn't yet been seen in the label set, so create new NonTerminal
                if (!_this.m_symbols.has(label)) {
                    //If this thing is not a terminal, then add to all non-terminal map.
                    var nTerm = new NonTerminal_1.NonTerminal(label);
                    _this.m_allNonTerms.set(label, nTerm);
                    tmp_list.push(nTerm);
                }
            }
            else {
                //Neighbor already exists
                var nTerm = _this.m_allNonTerms.get(label);
                tmp_list.push(nTerm);
            }
        });
        nonTerm.setNeighbors(tmp_list);
    };
    return Grammar;
}());
exports.Grammar = Grammar;
function depth_first_search(N, neighborSet) {
    console.log("TEST: " + N.label);
    neighborSet.add(N.label);
    N.neighbors.forEach(function (w) {
        if (!neighborSet.has(w.label)) {
            depth_first_search(w, neighborSet);
        }
    });
}
//# sourceMappingURL=Grammar.js.map