/* The lexer module */
import { M$ } from './message101.mjs';

function Position(lpos,cpos) {
  this.lpos = lpos || 1;
  this.cpos = cpos || 1;

  this.toString = function() {
    return ""+this.lpos+":"+this.cpos;
  };
    
  this.clone = function() {
    return new Position(this.lpos,this.cpos);
  };
}

function Token(type,value,startPos,endPos) {
  this.type = type;
  this.value = value;
  this.startPos = startPos;
  this.endPos = endPos;
  this.toString = function() {
    return "Token::"+this.type+"@"+this.startPos+"->"+this.endPos+":"+this.value;
  };
}

function ErrorToken(pos,msg) {
  this.type = "errorToken";
  this.startPos = pos;
  this.message = msg;
  this.toString = function() {
    return "TokenError@"+this.startPos+":"+msg;
  }
}

//TODO: add utf8 characters
//TODO: think about whitespace delimeters,
//      because currently '#fff' will be parsed as '#f ff',
//      but any attempt to parse '#fff' should gives an error.
//      
const EXTENDED_CHARS = "[!\\$%&\\*\\+\\-/\\:<\\=>\\?@\\^_~]";
const IDENT_TOKEN = new RegExp("^(?:[a-zA-Z]|"+EXTENDED_CHARS+")(?:[a-zA-Z0-9]|"+EXTENDED_CHARS+")*");
const BOOL_TOKEN = /^(?:#t|#f)/;
const COMMENT_TOKEN = /^;.*$/m;
const DELIMETER = "()\[\];\s#\"";
const MAYBE_NUMBER_TOKEN = new RegExp ("^[-+#]{0,1}[^-+<>#\\[\\]()\\s]{1,}[-+]{0,1}[^-+<>#\\[\\]()\\s]{0,}");



export function Tokenizer(input) {
  this.input = input;
  this.offset = 0;
  this.pos = new Position(1,1);
  this.cposArray = new Array();

  this.advance = function () {
    this.offset++;
    this.pos.cpos++;
  };

  this.nextLine = function() {
    this.offset++;
    this.cposArray.push(this.pos.cpos);
    this.pos.cpos = 1;
    this.pos.lpos++;
  };

  this.consume = function(str) {
    for(var i=0;i<str.length;i++) {
      var ch = str.charAt(i);
      if(ch=='\n') {
        this.nextLine();
      } else {
        this.advance();
      }
    }
  };

  this.peekChar = function() {
    if(this.offset==this.input.length) {
      return null;
    }

    var ch = this.input.charAt(this.offset);
    return ch;
  };

  this.nextChar = function() {
    var ch = this.peekChar();
    if (ch!=null) {
      if(ch=='\n') {
        this.nextLine();
      } else {
        this.advance();
      }
    }
    return ch;
  };
    
  this.putBack = function() {
    this.offset--;
    if(this.pos.cpos==1) {
      if(this.pos.lpos==1) {
        throw "wrong put back (please report)";
      } else {
        this.pos.lpos--;
        this.pos.cpos = this.cposArray.pop();
      }
    } else {
      this.pos.cpos--;
    }
  };
     
  var RegexParse = function(sPos,ePos,str) {
    this.startPos = sPos;
    this.endPos = ePos;
    this.parse = str;
  };

  this.searchRegexp = function(regexp) {
    var str = this.input.substring(this.offset);
    var fstr = regexp.exec(str);
    if(fstr==null) {
      return null;
    }
    str = fstr[0]; // only the first match is considered
    var sPos = this.pos.clone();
    this.consume(str);
      return new RegexParse(sPos,this.pos.clone(),str);
  };
    
  /* return the next token */
  this.nextToken = function() {
    var startPos = this.pos.clone();
    var first = null;
    do {
      first = this.nextChar();
      if(first==null) {
        return new Token('eof',null,startPos,this.pos.clone());
      }
    } while(first==' ' || first=='\n' || first=='\t' || first=='\r');

    startPos = this.pos.clone(); // new start
        
    if (first == '(') {
      return new Token('lparen','(',startPos,this.pos.clone());
    } 
    
    // else
    if(first == ')') {
      return new Token('rparen',')',startPos,this.pos.clone());
    } 

    if(first == "'") {
      return new Token('quote',"'",startPos,this.pos.clone());
    }

    // boolean?
    if (first == '#') {
      this.putBack();
      parse = this.searchRegexp(BOOL_TOKEN);
      if (parse!=null) {
        return new Token("bool",parse.parse,parse.startPos,parse.endPos);
      } else {
        first = this.nextChar();
      }
    }


    // so it's not boolean, maybe a number?
    var result = null; // if cannot parse the number
    if((first=='-') || (first=='+') || (first>='0' && first<='9') ||
       (first=='#') || (first=='.')) {
      this.putBack();
      var parse = this.searchRegexp(MAYBE_NUMBER_TOKEN);
      if(parse==null) {
        first = this.nextChar(); // fetch again the first char
          result = new ErrorToken(this.pos.clone(),M$("Not a number"));
      } else {
        return new Token("number",parse.parse,parse.startPos,parse.endPos);
      }
    }

    //else 
    if(first==";") {
      this.putBack();
      var parse = this.searchRegexp(COMMENT_TOKEN);
      if(parse==null) {
          return new ErrorToken(this.pos.clone(),M$("Not a comment"));
      } else {
        return new Token("comment",parse.parse,parse.startPos,parse.endPos);
      }
    }

    //else
    if(first=='"') {
      var str = "";
      var cont = true;
      do {
        var next = this.nextChar();
        if(next=='\\') {
          next = this.nextChar();
          if(next=='"') {
            str += '"';
          } else if(next=='n') {
            str += "\n";
          } else if(next=='r') {
            str += "\r";
          } else if(next=='t') {
            str += "\t";
          } else if(next=='\\') {
            str += "\\";
          } else {
            return new ErrorToken(this.pos.clone(),M$("Unexpected token '$0' after \\",next));
          }
        } else if(next!=null && next!='"') {
          str += next;
        } else if(next==null) {
          return new ErrorToken(startPos,M$("Unfinished string"));
        } else if(next=='"') {
          cont = false;
        }
      } while(cont);
      return new Token("string",str,startPos,this.pos.clone());
    }
    
    // (else) other cases
    this.putBack();
    var parse = this.searchRegexp(IDENT_TOKEN);
    if(parse!=null) {
      return new Token("ident",parse.parse,parse.startPos,parse.endPos);
    }

    if(result!=null) {
      return result;
    } else {
        return new ErrorToken(this.pos.clone(),M$("Unexpected '$0'",first));
    }
  };   
}

