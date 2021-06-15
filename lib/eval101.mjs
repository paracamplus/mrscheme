
import { M$ } from './message101.mjs';
import { SchemeNumber } from "./schemeNumber101.mjs";
import { BoolValue, VectorValue, StringValue, NilValue, PairValue,
         IntegerValue, NumberValue, RealValue, RationalValue, UnitValue  }
  from './values.mjs';

function BuildPairFromList(evaluator, lexenv, list) {
    var pair = new NilValue();
    for(var i=list.elems.length-1;i>=0;i--) {
        var qarg = list.elems[i];
        if(qarg.type=='qexpr') {
            qarg = EvalQuoted(evaluator,lexenv,qarg.expr);
            if(qarg.type=="evalError") {
                return qarg;
            }
        } else {
            qarg = EvalQuoted(evaluator,lexenv,qarg);
            if(qarg.type=="evalError") {
                return qarg;
            }
        }
        
        pair = new PairValue(qarg,pair);
    }
    return pair;
}

function EvalError(msg,expr) {
    this.type = "evalError";
    this.expr = expr;
    this.startPos = expr.startPos;
    this.endPos = expr.endPos;
    this.message = msg;
    this.expr = expr;
    
    this.toString = function() {
        var str = "Eval error: frm (line "+expr.startPos.lpos+", col "+expr.startPos.cpos+") to (line "+expr.endPos.lpos+", col "+expr.endPos.cpos+')\n';
        str = str + "  ==> " + this.message + "\n";
        return str;
    }

    this.toHTML = function() {
        return '<span class="error"><strong>'+M$("Eval Error").toString()+'</strong>: '+this.message+'</span>';
    }
    
}

function FunEnv() {
    this.funs = new Array();

    this.fetch = function(name) {
        return this.funs["___"+name];
    }

    this.register = function(name,fun) {
        if (this.funs["___"+name]==null) {
            this.funs["___"+name] = fun;
            return true;
        } else {
            return false;
        }
    }

    this.unregister = function(name) {
        var fun = this.fetch(name);
        if(fun==null) {
            throw "Cannot unregister function '"+name+"' (please report)";
        }
        this.funs["___"+name] = null;
    }

}

function UserFunction(expr,lexenv) {
    this.type = "function";
    this.expr = expr;
    this.name = expr.fname;
    this.params = expr.params;
    this.arity = this.params.length;
    this.callable = true;
    this.innerDefs = expr.innerDefs;
    this.body = expr.body;
    this.defEnv = lexenv;

    this.call = function(evaluator,lexenv,callExpr,args) {
        // remark : lexenv is of course unused with lexical scoping (the args have been calculated in lexenv)

        // check the arity
        if(args.length < this.arity) {
            return new EvalError(M$("Not enough arguments in call (given $0, needs $1)",new Array(""+args.length,""+this.arity)),callExpr);
        } else if(args.length > this.arity) {
            return new EvalError(M$("Too many arguments in call (given $0, needs $1)",new Array(""+args.length,""+this.arity)),callExpr);
        }

        // first dig the definitional lex. env
        var callEnv = this.defEnv.dig();
        // then bind the parameters
        for(var i=0;i<this.params.length;i++) {
            var ok = callEnv.bind(this.params[i], args[i]);
            if(!ok) {
                return new EvalError(M$("Parameter '$0' already defined",this.params[i]), this.expr);
            }
        }

        // now must evaluate the inner functions and also bind them in the call env
        for(var i=0;i<this.innerDefs.length;i++) {
            var result = EvalDefine(evaluator,callEnv,this.innerDefs[i]);
            if(result.type!="function") {
                return result;
            }
            
            var ok = callEnv.bind(result.name,result);
            if(!ok) {
                return new EvalError(M$("Inner function '$0' already defined",result.name),this.innerDefs[i]);
            }


        }

        // ok to evaluate the body
        return evaluator.evalExpr(callEnv,this.body);
    }

    this.toString = function() {
        return this.name;
    }

    this.toHTML = function() {
        return '<span class="value">function:'+this.name+'<span class="tooltip">type <strong>Function</strong></span></span>';        
    }
    
}

