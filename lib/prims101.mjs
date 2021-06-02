import { SchemeNumber }  from "./schemeNumber101.mjs";
import { M$ } from './message101.mjs';
import { TypeUnit, TypeInt, TypeString, TypeVector, TypeList, TypeVariable,
         TypeOption, makeTypeBool, TypeFun } from "./type101.mjs";
import { BoolValue, VectorValue, StringValue, NilValue, PairValue,
         IntegerValue }
  from './values.mjs';
import { PrimitiveError } from './primerror.mjs';

/* primitives functions */

function PrimsEnv() {
    this.env = new Array();

    this.register = function(name,prim) {
        if(this.env["___"+name]!=null) {
            throw "Primitive '" + name +"' already defined";
        }
        this.env["___"+name] = prim;
        prim.type = "primitive";
        prim.call = function(evaluator,lexenv,expr,args) { return checkAndCall(prim,evaluator,lexenv,expr,args); }
        prim.callable = true;
        prim.name = name;
        prim.toString = function() {
          return name+":"+prim.typeRepr.toString();
        }
        prim.toHTML = function() {
          return '<span class="value">primitive:'+name+'<span class="tooltip">type <strong>'+prim.typeRepr.show()+'</strong></span></span>';
        } 

    }
    
    this.fetch = function(name) {
        return this.env["___"+name];
    }

    this.lookupType = function(name,mvars) {
      var prim = this.env["___"+name];
      if(prim==null) {
        return null; // not found
      }
      var ntypeRepr = prim.typeRepr.updateVars(mvars,{});
      return ntypeRepr;
    }

}

export function defaultPrimsEnv() {
    var penv = new PrimsEnv();

    // remark: numerical primitives are in numericaltower101.js

    // misc.
    penv.register("boolean?", new primitiveTypePredicate("boolean?","bool"));
    penv.register("string?", new primitiveTypePredicate("string?","string"));
    penv.register("symbol?", new primitiveTypePredicate("symbol?","symbol"));
    penv.register("equal?",new primitiveEqual());
    penv.register("not", new primitiveNot());
    penv.register(M$("error").toString(), new primitiveError());

    // strings
    penv.register("string-length", new primitiveStringLength());
    penv.register("string-append", new primitiveStringAppend());
    penv.register("substring", new primitiveSubString());
    penv.register("string>?", new primitiveCompareString());

    // cons cells
    penv.register("cons", new primitiveCons());
    penv.register("list", new primitiveList());
    penv.register("pair?", new primitivePairP());
    penv.register("empty?", new primitiveNullP());//JPRoy
    penv.register("list?", new primitiveListP());
    penv.register("car", new primitiveCar());
    penv.register("first", new primitiveCar());//JPRoy
    penv.register("cdr", new primitiveCdr());
    penv.register("rest", new primitiveCdr());//JPRoy
    penv.register("caar", new primitiveListAccess(new Array("a","a")));
    penv.register("cadr", new primitiveListAccess(new Array("a","d")));
    penv.register("second", new primitiveListAccess(new Array("a","d")));//JPRoy
    penv.register("cdar", new primitiveListAccess(new Array("d","a")));
    penv.register("cddr", new primitiveListAccess(new Array("d","d")));

    penv.register("caaar", new primitiveListAccess(new Array("a","a","a")));
    penv.register("cdaar", new primitiveListAccess(new Array("d","a","a")));
    penv.register("cadar", new primitiveListAccess(new Array("a","d","a")));
    penv.register("caadr", new primitiveListAccess(new Array("a","a","d")));
    penv.register("caddr", new primitiveListAccess(new Array("a","d","d")));
    penv.register("third", new primitiveListAccess(new Array("a","d","d")));//JPRoy
    penv.register("cdadr", new primitiveListAccess(new Array("d","a","d")));
    penv.register("cddar", new primitiveListAccess(new Array("d","d","a")));
    penv.register("cdddr", new primitiveListAccess(new Array("d","d","d")));

    penv.register("caaaar", new primitiveListAccess(new Array("a","a","a","a")));
    penv.register("caaadr", new primitiveListAccess(new Array("a","a","a","d")));
    penv.register("caadar", new primitiveListAccess(new Array("a","a","d","a")));
    penv.register("cadaar", new primitiveListAccess(new Array("a","d","a","a")));
    penv.register("cdaaar", new primitiveListAccess(new Array("d","a","a","a")));
    penv.register("caaddr", new primitiveListAccess(new Array("a","a","d","d")));
    penv.register("caddar", new primitiveListAccess(new Array("a","d","d","a")));
    penv.register("cdaadr", new primitiveListAccess(new Array("d","a","a","d")));
    penv.register("cddaar", new primitiveListAccess(new Array("d","d","a","a")));
    penv.register("cadddr", new primitiveListAccess(new Array("a","d","d","d")));
    penv.register("fourth", new primitiveListAccess(new Array("a","d","d","d")));//JPRoy
    penv.register("cdaddr", new primitiveListAccess(new Array("d","a","d","d")));
    penv.register("cddadr", new primitiveListAccess(new Array("d","d","a","d")));
    penv.register("cdddar", new primitiveListAccess(new Array("d","d","d","a")));
    penv.register("cddddr", new primitiveListAccess(new Array("d","d","d","d")));

    penv.register("append", new primitiveAppend());
    penv.register("map", new primitiveMap());
    penv.register("filter", new primitiveFilter());
    penv.register("filtre", new primitiveFilter());
    penv.register("reduce", new primitiveReduce());
    penv.register("assoc", new primitiveAssoc());

    penv.register("make-vector", new primitiveVectorMake());
    penv.register("vector-ref", new primitiveVectorRef());
    penv.register("vector-set!", new primitiveVectorSet());
    penv.register("vector-length", new primitiveVectorLength());
    penv.register("vector?", new primitiveTypePredicate("vector?","vector"));
    
    return penv; 
}

