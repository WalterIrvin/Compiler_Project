// Generated from gram.txt by ANTLR 4.8
// jshint ignore: start
var antlr4 = require('antlr4/index');
var gramListener = require('./gramListener').gramListener;
var grammarFileName = "gram.txt";


var serializedATN = ["\u0003\u608b\ua72a\u8133\ub9ed\u417c\u3be7\u7786\u5964",
    "\u0003\rE\u0004\u0002\t\u0002\u0004\u0003\t\u0003\u0004\u0004\t\u0004",
    "\u0004\u0005\t\u0005\u0004\u0006\t\u0006\u0004\u0007\t\u0007\u0004\b",
    "\t\b\u0004\t\t\t\u0004\n\t\n\u0003\u0002\u0003\u0002\u0003\u0003\u0003",
    "\u0003\u0003\u0004\u0003\u0004\u0003\u0004\u0003\u0004\u0005\u0004\u001d",
    "\n\u0004\u0003\u0005\u0003\u0005\u0003\u0005\u0003\u0005\u0003\u0005",
    "\u0005\u0005$\n\u0005\u0003\u0006\u0003\u0006\u0003\u0006\u0003\u0006",
    "\u0003\u0006\u0003\u0006\u0003\u0006\u0003\u0006\u0003\u0006\u0003\u0006",
    "\u0003\u0006\u0003\u0006\u0003\u0006\u0003\u0006\u0005\u00064\n\u0006",
    "\u0003\u0007\u0003\u0007\u0003\u0007\u0003\u0007\u0003\b\u0003\b\u0003",
    "\t\u0003\t\u0003\t\u0003\n\u0003\n\u0003\n\u0003\n\u0003\n\u0003\n\u0003",
    "\n\u0002\u0002\u000b\u0002\u0004\u0006\b\n\f\u000e\u0010\u0012\u0002",
    "\u0002\u0002?\u0002\u0014\u0003\u0002\u0002\u0002\u0004\u0016\u0003",
    "\u0002\u0002\u0002\u0006\u001c\u0003\u0002\u0002\u0002\b#\u0003\u0002",
    "\u0002\u0002\n3\u0003\u0002\u0002\u0002\f5\u0003\u0002\u0002\u0002\u000e",
    "9\u0003\u0002\u0002\u0002\u0010;\u0003\u0002\u0002\u0002\u0012>\u0003",
    "\u0002\u0002\u0002\u0014\u0015\u0005\u0004\u0003\u0002\u0015\u0003\u0003",
    "\u0002\u0002\u0002\u0016\u0017\u0005\f\u0007\u0002\u0017\u0005\u0003",
    "\u0002\u0002\u0002\u0018\u0019\u0005\b\u0005\u0002\u0019\u001a\u0005",
    "\u0006\u0004\u0002\u001a\u001d\u0003\u0002\u0002\u0002\u001b\u001d\u0003",
    "\u0002\u0002\u0002\u001c\u0018\u0003\u0002\u0002\u0002\u001c\u001b\u0003",
    "\u0002\u0002\u0002\u001d\u0007\u0003\u0002\u0002\u0002\u001e$\u0005",
    "\n\u0006\u0002\u001f$\u0005\u0012\n\u0002 !\u0005\u0010\t\u0002!\"\u0007",
    "\u0003\u0002\u0002\"$\u0003\u0002\u0002\u0002#\u001e\u0003\u0002\u0002",
    "\u0002#\u001f\u0003\u0002\u0002\u0002# \u0003\u0002\u0002\u0002$\t\u0003",
    "\u0002\u0002\u0002%&\u0007\b\u0002\u0002&\'\u0007\u0006\u0002\u0002",
    "\'(\u0005\u000e\b\u0002()\u0007\u0007\u0002\u0002)*\u0005\f\u0007\u0002",
    "*4\u0003\u0002\u0002\u0002+,\u0007\b\u0002\u0002,-\u0007\u0006\u0002",
    "\u0002-.\u0005\u000e\b\u0002./\u0007\u0007\u0002\u0002/0\u0005\f\u0007",
    "\u000201\u0007\t\u0002\u000212\u0005\f\u0007\u000224\u0003\u0002\u0002",
    "\u00023%\u0003\u0002\u0002\u00023+\u0003\u0002\u0002\u00024\u000b\u0003",
    "\u0002\u0002\u000256\u0007\u000b\u0002\u000267\u0005\u0006\u0004\u0002",
    "78\u0007\f\u0002\u00028\r\u0003\u0002\u0002\u00029:\u0007\r\u0002\u0002",
    ":\u000f\u0003\u0002\u0002\u0002;<\u0007\n\u0002\u0002<=\u0005\u000e",
    "\b\u0002=\u0011\u0003\u0002\u0002\u0002>?\u0007\u0005\u0002\u0002?@",
    "\u0007\u0006\u0002\u0002@A\u0005\u000e\b\u0002AB\u0007\u0007\u0002\u0002",
    "BC\u0005\f\u0007\u0002C\u0013\u0003\u0002\u0002\u0002\u0005\u001c#3"].join("");


