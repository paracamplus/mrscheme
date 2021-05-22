export function TypeError(msg,expr) {
    this.type = "typeError";
    this.expr = expr;
    this.startPos = expr.startPos;
    this.endPos = expr.endPos;
    this.message = msg;
    this.expr = expr;
    
    this.toString = function() {
        var str = "Type error: from (line "+expr.startPos.lpos+", col "+expr.startPos.cpos+") to (line "+expr.endPos.lpos+", col "+expr.endPos.cpos+')\n';
        str = str + "  ==> " + this.message + "\n";
        return str;
    }

    this.toHTML = function() {
        return '<span class="error"><strong>Type Error</strong>: '+this.message+'</span>';
    }
    
}

export function TypeUnit() {
    this.type = "Unit";
    this.toString = function() {
        return "Unit";
    }
    this.show = function() {
        return "unit";  // for users
    }
    this.convert = function(other,mvars) {
        if(other.type=="Unit") {
            return this;
        } else if(other.type=="Option") {
            return other.convert(this,mvars);
        } else if(other.type=="Sum") {
            return other.convert(this,mvars);
        } else if(other.type=="Var") {
            return mvars.convertVar(this,other.ref);
        } else {
            return null;
        }
    }
    this.updateVars = function(mvars,trans) {
        return new TypeUnit();
    }
    this.normalize = function(mvars) {
        return new TypeUnit();
    }
}


export function TypeTrue() {
    this.type = "True";
    this.toString = function() {
        return "True";
    }
    this.show = function() {
        return "bool";  // for users
    }
    this.convert = function(other,mvars) {
        if(other.type=="True") {
            return this;
        } else if(other.type=="False") {
            return makeTypeBool(); // generalize to bool
        } else if(other.type=="Option") {
            return other.convert(this,mvars);
        } else if(other.type=="Sum") {
            return other.convert(this,mvars);
        } else if(other.type=="Var") {
            return mvars.convertVar(this,other.ref);
        } else {
            return null;
        }
    }
    this.updateVars = function(mvars,trans) {
        return new TypeTrue();
    }
    this.normalize = function(mvars) {
        return new TypeTrue();
    }
}

export function TypeFalse() {
    this.type = "False";
    this.toString = function() {
        return "False";
    }
    this.show = function() {
        return "bool";  // for users
    }
    this.convert = function(other,mvars) {
        if(other.type=="False") {
            return this;
        } else if(other.type=="True") {
            return makeTypeBool(); // generalize to bool
        } else if(other.type=="Option") {
            return other; // generalize to option
        } else if(other.type=="Sum") {
            return other.convert(this,mvars);
        } else if(other.type=="Var") {
            return mvars.convertVar(this,other.ref);
        } else {
            return null;
        }
    }
    this.updateVars = function(mvars,trans) {
        return new TypeFalse();
    }
    this.normalize = function(mvars) {
        return new TypeFalse();
    }
}

export function TypeInt(flexible) { 
    this.type = "Int"; 
    if(flexible==null) { 
	this.flexible = false; 
    } else { 
	this.flexible = flexible; 
    } 
    
    this.toString = function() { 
	if(this.flexible) { 
	    return "Int[Flexible]"; 
	} else { 
	    return "Int"; 
	} 
    } 
    this.show = function() { 
	return "int";  // for users 
    } 
    this.convert = function(other,mvars) { 
	if(other.type=="Int") { 
	    if(!this.flexible) { 
	 	return this; 
	    } else if(!other.flexible) { 
	 	return other; 
	    } 
	    return this; // both flexible 
	} else if(other.type=="Real") { 
	    if(this.flexible) { 
	 	return makeTypeNumber(); // generalize to number 
	    } else { 
	 	return null; // avoid to mix ints and reals 
	    } 
	} else if(other.type=="Option") { 
	    return other.convert(this,mvars); 
	} else if(other.type=="Sum") { 
	    return other.convert(this,mvars); 
	} else if(other.type=="Var") { 
	    return mvars.convertVar(this,other.ref); 
	} else if(other.type=="Dependent") { 
	    if(other.dependents!=null) { 
	 	mvars.save(); 
	 	for(var i=0;i<other.dependents.length;i++) { 
	 	    var dependent = other.dependents[i]; 
	 	    var ntype = dependent.convert(this,mvars); 
	 	    if(ntype==null) { 
	 	        mvars.restore(); 
	 	        return null; // cannot unify with dependent 
	 	    } 
	 	} 
	 	mvars.commit(); 
	    } 
	    return this; 
	} else { 
	    return null; 
	} 
    } 
    this.updateVars = function(mvars,trans) { 
	return new TypeInt(this.flexible); 
    } 
    this.normalize = function(mvars) { 
	return new TypeInt(this.flexible); 
    } 
} 