function LexEnv(parent) {
    this.parent = parent;

    this.vars = new Array();

    this.bind = function(varname,value) {
        if (this.vars["___"+varname]==null) {
            this.vars["___"+varname] = value;
            return true;
        } else {
            return false;
        }
    }
    
    this.fetch = function(varname) {
        var result = this.vars["___"+varname];
        if(result!=null) {
            return result;
        }
        if(this.parent==null) {
            return null;
        } else {
            return this.parent.fetch(varname);
        }
    }

    this.dig = function() {
        var nenv = new LexEnv(this);
        return nenv;
    }

    this.bury = function() {
        return parent;
    }

    this.toString = function() {
        var str = "[";
        var i = 0;
        for(var key in this.vars) {
            str = str + key + "->" + this.vars[key];
            i++;
            if(i<this.vars.length-1) {
                str = str+",";
            }
        }
        str = str + "]";
        if(parent!=null) {
            str = str + parent;
        }
        return str;
    }

}

export function Evaluator(primsEnv) {
    if(primsEnv==null) {
        throw new "PrimsEnv undefined (please report)";
    }

    this.primsEnv = primsEnv; // environment of primitives
    this.funEnv = new FunEnv(); // environment of functions

    this.nbTestsPassed = 0;
    
    this.lookup = function(lexenv,symbol) {
        // 1) search in lexenv
        var entry = lexenv.fetch(symbol.value);
        if(entry!=null) {
            return entry;
        }

        // 2) search in funEnv
        entry = this.funEnv.fetch(symbol.value);
        if(entry!=null) {
            return entry;
        }

        // 3) search in primsEnv
        entry = this.primsEnv.fetch(symbol.value);
        if(entry!=null) {
            return entry;
        }

        return new EvalError(M$("Unknown variable '$0'",symbol.value),symbol);
    }

    this.eval = function(expr, traceMode) {
        var lexenv = new LexEnv();
        // install constants
        lexenv.bind("pi", new RealValue(SchemeNumber.fn["string->number"](""+Math.PI)));
        
        // then run evaluator
        if(traceMode) {
            this.evalTraceExpr = this.evalExpr;
            this.evalExpr = this.traceExpr;
        }

        var result = this.evalExpr(lexenv,expr);

        if(traceMode) {
            this.evalExpr = this.evalTraceExpr;
            this.evalTraceExpr = null;
        }
        
        return result;
    }

    this.traceExpr = function(lexenv,expr) {
        this.evalDepth++;

        // 1. show the eval step

        if (this.traceMode == "all") {
            var msg = "";
            for(var i=0;i<this.evalDepth-1;i++) {
                msg += "·";
            }
            msg += "| ";
            msg += expr.toString();

            if(expr.type=="symbol") {
                var entry = lexenv.fetch(expr.value);
                if(entry!=null) {
                    msg += " <== " + entry.toString();
                }
            }
            
            this.traceln("<pre class='traceExpr'>" + msg +"</pre>");
        }

        // 2. perform the step
        var result = this.evalTraceExpr(lexenv,expr);

        this.evalDepth--;

        // XXX: show something at the end ?

        return result;
    }
    
    this.evalExpr = function(lexenv,expr) {
        if(expr.type=="Number") {
          return new NumberValue(expr.value);
        } else if(expr.type=="bool") {
            return new BoolValue(expr.value);
        } else if(expr.type=="string") {
            return new StringValue(expr.value);
        } else if(expr.type=="nil") {
            return new NilValue();
        } else if(expr.type=='qlist') { // quoted list
            return BuildPairFromList(this,lexenv,expr);
        } else if(expr.type=='qexpr') { // quoted expression
            return EvalQuoted(this,lexenv,expr.expr);
        } else if(expr.type=="symbol") {
            return this.lookup(lexenv,expr);
        } else if(expr.type=="application") {
            return EvalApplication(this,lexenv,expr);
        } else if(expr.type=="if") {
            return EvalIf(this,lexenv,expr);
        } else if(expr.type=="and") {
            return EvalAnd(this,lexenv,expr);
        } else if(expr.type=="or") {
            return EvalOr(this,lexenv,expr);
        } else if(expr.type=="test") {
            return EvalTest(this,lexenv,expr);
        } else if(expr.type=="define") {
            var fun = EvalDefine(this,lexenv,expr);
            if(fun.type!="function") {
                return new EvalError("Define is not a function (please report)",expr);
            }
            var ok = this.funEnv.register(fun.name,fun);
            if(!ok) {
                return new EvalError(M$("Function '$0' already defined",fun.name),expr);
            }
            return new UnitValue();
        } else if(expr.type=="let") {
            return EvalLet(this,lexenv,expr);
        } else if(expr.type=="let*") {
            return EvalLetStar(this,lexenv,expr);
        } else if(expr.type=="cond") {
            return EvalCond(this,lexenv,expr);
        } else {
            return new EvalError(M$("Cannot (yet) evaluate expression of type: $0",expr.type),expr);
        }
    }
}


