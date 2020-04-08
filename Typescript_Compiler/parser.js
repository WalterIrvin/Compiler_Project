"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
exports.__esModule = true;
var shuntingyard_1 = require("./shuntingyard");
var Token_1 = require("./Token");
var antlr4 = require("./antlr4");
var Lexer = require("./gramLexer.js").gramLexer;
var Parser = require("./gramParser.js").gramParser;
var asmCode = [];
//<ASM3>
var VarInfo = /** @class */ (function () {
    //also the line number, if you want
    function VarInfo(t, location) {
        this.location = location;
        this.type = t;
    }
    return VarInfo;
}());
var SymbolTable = /** @class */ (function () {
    function SymbolTable() {
        this.table = new Map();
    }
    SymbolTable.prototype.get = function (name) {
        if (!this.table.has(name))
            generalError("Does not exist");
        return this.table.get(name);
    };
    SymbolTable.prototype.set = function (name, v) {
        if (this.table.has(name))
            generalError("Redeclaration");
        this.table.set(name, v);
    };
    SymbolTable.prototype.has = function (name) {
        return this.table.has(name);
    };
    return SymbolTable;
}());
//</ ASM3>
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
    outputSymbolTableInfo();
    outputStringPoolInfo();
    stringPool = new Map();
    symtable = new SymbolTable();
    return asmCode.join("\n");
}
function programNodeCode(n) {
    //program -> var_decl_list braceblock
    if (n.sym !== "program")
        ICE();
    vardeclListNodeCode(n.children[0]);
    braceblockNodeCode(n.children[1]);
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
        case "assign":
            assignNodeCode(c);
            break;
        default:
            console.log("Error  in stmtNode");
            ICE();
    }
}
function returnstmtNodeCode(n) {
    //return-stmt -> RETURN expr
    exprNodeCode(n.children[1]);
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
    generalError("Internal Compiler Error");
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
        case "ID":
            var variable = symtable.get(child.token.lexeme);
            emit("push qword [" + variable.location + "]");
            return variable.type;
        case "STRING_CONSTANT":
            var add = stringconstantNodeCode(child);
            emit("push " + add);
            return VarType.STRING;
        default:
            console.log("error in factorNode");
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
        convertStackTopToZeroOrOneInteger(orexpType);
        var lbl = label();
        emit("cmp qword [rsp], 0");
        emit("jne " + lbl);
        emit("add rsp,8"); //discard left result (0)
        var andexpType = andexpNodeCode(n.children[2]);
        convertStackTopToZeroOrOneInteger(andexpType);
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
        if (sumType !== VarType.INTEGER || termType != VarType.INTEGER) {
            console.log("Error in sumNode");
            ICE();
            //error!
        }
        else {
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
        generalError("Invalid type");
    }
}
function andexpNodeCode(n) {
    //andexp AND notexp | notexp;
    if (n.children.length === 1) {
        return notexpNodeCode(n.children[0]);
    }
    else {
        var andexp = andexpNodeCode(n.children[0]);
        convertStackTopToZeroOrOneInteger(andexp);
        var lbl_false = label();
        var lbl_end = label();
        emit("cmp qword [rsp], 1");
        emit("jne " + lbl_false); // first case false, jump to end-and
        emit("add rsp,8"); //discard left result (0)
        var notexp = notexpNodeCode(n.children[2]);
        convertStackTopToZeroOrOneInteger(notexp);
        emit("cmp qword [rsp], 1");
        emit("jne " + lbl_false); //second case false, jump to end-and
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
        return result;
    }
}
function relexpNodeCode(n) {
    //sum RELOP sum | sum
    if (n.children.length === 1)
        return sumNodeCode(n.children[0]);
    else {
        var sum1Type = sumNodeCode(n.children[0]);
        var sum2Type = sumNodeCode(n.children[2]);
        if (sum1Type !== VarType.INTEGER || sum2Type != VarType.INTEGER) {
            //error
        }
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
                emit("setg  al");
                break;
            case "<":
                emit("setl  al");
                break;
            case "==":
                emit("sete  al");
                break;
            case "!=":
                emit("setne al");
                break;
            default:
                console.log("Error relexp");
                ICE();
        }
        emit("movzx qword rax, al"); //move with zero extend
        emit("mov [rsp], rax");
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
        console.log(n.children[1]);
        var val1 = termNodeCode(n.children[0]);
        var val = negNodeCode(n.children[2]);
        if (val !== val1) {
            generalError("Error invalid types");
        }
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
        emit("pop rax"); // get value off of stack
        emit("neg rax");
        emit("push rax"); // push back onto stack
        return val;
    }
}
//ASM 3
var stringPool = new Map();
var symtable = new SymbolTable();
function vardeclListNodeCode(n) {
    //var_decl_list : var_decl SEMI var_decl_list | 
    if (n.children.length !== 3)
        return;
    vardeclNodeCode(n.children[0]);
    vardeclListNodeCode(n.children[2]);
}
function typeNodeCode(n) {
    var l_type = n.token.lexeme;
    var f_type = VarType.INTEGER;
    if (l_type === "int")
        f_type = VarType.INTEGER;
    else if (l_type === "string")
        f_type = VarType.STRING;
    return f_type;
}
function vardeclNodeCode(n) {
    //var-decl -> TYPE ID
    var vname = n.children[1].token.lexeme;
    var vtype = typeNodeCode(n.children[0]);
    symtable.set(vname, new VarInfo(vtype, label()));
}
function assignNodeCode(n) {
    // assign -> ID EQ expr
    var t = exprNodeCode(n.children[2]);
    var vname = n.children[0].token.lexeme;
    if (symtable.get(vname).type !== t)
        generalError("Type mismatch");
    moveBytesFromStackToLocation(symtable.get(vname).location);
}
function moveBytesFromStackToLocation(loc) {
    emit("pop rax");
    emit("mov [" + loc + "], rax");
}
function stringconstantNodeCode(n) {
    var s = n.token.lexeme;
    //...strip leading and trailing quotation marks...
    s = s.slice(1, -1);
    //...handle backslash escapes... \" \n \\
    if (!stringPool.has(s))
        stringPool.set(s, label());
    return stringPool.get(s); //return the label
}
function outputSymbolTableInfo() {
    var e_1, _a;
    try {
        for (var _b = __values(symtable.table.keys()), _c = _b.next(); !_c.done; _c = _b.next()) {
            var vname = _c.value;
            var vinfo = symtable.get(vname);
            emit(vinfo.location + ":");
            emit("dq 0");
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b["return"])) _a.call(_b);
        }
        finally { if (e_1) throw e_1.error; }
    }
}
function outputStringPoolInfo() {
    stringPool.forEach(function (value, key) {
        emit(value + ":");
        for (var i = 0; i < key.length; ++i) {
            emit("db " + key.charCodeAt(i));
        }
        emit("db 0");
    });
    /* Doesn't work for some reason
    for (let key in stringPool.keys()) {
        let lbl = stringPool.get(key);
        emit(`${lbl}:`);
        for (let i = 0; i < key.length; ++i) {
            emit(`db ${key.charCodeAt(i)}`);
        }
        emit("db 0");   //null terminator
    }
    */
}
function generalError(message) {
    //Allows compiler to error while also clearing out any globals.
    symtable = new SymbolTable();
    stringPool = new Map();
    labelCounter = 0;
    throw Error(message);
}
//# sourceMappingURL=parser.js.map