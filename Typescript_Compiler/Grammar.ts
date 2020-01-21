import { Terminal } from "./Terminal";

export class Grammar
{
    m_terminals: Array<Terminal> = new Array<Terminal>();
    m_symbols: Set<string> = new Set<string>();
    constructor(inputStr: string)
    {
        let varList = inputStr.split("\n");
        for (let i = 0; i < varList.length - 1; i++)
        {
            let splitList = varList[i].split(" -> ", 2);
            let symbol = "null";
            let regex = "null";
            if (splitList.length == 2)
            {
                symbol = splitList[0];
                regex = splitList[1];
                let terminalRegex = RegExp(regex, "gy");
                let term: Terminal = new Terminal(symbol, terminalRegex);               
                if (this.m_symbols.has(symbol))
                {
                    throw new Error("Error: variable redeclaration " + term.sym);
                }
                this.m_terminals.push(term);
                this.m_symbols.add(symbol);
                console.log(term.sym + " : " + term.rex);
            }
            else
            {
                throw new Error("Invalid syntax, -> not found with the variable declaration " + varList[i]);
            }
        }
        this.m_terminals.push(new Terminal("WHITESPACE", new RegExp("\\s+", "gy")));
    }
}