var atn = new antlr4.atn.ATNDeserializer().deserialize(serializedATN);

var decisionsToDFA = atn.decisionToState.map( function(ds, index) { return new antlr4.dfa.DFA(ds, index); });

var sharedContextCache = new antlr4.PredictionContextCache();

var literalNames = [ null, "';'", null, "'while'", null, null, "'if'", "'else'", 
                     "'return'" ];

var symbolicNames = [ null, "SEMI", "WHITESPACE", "WHILE", "LP", "RP", "IF", 
                      "ELSE", "RETURN", "LBR", "RBR", "NUM" ];

var ruleNames =  [ "start", "program", "stmts", "stmt", "cond", "braceblock", 
                   "expr", "return_stmt", "loop" ];

function gramParser (input) {
	antlr4.Parser.call(this, input);
    this._interp = new antlr4.atn.ParserATNSimulator(this, atn, decisionsToDFA, sharedContextCache);
    this.ruleNames = ruleNames;
    this.literalNames = literalNames;
    this.symbolicNames = symbolicNames;
    return this;
}

gramParser.prototype = Object.create(antlr4.Parser.prototype);
gramParser.prototype.constructor = gramParser;

Object.defineProperty(gramParser.prototype, "atn", {
	get : function() {
		return atn;
	}
});

gramParser.EOF = antlr4.Token.EOF;
gramParser.SEMI = 1;
gramParser.WHITESPACE = 2;
gramParser.WHILE = 3;
gramParser.LP = 4;
gramParser.RP = 5;
gramParser.IF = 6;
gramParser.ELSE = 7;
gramParser.RETURN = 8;
gramParser.LBR = 9;
gramParser.RBR = 10;
gramParser.NUM = 11;

gramParser.RULE_start = 0;
gramParser.RULE_program = 1;
gramParser.RULE_stmts = 2;
gramParser.RULE_stmt = 3;
gramParser.RULE_cond = 4;
gramParser.RULE_braceblock = 5;
gramParser.RULE_expr = 6;
gramParser.RULE_return_stmt = 7;
gramParser.RULE_loop = 8;


function StartContext(parser, parent, invokingState) {
	if(parent===undefined) {
	    parent = null;
	}
	if(invokingState===undefined || invokingState===null) {
		invokingState = -1;
	}
	antlr4.ParserRuleContext.call(this, parent, invokingState);
    this.parser = parser;
    this.ruleIndex = gramParser.RULE_start;
    return this;
}

StartContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
StartContext.prototype.constructor = StartContext;

StartContext.prototype.program = function() {
    return this.getTypedRuleContext(ProgramContext,0);
};

StartContext.prototype.enterRule = function(listener) {
    if(listener instanceof gramListener ) {
        listener.enterStart(this);
	}
};

StartContext.prototype.exitRule = function(listener) {
    if(listener instanceof gramListener ) {
        listener.exitStart(this);
	}
};




gramParser.StartContext = StartContext;

