export class Terminal
{
    sym: string;
    rex: RegExp;
    constructor(symbol: string, regex: RegExp)
    {
        this.sym = symbol;
        this.rex = regex;
    }
}