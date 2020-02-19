import { Grammar } from "./Grammar"
import { Token } from "./Token";
export class Tokenizer {
    grammar: Grammar;
    inputData: string;
    lineNumber: number;
    idx: number;
    previous: Token;  // reference to the previous token looked at
    current: Token; // reference to the current token looked at
    constructor(grammar: Grammar) {
        this.grammar = grammar;
        this.lineNumber = 1;
        this.idx = 0;
        this.inputData = ""
        this.previous = undefined;
        this.current = undefined;
    }
    next(): Token {
        if (this.idx >= this.inputData.length - 1) {
            return new Token("$", undefined, this.lineNumber);
        }
        this.previous = this.current; // function returns the next token, so the current token is the previous to that.
        for (let i = 0; i < this.grammar.m_terminals.length; i++) {
            let terminal = this.grammar.m_terminals[i];
            let sym = terminal.sym;
            let rex = terminal.rex;
            rex.lastIndex = this.idx;

            let m = rex.exec(this.inputData);
            if (m) {
                let lexeme = m[0];
                this.idx += lexeme.length;

                if (sym !== "WHITESPACE" && sym !== "COMMENT") {
                    //return new token using sym, lexeme, and line num
                    this.current = new Token(terminal.sym, lexeme, this.lineNumber);
                    let lineSplitter = lexeme.split("\n");
                    this.lineNumber += lineSplitter.length - 1;
                    return this.current;
                }
                else {
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
    setInput(inputData: string) {
        this.inputData = inputData;
        this.lineNumber = 1;
        this.idx = 0;
    }
}