gramParser.prototype.start = function() {

    var localctx = new StartContext(this, this._ctx, this.state);
    this.enterRule(localctx, 0, gramParser.RULE_start);
    try {
        this.enterOuterAlt(localctx, 1);
        this.state = 18;
        this.program();
    } catch (re) {
    	if(re instanceof antlr4.error.RecognitionException) {
	        localctx.exception = re;
	        this._errHandler.reportError(this, re);
	        this._errHandler.recover(this, re);
	    } else {
	    	throw re;
	    }
    } finally {
        this.exitRule();
    }
    return localctx;
};


function ProgramContext(parser, parent, invokingState) {
	if(parent===undefined) {
	    parent = null;
	}
	if(invokingState===undefined || invokingState===null) {
		invokingState = -1;
	}
	antlr4.ParserRuleContext.call(this, parent, invokingState);
    this.parser = parser;
    this.ruleIndex = gramParser.RULE_program;
    return this;
}

ProgramContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
ProgramContext.prototype.constructor = ProgramContext;

ProgramContext.prototype.braceblock = function() {
    return this.getTypedRuleContext(BraceblockContext,0);
};

ProgramContext.prototype.enterRule = function(listener) {
    if(listener instanceof gramListener ) {
        listener.enterProgram(this);
	}
};

ProgramContext.prototype.exitRule = function(listener) {
    if(listener instanceof gramListener ) {
        listener.exitProgram(this);
	}
};




gramParser.ProgramContext = ProgramContext;

gramParser.prototype.program = function() {

    var localctx = new ProgramContext(this, this._ctx, this.state);
    this.enterRule(localctx, 2, gramParser.RULE_program);
    try {
        this.enterOuterAlt(localctx, 1);
        this.state = 20;
        this.braceblock();
    } catch (re) {
    	if(re instanceof antlr4.error.RecognitionException) {
	        localctx.exception = re;
	        this._errHandler.reportError(this, re);
	        this._errHandler.recover(this, re);
	    } else {
	    	throw re;
	    }
    } finally {
        this.exitRule();
    }
    return localctx;
};


function StmtsContext(parser, parent, invokingState) {
	if(parent===undefined) {
	    parent = null;
	}
	if(invokingState===undefined || invokingState===null) {
		invokingState = -1;
	}
	antlr4.ParserRuleContext.call(this, parent, invokingState);
    this.parser = parser;
    this.ruleIndex = gramParser.RULE_stmts;
    return this;
}

StmtsContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
StmtsContext.prototype.constructor = StmtsContext;

StmtsContext.prototype.stmt = function() {
    return this.getTypedRuleContext(StmtContext,0);
};

StmtsContext.prototype.stmts = function() {
    return this.getTypedRuleContext(StmtsContext,0);
};

StmtsContext.prototype.enterRule = function(listener) {
    if(listener instanceof gramListener ) {
        listener.enterStmts(this);
	}
};

StmtsContext.prototype.exitRule = function(listener) {
    if(listener instanceof gramListener ) {
        listener.exitStmts(this);
	}
};




gramParser.StmtsContext = StmtsContext;

gramParser.prototype.stmts = function() {

    var localctx = new StmtsContext(this, this._ctx, this.state);
    this.enterRule(localctx, 4, gramParser.RULE_stmts);
    try {
        this.state = 26;
        this._errHandler.sync(this);
        switch(this._input.LA(1)) {
        case gramParser.WHILE:
        case gramParser.IF:
        case gramParser.RETURN:
            this.enterOuterAlt(localctx, 1);
            this.state = 22;
            this.stmt();
            this.state = 23;
            this.stmts();
            break;
        case gramParser.RBR:
            this.enterOuterAlt(localctx, 2);

            break;
        default:
            throw new antlr4.error.NoViableAltException(this);
        }
    } catch (re) {
    	if(re instanceof antlr4.error.RecognitionException) {
	        localctx.exception = re;
	        this._errHandler.reportError(this, re);
	        this._errHandler.recover(this, re);
	    } else {
	    	throw re;
	    }
    } finally {
        this.exitRule();
    }
    return localctx;
};


function StmtContext(parser, parent, invokingState) {
	if(parent===undefined) {
	    parent = null;
	}
	if(invokingState===undefined || invokingState===null) {
		invokingState = -1;
	}
	antlr4.ParserRuleContext.call(this, parent, invokingState);
    this.parser = parser;
    this.ruleIndex = gramParser.RULE_stmt;
    return this;
}

StmtContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
StmtContext.prototype.constructor = StmtContext;

StmtContext.prototype.cond = function() {
    return this.getTypedRuleContext(CondContext,0);
};

StmtContext.prototype.loop = function() {
    return this.getTypedRuleContext(LoopContext,0);
};

StmtContext.prototype.return_stmt = function() {
    return this.getTypedRuleContext(Return_stmtContext,0);
};

StmtContext.prototype.SEMI = function() {
    return this.getToken(gramParser.SEMI, 0);
};

StmtContext.prototype.enterRule = function(listener) {
    if(listener instanceof gramListener ) {
        listener.enterStmt(this);
	}
};

StmtContext.prototype.exitRule = function(listener) {
    if(listener instanceof gramListener ) {
        listener.exitStmt(this);
	}
};




gramParser.StmtContext = StmtContext;

gramParser.prototype.stmt = function() {

    var localctx = new StmtContext(this, this._ctx, this.state);
    this.enterRule(localctx, 6, gramParser.RULE_stmt);
    try {
        this.state = 33;
        this._errHandler.sync(this);
        switch(this._input.LA(1)) {
        case gramParser.IF:
            this.enterOuterAlt(localctx, 1);
            this.state = 28;
            this.cond();
            break;
        case gramParser.WHILE:
            this.enterOuterAlt(localctx, 2);
            this.state = 29;
            this.loop();
            break;
        case gramParser.RETURN:
            this.enterOuterAlt(localctx, 3);
            this.state = 30;
            this.return_stmt();
            this.state = 31;
            this.match(gramParser.SEMI);
            break;
        default:
            throw new antlr4.error.NoViableAltException(this);
        }
    } catch (re) {
    	if(re instanceof antlr4.error.RecognitionException) {
	        localctx.exception = re;
	        this._errHandler.reportError(this, re);
	        this._errHandler.recover(this, re);
	    } else {
	    	throw re;
	    }
    } finally {
        this.exitRule();
    }
    return localctx;
};


function CondContext(parser, parent, invokingState) {
	if(parent===undefined) {
	    parent = null;
	}
	if(invokingState===undefined || invokingState===null) {
		invokingState = -1;
	}
	antlr4.ParserRuleContext.call(this, parent, invokingState);
    this.parser = parser;
    this.ruleIndex = gramParser.RULE_cond;
    return this;
}

CondContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
CondContext.prototype.constructor = CondContext;

CondContext.prototype.IF = function() {
    return this.getToken(gramParser.IF, 0);
};

CondContext.prototype.LP = function() {
    return this.getToken(gramParser.LP, 0);
};

CondContext.prototype.expr = function() {
    return this.getTypedRuleContext(ExprContext,0);
};

CondContext.prototype.RP = function() {
    return this.getToken(gramParser.RP, 0);
};

CondContext.prototype.braceblock = function(i) {
    if(i===undefined) {
        i = null;
    }
    if(i===null) {
        return this.getTypedRuleContexts(BraceblockContext);
    } else {
        return this.getTypedRuleContext(BraceblockContext,i);
    }
};

CondContext.prototype.ELSE = function() {
    return this.getToken(gramParser.ELSE, 0);
};

CondContext.prototype.enterRule = function(listener) {
    if(listener instanceof gramListener ) {
        listener.enterCond(this);
	}
};

CondContext.prototype.exitRule = function(listener) {
    if(listener instanceof gramListener ) {
        listener.exitCond(this);
	}
};




gramParser.CondContext = CondContext;

