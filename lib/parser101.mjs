/* The parser module */

import { M$ } from './message101.mjs';
import { SchemeNumber }  from "./schemeNumber101.mjs";
var Parser101 = {};

Parser101.ReservedWords = {
    'define' : 'define',
    'if' : 'if',
    'quote' : 'quote',
    'begin' : 'begin',
    'cond' : 'cond',
    'lambda' : 'lambda',
    'let' : 'let',
    'let*' : 'let*',
    'letrec' : 'letrec',
    'case' : 'case',
    'test' : 'test',
    'tester' : 'tester',
    'verifier' : 'verifier'
};

Parser101.isReserved = function(word) {
  return Parser101.ReservedWords[word]!=null;
}

// S-Expression objects
function SExpr() {
  this.type = "sexpr";
  this._elements = new Array();

  // adding an element
  this.add = function(element) {
    this._elements.push(element)
  }

  // accessing an element
  this.get = function(index) {
    return this._elements[index]
  }

  this.size = function() {
    return this._elements.length;
  }

  // debug string
  this.toString = function() {
    var str = "(";
    for(var i=0;i<this._elements.length;i++) {
      str = str + this._elements[i].toString();
      if(i<this._elements.length-1) {
        str = str + " ";
      }
    }
    return str+")";
  }
}

// Atoms

function AtomNumber(value) {
  this.value = value;
  this.toString = function() {
    return ""+this.value
  }
}

function isEscapeChar(ch) {
  return ch=='"';
}

function AtomString(value) {
  this.type = "string";
  this.value = value;
  this.toString = function() {
    var str = '"';
    for(var i=0; i<this.value.length; i++) {
      var ch = this.value.charAt(i);
      if (isEscapeChar(ch)) {
        str = str + '\\'+ch;
      } else {
        str = str+ch;
      }
    }
    return str+'"';
  }
}

function AtomBool(value) {
  this.type = "bool";
  this.value = value;
  this.toString = function() {
    if(this.value==true) {
      return "#t";
    } else {
      return "#f";
    }
  }
}

function AtomSymbol(value) {
  this.type = "symbol";
  this.value = value;
  this.toString = function() {
    return this.value;
  }
}

function AtomUnit() {
  this.type = "unit";
  this.value = "#unit"
    this.toString = function() {
    return this.value;
  }
}

function QuotedExpr(expr) {
  this.type = "qexpr";
  this.expr = expr;
    this.startPos = this.expr.startPos;
    this.endPos = this.expr.endPos;
  this.toString = function() {
    return "(quote "+expr+")";
  }
}

function QuotedList(elems) {
  this.type = "qlist";
  this.elems = elems;

    if(elems!=null && elems.length>0) {
        this.startPos = elems[0].startPos;
        this.endPos = elems[elems.length-1].endPos;
    }
    
  this.toString = function() {
    var str = "(";
    for(var i=0;i<this.elems.length;i++) {
      str += this.elems[i].toString();
      if(i<this.elems.length-1) {
        str += " ";
      }
    }
    return str + ")";
  }
}

function TestCase() {
    // a shallow object
}

function ParseError(msg,spos,epos) {
  this.type = "parseError";
  this.message = msg;
  this.startPos = spos;
  this.endPos = epos;
  this.toString = function() {
    var str = "Parse error: from (line "+this.startPos.lpos+", col "+this.startPos.cpos+") to (line "+this.endPos.lpos+", col "+this.endPos.cpos+')\n';
    str = str + "  ==> " + this.message + "\n";
    
    return str;
  }

  this.toHTML = function() {
      return '<span class="error"><strong>'+M$("Parse Error").toString()+'</strong>: '+this.message+'</span>';
  }
}