function checkArity(expr,name,arity,nary,args) {
    if(args.length<arity) {
        return new PrimitiveError(expr,name,args,M$("Not enough arguments: expected $0 given $1",new Array(arity,args.length)));
    }
    if(nary) {
        return { type: "ok" };
    }
    if(args.length>arity) {
        return new PrimitiveError(expr,name,args,M$("Too many arguments: expected $0 given $1", new Array(arity,args.length)));
    }
    return { type: "ok" };
}

function checkAndCall(prim,evaluator,lexenv,expr,args) {
    var check  = checkArity(expr,prim.name,prim.arity,prim.nary,args);
    if(check.type=="evalError") {
      return check;
    }
    return prim.exec(evaluator,lexenv,expr,args)
}

/*********** MISC. **********/

export function primitiveTypePredicate(name,type) {
  this.typeRepr = new TypeFun(new Array(new TypeVariable(0)),makeTypeBool());

    this.arity = 1;
    this.nary = false;
    
    this.exec = function(evaluator,lexenv,expr,args) {
        var arg = args[0];
        
        if(arg.type==type) {
          return new BoolValue(true);
        } else {
          return new BoolValue(false);
        }
        
    }
    
}

function primitiveEqual() {
  this.typeRepr = new TypeFun(new Array(new TypeVariable(0), new TypeVariable(1)),makeTypeBool());

    this.arity = 2;
    this.nary = false;
    
    this.exec = function(evaluator,lexenv,expr,args) {
        var left = args[0];
        var right = args[1];
        
        if(left.type=="function" || right.type=="function") {
            return new PrimitiveError(expr,"equal?",new Array(left,right),M$("No equality for functions"));
        } else if(left.type=="primitive" || right.type=="primitive") {
            return new PrimitiveError(expr,"equal?",new Array(left,right),M$("No equality for primitives"));
        }
        
        return new BoolValue(left.equal(right));
    }
    
}