export function TypeReal() { 
    this.type = "Real"; 
    this.toString = function() { 
	return "Real"; 
    } 
    this.show = function() { 
	return M$("Number").toString();  // for users 
    } 
    this.convert = function(other,mvars) { 
	if(other.type=="Real") { 
	    return this; 
	} else if(other.type=="Int") { 
	    if(other.flexible) { 
	 	return makeTypeNumber(); // generalize to number 
	    } else { 
	 	return null; // avoid to mix inflexible ints and reals 
	    } 
	} else if(other.type=="Option") { 
	    return other.convert(this,mvars); 
	} else if(other.type=="Sum") { 
	    return other.convert(this,mvars); 
	} else if(other.type=="Var") { 
	    return mvars.convertVar(this,other.ref); 
	} else if(other.type=="Dependent") { 
	    if(other.dependentType=="Number") { 
	 	return this; // XXX: real or dependent number ? 
	    } 
	} else { 
	    return null; 
	} 
    } 
    this.updateVars = function(mvars,trans) { 
	return new TypeReal(); 
    } 
    this.normalize = function(mvars) { 
	return new TypeReal(); 
    } 
} 


export function TypeString() {
    this.type = "String";
    this.toString = function() {
        return "String";
    }
    this.show = function() {
        return "string";  // for users
    }
    this.convert = function(other,mvars) {
        if(other.type=="String") {
            return this;
        } else if(other.type=="Option") {
            return other.convert(this,mvars);
        } else if(other.type=="Sum") {
            return other.convert(this,mvars);
        } else if(other.type=="Var") {
            return mvars.convertVar(this,other.ref);
        } else {
            return null;
        }
    }
    this.updateVars = function(mvars,trans) {
        return new TypeString();
    }
    this.normalize = function(mvars) {
        return new TypeString();
    }
}

export function TypeVector() {
    this.type = "vector";
    this.toString = function () {
        return "vector";
    }
    this.show = function () {
        return "vector";
    }
    this.convert = function(other,mvars) {
        if(other.type=="vector") {
            return this;
        } else if(other.type=="Option") {
            return other.convert(this,mvars);
        } else if(other.type=="Sum") {
            return other.convert(this,mvars);
        } else if(other.type=="Var") {
            return mvars.convertVar(this,other.ref);
        } else {
            return null;
        }
    }
    this.updateVars = function(mvars,trans) {
        return new TypeVector();
    }
    this.normalize = function(mvars) {
        return new TypeVector();
    }
}

export function TypeNil() {
    this.type = "Nil";
    this.toString = function() {
        return "Nil";
    }
    this.show = function() {
        return "nil";  // for users
    }
    this.convert = function(other,mvars) {
        if(other.type=="Nil") {
            return this;
        } else if(other.type=="List") {
            return other; // List wins
        } else if(other.type=="Option") {
            return other.convert(this,mvars);
        } else if(other.type=="Sum") {
            return other.convert(this,mvars);
        } else if(other.type=="Var") {
            return mvars.convertVar(this,other.ref);
        } else {
            return null;
        }
    }
    this.updateVars = function(mvars,trans) {
        return new TypeNil();
    }
    this.normalize = function(mvars) {
        return new TypeNil();
    }
}

