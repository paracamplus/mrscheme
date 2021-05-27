/////////////////////////////////////////////////////////////////////
import { SchemeNumber } from "./schemeNumber101.mjs";
import { TypeFun, TypeVariable, makeTypeBool } from "./type101.mjs";
import { M$ } from './message101.mjs';
import { PrimitiveError } from './primerror.mjs';

// Implementation of "schema's numerical tower".                 //  
// This implementation is based on                              //
// "Scheme arithmetic library for JavaScript",                 //
// https://github.com/jtobey/javascript-bignum.               //
//                                                           //
// More info about numerical tower can be find at           //
// "Revised⁶ Report on the Algorithmic Language Scheme".    //
//                                                         //
// But here certains function are based on                //
// "Carte de référence pour LI101",                      //
// so there are some differences, for example           //
// '>' takes only two arguments.                       //
//                                                    //
// Author: Sergey KIRGIZOV <sergey.kirgizov@lip6.fr> //
//                                                  //
/////////////////////////////////////////////////////


// TODO: use javascript inheritance for number objects and (maybe) types
// TODO: think about DependentNumber type.
// TODO: rewrite 'Carte de référence' and add new number types

export const NumericalTowerLib = {};

NumericalTowerLib.installPrimEnv = function(penv) {
  /* See schemeNumber.js for details */

  function regPredicate1(fname) {
    penv.register(fname, new NumericalTowerLib.predicate1(fname));
  }

  ["number?", "complex?", "real?", "rational?", "integer?", 
   "real-valued?", "rational-valued?", "integer-valued?"]
  .map(regPredicate1);

  ["exact?", "inexact?"].
    map(
      function(fname) {
        penv.register(fname, 
                      new NumericalTowerLib.typedPredicate1(
                        fname,
                        new TypeNumber(),
                        M$("Expecting a number"))
                     );
      }
    );

  ["exact","inexact"].
    map(
      function(fname) {
        penv.register(fname,
                      new NumericalTowerLib.operation1(
                        fname,
                        new TypeNumber(),
                        new TypeNumber(),
                        function(x) { return new NumberValue(x);},
                        M$("Expecting a number"))                  
                     );
      }
    );

  penv.register("zero?", 
                new NumericalTowerLib.typedPredicate1(
                  "zero?",
                  new TypeNumber(),
                  M$("Expecting a number"))
               );

  ["positive?","negative?","finite?","infinite?","nan?"].
    map(
      function(fname) {
        penv.register(fname, 
                      new NumericalTowerLib.typedPredicate1(
                        fname,
                        new TypeReal(),
                        M$("Expecting a real number"))
                     );

      }
    );

  ["odd?", "even?"].
    map(
      function(fname) {
        penv.register(fname, 
                      new NumericalTowerLib.typedPredicate1(
                        fname,
                        new TypeInteger(),
                        M$("Expecting an integer"))
                     );

      }
    );


  ["abs", "floor", "ceiling", "truncate", "round"].
    map(
      function(fname) {
        penv.register(fname,
                      new NumericalTowerLib.operation1(
                        fname,
                        new TypeReal(),
                        new TypeReal(),
                        function(x) { return new RealValue(x);},
                        M$("Expecting a real number"))
                     );
      }
    );
  
  ["sqrt", "exp", "log", "sin", "cos", "tan",
   "asin", "acos", "atan"].
    map(
      function(fname) {
        penv.register(fname,
                      new NumericalTowerLib.operation1(
                        fname,
                        new TypeNumber(),
                        new TypeNumber(),
                        function(x) { return new NumberValue(x);},
                        M$("Expecting a number"))
                     );
      }
    );

  penv.register("quotient",
                      new NumericalTowerLib.operation2DivMod(
                        "div"));

  penv.register("remainder",      
                      new NumericalTowerLib.operation2DivMod(
                        "remainder"));   // QNC sign of arg1
  penv.register("modulo",
                      new NumericalTowerLib.operation2DivMod(
                        "modulo"));      // QNC sign of arg2
 // QNC see bignum101/schemeNumber101.js

  //eqv? == equals? for numbers, but '=' may be different.
  //see r6rs for details.

  //=
  penv.register("=",
                new NumericalTowerLib.eq("="));

  ["<", ">", "<=", ">="].
    map(
      function(fname) {
        penv.register(fname,
                     new NumericalTowerLib.comparator(fname))
      }
    );


  penv.register("random",
                new NumericalTowerLib.random());

    penv.register("-",
                  new NumericalTowerLib.operationN1("-"));


  ["+", "*"].
    map(
      function (fname) {
        penv.register(fname,
                      new NumericalTowerLib.operationN(fname)
                     )
      }
    );
  

  penv.register("/", new NumericalTowerLib.operationNDiv("/"));

  ["min", "max"].
    map(
      function (fname) {
        penv.register(fname,
                      new NumericalTowerLib.operationNminmax(fname)
                     )
      }
    );

// long todo:
//  other function from "Revised⁶ Report", for example
//   make-rectangular, 
//   real-part
//   angle
//   number->string
//   etc
  
};


