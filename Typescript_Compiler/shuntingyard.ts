import { Token } from "./Token";
import { Tokenizer } from "./Tokenizer";
import { Grammar } from "./Grammar";
let fs = require("fs");

export function parse(inputData: string): TreeNode
{
    let data: string = fs.readFileSync("grammar.txt", "utf8");
    let operator_precedence =
    {
        "POWOP":  3,
        "MULOP": 2,
        "ADDOP": 1,
        "LPR": 0
    }
    let inputGrammar: Grammar = new Grammar(data, true);
    let tokenGenerator: Tokenizer = new Tokenizer(inputGrammar);
    tokenGenerator.setInput(inputData);
    let cur_token = tokenGenerator.next();

    while (cur_token.sym !== "$")
    {
        cur_token = tokenGenerator.next();

        sym = t.sym
        if sym is NUM or ID:
            operandStack.push(Node(t.sym, t.lexeme))
        else:
            while True:
                if operatorStack.empty(): break
            A = operatorStack.top().sym
            if precedence[A] >= precedence[sym]:
                doOperation()
            else:
            break
            operatorStack.push(Node(t.sym, t.lexeme))
            while not operatorStack.empty():
            doOperation()
    }

    return undefined;
}

export class TreeNode
{
    children: Array<TreeNode>;
    sym: string;
    token: Token;
    constructor(symbol: string, token: Token)
    {
        this.sym = symbol;
        this.token = token;
    }
    add_child(node: TreeNode)
    {
        this.children.push(node);
    }
}

function doOperation()
{
    let c1 = operandStack.pop()
    let c2 = operandStack.pop()
    let opNode = operatorStack.pop()
    opNode.addChild(c2)
    opNode.addChild(c1)
    operandStack.push(opNode)
}