export function TypeList(elemType) {
    this.type = "List";
    this.elemType = elemType;
    this.toString = function() {
        return "List[" + this.elemType.toString() + "]";
    }
    this.show = function() {
        return "List[" + this.elemType.show() + "]";
    }
    this.convert = function(other,mvars) {
        if(other.type=="Nil") {
            return this;
        } else if(other.type=="List") {
            mvars.save();
            var nelemType = this.elemType.convert(other.elemType,mvars);
            if(nelemType!=null) {
                mvars.commit();
                return new TypeList(nelemType);
            }
            mvars.restore();
            return null;
        } else if(other.type=="Option") {
            return other.convert(this,mvars);
        } else if(other.type=="Sum") {
            return other.convert(this,mvars);
        } else if(other.type=="Var") {
            return mvars.convertVar(this,other.ref);
        } else {
            return null;
        }
    }
    this.updateVars = function(mvars,trans) {
        var nelemType = this.elemType.updateVars(mvars,trans);
        return new TypeList(nelemType);
    }
    this.normalize = function(mvars) {
        var nelemType = this.elemType.normalize(mvars);
        return new TypeList(nelemType);
    }
}

export function TypeVariable(ref) {
    this.type = "Var";
    this.ref = ref;
    this.toString = function() {
        return "?"+this.ref;
    }
    this.show = function() {
        if(this.ref==0) {
            return "alpha";
        } else if(this.ref==1) {
            return "beta";
        } else if(this.ref==2) {
            return "gamma";
        } else if(this.ref==3) {
            return "delta";
        } else {
            return this.toString();
        }
    }
    this.convert = function(other,mvars) {
        return mvars.convertVar(other,this.ref);
    }
    this.updateVars = function(mvars,trans) {
        var nref = trans[this.ref];
        if(nref!=null) {
            return new TypeVariable(nref);
        }
        nref = mvars.newVar();
        trans[this.ref] = nref;
        return new TypeVariable(nref);
    }

    this.normalize = function(mvars) {
        var ntype = mvars.normalizeVar(this.ref);
        if(ntype!=null) {
            if(ntype.type=='Var') {
                return ntype;
            } else {
                return ntype.normalize(mvars);
            }
        }
        return new TypeVariable(this.ref);
    }
}

export function TypeOption(opt) {
    this.type = "Option";
    if(opt.type=="False") {
        throw "Option[False] is illegal (please report)";
    }
    this.opt = opt;
    this.toString = function() {
        return "Option["+this.opt+"]";
    }
    this.show = function() {
        if(this.opt.type=="True") {
            return "bool";
        } else {
            return ""+this.opt.show()+"+#f";
        }
    }

    this.convert = function(other,mvars) {
        if(other.type=="False") {
            return this; // false always convertible with option type
        } else if(other.type=="Option") {
            var optType = other.convert(this.opt,mvars); // no cycle here
            if(optType!=null) {
                return optType;
            } else {
                return null;
            }
        } else {
            mvars.save();
            var optType = this.opt.convert(other,mvars);
            if(optType!=null) {
                mvars.commit();
                var noptType = optType;
                if(optType.type=="Var") {
                    noptType = mvars.normalizeVar(optType.ref);
                }
                if(noptType.type=="Option") {
                    return new TypeOption(noptType.opt);
                } else {
                    return new TypeOption(optType);
                }
            }
            mvars.restore();
            return null;
        }
    }
    this.updateVars = function(mvars,trans) {
        var nopt = this.opt.updateVars(mvars,trans);
        return new TypeOption(nopt);
    }
    this.normalize = function(mvars) {
        var nopt = this.opt.normalize(mvars);
        return new TypeOption(nopt);
    }

}

export function makeTypeBool() {
    return new TypeOption(new TypeTrue());
}