// To implement in each primitive procedure:
//
// typeRepr
// arity
// nary
// exec
//

NumericalTowerLib.predicate1 = function(fname) {
  this.typeRepr = new TypeFun(new Array(new TypeVariable(0)),makeTypeBool());
  this.arity = 1;
  this.nary = false;
  
  this.exec = function(evaluator,lexenv,expr,args) {
    var v = args[0].value;
    return new BoolValue(SchemeNumber.fn[fname](v));
  }
}


NumericalTowerLib.typedPredicate1 = function (fname, type, errmsg) {
  this.typeRepr = new TypeFun(new Array(type), makeTypeBool());
  this.arity = 1;
  this.nary = false;
  
  this.exec = function(evaluator,lexenv,expr,args) {
    var v = args[0].value;
    try {
      return new BoolValue(SchemeNumber.fn[fname](v));
    } catch (exp) {
      return new PrimitiveError(expr.get(1),fname,args,errmsg);
    }
  }  
}

NumericalTowerLib.operation1 = function (fname, typeIn, typeOut,
                                         constructOut, errmsg) {
  this.typeRepr = new TypeFun(new Array(typeIn), typeOut);
  this.arity = 1;
  this.nary = false;
  
  this.exec = function(evaluator,lexenv,expr,args) {
    var v = args[0].value;
    try {
      return constructOut(SchemeNumber.fn[fname](v));
    } catch (exp) {
      return new PrimitiveError(expr.get(1),fname,args,errmsg);
    }
  }
}

NumericalTowerLib.operation2DivMod = function (fname) {
  this.typeRepr = new TypeFun(new Array(new TypeInteger(),
                                       new TypeInteger()), 
                             new TypeInteger);
  this.arity = 2;
  this.nary = false;
  
  this.exec = function(evaluator,lexenv,expr,args) {
    var a = args[0].value;
    var b = args[1].value;

    if (!SchemeNumber.fn["integer?"](a)) {
      return new PrimitiveError(expr.get(1),fname,args,
                                M$("Expecting an integer"));
    }

    if (!SchemeNumber.fn["integer?"](b)) {
      return new PrimitiveError(expr.get(2),fname,args,
                                M$("Expecting an integer"));
    }
    
    if(SchemeNumber.fn["="](b,0)) {
      return new PrimitiveError(expr.get(2),fname,args,
                                M$("Division by zero"));
    }

    try {
      return new IntegerValue( SchemeNumber.fn[fname](a,b) );
    } catch (exp) {
      console.log(exp);
      return new PrimitiveError(expr,fname,args,
                                M$("Unknown exception raised (please report)"));
    }
  }
}

NumericalTowerLib.eq = function (fname) {
  this.typeRepr = new TypeFun(new Array(new TypeNumber(),new TypeNumber()),
                              makeTypeBool());
  this.arity = 2;
  this.nary = false;  
  this.exec = function(evaluator,lexenv,expr,args) {
    var a = args[0].value;
    var b = args[1].value;

    if (!SchemeNumber.fn["number?"](a)) {
      return new PrimitiveError(expr.get(1),fname,args,
                                M$("Expecting a number"));
    }

    if (!SchemeNumber.fn["number?"](b)) {
      return new PrimitiveError(expr.get(2),fname,args,
                                M$("Expecting a number"));
    }

    try {
      return new BoolValue(SchemeNumber.fn[fname](a,b));
    } catch (exp) {
      console.log(exp);
      return new PrimitiveError(expr,fname,args,
                                M$("Unknown exception raised (please report)"));
    }
  }  
}

//todo: add expr.get(1) for example
NumericalTowerLib.comparator = function (fname) {
  this.typeRepr = new TypeFun(new Array(new TypeReal(),new TypeReal()),
                              makeTypeBool());
  this.arity = 2;
  this.nary = false;  
  this.exec = function(evaluator,lexenv,expr,args) {
    var a = args[0].value;
    var b = args[1].value;

    if (!SchemeNumber.fn["real?"](a)) {
      return new PrimitiveError(expr.get(1),fname,args,
                                M$("Expecting a real number"));
    }

    if (!SchemeNumber.fn["real?"](b)) {
      return new PrimitiveError(expr.get(2),fname,args,
                                M$("Expecting a real number"));
    }

    try {
      return new BoolValue(SchemeNumber.fn[fname](a,b));
    } catch (exp) {
      console.log(exp);
      return new PrimitiveError(expr,fname,args,
                                M$("Unknown exception raised (please report)"));
    }
  }  
}


