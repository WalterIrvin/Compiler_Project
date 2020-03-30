import { Terminal } from "./Terminal";

export class Grammar {
    m_terminals: Array<Terminal> = new Array<Terminal>();
    m_symbols: Set<string> = new Set<string>();
    m_nonterminals: Map<string, Array<Array<string>>> = new Map<string, Array<Array<string>>>();
    m_nonterminalStart: string;
    m_usedterminals: Set<string> = new Set<string>();
    m_startVar: string = null;

    constructor(inputStr: string, tokenOnlyFlag: boolean=false) {
        let terminal_section: Boolean = true;
        let varList = inputStr.split("\n");
        this.m_terminals.push(new Terminal("WHITESPACE", new RegExp("\\s+", "gy")));
        for (let i = 0; i < varList.length; i++) {
            if (terminal_section) {
                let splitList = varList[i].split("->", 2);
                let symbol = null;
                let regex = null;
                if (splitList.length == 2) {
                    symbol = splitList[0].trim();
                    regex = splitList[1].trim();
                    let terminalRegex = RegExp(regex, "gy");
                    let term: Terminal = new Terminal(symbol, terminalRegex);
                    if (this.m_symbols.has(symbol)) {
                        throw new Error("Error: variable redeclaration " + term.sym);
                    }
                    this.m_terminals.push(term);
                    this.m_symbols.add(symbol);
                }
                else { // split len != 2
                    if (!tokenOnlyFlag)
                    {
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
                let splitList = varList[i].split(" -> ", 2);
                if (splitList.length != 2)
                    continue;
                let leftSide = splitList[0];
                if (this.m_startVar === null) {
                    //Sets the name of the start variable
                    this.m_startVar = leftSide;
                }
                let alternation = splitList[1].split(" | "); // splits rhs into different | terms
                let newProdArray = new Array<Array<string>>();
                
                alternation.forEach((production: string) => {
                    let productionList = new Array<string>();
                    let nonTermsRightSide = production.split(" "); //splits each equation into individual terms seperated by space character.
                    nonTermsRightSide.forEach((nonTerm: string) => {
                        let nTerm = nonTerm.trim();
                        if (nTerm !== '')
                            productionList.push(nTerm);
                    });
                    newProdArray.push(productionList);

                });
                if (this.m_nonterminals.has(leftSide))
                {
                    //concat new productions to an existing nonterminal
                    let oldList = this.m_nonterminals.get(leftSide);
                    let newList = oldList.concat(newProdArray);
                    this.m_nonterminals.set(leftSide, newList);
                }
                else
                {
                    if (this.m_nonterminals.size == 0)
                        this.m_nonterminalStart = leftSide
                    //Create new nonterminal
                    this.m_nonterminals.set(leftSide, newProdArray);
                }
                
            }
        }
        this.check_valid();
        
    }

    check_valid()
    {
        let neighborSet = new Set<string>();
        this.depth_first_search(this.m_nonterminalStart, neighborSet);

        //nonterminal usage check
        this.m_nonterminals.forEach((value: string[][], symbol: string) => {
            if (!neighborSet.has(symbol))
            {
                throw Error("Error: there is an unreachable nonterminal: " + symbol);
            }
        });

        //terminal usage check
        this.m_symbols.forEach((symbol: string) => {
            if (!this.m_usedterminals.has(symbol) && symbol !== "COMMENT")
            {
                throw Error("Error: this is an unused terminal: " + symbol);
            }
        });
    }

    depth_first_search(label: string, neighborSet: Set<string>)
    {
        //When entering the search, add the label to the set of neighbors and then visit all of its neighbors
        neighborSet.add(label);
        let productionList: Array<Array<string>> = this.m_nonterminals.get(label);
        if (productionList !== undefined)
        {
            productionList.forEach((production: string[]) => {
                //Go through each production, which is a list of symbols representing terminals/nonterminals
                production.forEach((symbol: string) => {
                    //Each symbol in a single production, will either be a terminal or nonterminal
                    if (!this.m_symbols.has(symbol) && !this.m_nonterminals.has(symbol) && symbol !== "lambda") {
                        throw Error("Error: symbol not defined: " + symbol);
                    }
                    else if (this.m_nonterminals.has(symbol) && !neighborSet.has(symbol)) {
                        //recursively check this new symbols neighbors
                        this.depth_first_search(symbol, neighborSet);
                    }
                    else if (this.m_symbols.has(symbol)) {
                        //add a terminal to the used terminals list
                        this.m_usedterminals.add(symbol);
                    }
                });
            });
        }
    }

    getNullable() : Set<string>
    {
        let null_set: Set<string> = new Set<string>();
        while (true) {  // repeat until it stabilizes
            let flag: boolean = true;
            this.m_nonterminals.forEach((productionList: string[][], N: string) => {
                //production list is the entire production list, with possibly multiple production lists
                productionList.forEach((termList: string[]) => {
                    //list of individual terms in a production     Ex: ["lamba"], ["A", "B", "C"]
                    if (termList.length === 1) {
                        if (termList[0] === "lambda") {
                            termList = new Array<string>();
                        }
                    }
                    let allNullable = termList.every((sym: string) => {
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
            if (flag)
            {
                //If sets are the same between checking all nonterminals, then it has stabilized
                break;
            }
        }
        return null_set;
    }

    getFirst(): Map<string, Set<string>> {
        //Pre-init section
        let null_set = this.getNullable();
        let first: Map<string, Set<string>> = new Map<string, Set<string>>();
        this.m_nonterminals.forEach((prodlist: string[][], N: string) => {
            first.set(N, new Set<string>());
        });
        this.m_terminals.forEach((term: Terminal) => {
            first.set(term.sym, new Set<string>());
            first.get(term.sym).add(term.sym);
        });
        first.delete("WHITESPACE"); // ignore whitespace
        //console.log("----BEFORE-----");
        //console.log(first);
        //console.log("----LOOP-------");
        let flag: boolean = true;
        //Normal section
        while (flag) {  // repeat until it stabilizes
            flag = false;
            this.m_nonterminals.forEach((productionList: string[][], N: string) => {
                //production list is the entire production list, with possibly multiple production lists
                productionList.forEach((P: string[]) => {
                    //list of individual terms in a production     Ex: ["lamba"], ["A", "B", "C"]
                    P.every((sym: string) => {
                        if (sym !== "lambda") {
                            first.get(sym).forEach((x: string) => {
                                if (!first.get(N).has(x)) {
                                    first.get(N).add(x);
                                    flag = true;
                                }
                            });
                        }
                        if (null_set.has(sym)) {
                            return true;
                        } else {
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
    }

    getFollow(): Map<string, Set<string>> {
        let null_set = this.getNullable();
        let first = this.getFirst();
        let follow = new Map<string, Set<string>>();
        this.m_nonterminals.forEach((prodlist: string[][], N: string) => {
            follow.set(N, new Set<string>());
        });
        follow.delete("WHITESPACE"); // ignore whitespace
        follow.set(this.m_startVar, new Set<string>("$"));
        let flag = true;
        while (flag) {
            flag = false;
            this.m_nonterminals.forEach((productionList: string[][], N: string) => {
                //production list is the entire production list, with possibly multiple production lists
                productionList.forEach((P: string[]) => {
                    //list of individual terms in a production     Ex: ["lamba"], ["A", "B", "C"]    
                    for (let i = 0; i < P.length; i++) {
                        let broke_loop = false;
                        let sym = P[i];
                        if (this.m_nonterminals.has(sym)) {
                            for (let y = i + 1; y < P.length; y++) {
                                let y_sym = P[y];
                                //union(follow[x], first[y])
                                first.get(y_sym).forEach((y_str: string) => {
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
                                follow.get(N).forEach((x: string) => {
                                    if (!follow.get(sym).has(x)) {
                                        follow.get(sym).add(x);
                                        flag = true;
                                    }
                                });
                            }
                        }
                    }
                });
            });
        }
        return follow;
    }
}