export function TypeSum(name,opts) {
    this.type = "Sum";
    this.name = name;
    this.opts = opts;
    this.toString = function() {
        var str = name+"::=";
        for(var i=0;i<this.opts.length;i++) {
            str += this.opts[i].toString();
            if(i<this.opts.length-1) {
                str += "+";
            }
        }
        return str;
    }
    this.show = function() {
        return name;
    }
    this.convert = function(other,mvars) {
        if(other.type=='Var') {
            return mvars.convertVar(this,other.ref);
        } else if(other.type=='Sum') {
            mvars.save();
            var nopts = new Array();
            for(var i=0;i<this.opts.length;i++) {
                var nopt = this.opts[i].convert(other,mvars);
                if(nopt==null) {
                    mvars.restore();
                    return null;
                }
                nopts.push(nopt);
            }
            mvars.commit();
            return new TypeSum(this.name,nopts);
        } else { // not a sum
            mvars.save();
            for(var i=0;i<this.opts.length;i++) {
                var nopt = this.opts[i].convert(other,mvars);
                if(nopt!=null && nopt.type!='Sum') {
                    mvars.commit();
                    return nopt;
                }
            }
            mvars.restore();
            return null;
        }
    }
    this.updateVars = function(mvars,trans) {
        var nopts = new Array();
        for(var i=0;i<this.opts.length;i++) {
            var nopt = this.opts[i].updateVars(mvars,trans);
            nopts.push(nopt);
        }
        return new TypeSum(this.name,nopts);
    }
    this.normalize = function(mvars) {
        var nopts = new Array();
        for(var i=0;i<this.opts.length;i++) {
            var nopt = this.opts[i].normalize(mvars);
            nopts.push(nopt);
        }
        return new TypeSum(this.name,nopts);
    }
}


export function TypeFun(tparams,tresult,nary) {
    this.type = "Fun";
    this.tparams = tparams;
    this.tresult = tresult;
    
    if(nary) {
        this.nary = true;
    } else {
        this.nary = false;
    }

    this.toString = function() {
        var str = "(";
        for(var i=0;i<this.tparams.length;i++) {
            str += this.tparams[i].toString();
            if(i<this.tparams.length-1) {
                str += "*";
            }
        }
        if(this.nary) {
            str += "*...";
        }
        str += "->" + this.tresult.toString();
        str += ")";
        return str;
    }
    this.show = function() {
        var str = "(";
        for(var i=0;i<this.tparams.length;i++) {
            str += this.tparams[i].show();
            if(i<this.tparams.length-1) {
                str += "*";
            }
        }
        if(this.nary) {
            str += "*...";
        }
        str += "->" + this.tresult.show();
        str += ")";
        return str;
    }
    this.convert = function(other,mvars) {
        if(other.type=="Fun") {
            // check arity
            if(this.tparams.length!=other.tparams.length) {
                return null;
            }
            // convert parameters
            mvars.save();
            var ntparams = new Array();
            for(var i=0;i<this.tparams.length;i++) {
                var ntparam = this.tparams[i].convert(other.tparams[i],mvars);
                if(ntparam==null) {
                    mvars.restore();
                    return null;
                }
                ntparams.push(ntparam);
            }
            // convert result type
            var ntresult = this.tresult.convert(other.tresult,mvars);
            if(ntresult==null) {
                mvars.restore();
                return null;
            }
            mvars.commit();
            return new TypeFun(ntparams,ntresult);
        } else if(other.type=="Var") {
            return mvars.convertVar(this,other.ref);
        } else {
            return null;
        }
    }
    
    this.updateVars = function(mvars,trans) {
        var ntparams = new Array();
        for(var i=0;i<this.tparams.length;i++) {
            var ntparam = this.tparams[i].updateVars(mvars,trans);
            ntparams.push(ntparam);
        }
        var ntresult = this.tresult.updateVars(mvars,trans);
        return new TypeFun(ntparams,ntresult,this.nary);
    }
    this.normalize = function(mvars) {
        var ntparams = new Array();
        for(var i=0;i<this.tparams.length;i++) {
            var ntparam = this.tparams[i].normalize(mvars);
            ntparams.push(ntparam);
        }
        var ntresult = this.tresult.normalize(mvars);
        return new TypeFun(ntparams,ntresult,this.nary);
    }
}

export function TypeVarEnv(parent) {
    this.parent = parent;

    this.vars = {};

    this.bind = function(sym,entry) {
        var oentry = this.vars[sym];
        if(oentry!=null) {
            return false;
        }
        this.vars[sym] = entry;
        return true;
    }

    this.lookup = function(sym) {
        var type = this.vars[sym];
        if(type==null && parent!=null) {
            return parent.lookup(sym);
        }
        return type;
    }

    this.dig = function() {
        return new TypeVarEnv(this);
    }

}

