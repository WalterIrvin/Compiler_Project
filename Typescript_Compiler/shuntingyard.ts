import { Token } from "./Token";
import { Tokenizer } from "./Tokenizer";
import { Grammar } from "./Grammar";
let fs = require("fs");

export function parse(inputData: string): TreeNode {
    let data: string = fs.readFileSync("grammar.txt", "utf8");
    let precedence: Map<string, number> = new Map<string, number>();
    precedence.set("POWOP", 3).set("MULOP", 2).set("ADDOP", 1).set("NEGATE", 3).set("BITNOT", 3);
    let associativity: Map<string, string> = new Map<string, string>();
    associativity.set("LPAREN", "left").set("POWOP", "right").set("MULOP", "left").set("ADDOP", "left").set("NEGATE", "right").set("BITNOT", "right");
    let arity: Map<string, number> = new Map<string, number>();
    arity.set("func-call", 2).set("BITNOT", 1).set("NEGATE", 1).set("POWOP", 2).set("MULOP", 2).set("ADDOP", 2).set("ADDOP", 2).set("COMMA", 1);
    let inputGrammar: Grammar = new Grammar(data, true);
    let tokenGenerator: Tokenizer = new Tokenizer(inputGrammar);
    tokenGenerator.setInput(inputData);

    let operatorStack = new Array<TreeNode>();
    let operandStack = new Array<TreeNode>();

    while (true) {
        let t = tokenGenerator.next();
        if (t.sym === "$") {
            //Tokenizer reached end if true
            break;
        }
        if (t.lexeme === "-") {
            let p = tokenGenerator.previous;
            if (p === undefined || p.sym === "LPAREN" || precedence.has(p.sym))
            {
                t.sym = "NEGATE";
            }
        }
        let sym = t.sym;
        if (sym === "NUM" || sym === "ID") {
            operandStack.push(new TreeNode(t.sym, t));
        }
        else if (sym === "LPAREN") {
            //LPAREN special case, always push onto operator stack
            operatorStack.push(new TreeNode(t.sym, t));
        }
        else if (sym === "RPAREN") {
            //RPAREN special case, do op untill we encounter a LPAREN, then destroy the LPAREN
            while (operatorStack[operatorStack.length - 1].sym !== "LPAREN") {
                doOperation(operandStack, operatorStack, arity);
            }
            operatorStack.pop();
        }
        else {
            let assoc = associativity.get(sym);
            while (true) {
                if (operatorStack.length === 0) {
                    break;
                }
                let A = operatorStack[operatorStack.length - 1].sym;
                if (assoc === "left" && precedence.get(A) >= precedence.get(sym)) {
                    doOperation(operandStack, operatorStack, arity);
                }
                else if (assoc === "right" && precedence.get(A) > precedence.get(sym)) {
                    doOperation(operandStack, operatorStack, arity);
                }
                else {
                    break;
                }
            }
            operatorStack.push(new TreeNode(t.sym, t));              
        }
    }
    while (!(operatorStack.length === 0)) {
        doOperation(operandStack, operatorStack, arity);
    }
    return operandStack.pop();
}

export class TreeNode {
    children: Array<TreeNode>;
    sym: string;
    token: Token;
    constructor(symbol: string, token: Token)
    {
        this.sym = symbol;
        this.token = token;
        this.children = new Array<TreeNode>();
    }
    addChild(node: TreeNode)
    {
        this.children.push(node);
    }
}

function doOperation(operandStack: Array<TreeNode>, operatorStack: Array<TreeNode>, arity: Map<string, number>)
{
    let opNode = operatorStack.pop();
    let c1 = operandStack.pop();
    if (arity.get(opNode.sym) === 2) {
        let c2 = operandStack.pop();
        opNode.addChild(c2);
    }   
    opNode.addChild(c1);
    operandStack.push(opNode);
}
