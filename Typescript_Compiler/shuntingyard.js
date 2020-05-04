"use strict";
exports.__esModule = true;
var Tokenizer_1 = require("./Tokenizer");
var Grammar_1 = require("./Grammar");
var fs = require("fs");
function parse(inputData) {
    var data = fs.readFileSync("grammar.txt", "utf8");
    var precedence = new Map();
    precedence.set("COMMA", 0).set("ADDOP", 1).set("MULOP", 2).set("BITNOT", 3).set("NEGATE", 4).set("POWOP", 5).set("func-call", 6);
    var associativity = new Map();
    associativity.set("LPAREN", "left").set("POWOP", "right").set("MULOP", "left").set("ADDOP", "left").set("NEGATE", "right").set("BITNOT", "right").set("COMMA", "left");
    var arity = new Map();
    arity.set("func-call", 2).set("BITNOT", 1).set("NEGATE", 1).set("POWOP", 2).set("MULOP", 2).set("ADDOP", 2).set("COMMA", 2);
    var inputGrammar = new Grammar_1.Grammar(data, true);
    var tokenGenerator = new Tokenizer_1.Tokenizer(inputGrammar);
    tokenGenerator.setInput(inputData);
    var operatorStack = new Array();
    var operandStack = new Array();
    while (true) {
        var t = tokenGenerator.next();
        if (t.sym === "$") {
            //Tokenizer reached end if true
            break;
        }
        if (t.lexeme === "-") {
            var p = tokenGenerator.previous;
            if (p === undefined || p.sym === "LPAREN" || precedence.has(p.sym)) {
                t.sym = "NEGATE";
            }
        }
        if (t.sym === "NUM") {
            operandStack.push(new TreeNode(t.sym, t));
        }
        else if (t.sym === "ID") {
            //Peek next token, if LP then we got a func-call
            var result = tokenGenerator.peek();
            if (result === "LPAREN") {
                operatorStack.push(new TreeNode("func-call", null));
            }
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
            var assoc = associativity.get(t.sym);
            while (true) {
                if (assoc === "right" && arity.get(t.sym) === 1) {
                    break;
                }
                if (operatorStack.length === 0) {
                    break;
                }
                var A = operatorStack[operatorStack.length - 1].sym;
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
exports.parse = parse;
var TreeNode = /** @class */ (function () {
    function TreeNode(symbol, token) {
        this.sym = symbol;
        this.token = token;
        this.children = new Array();
    }
    TreeNode.prototype.addChild = function (node) {
        this.children.push(node);
    };
    TreeNode.prototype.toString = function () {
        function walk(n, callback) {
            callback(n);
            n.children.forEach(function (x) {
                walk(x, callback);
            });
        }
        var L = [];
        L.push("digraph d{");
        L.push("node [fontname=\"Helvetica\",shape=box];");
        var counter = 0;
        walk(this, function (n) {
            n.NUMBER = "n" + (counter++);
            var tmp = n.sym;
            if (n.token) {
                tmp += "\n";
                tmp += n.token.lexeme;
            }
            tmp = tmp.replace(/&/g, "&amp;");
            tmp = tmp.replace(/</g, "&lt;");
            tmp = tmp.replace(/>/g, "&gt;");
            tmp = tmp.replace(/\n/g, "<br/>");
            L.push(n.NUMBER + " [label=<" + tmp + ">];");
        });
        walk(this, function (n) {
            n.children.forEach(function (x) {
                L.push(n.NUMBER + " -> " + x.NUMBER + ";");
            });
        });
        L.push("}");
        return L.join("\n");
    };
    return TreeNode;
}());
exports.TreeNode = TreeNode;
function doOperation(operandStack, operatorStack, arity) {
    var opNode = operatorStack.pop();
    var c1 = operandStack.pop();
    if (arity.get(opNode.sym) === 2) {
        var c2 = operandStack.pop();
        opNode.addChild(c2);
    }
    opNode.addChild(c1);
    operandStack.push(opNode);
}
//# sourceMappingURL=shuntingyard.js.map