export function TypeFunEnv(parent) {
    this.parent = parent;

    this.funs = {};
    
    this.register = function(sym,entry) {
        var oentry = this.lookup(sym);
        if(oentry!=null) {
            return false; // already registered
        }
        this.funs[sym] = entry;
        return true;
    }

    this.lookup = function(sym) {
        var type = this.funs[sym];
        if(type==null && parent!=null) {
            return parent.lookup(sym);
        }
        return type;
    }

    this.dig = function() {
        return new TypeFunEnv(this);
    }
}

export function UnknownVar() {
    this.type = "Unknown";
}

export function MetaVars() {
    this.vars = new Array();
    this.saves = new Array();

    this.save = function() {
        var svars = new Array();
        for(var i=0;i<this.vars.length;i++) {
            svars.push(this.vars[i]);
        }
        this.saves.push(svars);
    }

    this.restore = function() {
        this.vars = this.saves.pop();
    }

    this.commit = function() {
        this.saves.pop();  // forget old vars
    }

    this.fetch = function(ref) {
        if(ref<0 || ref>=this.vars.length) {
            throw "MetaVars: out of bounds (please report)";
        }
        return this.vars[ref];
    }

    this.newVar = function() {
        this.vars.push(new UnknownVar());
        return this.vars.length-1;
    }

    this.bind = function(ref,type) {
        this.vars[ref] = type;
    }

    this.convertVar = function(type,ref) {
        // console.log("Convert var",type,ref);
        var entry = null;
        do {
            entry = this.fetch(ref);
            if(entry.type=='Var') {
                ref = entry.ref;
            }
        } while(entry.type=='Var');
        // console.log("var binding",entry);
        if(entry.type=="Unknown") {
            // ok, can convert and bind variable
            var ntype = type.normalize(this);
            if(ntype.type=='Var' && ntype.ref==ref) {
                // do nothing... binds to itself
            } else {
                this.bind(ref,ntype);
            }
            return new TypeVariable(ref); // always return a variable (but bound)
        } else { 
            this.save();
            var ntype = type.convert(entry,this);
            if(ntype!=null) {
                this.commit();
                if(type.type=='Var') {
                    // unify vars
                    var tentry = this.fetch(type.ref);  
                    if(ref<type.ref) {
                        this.bind(type.ref,new TypeVariable(ref)); // relay
                        this.bind(ref,ntype.normalize(this));
                        return new TypeVariable(ref);
                    } else if(type.ref<ref) {
                        this.bind(ref,new TypeVariable(type.ref)); // relay
                        this.bind(type.ref,ntype.normalize(this));
                        return new TypeVariable(type.ref);
                    }
                } else {
                    this.bind(ref,ntype.normalize(this));
                    return new TypeVariable(ref);
                }
                return new TypeVariable(ref);
            }
            this.restore();
            return null;
        }

    }
    
    this.normalizeVar = function(ref) {
        var entry = null;
        do {
            entry = this.fetch(ref);
            if(entry==null) {
                throw "No such entry";
            }
            if(entry.type=='Var') {
                ref = entry.ref;
            }
        } while(entry.type=='Var');
        if(entry.type=='Unknown') {
            return new TypeVariable(ref);
        }
        return entry;
    }
}