function parseSExpr(sexpr,canDefine,quoted) {
    
  if(quoted) {
    var qargs = new Array();
    for(var i=0;i<sexpr._elements.length;i++) {
      var qarg = parseAST(sexpr._elements[i],false,true);
      qargs.push(qarg);
    }
    return new QuotedList(qargs);
  }

  // else not quoted

  if(sexpr._elements.length==0) {
    sexpr.type = "nil";
    return sexpr;
  }

  var first = sexpr._elements[0];

  if(first.type == 'symbol') {
    if(first.value == "define") {
      if(!canDefine) {
          return new ParseError(M$("Cannot define here"), sexpr.startPos, sexpr.endPos);
      }
      sexpr.type = "define";
      if(sexpr._elements.length==1) {
          return new ParseError(M$("Missing header for function definition"),sexpr.startPos,sexpr.endPos);
      }
      var header = sexpr._elements[1];
      if(header.type!='sexpr') {
          return new ParseError(M$("Wrong header for function definition"),sexpr.startPos, sexpr.endPos);
      }
      if(header._elements.length==0) {
          return new ParseError(M$("Empty header in function definition"),sexpr.startPos, sexpr.endPos);
      }
      var fname = header._elements[0];
      if(fname.type!="symbol") {
          return new ParseError(M$("Function name must be a symbol"), fname.startPos, fname.endPos);
      }
        if(Parser101.isReserved(fname.value)) {
            return new ParseError(M$("The keyword '$0' is reserved, it cannot be used as definition name",fname.value),fname.startPos, fname.endPos);
        }
      sexpr.fname = fname.value;
      var fparams = header._elements.slice(1);
      sexpr.params = new Array();
        var checkParams = {};
        for(var paramKey in fparams) {
        var fparam = fparams[paramKey];
        if(fparam.type!="symbol") {
            return new ParseError(M$("Parameter must be a symbol"), fparam.startPos, fparam.endPos);
        }
        if(Parser101.isReserved(fparam.value)) {
            return new ParseError(M$("The keyword '$0' is reserved, it cannot be used as parameter",fparam.value),fparam.startPos, fparam.endPos);
        }
            if(checkParams[fparam.value]!=null) {
                return new ParseError(M$("The parameter '$0' is defined twice",fparam.value), fparam.startPos, fparam.endPos);
            } else {
                checkParams[fparam.value] = fparam.value;
            }
        sexpr.params.push(fparam.value);
      }
            
      if(sexpr._elements.length==2) {
          return new ParseError(M$("Missing body of function definition"), sexpr.startPos, sexpr.endPos);
      }

      sexpr.innerDefs = new Array();
            
        var innerDefsNames = {};
      for(var i=2; i<sexpr._elements.length-1;i++) {
        var expr = sexpr._elements[i];
        var result = parseAST(expr,true,false);  // must (thus can) be a definition
        if(result.type=='parseError') {
          return result;
        } else if(result.type!='define') {
            return new ParseError(M$("Must be an inner definition"),expr.startPos, expr.endPos);
        } // else change is in place

          if(innerDefsNames[result.fname]!=null) {
              return new ParseError(M$("Inner function '$0' defined twice",result.fname),expr.startPos, expr.endPos);
        } else {
            innerDefsNames[result.fname] = result.fname;
        }


        sexpr.innerDefs.push(result);
      }
            
      var expr = sexpr._elements[sexpr._elements.length-1];
      var result = parseAST(expr,false,false);  // cannot be a definition
      if(result.type=='parseError') {
        return result;
      } // else change is in place
            
      sexpr.body = expr;

      return sexpr;
    } else if(first=="if") {
      sexpr.type = "if";
      if(sexpr._elements.length==1) {
          return new ParseError(M$("Missing condition, then and else clause in if expression"),sexpr.startPos, sexpr.endPos);
      }
      var condition = sexpr._elements[1];
      var result = parseAST(condition,false,false);
      if(result.type=='parseError') {
        return result;
      }
      sexpr.condition = condition;
      if(sexpr._elements.length==2) {
          return new ParseError(M$("Missing then and else clause in if expression"),sexpr.startPos, sexpr.endPos);
      }
      var thenClause = sexpr._elements[2];
      var result = parseAST(thenClause,false,false);
      if(result.type=='parseError') {
        return result;
      }
      sexpr.thenClause = thenClause;
      if(sexpr._elements.length==3) {
          return new ParseError(M$("Missing else clause in if expression"),sexpr.startPos, sexpr.endPos);
      }
      var elseClause = sexpr._elements[3];
      var result = parseAST(elseClause,false,false);
      if(result.type=='parseError') {
        return result;
      }
      sexpr.elseClause = elseClause;
            
      if(sexpr._elements.length>4) {
          return new ParseError(M$("Too many arguments for if expression"),sexpr.startPos, sexpr.endPos);
      }
            
      return sexpr;
            
    } else if(first=="and" || first=="or") {
      sexpr.type=first;
      for(var i=1; i<sexpr._elements.length;i++) {
        var expr = sexpr._elements[i];
        var result = parseAST(expr,false,false);  // cannot be a definition
        if(result.type=='parseError') {
          return result;
        }
        sexpr._elements[i] = result;
      }
      return sexpr;
    } else if(first=="cond") {
      sexpr.type = first;
      if(sexpr._elements.length<3) {
          return new ParseError(M$("Conditional needs at leat 2 clauses"),sexpr.startPos, sexpr.endPos);
      }
      sexpr.clauses = new Array();
      for(var i=1;i<sexpr._elements.length;i++) {
        var clause = sexpr._elements[i];
        if(clause.type!="sexpr") {
            return new ParseError(M$("Not a clause in conditional"),clause.startPos, clause.endPos);
        }
        if(clause._elements.length<2) {
            return new ParseError(M$("Clause must have at least 2 elements in conditional"),clause.startPos, clause.endPos);      
        }
        var condition = parseAST(clause.get(0),false,false);
        if(condition=="parseError") {
          return condition;
        }
        if(condition.type=="symbol" && condition.value=="else") {
          if(i!=sexpr._elements.length-1) {
              return new ParseError(M$("Else clause must be the last in conditional"),clause.startPos, clause.endPos);      
          }
        } else if(i==sexpr._elements.length-1) {
            return new ParseError(M$("Conditional must be ended by an else"),clause.startPos, clause.endPos);      
        }

        var body = new Array();
        for(var j=1;j<clause._elements.length;j++) {
          var expr = parseAST(clause._elements[j],false,false);
          if(expr.type=="parseError") {
            return expr;
          }
          body.push(expr);
        }
        
        sexpr.clauses.push({ condition: condition, body:body });
      }

      return sexpr;

    } else if(first=="test" || first=="tester" || first=="verifier") { // XXX: for compatibility with old LI101 language
        sexpr.type = "test";
        if(sexpr.size()==1) {
            return new ParseError(M$("Missing function name in test expression"),sexpr.startPos, sexpr.endPos);
        }
        var testFun = sexpr.get(1);
        if(testFun.type=="parseError") {
            return testFun;
        } else if(testFun.type!="symbol") {
            return new ParseError(M$("Wrong function name in test expression: expecting a symbol"), testFun.startPos, testFun.endPos);
        }
        // QNC
        testFun.startPos = sexpr.startPos;
        testFun.endPos = sexpr.endPos;
        
        sexpr.testFun = testFun;
        if(sexpr.size()==2) {
            return new ParseError(M$("Missing test case(s) in test expression"),sexpr.startPos, sexpr.endPos);
        }

        sexpr.testCases = new Array();
        var pos = 2 ;
        while (pos < sexpr.size()) {
            var testCase = new TestCase();
            var testExpr = parseAST(sexpr.get(pos), false, false);
            if (testExpr.type=="parseError") {
                return testExpr;
            }
            testCase.testExpr = testExpr;

            pos++ ;
            if (pos >= sexpr.size()) {
                return new ParseError(M$("Missing arrow '->' or '=>' or '~>' in test case"), testCase.testExpr.startPos, testCase.testExpr.endPos);
            }
            var arrow = sexpr.get(pos);
            if(arrow.type!="symbol" || (arrow.value!="->" && arrow.value!="=>" && arrow.value!="~>")) {
                return new ParseError(M$("Arrow symbol '->' or '=>' or '~>' expected, not '$0' in test expression",arrow.toString()),arrow.startPos, arrow.endPos);
            }

            pos++ ;
            if (pos >= sexpr.size()) {
                return new ParseError(M$("Missing expected value in test expression"),sexpr.startPos, sexpr.endPos);
            }

            var expectedValue = parseAST(sexpr.get(pos),false,true); // quoted
            if(expectedValue.type!="qlist" && expectedValue.type!="qexpr") {
                expectedValue = new QuotedExpr(expectedValue);
            }
            testCase.expectedValue = expectedValue;
        
            // console.log("expected value",expectedValue,expectedValue.toString());
            /* XXX: need a check ?
               if(expectedValue.type!="qexpr" && expectedValue.type!="qlist") {
               return new ParseError(M$("Wrong expected value in test expression"),expectedValue.startPos, expectedValue.endPos);            
               }
            */
            pos++ ;

            sexpr.testCases.push(testCase);

        }
        
        return sexpr;
    } else if(first=="let" || first=="let*") {
      sexpr.type = first;
      if(sexpr._elements.length<3) {
          return new ParseError(M$("Missing arguments for $0-expression",first), sexpr.startPos, sexpr.endPos);
      }
      // parse bindings
        var varNames = {};
      var bindings = sexpr._elements[1];
      if(bindings.type!="sexpr") {
          return new ParseError(M$("Bindings in $0-expression must be a list",first), bindings.startPos, bindings.endPos);
      }
      sexpr.bindings=new Array();
      for(var i=0;i<bindings._elements.length;i++) {
        var binding = bindings._elements[i];
        if(binding.type!="sexpr") {
            return new ParseError(M$("Binding in $0-expression is not a pair",first), binding.startPos, binding.endPos);
        } 
        if(binding._elements.length!=2) {
            return new ParseError(M$("Binding in $0-expression must be of length 2",first), binding.startPos, binding.endPos);
        }
        var name = binding._elements[0];
        if(name.type!="symbol") {
            return new ParseError(M$("Variable name missing in '$0'-binding",first), binding.startPos, binding.endPos);          
        }
          if(varNames[name.value]!=null) {
              return new ParseError(M$("Variable '$0' defined twice in $1-expression",new Array(name.value,first)), name.startPos, name.endPos);
          } else {
              varNames[name.value] = name.value;
          }
          var expr = parseAST(binding._elements[1],false,false);
        if(expr.type=="parseError") {
          return expr;
        }
        
        sexpr.bindings.push({ name : name , expr : expr });
      }
      // parse expressions
      sexpr.body = new Array();
      for(var i=2;i<sexpr._elements.length;i++) {
        var expr = parseAST(sexpr._elements[i],false,false);
        if(expr.type=="parseError") {
          return expr;
        }
        sexpr.body.push(expr);
      }
        
      return sexpr;
    } else if(first=="quote") {
        if(sexpr.size()<2) {
            return new ParseError(M$("Missing expression in quote"), sexpr.startPos, sexpr.endPos);
        } else if(sexpr.size()>2) {
            return new ParseError(M$("Too many arguments to quote"), sexpr.startPos, sexpr.endPos);
        }
        var quotedExpr = parseAST(sexpr.get(1),false,true); // quoted
        if(quotedExpr.type!="qlist" && quotedExpr.type!="qexpr") {
            return new QuotedExpr(quotedExpr);
        } else {
            return quotedExpr;
        }
    }
  }

  // here first is either a symbol but not reserved, or an sexpression to evaluate
  if(first.type!='symbol' && first.type!='sexpr') {
      return new ParseError(M$("First argument of expression must be a symbol or a sub-expression"), first.startPos, first.endPos);
  }

  sexpr.type = "application";
    
  for(var arg in sexpr._elements) {
    var result = parseAST(sexpr._elements[arg],false);
    if(result=='parseError') {
      return result;
    }
    // QNC
    sexpr._elements[arg] = result;
  }

  sexpr.args = sexpr._elements;

  return sexpr;
    
}