function EvalApplication(evaluator,lexenv,expr) {
    var args = new Array();
    // evaluate arguments  (beware of recursion here)
    for(var i=1;i<expr.size();i++) {
        var arg = evaluator.evalExpr(lexenv,expr.get(i));
        if (arg.type=="evalError") {
            return arg;
        }
        args.push(arg);
    }
    // evaluation functional argument
    var fun = evaluator.evalExpr(lexenv,expr.get(0));
    if (fun.type=="evalError") {
        return fun;
    } else if(!fun.callable) {
        return new EvalError(M$("Functional argument is not callable"),expr);
    }

    // trace
    var showStep = false;

    if (evaluator.traceMode == "calls" && fun.type != "primitive") {
        showStep = true;
    }

    if(showStep) {
        var msg = "";
        for(var i=0;i<evaluator.evalDepth-1;i++) {
            msg += "·";
        }
        msg += "> ";
        msg += "(" + expr.get(0).toString();
        for(var j=0;j<args.length;j++) {
            msg += " ";
            msg += args[j].toString();
        }
        msg += ")";
        evaluator.traceln("<pre class='traceExpr'>" + msg+"</pre>");
    }

    var result = fun.call(evaluator,lexenv,expr,args);

    if(showStep) {
        var msg = "";
        for(var i=0;i<evaluator.evalDepth-1;i++) {
            msg += "·";
        }
        msg += "< ";
        if(result.type=="evalError") {
            msg += "{ERROR}";
        } else {
            msg += result.toString();
        }
        evaluator.traceln("<pre class='traceExpr'>" + msg+"</pre>");
    }
    
    return result;
}

function EvalIf(evaluator,lexenv,expr) {
    var condition = evaluator.evalExpr(lexenv,expr.condition);
    if(condition.type=="evalError") {
        return condition;
    }
    if(condition.type=="bool" && !condition.value) { // same meaning as in javascript
        return evaluator.evalExpr(lexenv,expr.elseClause);
    } else { // anything except #f is ok
        return evaluator.evalExpr(lexenv,expr.thenClause);
    } 
}

function EvalDefine(evaluator,lexenv,expr) {
    return new UserFunction(expr,lexenv);
}

function EvalAnd(evaluator,lexenv,expr) {
    var result = new BoolValue(true);
    for(var i=1;i<expr.size();i++) {
        result = evaluator.evalExpr(lexenv,expr.get(i));
        //alert(""+expr.get(i)+" = " + result);
        if(result.type=="evalError") {
            return result;
        }
        if(result.type=="bool" && !result.value) {
            return new BoolValue(false);
        }
    }
    return result;
}

function EvalOr(evaluator,lexenv,expr) {
    var result = new BoolValue(false);
    for(var i=1;i<expr.size();i++) {
        var result = evaluator.evalExpr(lexenv,expr.get(i));
        if(result.type=="evalError") {
            return result;
        }
        if(result.type!="bool" || result.value) {
            return result;
        }
    }
    return result;
}

function EvalLet(evaluator,lexenv,expr) {
    var newEnv = lexenv.dig(); // allows to shadow variables
    var vals = new Array();
    for(var i=0;i<expr.bindings.length;i++) {
        var bexpr = expr.bindings[i].expr;
        var result = evaluator.evalExpr(lexenv,bexpr);
        if(result.type=="evalError") {
            return result;
        }
        vals.push(result);
    }
    for(var i=0;i<expr.bindings.length;i++) {
        var name = expr.bindings[i].name;
        if(!newEnv.bind(name,vals[i])) {
            return new EvalError(M$("Dupplicate variable '$0' un $1-expression", new Array(name,expr.type)), expr);
        }
    }

    var result = null;
    for(var i=0;i<expr.body.length;i++) {
        result = evaluator.evalExpr(newEnv, expr.body[i]);
        if(result.type=="evalError") {
            return result;
        }
    }
    return result;
}

