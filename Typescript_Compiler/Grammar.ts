import { Terminal } from "./Terminal";

export class Grammar {
    m_terminals: Array<Terminal> = new Array<Terminal>();
    m_symbols: Set<string> = new Set<string>();
    m_nonterminals: Map<string, Array<Array<string>>> = new Map<string, Array<Array<string>>>();
    m_nonterminalStart: string;
    m_usedterminals: Set<string> = new Set<string>();

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
                    //console.log(term.sym + " : " + term.rex);
                }
                else { // split len != 2
                    if (!tokenOnlyFlag)
                    {
                        if (varList[i].length === 0) {
                            terminal_section = false;
                            console.log("Terminal section over");
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
        //this.check_valid();
        
    }

    check_valid()
    {
        console.log(this.m_nonterminals);
        let neighborSet = new Set<string>();
        this.depth_first_search(this.m_nonterminalStart, neighborSet);
        console.log(neighborSet);

        //nonterminal usage check
        this.m_nonterminals.forEach((value: string[][], symbol: string) => {
            if (!neighborSet.has(symbol))
            {
                throw Error("Error: there is an unreachable nonterminal: " + symbol);
            }
        });

        //terminal usage check
        this.m_symbols.forEach((symbol: string) => {
            if (!this.m_usedterminals.has(symbol))
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
                    if (!this.m_symbols.has(symbol) && !this.m_nonterminals.has(symbol)) {
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
                    console.log(termList);
                    let allNullable = termList.every((sym: string) => {
                        return null_set.has(sym);
                    });
                    console.log(allNullable);
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
}