function primitiveNot() {
  this.typeRepr = new TypeFun(new Array(new TypeVariable(0)),makeTypeBool());

    this.arity = 1;
    this.nary = 0;

    this.exec = function(evaluator,lexenv,expr,args) {
        if(args[0].type=='bool' && !args[0].value) {
            return new BoolValue(true);
        }
        return new BoolValue(false);
    }
}


function primitiveError() {
    this.typeRepr = new TypeFun(new Array(new TypeVariable(0)),new TypeUnit(), true); // n-ary

    this.arity = 1;
    this.nary = true;
    
    this.exec = function(evaluator,lexenv,expr,args) {
        var str = "";
        for(var i=0;i<args.length;i++) {
            if(args[i].type=="string") {
                str += args[i].value;
            } else {
                str += args[i].toString();
            }
            if(i<args.length-1) {
                str += " ";
            }
        }

        var err = new PrimitiveError(expr,M$("error").toString(),args,str);
        err.toHTML = function() {
            return '<span class="error"><strong>'+M$("Error").toString()+'</strong>: '+this.message+'</span>';
        }

        return err;

    }
    
}

/********** Vectors *************/

function primitiveVectorMake() {
    this.typeRepr = new TypeFun(new Array(new TypeInt()), new TypeVector());
    this.arity = 1;
    this.nary = false;

    this.exec = function(evaluator,lexenv,expr,args) {
        if(args[0].type!="int") {
            return new PrimitiveError(expr.get(1),"make-vector",args,M$("Expecting an int"));
        }
        
        var size = args[0].value;
        if (size < 0 ) {
            return new PrimitiveError(expr.get(1),"make-vector",args,M$("Expecting a natural number"));
        }
        var array = new Array(size);
        for (var i=0; i<size; i++ ) {
            array[i] = new BoolValue(false);
        }
        return new VectorValue(array);
    }
}

function primitiveVectorRef() {
    this.typeRepr = new TypeFun(new Array(new TypeVector(), new TypeInt()), new TypeVariable(0));
    this.arity = 2;
    this.nary = false;

    this.exec = function(evaluator,lexenv,expr,args) {
        if(args[0].type!="vector") {
            return new PrimitiveError(expr.get(1),"vector-ref",args,M$("Expecting a vector"));
        }
        if(args[1].type!="int") {
            return new PrimitiveError(expr.get(2),"vector-ref",args,M$("Expecting a natural number"));
        }
        
        var array = args[0].value;
        var index = args[1].value;
        if ( 0 <= index && index < array.length ) {
            return array[index];
        } else {
            return new PrimitiveError(expr,"vector-ref",args,M$("Index out of bounds"));
        }
    }
}

function primitiveVectorSet() {
    this.typeRepr = new TypeFun(new Array(new TypeVector(), new TypeInt(), new TypeVariable(0)), new TypeVariable(1));
    this.arity = 3;
    this.nary = false;

    this.exec = function(evaluator,lexenv,expr,args) {
        if(args[0].type!="vector") {
            return new PrimitiveError(expr.get(1),"vector-set!",args,M$("Expecting a vector"));
        }
        if(args[1].type!="int") {
            return new PrimitiveError(expr.get(2),"vector-set!",args,M$("Expecting a natural number"));
        }
        
        var array = args[0].value;
        var index = args[1].value;
        if ( 0 <= index && index < array.length ) {
            var value = args[2];
            var oldvalue = array[index];
            array[index] = value;
            return oldvalue;
        } else {
            return new PrimitiveError(expr,"vector-set!",args,M$("Index out of bounds"));
        }
    }
}

function primitiveVectorLength() {
    this.typeRepr = new TypeFun(new Array(new TypeVector()), new TypeInt());
    this.arity = 1;
    this.nary = false;

    this.exec = function(evaluator,lexenv,expr,args) {
        if(args[0].type!="vector") {
            return new PrimitiveError(expr.get(1),"vector-set!",args,M$("Expecting a vector"));
        }
        return new IntegerValue(SchemeNumber.fn["string->number"](""+args[0].value.length));
    }
}

/********** STRINGS *************/

