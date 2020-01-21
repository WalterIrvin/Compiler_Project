import { Grammar } from "./Grammar"
import { Token } from "./Token";
export class Tokenizer
{
    grammar: Grammar;
    inputData: string;
    lineNumber: number;
    idx: number;
    constructor(grammar: Grammar)
    {
        this.grammar = grammar;
        this.lineNumber = 1;
        this.idx = 0;
        this.inputData = ""
    }
    next(): Token
    {
        if (this.idx >= this.inputData.length - 1)
        {
            return new Token("$", undefined, this.lineNumber);
        }
        for (let i = 0; i < this.grammar.m_terminals.length; i++)
        {
            let terminal = this.grammar.m_terminals[i];
            let sym = terminal.sym;
            let rex = terminal.rex;
            rex.lastIndex = this.idx;

            let m = rex.exec(this.inputData);
            if (m)
            {
                let lexeme = m[0];
                this.idx += lexeme.length;
                let lineSplitter = lexeme.split("\n");
                this.lineNumber += lineSplitter.length - 1;
                if (sym !== "WHITESPACE" && sym !== "COMMENT")
                {
                    //return new token using sym, lexeme, and line num
                    return new Token(terminal.sym, lexeme, this.lineNumber);
                }
                else
                {
                    //skip whitespace and get next real token
                    return this.next();
                }
            }
        }
        //no match; syntax error
        throw new Error("Syntax error on line: " + this.lineNumber);
    }
    setInput(inputData: string)
    {
        this.inputData = inputData;
        this.lineNumber = 1;
        this.idx = 0;
    }
}