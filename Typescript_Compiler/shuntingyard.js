"use strict";
exports.__esModule = true;
var Tokenizer_1 = require("./Tokenizer");
var Grammar_1 = require("./Grammar");
var fs = require("fs");
function parse(inputData) {
    var data = fs.readFileSync("grammar.txt", "utf8");
    var operator_precedence = {
        "POWOP": 3,
        "MULOP": 2,
        "ADDOP": 1,
        "LPR": 0
    };
    var inputGrammar = new Grammar_1.Grammar(data, true);
    var tokenGenerator = new Tokenizer_1.Tokenizer(inputGrammar);
    tokenGenerator.setInput(inputData);
    var cur_token = tokenGenerator.next();
    while (cur_token.sym !== "$") {
        cur_token = tokenGenerator.next();
    }
    return undefined;
}
exports.parse = parse;
var TreeNode = /** @class */ (function () {
    function TreeNode(symbol, token) {
        this.sym = symbol;
        this.token = token;
    }
    TreeNode.prototype.add_child = function (node) {
        this.children.push(node);
    };
    return TreeNode;
}());
exports.TreeNode = TreeNode;
//# sourceMappingURL=shuntingyard.js.map