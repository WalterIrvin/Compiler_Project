import { Grammar } from "./Grammar"
import { Token } from "./Token";
export class Tokenizer {
    grammar: Grammar;
    inputData: string;
    lineNumber: number;
    idx: number;
    peek_idx: number;
    previous: Token;  // reference to the previous token looked at
    current: Token; // reference to the current token looked at
    constructor(grammar: Grammar) {
        this.grammar = grammar;
        this.lineNumber = 1;
        this.idx = 0;
        this.inputData = ""
        this.previous = undefined;
        this.current = undefined;
        this.peek_idx = 0;
    }
    next_peek() {
        return this.peek();
    }
    peek(): string {
        if (this.peek_idx >= this.inputData.length - 1) {
            this.peek_idx = this.idx; //reached eof, update peek_idx to match cur idx.
            return "$";
        }
        for (let i = 0; i < this.grammar.m_terminals.length; i++) {
            let terminal = this.grammar.m_terminals[i];
            let sym = terminal.sym;
            let rex = terminal.rex;
            rex.lastIndex = this.peek_idx;
            try {
                let m = rex.exec(this.inputData);
                if (m) {
                    let lexeme = m[0];
                    this.peek_idx += lexeme.length;

                    if (sym !== "WHITESPACE" && sym !== "COMMENT") {
                        //return new token using sym, lexeme, and line num
                        this.peek_idx = this.idx; // done with one peek, return peek_idx back to normal.
                        return terminal.sym;
                    }
                    else {
                        //skip whitespace and get next real token
                        let ret_token = this.next_peek();
                        this.peek_idx = this.idx; // done going ahead, reset the peek_idx
                        return ret_token;
                    }
                }
            }
            catch (e) {
                console.log("regex failed");
                console.log(this.inputData);
            }
            
        }
        //no match; syntax error
        this.peek_idx = this.idx;
        throw new Error("Peek failed");
    }
    peek2(): string {
        return this.peek();
    }
    expect(x: string): Token {
        let next_token = this.next();
        if (next_token.sym !== x) {
            throw new Error("Error, symbols do not match: " + x + " expected, " + next_token.sym + " received.");
        }
        return next_token;
    }
    next(): Token {
        this.peek_idx = this.idx;
        if (this.idx >= this.inputData.length - 1) {
            return new Token("$", undefined, this.lineNumber);
        }
        this.previous = this.current;
        for (let i = 0; i < this.grammar.m_terminals.length; i++) {
            let terminal = this.grammar.m_terminals[i];
            let sym = terminal.sym;
            let rex = terminal.rex;
            rex.lastIndex = this.idx;

            let m = rex.exec(this.inputData);
            if (m) {
                let lexeme = m[0];
                this.idx += lexeme.length;
                this.peek_idx = this.idx;
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
        console.log(inputData);
        this.inputData = inputData;
        this.lineNumber = 1;
        this.idx = 0;
    }
}