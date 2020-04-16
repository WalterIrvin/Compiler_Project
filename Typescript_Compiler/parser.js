"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
//ASM 5
var VarType = /** @class */ (function () {
    function VarType() {
    }
    //convenience objects so we don't have to change
    //our existing code
    VarType.INTEGER = new VarType();
    VarType.STRING = new VarType();
    VarType.DOUBLE = new VarType();
    VarType.VOID = new VarType();
    return VarType;
}());
var FuncVarType = /** @class */ (function (_super) {
    __extends(FuncVarType, _super);
    function FuncVarType(argTypes, argNames, retType) {
        var _this = _super.call(this) || this;
        _this.retType = retType;
        _this.argTypes = argTypes;
        _this.argNames = argNames;
        return _this;
    }
    return FuncVarType;
}(VarType));
//ASM5
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
    emit("%include \"doCall.asm\"");
    emit("default rel");
    emit("section .text");
    emit("global main");
    emit("main:");
    //ASM4 Code
    emit("mov arg0, 0");
    emit("mov arg1, string_r");
    emit("ffcall fdopen");
    emit("mov[stdin], rax");
    emit("mov arg0, 1");
    emit("mov arg1, string_w");
    emit("ffcall fdopen");
    emit("mov[stdout], rax");
    //ASM4 End Code
    programNodeCode(root, true);
    programNodeCode(root, false);
    emit("ret");
    emit("section .data");
    //ASM4 DATA SECTION
    emit("stdin: dq 0");
    emit("stdout: dq 0");
    emit("string_r: db 'r', 0");
    emit("string_w: db 'w', 0");
    emit("string_a: db 'a', 0");
    emit("string_rplus: db 'r+', 0");
    emit("string_percent_s: db '%s', 0");
    emit("string_percent_d: db '%d', 0");
    emit("fgets_buffer: times 64 db 0");
    //ASM4 END DATA SECTION
    outputSymbolTableInfo();
    outputStringPoolInfo();
    stringPool = new Map();
    symtable = new SymbolTable();
    return asmCode.join("\n");
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
        case "func_call":
            funccallNodeCode(c);
            break;
        case "return_stmt":
            returnstmtNodeCode(c);
            break;
        default:
            console.log("Error  in stmtNode");
            ICE();
    }
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
        case "func_call":
            var type = funccallNodeCode(n.children[0]);
            if (type === VarType.VOID) {
                generalError("error: Can't use void in expression");
            }
            emit("push rax");
            return type;
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
function typeNodeCode(n) {
    var l_type = n.token.lexeme;
    var f_type = VarType.INTEGER;
    if (l_type === "int")
        f_type = VarType.INTEGER;
    else if (l_type === "string")
        f_type = VarType.STRING;
    else if (l_type === "void")
        f_type = VarType.VOID;
    else if (l_type === "double")
        f_type = VarType.DOUBLE;
    return f_type;
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
    var ns = s;
    var slash_counter = 0;
    var final_str = "";
    for (var i = 0; i < ns.length; i++) {
        var cur_char = ns[i];
        if (cur_char === "\\") {
            slash_counter += 1;
        }
        else {
            if (slash_counter % 2 === 0) {
                // If slashes are even, then keep literal character, else use the escape seq
                var tmp = "";
                for (var j = 0; j < slash_counter / 2; j++) {
                    tmp += "\\";
                }
                tmp += cur_char;
                final_str += tmp;
            }
            else {
                var tmp = "";
                for (var j = 0; j < (slash_counter - 1) / 2; j++) {
                    tmp += "\\";
                }
                switch (cur_char) {
                    case "n":
                        tmp += "\n";
                        break;
                    case "\"":
                        tmp += "\"";
                        break;
                    case ">":
                        tmp += "\>";
                        break;
                    default:
                        break;
                }
                final_str += tmp;
            }
            slash_counter = 0;
        }
    }
    if (!stringPool.has(final_str))
        stringPool.set(final_str, label());
    return stringPool.get(final_str); //return the label
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
// ASM 4
function builtinfunccallNodeCode(n) {
    //builtin-func-call -> PRINT LP expr RP | INPUT LP RP |
    //OPEN LP expr RP | READ LP expr RP | WRITE LP expr CMA expr RP |
    //CLOSE LP expr RP
    switch (n.children[0].sym) {
        //code
        case "PRINT":
            {
                emit("; Starting PRINT");
                var type = exprNodeCode(n.children[2]);
                var fmt = void 0;
                if (type === VarType.INTEGER) {
                    fmt = "string_percent_d";
                }
                else if (type === VarType.STRING) {
                    fmt = "string_percent_s";
                }
                else {
                    generalError("Attempting to print invalid type...");
                }
                emit("pop arg1"); //the thing to print
                emit("mov arg0, " + fmt); // format, %s or %d
                emit("ffvcall printf, 0");
                //need to call fflush(NULL)
                emit("mov arg0, 0");
                emit("ffcall fflush");
                emit("; Ending PRINT");
            }
        case "INPUT":
            {
                //INPUT LP RP
                //fgets( ptr, size, stream)
                //strtol( ptr, eptr, base )
                emit("mov arg0, fgets_buffer");
                emit("mov arg1, 64");
                emit("mov arg2, [stdin]");
                emit("ffcall fgets");
                //should do error checking...
                emit("mov arg0, fgets_buffer");
                emit("mov arg1, 0");
                emit("mov arg2, 10");
                emit("ffcall strtol"); //result is in rax
                return VarType.INTEGER;
            }
        case "OPEN":
            {
                emit("; Start Open");
                var type = exprNodeCode(n.children[2]);
                if (type !== VarType.STRING)
                    generalError("Invalid parameter passed to open function. " + type + ", expected " + VarType.STRING + " (string)");
                //tmp = fopen( filename, "a" );
                emit("mov arg0, [rsp]"); //filename (string)
                emit("mov arg1, string_a"); //next slide
                emit("ffcall fopen");
                //fclose(tmp)
                emit("mov arg0, rax");
                emit("ffcall fclose");
                //fopen( filename, "r+" )
                emit("pop arg0"); //filename; remove from stack
                emit("mov arg1, string_rplus"); //next slide
                emit("ffcall fopen"); //result is in rax
                emit("; End Open");
                return VarType.INTEGER;
            }
        case "READ":
            {
                emit("; Start Read");
                var type = exprNodeCode(n.children[2]);
                if (type !== VarType.INTEGER)
                    generalError("Invalid parameter passed to open function. " + type + ", expected " + VarType.INTEGER + " (integer)");
                //fgets( ptr, size, handle)
                //strtol( ptr, eptr, base )
                emit("mov arg0, fgets_buffer");
                emit("mov arg1, 64");
                emit("pop arg2");
                emit("ffcall fgets");
                //should do error checking...
                emit("mov arg0, fgets_buffer");
                emit("mov arg1, 0");
                emit("mov arg2, 10");
                emit("ffcall strtol"); //result is in rax
                emit("; End read");
                return VarType.INTEGER;
            }
        case "WRITE":
            {
                // WRITE LP expr CMA expr RP
                // fprintf( fp, "%s", str )  or  fprintf( fp, "%d", num )
                emit("; Begin Write");
                var handletype = exprNodeCode(n.children[2]);
                if (handletype !== VarType.INTEGER)
                    generalError("error invalid type");
                var outputtype = exprNodeCode(n.children[4]);
                var fmt = void 0;
                if (outputtype === VarType.INTEGER)
                    fmt = "string_percent_d";
                else if (outputtype === VarType.STRING)
                    fmt = "string_percent_s";
                else
                    generalError("error invalid type");
                emit("pop arg2"); //the thing to print
                emit("mov arg1, " + fmt);
                emit("pop arg0"); //the handle
                emit("ffvcall fprintf,0");
                //need to call fflush(NULL)
                emit("mov arg0, 0");
                emit("ffcall fflush");
                emit("; End Write");
                return VarType.VOID;
            }
        case "CLOSE":
            {
                emit("; Begin Close");
                var type = exprNodeCode(n.children[2]);
                if (type !== VarType.INTEGER)
                    throw generalError("error: Close requires numeric arg");
                emit("pop arg0"); //argument for fclose
                emit("ffcall fclose");
                emit("; End Close");
                return VarType.VOID;
            }
        case "NOW":
            {
            }
        default:
            ICE();
            break;
    }
    return null;
}
// ASM 5
function programNodeCode(n, firstPass) {
    //program -> var_decl_list braceblock
    if (n.sym !== "program")
        ICE();
    declListNodeCode(n.children[0], firstPass);
}
function declListNodeCode(n, firstPass) {
    //decl-list ? func-decl decl-list | var-decl SEMI decl-list | ?
    if (n.children.length == 2) {
        funcdeclNodeCode(n.children[0], firstPass);
        declListNodeCode(n.children[1], firstPass);
    }
    else if (n.children.length == 3) {
        vardeclNodeCode(n.children[0], firstPass);
        declListNodeCode(n.children[2], firstPass);
    }
}
function getVarTypeFromToken(n) {
    return typeNodeCode(n);
}
function vardeclNodeCode(n, firstPass) {
    //var-decl -> TYPE ID
    if (firstPass) {
        vardeclFirstPass(n);
    }
    else {
        vardeclSecondPass(n);
    }
}
function vardeclFirstPass(n) {
    var vname = n.children[1].token.lexeme;
    var vtype = typeNodeCode(n.children[0]);
    symtable.set(vname, new VarInfo(vtype, label()));
}
function vardeclSecondPass(n) {
}
function funcdeclNodeCode(n, firstPass) {
    //func-decl -> TYPE ID LP optional-param-list RP braceblock
    if (firstPass) {
        funcdeclFirstPass(n);
    }
    else {
        funcdeclSecondPass(n);
    }
}
function funcdeclFirstPass(n) {
    //func-decl -> TYPE ID LP optional-param-list RP braceblock
    var funcName = n.children[1].token.lexeme;
    var returnType = getVarTypeFromToken(n.children[0]);
    var argTypes = [];
    var argNames = [];
    var lbl = label();
    var vtype = new FuncVarType(argTypes, argNames, returnType);
    //throws error if duplicate name
    symtable.set(funcName, new VarInfo(vtype, lbl));
}
function funcdeclSecondPass(n) {
    //func-decl ? TYPE ID LP optional-param-list RP braceblock
    var funcName = n.children[1].token.lexeme;
    var vinfo = symtable.get(funcName);
    emit(vinfo.location + ":");
    braceblockNodeCode(n.children[5]);
}
function funccallNodeCode(n) {
    //func-call -> ID LP optional-expr-list RP | builtin-func-call
    if (n.children.length === 1)
        return builtinfunccallNodeCode(n);
    else {
        var funcname = n.children[0].token.lexeme;
        //throws exception if not found
        var info = symtable.get(funcname).type;
        if (!(info instanceof FuncVarType)) {
            generalError("error: Can't call a non-function");
        }
        var funcInfo = info;
        emit("call " + symtable.get(funcname).location);
        return funcInfo.retType;
    }
}
function returnstmtNodeCode(n) {
    //return-stmt ? RETURN expr | RETURN
    if (n.children.length == 1) {
        emit("ret");
    }
    else {
        exprNodeCode(n.children[1]);
        emit("pop rax");
        emit("ret");
    }
}
//# sourceMappingURL=parser.js.map