function primitiveStringLength() {
    this.typeRepr = new TypeFun(new Array(new TypeString()), new TypeInt());
    this.arity = 1;
    this.nary = false;

    this.exec = function(evaluator,lexenv,expr,args) {
        if(args[0].type!="string") {
            return new PrimitiveError(expr.get(1),"string-length",args,M$("Expecting a string"));
        }
        
        return new IntegerValue(SchemeNumber.fn["string->number"](""+args[0].value.length));
    }
}

function primitiveStringAppend() {
    this.typeRepr = new TypeFun(new Array(new TypeString(),new TypeString()), new TypeString());
    this.arity = 2;
    this.nary = true;

    this.exec = function(evaluator,lexenv,expr,args) {
        var str = "";
        for(var i=0;i<args.length;i++) {

            if(args[i].type!="string") {
                return new PrimitiveError(expr.get(i+1),"string-append",args,M$("Expecting a string"));
            }

            str += args[i].value
        }
        
        return new StringValue(str);
    }
}

function primitiveCompareString() {
    // C'est string>? (qui passe mieux en html que string<?)
    this.typeRepr = new TypeFun(new Array(new TypeString(),new TypeString()), makeTypeBool());
    this.arity = 2;
    this.nary = false;

    this.exec = function(evaluator,lexenv,expr,args) {
        if(args[0].type!="string") {
            return new PrimitiveError(expr.get(1),"string>?",args,M$("Expecting a string"));
        }
        if(args[1].type!="string") {
            return new PrimitiveError(expr.get(1),"string>?",args,M$("Expecting a string"));
        }

        if ( args[0].value > args[1].value ) {
            return new BoolValue(true);
        } else {
            return new BoolValue(false);
        }
    }
}

function primitiveSubString() {
    this.typeRepr = new TypeFun(new Array(new TypeString(),new TypeInt(), new TypeInt()), new TypeString());
    this.arity = 3;
    this.nary = false;

    this.exec = function(evaluator,lexenv,expr,args) {
        if(args[0].type!="string") {
            return new PrimitiveError(expr.get(1),"substring",args,M$("Expecting a string"));
        }
        if(args[1].type!="int") {
            return new PrimitiveError(expr.get(2),"substring",args,M$("Expecting an integer"));
        }
        if(args[2].type!="int") {
            return new PrimitiveError(expr.get(3),"substring",args,M$("Expecting an integer"));
        }

        var str = args[0].value;
        var start = args[1].value;
        var end = args[2].value;

        if(start<0) {
            return new PrimitiveError(expr.get(2),"substring",args,M$("The start index must be positive"));
        }
        if(start>str.length) {
            return new PrimitiveError(expr.get(2),"substring",args,M$("The start index is outside the string"));
        }

        if(end<start) {
            return new PrimitiveError(expr.get(3),"substring",args,M$("The end index must be after start"));
        }
        
        if(end>str.length) {
            return new PrimitiveError(expr.get(3),"substring",args,M$("The end index is outside the string"));
        }
        

        return new StringValue(str.substring(start,end));
    }    
}

/********** CONS CELLS ***********/

function primitiveCons() {
  this.typeRepr = new TypeFun(new Array(new TypeVariable(0), new TypeList(new TypeVariable(0))),new TypeList(new TypeVariable(0)));
    
    this.arity = 2;
    this.nary = false;
    
    this.exec = function(evaluator,lexenv,expr,args) {
        
        return new PairValue(args[0],args[1]);
    }
    
}

function primitiveList() {
    this.typeRepr = new TypeFun(new Array(new TypeVariable(0)), new TypeList(new TypeVariable(0)), true);

    this.toString = function() {
        return "list:'a*...->LIST['a]";
    }
    
    this.arity = 0;
    this.nary = true;
    
    this.exec = function(evaluator,lexenv,expr,args) {

        var last = new NilValue();
        
        for(var i=args.length-1;i>=0;i--) {
            var next = new PairValue(args[i],last);
            last = next;
        }
        
        return last;
    }
    
}