gramParser.prototype.cond = function() {

    var localctx = new CondContext(this, this._ctx, this.state);
    this.enterRule(localctx, 8, gramParser.RULE_cond);
    try {
        this.state = 49;
        this._errHandler.sync(this);
        var la_ = this._interp.adaptivePredict(this._input,2,this._ctx);
        switch(la_) {
        case 1:
            this.enterOuterAlt(localctx, 1);
            this.state = 35;
            this.match(gramParser.IF);
            this.state = 36;
            this.match(gramParser.LP);
            this.state = 37;
            this.expr();
            this.state = 38;
            this.match(gramParser.RP);
            this.state = 39;
            this.braceblock();
            break;

        case 2:
            this.enterOuterAlt(localctx, 2);
            this.state = 41;
            this.match(gramParser.IF);
            this.state = 42;
            this.match(gramParser.LP);
            this.state = 43;
            this.expr();
            this.state = 44;
            this.match(gramParser.RP);
            this.state = 45;
            this.braceblock();
            this.state = 46;
            this.match(gramParser.ELSE);
            this.state = 47;
            this.braceblock();
            break;

        }
    } catch (re) {
    	if(re instanceof antlr4.error.RecognitionException) {
	        localctx.exception = re;
	        this._errHandler.reportError(this, re);
	        this._errHandler.recover(this, re);
	    } else {
	    	throw re;
	    }
    } finally {
        this.exitRule();
    }
    return localctx;
};


function BraceblockContext(parser, parent, invokingState) {
	if(parent===undefined) {
	    parent = null;
	}
	if(invokingState===undefined || invokingState===null) {
		invokingState = -1;
	}
	antlr4.ParserRuleContext.call(this, parent, invokingState);
    this.parser = parser;
    this.ruleIndex = gramParser.RULE_braceblock;
    return this;
}

BraceblockContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
BraceblockContext.prototype.constructor = BraceblockContext;

BraceblockContext.prototype.LBR = function() {
    return this.getToken(gramParser.LBR, 0);
};

BraceblockContext.prototype.stmts = function() {
    return this.getTypedRuleContext(StmtsContext,0);
};

BraceblockContext.prototype.RBR = function() {
    return this.getToken(gramParser.RBR, 0);
};

BraceblockContext.prototype.enterRule = function(listener) {
    if(listener instanceof gramListener ) {
        listener.enterBraceblock(this);
	}
};

BraceblockContext.prototype.exitRule = function(listener) {
    if(listener instanceof gramListener ) {
        listener.exitBraceblock(this);
	}
};




gramParser.BraceblockContext = BraceblockContext;

gramParser.prototype.braceblock = function() {

    var localctx = new BraceblockContext(this, this._ctx, this.state);
    this.enterRule(localctx, 10, gramParser.RULE_braceblock);
    try {
        this.enterOuterAlt(localctx, 1);
        this.state = 51;
        this.match(gramParser.LBR);
        this.state = 52;
        this.stmts();
        this.state = 53;
        this.match(gramParser.RBR);
    } catch (re) {
    	if(re instanceof antlr4.error.RecognitionException) {
	        localctx.exception = re;
	        this._errHandler.reportError(this, re);
	        this._errHandler.recover(this, re);
	    } else {
	    	throw re;
	    }
    } finally {
        this.exitRule();
    }
    return localctx;
};


function ExprContext(parser, parent, invokingState) {
	if(parent===undefined) {
	    parent = null;
	}
	if(invokingState===undefined || invokingState===null) {
		invokingState = -1;
	}
	antlr4.ParserRuleContext.call(this, parent, invokingState);
    this.parser = parser;
    this.ruleIndex = gramParser.RULE_expr;
    return this;
}

ExprContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
ExprContext.prototype.constructor = ExprContext;

ExprContext.prototype.NUM = function() {
    return this.getToken(gramParser.NUM, 0);
};

ExprContext.prototype.enterRule = function(listener) {
    if(listener instanceof gramListener ) {
        listener.enterExpr(this);
	}
};

ExprContext.prototype.exitRule = function(listener) {
    if(listener instanceof gramListener ) {
        listener.exitExpr(this);
	}
};




gramParser.ExprContext = ExprContext;

gramParser.prototype.expr = function() {

    var localctx = new ExprContext(this, this._ctx, this.state);
    this.enterRule(localctx, 12, gramParser.RULE_expr);
    try {
        this.enterOuterAlt(localctx, 1);
        this.state = 55;
        this.match(gramParser.NUM);
    } catch (re) {
    	if(re instanceof antlr4.error.RecognitionException) {
	        localctx.exception = re;
	        this._errHandler.reportError(this, re);
	        this._errHandler.recover(this, re);
	    } else {
	    	throw re;
	    }
    } finally {
        this.exitRule();
    }
    return localctx;
};


