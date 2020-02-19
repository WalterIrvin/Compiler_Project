import { Token } from "./Token";
import { Tokenizer } from "./Tokenizer";
import { Grammar } from "./Grammar";
let fs = require("fs");

export function parse(inputData: string): TreeNode {
    let data: string = fs.readFileSync("grammar.txt", "utf8");
    let precedence: Map<string, number> = new Map<string, number>();
    precedence.set("LPAREN", 4).set("POWOP", 3).set("MULOP", 2).set("ADDOP", 1);
    let associativity: Map<string, string> = new Map<string, string>();
    associativity.set("LPAREN", "left").set("POWOP", "right").set("MULOP", "left").set("ADDOP", "left");
    let inputGrammar: Grammar = new Grammar(data, true);
    let tokenGenerator: Tokenizer = new Tokenizer(inputGrammar);
    tokenGenerator.setInput(inputData);
    let cur_token = tokenGenerator.next();
    let operatorStack = new Array<TreeNode>();
    let operandStack = new Array<TreeNode>();

    while (cur_token.sym !== "$") {
        cur_token = tokenGenerator.next();
        if (cur_token.lexeme === "-") {
            let p = tokenGenerator.previous();
            if (p === undefined || p.sym === "LPAREN" || precedence.has(p.sym))
            {
                cur_token.sym = "NEGATE";
            }
        }
            
        let sym = cur_token.sym;
        if (sym === "NUM" || sym === "ID") {
            operandStack.push(new TreeNode(cur_token.sym, cur_token))
        }
        else {
            let assoc = associativity.get(sym);
            while (true) {
                if (operatorStack.length === 0) {
                    break;
                }
                let A = operatorStack.shift();
                if (assoc === "left" && precedence.get(A.sym) >= precedence.get(sym)) {
                    doOperation(operandStack, operatorStack);
                }
                else if (assoc === "right" && precedence.get(A.sym) > precedence.get(sym)) {
                    doOperation(operandStack, operatorStack);
                }
                else {
                    break;
                }
            }
            operatorStack.push(new TreeNode(cur_token.sym, cur_token))              
        }
    }
    while (!(operatorStack.length === 0)) {
        doOperation(operandStack, operatorStack);
    } 
    return undefined;
}

export class TreeNode {
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

function doOperation(operandStack: Array<TreeNode>, operatorStack: Array<TreeNode>)
{
    let c1 = operandStack.pop()
    let c2 = operandStack.pop()
    let opNode = operatorStack.pop()
    opNode.add_child(c2)
    opNode.add_child(c1)
    operandStack.push(opNode)
}