function primitivePairP() {
  this.typeRepr = new TypeFun(new Array(new TypeVariable(0)), makeTypeBool());
    
    this.arity = 1;
    this.nary = false;
    
    this.exec = function(evaluator,lexenv,expr,args) {
      if(args[0].type=="pair") {
        return new BoolValue(true);
      }

      return new BoolValue(false);
    }
    
}

function primitiveNullP() {
  this.typeRepr = new TypeFun(new Array(new TypeVariable(0)), makeTypeBool());
    
    this.arity = 1;
    this.nary = false;

    this.exec = function(evaluator,lexenv,expr,args) {
      var nil = new NilValue();
      if(args[0].equal(nil)) {
        return new BoolValue(true);
      }

      return new BoolValue(false);
    }
    
}

function primitiveListP() {
    this.toString = function() {
        return "list?:'a->bool";
    }
    
    this.arity = 1;
    this.nary = false;
    
    this.exec = function(evaluator,lexenv,expr,args) {
      if(args[0].type=="pair" || args[0].type=="nil") {
        return new BoolValue(true);
      }

      return new BoolValue(false);
    }
    
}

function primitiveCar() {
  this.typeRepr = new TypeFun(new Array(new TypeList(new TypeVariable(0))), new TypeVariable(0));
    
    this.arity = 1;
    this.nary = false;
    
    this.exec = function(evaluator,lexenv,expr,args) {
      if(args[0].type!="pair") {
          return new PrimitiveError(expr.get(1), "car", args,M$("Not a pair"));
      }

      return args[0].car;
    }
    
}

function primitiveCdr() {
  this.typeRepr = new TypeFun(new Array(new TypeList(new TypeVariable(0))), new TypeList(new TypeVariable(0)));

    this.arity = 1;
    this.nary = false;
    
    this.exec = function(evaluator,lexenv,expr,args) {
      if(args[0].type!="pair") {
        return new PrimitiveError(expr.get(1), "cdr", args,M$("Not a pair"));
      }

      return args[0].cdr;
    }
    
}

function primitiveListAccess(dirs) {
    if(dirs[0]=="a") {
        this.typeRepr = new TypeFun(new Array(new TypeList(new TypeVariable(0))), new TypeVariable(0));
    } else {
        this.typeRepr = new TypeFun(new Array(new TypeList(new TypeVariable(0))), new TypeList(new TypeVariable(0)));
    }

    this.arity = 1;
    this.nary = false;

    this.exec = function(evaluator,lexenv,expr,args) {

        var arg = args[0];

        if(arg.type!="pair") {
            return new PrimitiveError(expr.get(1), this.name, args,M$("Not a pair"));
        }
        
        var tempName = "";
        for(var i = dirs.length-1;i>=0;i--) {
            if(arg.type!="pair") {
                return new PrimitiveError(expr.get(1), this.name, args,M$("$0 is not a pair","c"+tempName+"r"));
            }
        
            var dir = dirs[i];
            if(dir=="a") {
                arg = arg.car;
            } else {
                arg = arg.cdr;
            }
            tempName  = dir + tempName;
        }

        return arg;
        
    }
}
        