NumericalTowerLib.operationN = function (fname) {
  this.typeRepr = new TypeFun(new Array(new TypeNumber(), new TypeNumber()), new TypeNumber(), true);

  this.arity = 2;
  this.nary = true;
  
  this.exec = function(evaluator,lexenv,expr,args) {
    //type check
    for(var ind=0;ind<args.length;ind++) {
      var v = args[ind].value;
      if (!SchemeNumber.fn["number?"](v)) {
        return new PrimitiveError(expr.get(ind + 1),fname,args,
                                  M$("Expecting a number"));        
      }
    }
    
    try {
      return new NumberValue(SchemeNumber.fn[fname].apply(this,args.map(
        function(x) {return x.value;}
      )));
    } catch (exp) {
      console.log(exp);
      return new PrimitiveError(expr,fname,args,
                                M$("Unknown exception raised (please report)"));
    }
  }
}

NumericalTowerLib.operationN1 = function (fname) {
  this.typeRepr = new TypeFun(new Array(new TypeNumber()), new TypeNumber(), true);

  this.arity = 1;
  this.nary = true;
  
  this.exec = function(evaluator,lexenv,expr,args) {
    //type check
    for(var ind=0;ind<args.length;ind++) {
      var v = args[ind].value;
      if (!SchemeNumber.fn["number?"](v)) {
        return new PrimitiveError(expr.get(ind + 1),fname,args,
                                  M$("Expecting a number number"));        
      }
    }
    
    try {
      return new NumberValue(SchemeNumber.fn[fname].apply(this,args.map(
        function(x) {return x.value;}
      )));
    } catch (exp) {
      console.log(exp);
      return new PrimitiveError(expr,fname,args,
                                M$("Unknown exception raised (please report)"));
    }
  }
}

NumericalTowerLib.operationNminmax = function (fname) {
  this.typeRepr = new TypeFun(new Array(new TypeReal(), new TypeReal()), new TypeReal(), true);

  this.arity = 2;
  this.nary = true;
  
  this.exec = function(evaluator,lexenv,expr,args) {
    //type check
    for(var ind=0;ind<args.length;ind++) {
      var v = args[ind].value;
      if (!SchemeNumber.fn["real?"](v)) {
        return new PrimitiveError(expr.get(ind + 1),fname,args,
                                  M$("Expecting a real number"));
      }
    }
    
    try {
      return new RealValue(SchemeNumber.fn[fname].apply(this,args.map(
        function(x) {return x.value;}
      )));
    } catch (exp) {
      console.log(exp);
      return new PrimitiveError(expr,fname,args,
                                M$("Unknown exception raised (please report)"));
    }
  }
}


NumericalTowerLib.operationNDiv = function (fname) {
  this.typeRepr = new TypeFun(new Array(new TypeNumber(), new TypeNumber()), new TypeNumber(), true);

  this.arity = 2;
  this.nary = true;
  
  this.exec = function(evaluator,lexenv,expr,args) {
    //type check
    if (!SchemeNumber.fn["number?"](args[0].value)) {
      return new PrimitiveError(expr.get(1),fname,args,
                                M$("Expecting a number number"));        
    }
    for(var ind=1;ind<args.length;ind++) {
      var v = args[ind].value;
      if (!SchemeNumber.fn["number?"](v)) {
        return new PrimitiveError(expr.get(ind + 1),fname,args,
                                  M$("Expecting a number number"));        
      }
      if (SchemeNumber.fn["="](v,0)) {
        return new PrimitiveError(expr.get(ind + 1),fname,args,
                                  M$("Division by zero"));        
      }
    }
    
    try {
      return new NumberValue(SchemeNumber.fn[fname].apply(this,args.map(
        function(x) {return x.value;}
      )));
    } catch (exp) {
      console.log(exp);
      return new PrimitiveError(expr,fname,args,
                                M$("Unknown exception raised (please report)"));
    }
  }
}


NumericalTowerLib.random = function() {
    this.typeRepr = new TypeFun(new Array(new TypeInteger()),
                                new TypeInteger());

    this.arity = 1;
    this.nary = 0;

    this.exec = function(evaluator,lexenv,expr,args) {
      var a = args[0].value;
      if(!SchemeNumber.fn["integer?"](a)) {
        return new PrimitiveError(expr.get(1),"random",args,M$("Expecting an integer"));
      }
      if(SchemeNumber.fn["<"](a,1)) {
        return new PrimitiveError(expr.get(1),"random",args,M$("The integer must be strictly positive"));
      }
      return new IntegerValue(
        SchemeNumber.fn["exact"](SchemeNumber(
          Math.floor(Math.random()*args[0].value)
        )));
    }
}


