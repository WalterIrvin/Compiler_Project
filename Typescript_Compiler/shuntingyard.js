"use strict";
exports.__esModule = true;
var Tokenizer_1 = require("./Tokenizer");
var Grammar_1 = require("./Grammar");
var fs = require("fs");
function parse(inputData) {
    var data = fs.readFileSync("grammar.txt", "utf8");
    var precedence = new Map();
    precedence.set("LPAREN", 0).set("POWOP", 3).set("MULOP", 2).set("ADDOP", 1);
    var associativity = new Map();
    associativity.set("LPAREN", "left").set("POWOP", "right").set("MULOP", "left").set("ADDOP", "left").set("NEGATE", "right").set("BITNOT", "right");
    var arity = new Map();
    arity.set("func-call", 2).set("BITNOT", 1).set("NEGATE", 1).set("POWOP", 2).set("MULOP", 2).set("ADDOP", 2).set("ADDOP", 2).set("COMMA", 1);
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
        var sym = t.sym;
        if (sym === "NUM" || sym === "ID") {
            operandStack.push(new TreeNode(t.sym, t));
        }
        else {
            var assoc = associativity.get(sym);
            while (true) {
                if (operatorStack.length === 0) {
                    break;
                }
                var A = operatorStack[operatorStack.length - 1].sym;
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