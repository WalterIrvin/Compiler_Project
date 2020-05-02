import { TreeNode } from "./shuntingyard";
import { Tokenizer } from "./Tokenizer";
import { Grammar } from "./Grammar";
let fs = require("fs");
let G: Grammar;
let T: Tokenizer;

export function parse(input: string): TreeNode {
    let data: string = fs.readFileSync("grammar.txt", "utf8");
    G = new Grammar(data);
    T = new Tokenizer(G);
    T.setInput(input);
    return parse_S();
}

function parse_S(): TreeNode {
    let n = new TreeNode("S", null);
    n.children.push(parse_stmt_list());
    return n;
}

function parse_stmt_list(): TreeNode {
    //stmt-list -> stmt stmt-list | lambda
    let n = new TreeNode("stmt-list", null);
    let result = T.peek();
    if (result !== "$" && result !== "RBR") {
        n.children.push(parse_stmt());
        n.children.push(parse_stmt_list());
    }
    return n;
}

function parse_stmt(): TreeNode {
    //stmt -> loop | cond | assign SEMI | LBR stmt-list RBR
    let n = new TreeNode("stmt", null);
    let result = T.peek();
    switch (result) {
        case "WHILE":
            n.children.push(parse_loop());
            break;
        case "IF":
            n.children.push(parse_cond());
            break;
        case "ID":
            n.children.push(parse_assign());
            n.children.push(new TreeNode("SEMI", T.expect("SEMI")));
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

function parse_loop(): TreeNode {
    //loop -> WHILE LP expr RP stmt
    let n = new TreeNode("loop", null);
    n.children.push(new TreeNode("WHILE", T.expect("WHILE")));
    n.children.push(new TreeNode("LP", T.expect("LP")));
    n.children.push(parse_expr());
    n.children.push(new TreeNode("RP", T.expect("RP")));
    n.children.push(parse_stmt());
    return n;
}

function parse_cond(): TreeNode {
    //cond -> IF LP expr RP stmt | IF LP expr RP stmt ELSE stmt
    let n = new TreeNode("cond", null);
    n.children.push(new TreeNode("IF", T.expect("IF")));
    n.children.push(new TreeNode("LP", T.expect("LP")));
    n.children.push(parse_expr());
    n.children.push(new TreeNode("RP", T.expect("RP")));
    n.children.push(parse_stmt());
    if (T.peek() === "ELSE") {
        n.children.push(new TreeNode("ELSE", T.expect("ELSE")));
    }
    n.children.push(parse_stmt());
    return n;
}

function parse_assign(): TreeNode {
    //assign -> ID EQ expr
    let n = new TreeNode("assign", null);
    n.children.push(new TreeNode("ID", T.expect("ID")));
    n.children.push(new TreeNode("EQ", T.expect("EQ")));
    n.children.push(parse_expr());
    return n;
}

function parse_expr(): TreeNode {
    //expr -> NUM | ID
    let n = new TreeNode("expr", null);
    if (T.peek() === "NUM") {
        n.children.push(new TreeNode("NUM", T.expect("NUM")));
    }
    else if (T.peek() === "ID") {
        n.children.push(new TreeNode("ID", T.expect("ID")));
    }
    return n;
}