function Return_stmtContext(parser, parent, invokingState) {
	if(parent===undefined) {
	    parent = null;
	}
	if(invokingState===undefined || invokingState===null) {
		invokingState = -1;
	}
	antlr4.ParserRuleContext.call(this, parent, invokingState);
    this.parser = parser;
    this.ruleIndex = gramParser.RULE_return_stmt;
    return this;
}

Return_stmtContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
Return_stmtContext.prototype.constructor = Return_stmtContext;

Return_stmtContext.prototype.RETURN = function() {
    return this.getToken(gramParser.RETURN, 0);
};

Return_stmtContext.prototype.expr = function() {
    return this.getTypedRuleContext(ExprContext,0);
};

Return_stmtContext.prototype.enterRule = function(listener) {
    if(listener instanceof gramListener ) {
        listener.enterReturn_stmt(this);
	}
};

Return_stmtContext.prototype.exitRule = function(listener) {
    if(listener instanceof gramListener ) {
        listener.exitReturn_stmt(this);
	}
};




gramParser.Return_stmtContext = Return_stmtContext;

gramParser.prototype.return_stmt = function() {

    var localctx = new Return_stmtContext(this, this._ctx, this.state);
    this.enterRule(localctx, 14, gramParser.RULE_return_stmt);
    try {
        this.enterOuterAlt(localctx, 1);
        this.state = 57;
        this.match(gramParser.RETURN);
        this.state = 58;
        this.expr();
    } catch (re) {
    	if(re instanceof antlr4.error.RecognitionException) {
	        localctx.exception = re;
	        this._errHandler.reportError(this, re);
	        this._errHandler.recover(this, re);
	    } else {
	    	throw re;
	    }
    } finally {
        this.exitRule();
    }
    return localctx;
};


function LoopContext(parser, parent, invokingState) {
	if(parent===undefined) {
	    parent = null;
	}
	if(invokingState===undefined || invokingState===null) {
		invokingState = -1;
	}
	antlr4.ParserRuleContext.call(this, parent, invokingState);
    this.parser = parser;
    this.ruleIndex = gramParser.RULE_loop;
    return this;
}

LoopContext.prototype = Object.create(antlr4.ParserRuleContext.prototype);
LoopContext.prototype.constructor = LoopContext;

LoopContext.prototype.WHILE = function() {
    return this.getToken(gramParser.WHILE, 0);
};

LoopContext.prototype.LP = function() {
    return this.getToken(gramParser.LP, 0);
};

LoopContext.prototype.expr = function() {
    return this.getTypedRuleContext(ExprContext,0);
};

LoopContext.prototype.RP = function() {
    return this.getToken(gramParser.RP, 0);
};

LoopContext.prototype.braceblock = function() {
    return this.getTypedRuleContext(BraceblockContext,0);
};

LoopContext.prototype.enterRule = function(listener) {
    if(listener instanceof gramListener ) {
        listener.enterLoop(this);
	}
};

LoopContext.prototype.exitRule = function(listener) {
    if(listener instanceof gramListener ) {
        listener.exitLoop(this);
	}
};




gramParser.LoopContext = LoopContext;

gramParser.prototype.loop = function() {

    var localctx = new LoopContext(this, this._ctx, this.state);
    this.enterRule(localctx, 16, gramParser.RULE_loop);
    try {
        this.enterOuterAlt(localctx, 1);
        this.state = 60;
        this.match(gramParser.WHILE);
        this.state = 61;
        this.match(gramParser.LP);
        this.state = 62;
        this.expr();
        this.state = 63;
        this.match(gramParser.RP);
        this.state = 64;
        this.braceblock();
    } catch (re) {
    	if(re instanceof antlr4.error.RecognitionException) {
	        localctx.exception = re;
	        this._errHandler.reportError(this, re);
	        this._errHandler.recover(this, re);
	    } else {
	    	throw re;
	    }
    } finally {
        this.exitRule();
    }
    return localctx;
};


exports.gramParser = gramParser;