function parseAST(ast,canDefine,quoted) {
    if(ast.type=="sexpr") {
        return parseSExpr(ast,canDefine,quoted);
    } else {
        return ast;
    }
}


export function Parser(lexer) {
  this.lexer = lexer;
    
  this.parseNext = function(quoted) {
    if(quoted==null) {
      quoted = false;
    }
    var lastComments = new Array();
    var sexpArray = new Array();
    var openParens = 0;
    while(true) {
      var token = lexer.nextToken();
      var ast = null;
      if (token.type == "errorToken") {
          return new ParseError(token.message,token.startPos,lexer.pos.clone());
      } else if(token.type=='ident') {
        ast = new AtomSymbol(token.value);
        ast.startPos = token.startPos;
        ast.endPos = token.endPos;
         // console.log("atom",ast.value,ast);
        if(sexpArray.length>=1) {
          sexpArray[sexpArray.length-1].add(ast);
        } else {
          return ast;
        }
      } else if(token.type=='number') {

        var numberMaybe = SchemeNumber.fn["string->number"](token.value);
        if (!numberMaybe) {
          return new ParseError(M$("Not a number"),token.startPos,token.endPos);
        } else {
          // new AtomNumber
          var ast = {};
          ast.value = numberMaybe;
          ast.tokenvalue = token.value;
          ast.type = 'Number';
          ast.startPos = token.startPos;
          ast.endPos = token.endPos;
          ast.toString = function() {return this.tokenvalue};
        }
        if(sexpArray.length>=1) {
          sexpArray[sexpArray.length-1].add(ast);
        } else {
          return ast;
        }
      } else if(token.type=='bool') {
        var flag = (token.value=='#t')?true:false;
        ast = new AtomBool(flag);
        ast.startPos = token.startPos;
        ast.endPos = token.endPos;
        if(sexpArray.length>=1) {
          sexpArray[sexpArray.length-1].add(ast);
        } else {
          return ast;
        }
      } else if(token.type=='string') {
        ast = new AtomString(token.value);
        ast.startPos = token.startPos;
        ast.endPos = token.endPos;
        if(sexpArray.length>=1) {
          sexpArray[sexpArray.length-1].add(ast);
        } else {
          return ast;
        }
      } else if(token.type=='comment') {
        lastComments.push(token.value);
      } else if(token.type=='lparen') {
        openParens++;
        var sexp = new SExpr();
        sexp.startPos = token.startPos;
        sexp.comments = lastComments;
        lastComments = new Array();
        sexpArray.push(sexp);
      } else if(token.type=='rparen') {
        if(sexpArray.length==0) {
          return new ParseError(M$("Extra right parenthesis"),token.startPos,token.endPos);
        }
        openParens--;
        var sexp = sexpArray.pop();
        sexp.endPos = token.endPos;
        if(sexpArray.length>=1) {
          sexpArray[sexpArray.length-1].add(sexp);
        } else {
          return parseSExpr(sexp,true,quoted); // top-level expression can be a define
        }
      } else if(token.type == 'quote') {
        if(!quoted) { 
          var expr = this.parseNext(true); // quoted
          if(sexpArray.length>=1) {
              sexpArray[sexpArray.length-1].add(new QuotedExpr(expr));
          } else {
            return new QuotedExpr(expr);
          }
        } else {
          var spos = token.startPos.clone();
          var expr = this.parseNext(true);
          var qargs = new Array();
          var qatom = new AtomSymbol('quote');
          qatom.startPos = spos;
          qatom.endPos = spos+1; // faked quote
          qargs.push(qatom);
          if(expr.type=='qlist') {
            for(var i=0;i<expr.elems.length;i++) {
              qargs.push(expr.elems[i]);
            }
          } else {
            qargs.push(expr);
          }
          var nexpr = new QuotedList(qargs);
          nexpr.startPos = spos;
          nexpr.endPos = expr.endPos;
          if(sexpArray.length>=1) {
            sexpArray[sexpArray.length-1].add(nexpr);
          } else {
            return nexpr;
          }
        }
      } else if(token.type=='eof') {
        if(openParens==0) {
          return new AtomUnit();
        } else {
            return new ParseError(M$("Unexpected end of input"),token.startPos,token.endPos);
        }
      } else { // unknown token
          return new ParseError(M$("Unsupported token '$0'",token.value),token.startPos,token.endPos);
      }
    }
  }
}
