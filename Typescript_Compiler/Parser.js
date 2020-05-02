"use strict";
exports.__esModule = true;
var shuntingyard_1 = require("./shuntingyard");
var Tokenizer_1 = require("./Tokenizer");
var Grammar_1 = require("./Grammar");
var fs = require("fs");
var G;
var T;
function parse(input) {
    var data = fs.readFileSync("grammar.txt", "utf8");
    G = new Grammar_1.Grammar(data);
    T = new Tokenizer_1.Tokenizer(G);
    T.setInput(input);
    return parse_S();
}
exports.parse = parse;
function parse_S() {
    var n = new shuntingyard_1.TreeNode("S", null);
    n.children.push(parse_stmt_list());
    return n;
}
function parse_stmt_list() {
    //stmt-list -> stmt stmt-list | lambda
    var n = new shuntingyard_1.TreeNode("stmt-list", null);
    var result = T.peek();
    if (result !== "$" && result !== "RBR") {
        n.children.push(parse_stmt());
        n.children.push(parse_stmt_list());
    }
    return n;
}
function parse_stmt() {
    //stmt -> loop | cond | assign SEMI | LBR stmt-list RBR
    var n = new shuntingyard_1.TreeNode("stmt", null);
    var result = T.peek();
    switch (result) {
        case "WHILE":
            n.children.push(parse_loop());
            break;
        case "IF":
            n.children.push(parse_cond());
            break;
        case "ID":
            n.children.push(parse_assign());
            n.children.push(new shuntingyard_1.TreeNode("SEMI", T.expect("SEMI")));
            break;
        case "LBR":
            n.children.push(parse_stmt_list());
            T.expect("RBR");
            break;
        default:
            throw Error("Something bad happened here in parse_stmt.");
    }
    return n;
}
function parse_loop() {
    //loop -> WHILE LP expr RP stmt
    var n = new shuntingyard_1.TreeNode("loop", null);
    n.children.push(new shuntingyard_1.TreeNode("WHILE", T.expect("WHILE")));
    n.children.push(new shuntingyard_1.TreeNode("LP", T.expect("LP")));
    n.children.push(parse_expr());
    n.children.push(new shuntingyard_1.TreeNode("RP", T.expect("RP")));
    n.children.push(parse_stmt());
    return n;
}
function parse_cond() {
    //cond -> IF LP expr RP stmt | IF LP expr RP stmt ELSE stmt
    var n = new shuntingyard_1.TreeNode("cond", null);
    n.children.push(new shuntingyard_1.TreeNode("IF", T.expect("IF")));
    n.children.push(new shuntingyard_1.TreeNode("LP", T.expect("LP")));
    n.children.push(parse_expr());
    n.children.push(new shuntingyard_1.TreeNode("RP", T.expect("RP")));
    n.children.push(parse_stmt());
    if (T.peek() === "ELSE") {
        n.children.push(new shuntingyard_1.TreeNode("ELSE", T.expect("ELSE")));
    }
    n.children.push(parse_stmt());
    return n;
}
function parse_assign() {
    //assign -> ID EQ expr
    var n = new shuntingyard_1.TreeNode("assign", null);
    n.children.push(new shuntingyard_1.TreeNode("ID", T.expect("ID")));
    n.children.push(new shuntingyard_1.TreeNode("EQ", T.expect("EQ")));
    n.children.push(parse_expr());
    return n;
}
function parse_expr() {
    //expr -> NUM | ID
    var n = new shuntingyard_1.TreeNode("expr", null);
    if (T.peek() === "NUM") {
        n.children.push(new shuntingyard_1.TreeNode("NUM", T.expect("NUM")));
    }
    else if (T.peek() === "ID") {
        n.children.push(new shuntingyard_1.TreeNode("ID", T.expect("ID")));
    }
    return n;
}
//# sourceMappingURL=Parser.js.map