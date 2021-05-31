
import { M$ } from './message101.mjs';

export function PrimitiveError(expr,name,args,msg) {
    this.type = "evalError";
    this.startPos = expr.startPos;
    this.endPos = expr.endPos;
    this.expr = expr;
    this.primName = name;
    this.args = args;
    this.message = msg;

    this.toString = function() {
        var str = "Primitive '"+this.primName+"' error: from (line "+expr.startPos.lpos+", col "+expr.startPos.cpos+") to (line "+expr.endPos.lpos+", col "+expr.endPos.cpos+')\n';
        str = str + "  ==> " + this.message + "\n";
        return str;
    }

    this.toHTML = function() {
        return '<span class="error"><strong>'+M$("Primitive '$0' Error",this.primName).toString()+'</strong>: '+this.message+'</span>';
    }

}

// end of primerror.mjs