function primitiveAppend() {
    this.typeRepr = new TypeFun(new Array(new TypeList(new TypeVariable(0)),new TypeList(new TypeVariable(0))), new TypeList(new TypeVariable(0)), true);

    this.arity = 2;
    this.nary = true;

    this.lastNode = null;

    this.copyList = function(expr,nb,args,head) {
        if(head.type=="nil") {
            return new NilValue();
        } else if(head.type=="pair") {
            var node = new PairValue(head.car,null);
            this.lastNode = node;
            var rest = this.copyList(expr,nb,args,head.cdr);
            node.cdr = rest;
            return node;
        } else {
            return new PrimitiveError(expr.get(nb),"append",args,M$("Expecting a proper list"));
        }
    }
    

    this.exec = function(evaluator,lexenv,expr,args) {
        var head = null;
        var last = null;
        this.lastNode = null;
        for(var i=0;i<args.length-1;i++) {
            var arg = args[i];
            if(arg.type=="pair") {
                var copy = this.copyList(expr,i+1,args,arg);
                if(copy.type=="error") {
                    return copy;
                }
                if(head==null) {
                    head = copy;
                }
                if(last!=null) {
                    last.cdr = copy;
                }
                last = this.lastNode;
            } else if(arg.type=="nil") {
                // do nothing
            } else {
                return new PrimitiveError(expr.get(i+1),"append",args,M$("Expecting a list"));
            }
        }

        var lastArg = args[args.length-1];
        if(lastArg.type=="pair" || lastArg.type=="nil") {
            if(head!=null) {
                last.cdr = lastArg;
                return head;
            } else {
                return lastArg;
            }
        } else {
            return new PrimitiveError(expr.get(args.length),"append",args,M$("Expecting a list"));
        }

    };

}


function primitiveMap() {
    this.typeRepr = new TypeFun(new Array(new TypeFun(new Array(new TypeVariable(0)),new TypeVariable(1)), new TypeList(new TypeVariable(0))), new TypeList(new TypeVariable(1)));
    
    this.arity = 2;
    this.nary = false;

    this.exec = function(evaluator,lexenv,expr,args) {
        if(args[0].type!="function" && args[0].type!="primitive") {
            return new PrimitiveError(expr.get(1), "map", args,M$("A function or primitive is expected"));
        }

        if(args[0].arity!=1) {
            if(args[0].nary) {
                return new PrimitiveError(expr.get(1), "map", args,M$("The function or primitive should be unary but its arity is (at least) $0",""+args[0].arity));
            } else {
                return new PrimitiveError(expr.get(1), "map", args,M$("The function or primitive should be unary but its arity is $0",""+args[0].arity));
            }
        }

        // now the map algorithm
        var pair = args[1];
        var mpair = null;
        var prevPair = null;
        var firstPair = null;
        do {
            if(pair.type=="pair") {
                mpair = new PairValue(null,null);
               
                // the new car
                var mcar = args[0].call(evaluator,lexenv,expr.get(1),new Array(pair.car));
                if(mcar.type=="error") {
                    return mcar;
                }
                mpair.car = mcar;
                pair = pair.cdr; // advance
            } else if(pair.type=="nil") {
                mpair = new NilValue();
            } else { // neither a pair nor a nil
                return new PrimitiveError(expr.get(2), "map", args,M$("Expecting a proper list"));
            }
            
            if(firstPair==null) {
                firstPair = mpair;
            }
            if(prevPair!=null) {
                prevPair.cdr = mpair;
            }
            prevPair = mpair;
        } while(mpair.type!="nil");
        
        return firstPair;

    };

}

function primitiveFilter() {
    this.typeRepr = new TypeFun(new Array(new TypeFun(new Array(new TypeVariable(0)),makeTypeBool()), new TypeList(new TypeVariable(1))), new TypeList(new TypeVariable(1)));
    
    this.arity = 2;
    this.nary = false;

    this.exec = function(evaluator,lexenv,expr,args) {
        if(args[0].type!="function" && args[0].type!="primitive") {
            return new PrimitiveError(expr.get(1), "filter", args,M$("A functional or primitive predicate is expected"));
        }

        if(args[0].arity!=1) {
            if(args[0].nary) {
                return new PrimitiveError(expr.get(1), "filter", args,M$("The function or primitive should by unary but its arity is (at least) $0",""+args[0].arity));
            } else {
                return new PrimitiveError(expr.get(1), "filter", args,M$("The function or primitive should by unary but its arity is $0",""+args[0].arity));
            }
        }

        // now the filter algorithm
        var pair = args[1];
        var prevPair = null;
        var firstPair = null;
        do {
            var mpair = null;
            if(pair.type=="pair") {
                mpair = new PairValue(null,null);
                
                // the test
                var test = args[0].call(evaluator,lexenv,expr.get(1),new Array(pair.car));
                if(test=="error") {
                    return test;
                } else if(test.type!="bool") {
                    return new PrimitiveError(expr.get(1),"filter",args,M$("The filter predicate should return a boolean, not a $0",M$(test.type).toString()));
                } else if(test.value==true) {
                    mpair.car = pair.car;
                    pair = pair.cdr;
                } else { // filtered
                    pair = pair.cdr;
                    continue; // skip the update
                }
            } else if(pair.type=="nil") {
                mpair = new NilValue();
            } else { // neither a pair nor a nil
                return new PrimitiveError(expr.get(2), "filter", args,M$("Expecting a proper list"));
            }

            if(firstPair==null) {
                firstPair = mpair;
            }
            if(prevPair!=null) {
                prevPair.cdr = mpair;
            }
            prevPair = mpair;
            
        } while(mpair.type!="nil");
        
        return firstPair;

    };

}