function EvalLetStar(evaluator,lexenv,expr) {
    var newEnv = lexenv.dig(); // allows to shadow variables

    for(var i=0;i<expr.bindings.length;i++) {
        var bexpr = expr.bindings[i].expr;
        var result = evaluator.evalExpr(newEnv,bexpr);
        if(result.type=="evalError") {
            return result;
        }
        var name = expr.bindings[i].name;
        if(!newEnv.bind(name,result)) {
            return new EvalError(M$("Dupplicate variable '$0' un $1-expression", new Array(name,expr.type)), expr);
        }
    }

    var result = null;
    for(var i=0;i<expr.body.length;i++) {
        result = evaluator.evalExpr(newEnv, expr.body[i]);
        if(result.type=="evalError") {
            return result;
        }
    }
    return result;
}

function EvalCond(evaluator,lexenv,expr) {
    for(var i=0;i<expr.clauses.length-1;i++) {
        var clause = expr.clauses[i];
        var condval = evaluator.evalExpr(lexenv, clause.condition);
        if(condval.type=="evalError") {
            return condval;
        }
        if(condval.type!="bool" || condval.value!=false) {
            var result = null;
            for(var j=0;j<clause.body.length;j++) {
                result = evaluator.evalExpr(lexenv, clause.body[j]);
                if(result.type=="evalError") {
                    return result;
                }
            }
            return result;
        }
    }

    var elseClause = expr.clauses[expr.clauses.length-1];
    var result = null;
    for(var j=0;j<elseClause.body.length;j++) {
        result = evaluator.evalExpr(lexenv, elseClause.body[j]);
        if(result.type=="evalError") {
            return result;
        }
    }
    return result; 
}

function EvalTest(evaluator,lexenv,expr) {
    //QNC check that the checked function is indeed a function
    // see parser101/parser101.js
    var f = evaluator.evalExpr(lexenv, expr.testFun);
    if ( f.type === 'evalError' ) {
        return f;
    }
    if ( ! f.callable ) {
        return new EvalError(M$("First parameter of verifier is not a function: $0", f.toString()),expr.testFun);
    }
    
    for(var index=0; index<expr.testCases.length;index++) {
        var testCase = expr.testCases[index];

        // evaluate the expected value (quoted)
        var expected = evaluator.evalExpr(lexenv, testCase.expectedValue);
        if(expected.type=="evalError") {
            throw "Cannot evaluate expected value: "+expected.toString()+" (please report)"; // XXX: should not happen !
        }

        // evaluate test expression
        var result = evaluator.evalExpr(lexenv, testCase.testExpr);

        if(expected.type=="symbol" && (expected.value=="ERROR" || expected.value=="ERREUR")) {
            if(result.type!="evalError") {
                return new EvalError(M$("Test case failed: expected error but obtained value = $0",result.toString()), testCase.testExpr);
            }

        } else {
            // XXX: an error should not happen now
            if(result.type=="evalError") {
                return new EvalError(M$("Test case failed: expected value = $0 but obtained error = $1",new Array(expected.toString(),result.message.toString())), testCase.testExpr);
            }
            
            // compare
            var compare = result.equal(expected);
            // QNC
            if( !compare && !compareApprox(result, expected) ) {
                    return new EvalError(M$("Test case failed: expected value = $0 but computed value = $1",new Array(expected.toString(),result.toString())), testCase.testExpr);
            }
            
            
        }

        evaluator.nbTestsPassed++;

    }

    return new UnitValue();
}

// QNC 
var epsilon = 0.001;
function compareApprox(a, b) {
    var aa = SchemeNumber.fn["number?"](a.value);
    var bb = SchemeNumber.fn["number?"](b.value);
    if ( aa && bb ) {
        var bminus = SchemeNumber.fn["-"](b.value, epsilon);
        if ( SchemeNumber.fn["<"](bminus, a.value) ) {
            var bplus = SchemeNumber.fn["+"](b.value, epsilon);
            var result = SchemeNumber.fn["<"](a.value, bplus);
            return result;
        } else {
            return false;
        }
    } else {
        // At least one argument is not a number:
        return false;
    }
}

function EvalQuoted(evaluator,lexenv,expr) {
    if(expr.type=='qlist') {
        return BuildPairFromList(evaluator,lexenv,expr);
    } else if(expr.type=='symbol') {
        return new SymbolValue(expr.value);
    } else { // auto-quoted value
        return evaluator.evalExpr(lexenv,expr);
    }
}
