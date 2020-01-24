import { Terminal } from "./Terminal";
import { NonTerminal } from "./NonTerminal";

export class Grammar
{
    m_terminals: Array<Terminal> = new Array<Terminal>();
    m_symbols: Set<string> = new Set<string>();
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
                    let n_set = new Set<string>();
                    for (let b = 0; b < neighbor_list.length; b++)
                    {
                        if (!n_set.has(neighbor_list[b]))
                        {
                            n_set.add(neighbor_list[b]);
                        }
                    }
                }
            }
           
        }
        this.m_terminals.push(new Terminal("WHITESPACE", new RegExp("\\s+", "gy")));
    }
}

function depth_first_search(N: NonTerminal, neighborSet: Set<string>)
{
    neighborSet.add(N.label);
    N.neighbors.forEach((w: NonTerminal) => {
        if (!neighborSet.has(w.label))
        {
            depth_first_search(w, neighborSet);
        }
    });
}