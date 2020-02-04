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
                let lexeme: string = m[0];
                this.idx += lexeme.length;
<<<<<<< HEAD
                
=======
                let lastEnd: boolean = false; // used to determine if the last substring does not have a string following it
                let notAString: boolean = true; // if not even string at all, ignore following checks
                let notInString: boolean = true; // determines if we should process \n as end of line, or a component of a string
                let startIdx = 0; // when to start the substring for checking \n if we encounter a string section and it closes before end of lexeme
                let endIdx = lexeme.length; // where to stop searching in substring for \n
                let subList: Array<string> = new Array<string>();
                for (let idx = 0; idx < lexeme.length; idx++)
                {
                    let ch = lexeme.charAt(idx);
                    if (ch === "\"")
                    {
                        notAString = false;
                        if (notInString)
                        {
                            // " detected and we are not in string, start idx will whatever it was when we last exited a string
                            // end idx will be the point at which we detect the new string
                            endIdx = idx;
                            let dist = endIdx - startIdx;
                            if (dist > 0) 
                            {
                                let tmp = lexeme.substring(startIdx, endIdx);
                                subList.push(tmp);
                            }
                            lastEnd = false;
                        }
                        else
                        {
                            // " detected and we are currently in string, start idx will be the current idx
                            // endIdx has yet to be determined, but can be assumed the lexeme length until we encounter another "
                            startIdx = idx;
                            endIdx = lexeme.length;
                            lastEnd = true;
                        }
                        notInString = !notInString;
                    }
                }
                if (notAString)
                {
                    let lineSplitter = lexeme.split("\n");
                    this.lineNumber += lineSplitter.length - 1;
                }
                else
                {
                    //split for every \n found in non-string section
                    subList.forEach((substr: string) => {
                        let lineSplitter = substr.split("\n");
                        this.lineNumber += lineSplitter.length - 1;
                    });
                    if (lastEnd)
                    {
                        let endString = lexeme.substring(startIdx, endIdx);
                        let lineSplitter = endString.split("\n");
                        this.lineNumber += lineSplitter.length - 1;
                    }
                }
>>>>>>> 23401b1af6fb8e41cc2ef40b6eba568bd450ea43
                if (sym !== "WHITESPACE" && sym !== "COMMENT")
                {
                    //return new token using sym, lexeme, and line num
                    let ret_token = new Token(terminal.sym, lexeme, this.lineNumber);
                    let lineSplitter = lexeme.split("\n");
                    this.lineNumber += lineSplitter.length - 1;
                    return ret_token;
                }
                else
                {
                    //skip whitespace and get next real token
                    let lineSplitter = lexeme.split("\n");
                    this.lineNumber += lineSplitter.length - 1;
                    let ret_token = this.next();
                    return ret_token;
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