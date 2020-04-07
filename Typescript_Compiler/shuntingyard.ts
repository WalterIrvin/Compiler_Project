import { Token } from "./Token";
import { Tokenizer } from "./Tokenizer";
import { Grammar } from "./Grammar";
let fs = require("fs");

export function parse(inputData: string): TreeNode {
    let data: string = fs.readFileSync("gram.txt", "utf8");
    let precedence: Map<string, number> = new Map<string, number>();
    precedence.set("COMMA", 0).set("ADDOP", 1).set("MULOP", 2).set("BITNOT", 3).set("NEGATE", 4).set("POWOP", 5);
    let associativity: Map<string, string> = new Map<string, string>();
    associativity.set("LPAREN", "left").set("POWOP", "right").set("MULOP", "left").set("ADDOP", "left").set("NEGATE", "right").set("BITNOT", "right");
    let arity: Map<string, number> = new Map<string, number>();
    arity.set("func-call", 2).set("BITNOT", 1).set("NEGATE", 1).set("POWOP", 2).set("MULOP", 2).set("ADDOP", 2).set("COMMA", 2);
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
            if (p === undefined || p.sym === "LPAREN" || precedence.has(p.sym)) {
                t.sym = "NEGATE";
            }
        }
        if (t.sym === "NUM" || t.sym === "ID") {
            operandStack.push(new TreeNode(t.sym, t));
        }
        else if (t.sym === "LPAREN") {
            //LPAREN special case, always push onto operator stack
            operatorStack.push(new TreeNode(t.sym, t));
        }
        else if (t.sym === "RPAREN") {
            //RPAREN special case, do op untill we encounter a LPAREN, then destroy the LPAREN
            while (operatorStack[operatorStack.length - 1].sym !== "LPAREN") {
                doOperation(operandStack, operatorStack, arity);
            }
            operatorStack.pop();
        }
        if (t.sym !== "NUM" && t.sym !== "ID" && t.sym !== "LPAREN" && t.sym !== "RPAREN") {
            let assoc = associativity.get(t.sym);
            while (true) {
                if (assoc === "right" && arity.get(t.sym) === 1) {
                    break;
                }
                if (operatorStack.length === 0) {
                    break;
                }
                let A = operatorStack[operatorStack.length - 1].sym;
                if (assoc === "left" && precedence.get(A) >= precedence.get(t.sym)) {
                    doOperation(operandStack, operatorStack, arity);
                }
                else if (assoc === "right" && precedence.get(A) > precedence.get(t.sym)) {
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

    toString() {
        function walk(n: any, callback: any) {
            callback(n);
            n.children.forEach((x: any) => {
                walk(x, callback);
            });
        }
        let L: string[] = [];
        L.push("digraph d{");
        L.push(`node [fontname="Helvetica",shape=box];`);
        let counter = 0;
        walk(this, (n: any) => {
            n.NUMBER = "n" + (counter++);
            let tmp = n.sym;
            if (n.token) {
                tmp += "\n";
                tmp += n.token.lexeme;
            }
            tmp = tmp.replace(/&/g, "&amp;");
            tmp = tmp.replace(/</g, "&lt;");
            tmp = tmp.replace(/>/g, "&gt;");
            tmp = tmp.replace(/\n/g, "<br/>");

            L.push(`${n.NUMBER} [label=<${tmp}>];`);
        });
        walk(this, (n: any) => {
            n.children.forEach((x: any) => {
                L.push(`${n.NUMBER} -> ${x.NUMBER};`);
            });
        });
        L.push("}");
        return L.join("\n");
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