export function TypeChecker(Penv) {
    
    this.Penv = Penv; // primitive (typing) env

    this.registerDefinition = function(fenv,name,defExpr) {
        var defEntry = { name : name,
                         defExpr : defExpr,
                         defType : null
                       };
        if(!fenv.register(name,defEntry)) {
            return new TypeError("Definition '"+name+"' already registered",defExpr);
        } else {
            return { type:"ok" };
        }
    }

    this.typeOf = function(expr,Fenv,Venv,vars) {
        if(expr.type=='bool') {
            if(expr.value) {
                return new TypeTrue();
            } else {
                return new TypeFalse();
            }
        } else if(expr.type=='int') {
            return new TypeInt(true); // flexible for constants
        } else if(expr.type=='real') {
            return new TypeReal();
        } else if(expr.type=='string') {
            return new TypeString();
        } else if(expr.type=='nil') {
            return new TypeNil();
        } else if(expr.type=='symbol') {
            return this.typeOfSymbol(expr,Fenv,Venv,vars);
        } else if(expr.type=='application') {
            return this.typeOfApplication(expr,Fenv,Venv,vars);
        } else if(expr.type=='if') {
            return this.typeOfIf(expr,Fenv,Venv,vars);
        } else if(expr.type=='define') {
            return this.typeOfDefine(expr,Fenv,Venv,vars);
        } else {
            return new TypeError("Cannot (yet) infer type",expr);
        }
    }

    this.typeOfSymbol = function(sym,Fenv,Venv,mvars) {
        // check in variable environment
        var type = Venv.lookup(sym.value);
        if(type!=null) {
            return type;
        }

        // check in user functions environment
        var defEntry = Fenv.lookup(sym.value);
        if(defEntry!=null) {
            var type = defEntry.defType;
            if(type==null) {
                // Must infer the definition type (allows forward typing)
                return this.typeOfDefine(defEntry.defExpr, Fenv, Venv,mvars);
            }
            return type.updateVars(mvars,{});
        }
        
        // check in primitive environment
        type = this.Penv.lookupType(sym.value,mvars);
        if(type!=null) {
            return type;
        }

        // not found
        return new TypeError("unknown variable: "+sym,sym);
        
    }

    this.typeOfApplication = function(expr,Fenv,Venv,mvars) {
        // console.log("Type of application",expr.toString());
        // 1) check types of arguments
        var targs = new Array();
        for(var i=1;i<expr.size();i++) {
            var targ = this.typeOf(expr.get(i),Fenv,Venv,mvars);
            // console.log("Type of arg",i,targ);
            if(targ.type=="typeError") {
                return targ;
            }
            targs.push(targ);
        }

        // 2) check type of functional argument
        var tfun = this.typeOf(expr.get(0),Fenv,Venv,mvars);
        // console.log("Type of arg 0",tfun);
        if(tfun.type=="typeError") {
            return tfun;
        }
        var ntfun = tfun.normalize(mvars);
        if(ntfun.type!="Fun") {
            if(ntfun.type=='Var') {
                var ttparams = new Array();
                for(var i=0;i<targs.length;i++) {
                    ttparams.push(new TypeVariable(mvars.newVar()));
                }
                var ttfun = new TypeFun(ttparams,new TypeVariable(mvars.newVar()));
                tfun = mvars.convertVar(ttfun, ntfun.ref);
                tfun = tfun.normalize(mvars);
            } else {
                return new TypeError("Not a function",expr);
            }
        }

        // 3) check application
        var tnargs = new Array();
        for(var i=0;i<tfun.tparams.length;i++) {
            if(i>=targs.length) {
                return new TypeError("Not enough arguments (given "+targs.length+" expected "+tfun.tparams.length+")",expr);
            }
            var tnarg = tfun.tparams[i].convert(targs[i],mvars);
            if(tnarg==null) {
                return new TypeError("Cannot match argument type '"+targs[i].show()+"' with parameter type '"+tfun.tparams[i].show()+"'",expr.get(i+1));
            }
            tnargs.push(tnarg);
        }

        // 3') handle nary functions
        if(targs.length>tfun.tparams.length) {
            if(!tfun.nary) {
                return new TypeError("Too many arguments (given "+targs.length+" expected "+tfun.tparams.length+")",expr);
            } else {
                for(var i=tfun.tparams.length;i<targs.length;i++) {
                    var tnarg = tfun.tparams[tfun.tparams.length-1].convert(targs[i],mvars); 
                    if(tnarg==null) {
                        return new TypeError("Cannot match argument type '"+targs[i].show()+"' with parameter type '"+tfun.tparams[tfun.tparams.length-1].show()+"'",expr.get(i+1));
                    }
                    tnargs.push(tnarg);
                }
            }
        }

        // 4) application type
        if(tfun.tresult.type=="Dependent") {
            // resolve type dependence (cf. arithmetic operators)
            var result = tfun.tresult.resolve(tfun,tnargs,mvars);
            // console.log("End type of application",expr.toString(),"(resolved)",result);
            return result;
        } else {
            var result = tfun.tresult;
            // console.log("End type of application",expr.toString(),result);
            return result;
        }
    }
    
    this.typeOfIf = function(expr,Fenv,Venv,mvars) {
        // console.log("Type of If",expr.toString());
        var condType = this.typeOf(expr.condition,Fenv,Venv,mvars);
        if(condType.type=="typeError") {
            return condType;
        }
        /* XXX: this yields Option[Option[...]]] types we would like to avoid 
           if(condType.type!="Option" && condType.type!="False") {
           var nvar = new TypeVariable(mvars.newVar());
           var ncondType = new TypeOption(nvar);
           condType = ncondType.convert(condType,mvars);
           } */
        // console.log("Type of condition",condType);

        var thenType = this.typeOf(expr.thenClause,Fenv,Venv,mvars);
        if(thenType.type=="typeError") {
            return thenType;
        }
        // console.log("Type of then",thenType);

        var elseType = this.typeOf(expr.elseClause,Fenv,Venv,mvars);
        if(elseType.type=="typeError") {
            return elseType;
        }
        // console.log("Type of else",thenType);

        var mixType = thenType.convert(elseType,mvars);
        if(mixType!=null) {
            return mixType;
        }

        // console.log("In if",expr.toString(),"mismatch",thenType,elseType);
        return new TypeError("Type of then clause '"+thenType.show()+"' and type of else clause '"+elseType.show()+"' are incompatible",expr);
    }

    this.typeOfDefine = function(expr,Fenv,Venv,mvars) {
        var defEntry = Fenv.lookup(expr.fname);
        if(defEntry.defType!=null) {
            return defEntry.defType; // already typed
        }

        // 1) type parameters and result with fresh meta-variables
        var defEnv = Venv.dig();
        var tparams = new Array();
        for(var i=0;i<expr.params.length;i++) {
            var param = expr.params[i];
            var nvar = new TypeVariable(mvars.newVar());
            if(!Venv.bind(param,nvar)) {
                return new TypeError("Duplicate parameter variable '"+param+"'", expr);
            }
            tparams.push(nvar);
        }

        var tresult = new TypeVariable(mvars.newVar()); 
        // record the temporary functional type (with only metavariables)
        // this is needed for recursive calls
        /* XXX: do not register type in global env. to avoid the creation of fresh meta-variables
           defEntry.defType = new TypeFun(tparams,tresult); */
        /* put in the lexical env instead */
        if(!Venv.bind(expr.fname, new TypeFun(tparams,tresult))) {
            return new TypeError("Definition name '"+expr.fname+"' used as parameter", expr);
        }
        
        // 2) type sub-defines in child functional env
        var defFunEnv = Fenv.dig();
        for(var i=0;i<expr.innerDefs.length;i++) {
            var innerDef = expr.innerDefs[i];
            var result = this.registerDefinition(defFunEnv, innerDef);
            if(result.type=="typeError") {
                return result;
            }
        }
        for(var i=0;i<expr.innerDefs.length;i++) {
            var innerDef = expr.innerDefs[i];
            var result = this.typeOf(innerDef, defFunEnv, defEnv, mvars);
            if(result.type=="typeError") {
                return result;
            }
        }

        // 3) type the body
        var retType = this.typeOf(expr.body, defFunEnv, defEnv, mvars);
        if(retType.type=="typeError") {
            return retType;
        }

        var paramTypes = new Array();
        for(var i=0;i<expr.params.length;i++) {
            var param = expr.params[i];
            var paramType = defEnv.lookup(param);
            if(paramType==null) {
                return new TypeError("Cannot lookup parameter '"+param+"' (please report)", expr);
            }        
            if(paramType.type=='Var') {
                paramType = mvars.normalizeVar(paramType.ref);
                if(paramType==null) {
                    return new TypeError("Cannot normalize parameter '"+param+"' (please report)", expr);
                }
            }
            paramTypes.push(paramType);
        }
        var ftype = new TypeFun(paramTypes,retType);
        ftype = ftype.convert(Venv.lookup(expr.fname),mvars); // unify with meta-vars
        ftype = ftype.normalize(mvars);
        // record in minimalized form
        defEntry.defType = ftype.updateVars(new MetaVars(),{});
        return ftype; // return unminimized (to remain compatible with current mvars)
    }
}
