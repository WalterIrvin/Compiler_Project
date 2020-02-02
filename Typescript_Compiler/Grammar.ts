import { Terminal } from "./Terminal";
import { NonTerminal } from "./NonTerminal";

export class Grammar
{
    m_terminals: Array<Terminal> = new Array<Terminal>();
    m_symbols: Set<string> = new Set<string>();
    m_leftNonTerm: Map<string, NonTerminal> = new Map<string, NonTerminal>(); // terminals defined on left side
    m_allNonTerms: Map<string, NonTerminal> = new Map<string, NonTerminal>(); // total terminals found on left-right side

    m_startVar: NonTerminal = null;
    constructor(inputStr: string)
    {
        let terminal_section: Boolean = true;
        let varList = inputStr.split("\n");
        for (let i = 0; i < varList.length - 1; i++)
        {
            if (terminal_section)
            {
                let splitList = varList[i].split(" -> ", 2);
                let symbol = "null";
                let regex = "null";
                if (splitList.length == 2) {
                    symbol = splitList[0];
                    regex = splitList[1];
                    let terminalRegex = RegExp(regex, "gy");
                    let term: Terminal = new Terminal(symbol, terminalRegex);
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
            else
            {
                // Non terminal section
                let splitList = varList[i].split(" -> ", 2);
                let leftSide = splitList[0];
                let alternation = splitList[1].split("|"); // splits rhs into different | terms
                for (let a = 0; a < alternation.length; a++)
                {
                    let neighbor_list = alternation[a].split(" ");
                    let n_set = new Set<string>(); // the local relative neighbors to this current NonTerminal
                    for (let b = 0; b < neighbor_list.length; b++)
                    {
                        if (!n_set.has(neighbor_list[b]) && neighbor_list[b] !== "")
                        {
                            n_set.add(neighbor_list[b]);
                        }
                    }
                    // construct the non Terminal and add to set if not already existing, if it already exists, add the two neighborlists together
                    if (!this.m_leftNonTerm.has(leftSide))
                    {
                        this.add_new_nonTerminal(leftSide, n_set);
                    }
                    else
                    {
                        this.existing_terminal(leftSide, n_set);
                    }
                }
            }
           
        }
        this.m_terminals.push(new Terminal("WHITESPACE", new RegExp("\\s+", "gy")));
        this.check_valid();
    }

    check_valid()
    {
        let terminalChecker: Set<string> = new Set<string>(); //gets the set of all reachable vars from the start variable
        depth_first_search(this.m_startVar, terminalChecker);
        // check if all non-terminals are defined
        this.m_allNonTerms.forEach((value, key) => {
            if (!this.m_leftNonTerm.has(key))
            {
                throw Error("Error: Undefined non-terminal: " + key);
            }
        });

        //check that all non-terminals are reachable from the start variable
        this.m_leftNonTerm.forEach((value, key) => {
            if (!terminalChecker.has(key))
            {
                // If the terminal is not within the group which can be reached from start, error
                throw Error("Error: Unreachable non-terminal: " + key);
            }
        });
    }

    existing_terminal(leftSide: string, n_set: Set<string>)
    {
        if (this.m_symbols.has(leftSide)) {
            //Attempting to redefine a terminal in non-terminal section, error
            throw Error("Error: Attempting to redefine a terminal in non-terminal section: " + leftSide);
        }
        if (!this.m_leftNonTerm.has(leftSide))
        {
            //definition is not currently on left - side, so add existing var to the leftside map.
            let nTerm: NonTerminal = this.m_allNonTerms.get(leftSide)
            this.m_leftNonTerm.set(leftSide, nTerm);
        }
        let tmp_list: Array<NonTerminal> = new Array<NonTerminal>(); //tmp list to add new neighbors / referenced neighbors
        // this nonterminal already exists in the nonTermLabel set, so append all unique terms to the neighbor set of this variable
        n_set.forEach((label: string) => {
            if (!this.m_allNonTerms.has(label))
            {
                //Neighbor hasn't yet been seen in the label set, so create new NonTerminal
                if (!this.m_symbols.has(label)) {
                    //If this thing is not a terminal, then add to all non-terminal map.
                    let nTerm: NonTerminal = new NonTerminal(label);
                    this.m_allNonTerms.set(label, nTerm);
                    tmp_list.push(nTerm);
                }
            }
            else
            {
                //Neighbor already exists
                let nTerm: NonTerminal = this.m_allNonTerms.get(label);
                tmp_list.push(nTerm);
            }
        });
        //append new found neighbors to existing item
        this.m_leftNonTerm.get(leftSide).addNeighbors(tmp_list);
    }

    add_new_nonTerminal(leftSide: string, n_set: Set<string>)
    {
        if (this.m_symbols.has(leftSide))
        {
            //Attempting to redefine a terminal in non-terminal section, error
            throw Error("Error: Attempting to redefine a terminal in non-terminal section: " + leftSide);
        }
        let tmp_list: Array<NonTerminal> = new Array<NonTerminal>(); //tmp list to add new neighbors / referenced neighbors
        // The nonTerm has not been created yet, so its neighbor list is whatever it is created with
        let nonTerm: NonTerminal = new NonTerminal(leftSide);
        if (this.m_leftNonTerm.size == 0)  // checks if this is the first non terminal, if so sets it to be the start variable
        {
            this.m_startVar = nonTerm;
        }
        this.m_leftNonTerm.set(leftSide, nonTerm); //Adds defined non terminal to the left side map.
        this.m_allNonTerms.set(leftSide, nonTerm); //Adds to list of all non-terminals
        n_set.forEach((label: string) => {
            if (!this.m_allNonTerms.has(label))
            {
                //Neighbor hasn't yet been seen in the label set, so create new NonTerminal
                if (!this.m_symbols.has(label))
                {
                    //If this thing is not a terminal, then add to all non-terminal map.
                    let nTerm: NonTerminal = new NonTerminal(label);
                    this.m_allNonTerms.set(label, nTerm);
                    tmp_list.push(nTerm);
                }
                
            }
            else
            {
                //Neighbor already exists
                let nTerm: NonTerminal = this.m_allNonTerms.get(label);
                tmp_list.push(nTerm);
            }
        });
        nonTerm.setNeighbors(tmp_list);
    }
}

function depth_first_search(N: NonTerminal, neighborSet: Set<string>)
{
    console.log("TEST: " + N.label);
    neighborSet.add(N.label);
    N.neighbors.forEach((w: NonTerminal) => {
        if (!neighborSet.has(w.label))
        {
            depth_first_search(w, neighborSet);
        }
    });
}