function primitiveReduce() {

    this.typeRepr = new TypeFun(new Array(new TypeFun(new Array(new TypeVariable(0),new TypeVariable(1)), new TypeVariable(1)),
                                          new TypeVariable(1),
                                          new TypeList(new TypeVariable(0))),
                                new TypeVariable(1));

    this.exec = function(evaluator,lexenv,expr,args) {
        // check the function
        if(args[0].type!="function" && args[0].type!="primitive") {
            return new PrimitiveError(expr.get(1), "reduce", args,M$("A function or primitive is expected"));
        }

        if(args[0].arity!=2) {
            if(args[0].nary) {
                if(args[0].arity>2) { // XXX: no error is arity <= 2   (because the function is nary)
                    return new PrimitiveError(expr.get(1), "reduce", args,M$("The function or primitive should be binary but its arity is (at least) $0",""+args[0].arity));
                }
            } else {
                return new PrimitiveError(expr.get(1), "reduce", args,M$("The function or primitive should be binary but its arity is $0",""+args[0].arity));
            }
        }
       
        // go the the last pair and store the values
        var values = new Array();
        var pair = args[2];
        var last = pair;
        do {
            last = pair;
            if(pair.type=="pair") {
                values.push(pair.car);
                pair = pair.cdr;
            } else if(pair.type!="nil") {
                return new PrimitiveError(expr.get(2),"reduce",args,M$("Expecting a proper list"));
            }
        } while(last.type!="nil");
        
        // now apply the reduction
        var acc = args[1];
        
        for(var i=values.length-1;i>=0;i--) {
            acc = args[0].call(evaluator,lexenv,expr.get(1),new Array(values[i],acc));
            if(acc.type=="error") {
                return acc;
            }
        }

        return acc;
        
    }

}


function primitiveAssoc() {
    this.typeRepr = new TypeFun(new Array(new TypeVariable(0),new TypeList(new TypeList(new TypeVariable(1)))), new TypeOption(new TypeVariable(1))); // XXX: need a TUPLE type !
    
    this.exec = function(evaluator,lexenv,expr,args) {
        if(args[1].type!="pair" && args[1].type!="nil") {
            return new PrimitiveError(expr.get(2), "assoc", args,M$("Expecting a list"));
        }
        if(args[1].type=="nil") {
            return new BoolValue(false);
        }

        var pair = args[1];
        while(pair.type!="nil") {
            var binding = pair.car;
            if(pair.car.type!="pair") {
                return new PrimitiveError(expr.get(2), "assoc", args,M$("Expecting an association list"));
            }
            if(args[0].equal==null) {
                return new PrimitiveError(expr.get(1), "assoc", args,M$("Equality not supported for type: '$0'",args[0].type));
            }

           if(pair.car.car.equal==null) {
                return new PrimitiveError(expr.get(2), "assoc", args,M$("Equality not supported for type: '$0'",pair.car.car.type));
            }

            var eq = args[0].equal(pair.car.car);
            if(eq) {
                return pair.car;
            }
            pair = pair.cdr;
        }

        return new BoolValue(false);
    }
}