////////////////////////////////////////////////////////////////
//                                                           //
// Types                                                    //
//                                                         //
// More info about schema's numerical tower               //
// can be find at                                        //
// "Revised⁶ Report on the Algorithmic Language Scheme" //
//                                                     //
////////////////////////////////////////////////////////
                                                                               
// Numerical tower: integer ⊂ rational ⊂ real ⊂ complex ⊂ number
// in "Revised⁶ Report..." authors use the following notation:
//
// n ∈ integer
// q ∈ rational
// x ∈ real
// z ∈ complex
// obj ∈ anyobject
//
// I prefer to use the same notation.
// Exactness:       each number can be either exact or inexact


function todo() {
  return "not yet implemented";
}

// todo: think about exactness
function TypeNumber() {
  this.type="Number";
  this.toString = function() { return "Number"; }
  this.show = function() { return M$("Number").toString(); }
  this.convert = todo();
}

function TypeComplex() {
  this.type="Complex";
  this.toString = function() { return "Complex"; }
  this.show = function() { return M$("Complex").toString(); }
  this.convert = todo();
}


//TOCHECK: canvas use real numbers, so... i should check that
//there is no problem with new number-library.
function TypeReal() {
  this.type="Real";
  this.toString = function() { return "Real"; }
  this.show = function() { return M$("real").toString(); }
  this.convert = todo();
}

function TypeRational() {
  this.type="Rational";
  this.toString = function() { return "Rational"; }
  this.show = function() { return M$("Rational").toString(); }
  this.convert = todo();
}

function TypeInteger() {
  this.type="Int";
  this.toString = function() { return "Int"; }
  this.show = function() { return M$("int").toString(); }
  this.convert = todo();
}


export function NumberValue(value) {
  if (SchemeNumber.fn["integer?"] (value)) {
    return new IntegerValue(value);
  } else if (SchemeNumber.fn["real?"] (value)) {
    return new RealValue(value);
  } else if (SchemeNumber.fn["complex?"] (value)) {
    return new ComplexValue(value);
  } else if (SchemeNumber.fn["rational?"] (value)) {
    return new RationalValue(value);
  } else {
      throw "Not a number: " + value ;
  }
}

export function RealValue(value) {
  this.value = value;
  this.type = "Real";
  this.isNumber = true;
  
  this.equal = function(other) {
    if(other==null || other==undefined) {
      return false;
    }
    return SchemeNumber.fn["eqv?"] (this.value, other.value);
  }

  this.toHTML = function() {
    return '<span class="value">' 
      + SchemeNumber.fn["number->string"] (this.value)
      + '<span class="tooltip">type <strong>'
      + M$("real")
      + '</strong></span></span>';
  }
  
  this.toString = function() {
    return SchemeNumber.fn["number->string"] (this.value);
  }
}

export function IntegerValue(value) {
  this.value = value;
  this.type = "int";
  this.isNumber = true;
  
  this.equal = function(other) {
    if(other==null || other==undefined) {
      return false;
    }
    return SchemeNumber.fn["eqv?"] (this.value, other.value);
  }

  this.toHTML = function() {
    return '<span class="value">' 
      + SchemeNumber.fn["number->string"] (this.value)
      + '<span class="tooltip">type <strong>'
      + M$("int")
      + '</strong></span></span>';
  }
  
  this.toString = function() {
    return SchemeNumber.fn["number->string"] (this.value);
  }
}

export function RationalValue(value) {
  this.value = value;
  this.type = "Rational";
  this.isNumber = true;
  
  this.equal = function(other) {
    if(other==null || other==undefined) {
      return false;
    }
    return SchemeNumber.fn["eqv?"] (this.value, other.value);
  }

  this.toHTML = function() {
    return '<span class="value">' 
      + SchemeNumber.fn["number->string"] (this.value)
      + '<span class="tooltip">type <strong>'
      + M$("rational")
      + '</strong></span></span>';
  }
  
  this.toString = function() {
    return SchemeNumber.fn["number->string"] (this.value);
  }
}


export function ComplexValue(value) {
  this.value = value;
  this.type = "Complex";
  this.isNumber = true;
  
  this.equal = function(other) {
    if(other==null || other==undefined) {
      return false;
    }
    return SchemeNumber.fn["eqv?"] (this.value, other.value);
  }

  this.toHTML = function() {
    return '<span class="value">' 
      + SchemeNumber.fn["number->string"] (this.value)
      + '<span class="tooltip">type <strong>'
      + M$("complex")
      + '</strong></span></span>';
  }
  
  this.toString = function() {
    return SchemeNumber.fn["number->string"] (this.value);
  }
}


////////////////////////////////////////////////////////////////
//                                                           //
// Known bugs                                               //
//                                                         //
////////////////////////////////////////////////////////////

// 'exact?' reads __"123"__ like a number, 
//          but clearly it's just a string.
