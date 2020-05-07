"use strict";
exports.__esModule = true;
var shuntingyard_1 = require("./shuntingyard");
var Token_1 = require("./Token");
var antlr4 = require("./antlr4");
var Lexer = require("./gramLexer.js").gramLexer;
var Parser = require("./gramParser.js").gramParser;
var asmCode = [];
var VarType;
(function (VarType) {
    VarType[VarType["STRING"] = 0] = "STRING";
    VarType[VarType["INTEGER"] = 1] = "INTEGER";
    VarType[VarType["FLOAT"] = 2] = "FLOAT";
})(VarType = exports.VarType || (exports.VarType = {}));
function parse(txt) {
    var stream = new antlr4.InputStream(txt);
    var lexer = new Lexer(stream);
    var tokens = new antlr4.CommonTokenStream(lexer);
    var parser = new Parser(tokens);
    parser.buildParseTrees = true;
    //Change the error handling
    var handler = new ErrorHandler();
    lexer.removeErrorListeners();
    lexer.addErrorListener(handler);
    parser.removeErrorListeners();
    parser.addErrorListener(handler);
    //Assumes that start symbol is 'start'
    var antlr_root = parser.start();
    //convert antlr tree to custom format
    var root = walk(parser, antlr_root);
    //Generate asm from the parse tree
    var asm = makeAsm(root.children[0]); // should get program
    return asm;
}
exports.parse = parse;
function walk(parser, node) {
    var p = node.getPayload();
    if (p.ruleIndex === undefined) {
        var line = p.line;
        var lexeme = p.text;
        var ty = p.type;
        var sym = parser.symbolicNames[ty];
        if (sym === null) {
            sym = lexeme.toUpperCase();
        }
        var T = new Token_1.Token(sym, lexeme, line);
        return new shuntingyard_1.TreeNode(sym, T);
    }
    else {
        var idx = p.ruleIndex;
        var sym = parser.ruleNames[idx];
        var N = new shuntingyard_1.TreeNode(sym, undefined);
        for (var i = 0; i < node.getChildCount(); i++) {
            var child = node.getChild(i);
            N.children.push(walk(parser, child));
        }
        return N;
    }
}
var labelCounter = 0;
function label() {
    var s = "lbl" + labelCounter;
    labelCounter++;
    return s;
}
function makeAsm(root) {
    asmCode = [];
    labelCounter = 0;
    emit("default rel");
    emit("section .text");
    emit("global main");
    emit("main:");
    programNodeCode(root);
    emit("ret");
    emit("section .data");
    return asmCode.join("\n");
}
function programNodeCode(n) {
    //program -> braceblock
    if (n.sym !== "program")
        ICE();
    braceblockNodeCode(n.children[0]);
}
function braceblockNodeCode(n) {
    //braceblock -> LBR stmts RBR
    stmtsNodeCode(n.children[1]);
}
function stmtsNodeCode(n) {
    //stmts -> stmt stmts | lambda
    if (n.children.length == 0)
        return;
    stmtNodeCode(n.children[0]);
    stmtsNodeCode(n.children[1]);
}
function stmtNodeCode(n) {
    //stmt -> cond | loop | return-stmt SEMI
    var c = n.children[0];
    switch (c.sym) {
        case "cond":
            condNodeCode(c);
            break;
        case "loop":
            loopNodeCode(c);
            break;
        case "return_stmt":
            returnstmtNodeCode(c);
            break;
        default:
            ICE();
    }
}
function returnstmtNodeCode(n) {
    //return-stmt -> RETURN expr
    var type = exprNodeCode(n.children[1]);
    if (type === VarType.FLOAT) {
        emit("; STMTNODECODE ROUND START");
        emit("movq xmm0, [rsp]"); // pop value
        emit("add rsp, 8");
        emit("cvtsd2si rax, xmm0"); // round to int
        emit("push rax");
        emit("; STMTNODECODE ROUND END");
    }
    emit("pop rax");
    emit("ret");
}
function loopNodeCode(n) {
    // loop -> WHILE LP expr RP braceblock;
    var startLoopLabel = label();
    var endLoopLabel = label();
    emit(startLoopLabel + ":");
    emit("; While Section");
    exprNodeCode(n.children[2]); //leaves result in rax
    emit("pop rax");
    emit("cmp rax, 0");
    emit("; break out of loop if cond is false");
    emit("je " + endLoopLabel); //break out of loop if condition is false
    braceblockNodeCode(n.children[4]);
    emit("; Return to top of loop");
    emit("jmp " + startLoopLabel);
    emit("; End loop section");
    emit(endLoopLabel + ":");
}
function condNodeCode(n) {
    //cond -> IF LP expr RP braceblock |
    //  IF LP expr RP braceblock ELSE braceblock
    if (n.children.length === 5) {
        //no 'else'
        exprNodeCode(n.children[2]); //leaves result in rax
        emit("pop rax");
        emit("cmp rax, 0");
        var endifLabel = label();
        emit("je " + endifLabel);
        braceblockNodeCode(n.children[4]);
        emit(endifLabel + ":");
    }
    else {
        exprNodeCode(n.children[2]); //leaves result in rax
        emit("pop rax");
        emit("cmp rax, 0");
        var elseLabel = label(); // if cmp fails, we go to else
        var endCondLabel = label(); // if cmp succeeds, we skip else
        emit("je " + elseLabel);
        emit("; If section");
        braceblockNodeCode(n.children[4]);
        emit("jmp " + endCondLabel);
        emit(elseLabel + ":");
        emit("; Else section");
        braceblockNodeCode(n.children[6]);
        emit(endCondLabel + ":");
        emit("; End cond");
    }
}
function emit(instr) {
    //Emits strings of assembly code
    asmCode.push(instr);
}
function ICE() {
    //Internal compiler error
    throw new Error("Error");
}
var ErrorHandler = /** @class */ (function () {
    function ErrorHandler() {
    }
    ErrorHandler.prototype.syntaxError = function (rec, sym, line, column, msg, e) {
        console.log("Syntax error: ", msg, " on line ", line, " at column ", column);
        throw new Error("Syntax error in ANTLR parse");
    };
    return ErrorHandler;
}());
//ASM 2
function factorNodeCode(n) {
    //factor -> NUM | LP expr RP
    var child = n.children[0];
    switch (child.sym) {
        case "NUM":
            var v = parseInt(child.token.lexeme, 10);
            emit("push qword " + v);
            return VarType.INTEGER;
        case "LP":
            return exprNodeCode(n.children[1]);
        case "FPNUM":
            var fp = parseFloat(child.token.lexeme).toPrecision(16);
            emit("mov rax, __float64__(" + fp + ")");
            emit("push rax");
            return VarType.FLOAT;
        default:
            ICE();
    }
}
function exprNodeCode(n) {
    return orexpNodeCode(n.children[0]);
}
function orexpNodeCode(n) {
    //orexp -> orexp OR andexp | andexp
    if (n.children.length === 1) {
        return andexpNodeCode(n.children[0]);
    }
    else {
        var orexpType = orexpNodeCode(n.children[0]);
        if (orexpType == VarType.FLOAT) {
            emit("movq xmm0, [rsp]"); // first operand
            emit("xorpd xmm1, xmm1"); // zero out xmm1
            emit("cmpneqsd xmm0, xmm1");
            emit("movq [rsp], xmm0");
            emit("and qword[rsp], 1");
        }
        else {
            convertStackTopToZeroOrOneInteger(orexpType);
        }
        emit("cmp qword [rsp], 0");
        var lbl = label();
        emit("jne " + lbl);
        emit("add rsp,8"); //discard left result (0)
        var andexpType = andexpNodeCode(n.children[2]);
        if (andexpType == VarType.FLOAT) {
            emit("movq xmm0, [rsp]"); // first operand
            emit("xorpd xmm1, xmm1"); // zero out xmm1
            emit("cmpneqsd xmm0, xmm1");
            emit("movq [rsp], xmm0");
            emit("and qword [rsp], 1");
        }
        else {
            convertStackTopToZeroOrOneInteger(andexpType);
        }
        emit(lbl + ":");
        return VarType.INTEGER; //always integer, even if float operands
    }
}
function sumNodeCode(n) {
    //sum -> sum PLUS term | sum MINUS term | term
    if (n.children.length === 1) {
        return termNodeCode(n.children[0]);
    }
    else {
        //emit("; in sumNodeCode; doing sum");
        var sumType = sumNodeCode(n.children[0]);
        //emit("; in sumNodeCode; doing term");
        var termType = termNodeCode(n.children[2]);
        if (sumType !== termType || sumType == VarType.STRING || termType === VarType.STRING) {
            ICE();
            //error!
        }
        else if (sumType === VarType.INTEGER) {
            //int math
            emit("pop rbx"); //second operand
            emit("pop rax"); //first operand
            switch (n.children[1].sym) {
                case "PLUS":
                    emit("add rax, rbx");
                    break;
                case "MINUS":
                    emit("sub rax, rbx");
                    break;
                default:
                    ICE();
            }
            emit("push rax");
            //emit("; done with sumNodeCode");
            return VarType.INTEGER;
        }
        else {
            //float math
            emit("; START FLOAT MATH");
            switch (n.children[1].sym) {
                case "PLUS":
                    emit("movq xmm1, [rsp]"); // second operand
                    emit("add rsp, 8");
                    emit("movq xmm0, [rsp]"); // first operand
                    emit("add rsp, 8");
                    emit("addsd xmm0, xmm1");
                    break;
                case "MINUS":
                    emit("movq xmm1, [rsp]"); // second operand
                    emit("add rsp, 8");
                    emit("movq xmm0, [rsp]"); // first operand
                    emit("add rsp, 8");
                    emit("subsd xmm0, xmm1");
                    break;
                default:
                    ICE();
            }
            emit("sub rsp, 8"); // push back onto stack
            emit("movq [rsp], xmm0");
            emit("; END FLOAT MATH");
            return VarType.FLOAT;
        }
    }
}
function convertStackTopToZeroOrOneInteger(type) {
    if (type === VarType.INTEGER) {
        emit("cmp qword [rsp], 0");
        emit("setne al");
        emit("movzx rax, al");
        emit("mov [rsp], rax");
    }
    else {
        //error
        throw Error("Invalid type " + type);
    }
}
function andexpNodeCode(n) {
    //andexp AND notexp | notexp;
    if (n.children.length === 1) {
        return notexpNodeCode(n.children[0]);
    }
    else {
        var andexp = andexpNodeCode(n.children[0]);
        if (andexp === VarType.FLOAT) {
            emit("movq xmm0, [rsp]"); // first operand
            emit("xorpd xmm1, xmm1"); // zero out xmm1
            emit("cmpneqsd xmm0, xmm1");
            emit("movq [rsp], xmm0");
            emit("and qword [rsp], 1");
        }
        else {
            convertStackTopToZeroOrOneInteger(andexp);
        }
        var lbl_false = label();
        var lbl_end = label();
        emit("cmp qword [rsp], 1");
        emit("jne " + lbl_false); // first case false, jump to end-and
        emit("add rsp,8"); //discard left result (0)
        var notexp = notexpNodeCode(n.children[2]);
        if (notexp === VarType.FLOAT) {
            emit("movq xmm0, [rsp]"); // first operand
            emit("xorpd xmm1, xmm1"); // zero out xmm1
            emit("cmpneqsd xmm0, xmm1");
            emit("movq [rsp], xmm0");
            emit("and qword [rsp], 1");
        }
        else {
            convertStackTopToZeroOrOneInteger(notexp);
        }
        emit("cmp qword [rsp], 1");
        emit("jne " + lbl_false); //second case false, jump to end-and
        //both cases are true - push 1 to rax?
        emit("pop rax");
        emit("mov rax, 1");
        emit("push rax");
        emit("jmp " + lbl_end);
        emit(lbl_false + ":");
        emit("pop rax");
        emit("mov rax, 0");
        emit("push rax");
        emit(lbl_end + ":");
        return VarType.INTEGER;
    }
}
function notexpNodeCode(n) {
    //NOT notexp | rel;
    if (n.children.length == 1) {
        return relexpNodeCode(n.children[0]);
    }
    else {
        var result = notexpNodeCode(n.children[1]);
        if (result === VarType.FLOAT) {
            emit("; BEGIN FLOAT NOT");
            emit("movq xmm0, [rsp]"); // first operand
            emit("xorpd xmm1, xmm1"); // zero out xmm1
            emit("cmpeqsd xmm0, xmm1");
            emit("movq [rsp], xmm0");
            emit("and qword [rsp], 1");
            emit("; END FLOAT NOT");
        }
        else {
            convertStackTopToZeroOrOneInteger(result); //convert value to 0-1, easier to work with
            //NOT
            var lbl = label();
            var lbl_end = label();
            emit("cmp qword [rsp], 1"); //check if true
            emit("je " + lbl);
            emit("; If 0, make 1");
            emit("pop rax");
            emit("mov rax, 1");
            emit("push rax");
            emit("jmp " + lbl_end);
            emit(lbl + ":"); //if true, make false
            emit("; If 1, make 0");
            emit("pop rax");
            emit("mov rax, 0");
            emit("push rax");
            emit(lbl_end + ":");
        }
        return VarType.INTEGER;
    }
}
function relexpNodeCode(n) {
    //sum RELOP sum | sum
    if (n.children.length === 1)
        return sumNodeCode(n.children[0]);
    else {
        var sum1Type = sumNodeCode(n.children[0]);
        var sum2Type = sumNodeCode(n.children[2]);
        if (sum1Type === VarType.INTEGER && sum2Type === VarType.INTEGER) {
            emit("pop rax"); //second operand
            //first operand is on stack
            emit("cmp [rsp],rax"); //do the compare
            switch (n.children[1].token.lexeme) {
                case ">=":
                    emit("setge al");
                    break;
                case "<=":
                    emit("setle al");
                    break;
                case ">":
                    emit("setg al");
                    break;
                case "<":
                    emit("setl al");
                    break;
                case "==":
                    emit("sete al");
                    break;
                case "!=":
                    emit("setne al");
                    break;
                default: ICE();
            }
            emit("movzx qword rax, al"); //move with zero extend
            emit("mov [rsp], rax");
        }
        else if (sum1Type === VarType.FLOAT && sum2Type === VarType.FLOAT) {
            // float relation
            emit("; FLOAT REL START");
            emit("movq xmm1, [rsp]"); // second operand
            emit("add rsp, 8");
            emit("movq xmm0, [rsp]"); // first operand
            //emit("add rsp, 8");
            switch (n.children[1].token.lexeme) {
                case ">=":
                    emit("cmpnlesd xmm0, xmm1");
                    break;
                case "<=":
                    emit("cmplesd xmm0, xmm1");
                    break;
                case ">":
                    emit("cmpnltsd xmm0, xmm1");
                    break;
                case "<":
                    emit("cmpltsd xmm0, xmm1");
                    break;
                case "==":
                    emit("cmpeqsd xmm0, xmm1");
                    break;
                case "!=":
                    emit("cmpneqsd xmm0, xmm1");
                    break;
                default: ICE();
            }
            emit("movq[rsp], xmm0");
            emit("and qword[rsp], 1");
            emit("; FLOAT REL END");
        }
        else {
            ICE();
        }
        return VarType.INTEGER;
    }
}
function termNodeCode(n) {
    //term MULOP neg | neg;
    //sum -> sum PLUS term | sum MINUS term | term
    if (n.children.length === 1) {
        //if only one child, send term to neg
        //emit("; inside termNodeCode, n.children.length === 1, going to negNodeCode");
        return negNodeCode(n.children[0]);
    }
    else {
        //else send it to term mulop then neg
        var val1 = termNodeCode(n.children[0]);
        var val = negNodeCode(n.children[2]);
        if (val !== val1) {
            throw Error("Error invalid types");
        }
        if (val === VarType.INTEGER) {
            if (n.children[1].token.lexeme === "*") {
                emit("pop rbx"); //second operand
                emit("pop rax"); //first operand
                emit("imul rbx");
                emit("push rax");
            }
            else if (n.children[1].token.lexeme === "/") {
                emit("mov rdx, 0");
                emit("pop rbx");
                emit("pop rax");
                emit("idiv rbx");
                emit("push rax");
            }
            else if (n.children[1].token.lexeme === "%") {
                emit("mov rdx, 0");
                emit("pop rbx");
                emit("pop rax");
                emit("idiv rbx");
                emit("push rdx");
            }
        }
        else if (val === VarType.FLOAT) {
            if (n.children[1].token.lexeme === "*") {
                emit("movq xmm1, [rsp]"); // second operand
                emit("add rsp, 8");
                emit("movq xmm0, [rsp]"); // first operand
                emit("add rsp, 8");
                emit("mulsd xmm0, xmm1");
                emit("sub rsp, 8"); // push back onto stack
                emit("movq [rsp], xmm0");
            }
            else if (n.children[1].token.lexeme === "/") {
                emit("movq xmm1, [rsp]"); // second operand
                emit("add rsp, 8");
                emit("movq xmm0, [rsp]"); // first operand
                emit("add rsp, 8");
                emit("divsd xmm0, xmm1");
                emit("sub rsp, 8"); // push back onto stack
                emit("movq [rsp], xmm0");
            }
            else if (n.children[1].token.lexeme === "%") {
                emit("movq xmm1, [rsp]"); // second operand
                emit("add rsp, 8");
                emit("movq xmm0, [rsp]"); // first operand
                emit("add rsp, 8");
                emit("divsd xmm0, xmm1");
                emit("sub rsp, 8"); // push back onto stack
                emit("movq [rsp], xmm1");
            }
        }
        return val;
    }
}
function negNodeCode(n) {
    //neg : MINUS neg | factor;
    if (n.children.length === 1) {
        //If len is just one, then it goes to factor
        return factorNodeCode(n.children[0]);
    }
    else {
        var val = negNodeCode(n.children[1]);
        if (val === VarType.INTEGER) {
            emit("pop rax"); // get value off of stack
            emit("neg rax");
            emit("push rax"); // push back onto stack
        }
        else if (val === VarType.FLOAT) {
            emit("movq xmm0, [rsp]"); //;xmm0 <- value
            emit("xorps xmm1, xmm1"); //;xmm1 <- 0
            emit("subsd xmm1, xmm0"); //;xmm1 <- 0-value = -value
            emit("movq [rsp], xmm1"); //;overwrite with result
        }
        return val;
    }
}
//emit("movq xmm0, [rsp]"); // pop value
//emit("add rsp, 8");
//emit("sub rsp, 8");  // push back onto stack
//emit("movq [rsp], xmm0");
//# sourceMappingURL=parser.js.map