import { IntegerValue as _IntegerValue,
         NumberValue as _NumberValue,
         RealValue as _RealValue,
         RationalValue as _RationalValue }
  from "./numericaltower101.mjs";
export const IntegerValue = _IntegerValue;
export const NumberValue = _NumberValue;
export const RealValue = _RealValue;
export const RationalValue = _RationalValue;

export function BoolValue(value) {
    this.value = value;
    this.type = "bool";
    
    this.isNumber = false;

    this.equal = function(other) {
        if(other==null || other==undefined) {
            return false;
        }
        if(other.type!="bool") {
            return false;
        }
        return other.value == this.value;
    }

    this.toHTML = function() {
        return '<span class="value">'+this.toString()+'<span class="tooltip">type <strong>bool</strong></span></span>';
    } 

    this.toString = function() {
        var str;
        if(this.value) {
            str = "#t";
        } else {
            str = "#f";
        }
        return str;
    }
}

export function StringValue(value) {
    this.value = value;
    this.type = "string";

    this.isNumber = false;

    this.equal = function(other) {
        if(other==null || other==undefined) {
            return false;
        }
        if(other.type!="string") {
            return false;
        }
        return other.value == this.value;
    }

    this.toHTML = function() {
        return '<span class="value">"'+this.value+'"<span class="tooltip">type <strong>string</strong></span></span>';
    } 

    this.toString = function() {
        return '"' + this.value + '"';
    }
}

export function VectorValue(value) {
    this.value = value;
    this.type = "vector";

    this.isNumber = false;

    this.equal = function(other) {
        if(other==null || other==undefined) {
            return false;
        }
        if(other.type!="vector") {
            return false;
        }
        if(other.value.length!= this.value.length) {
            return false;
        }
        for(var i=0; i<this.value.length; i++ ) {
            if ( ! other.value[i].equal(this.value[i])) {
                return false;
            }
        }
        return true;
    }

    this.toHTML = function() {
        var result = '<span class="value">[';
        for (var i=0; i<this.value.length ; i++) {
            result += this.value[i].toHTML() + ' ';
        }
        return result+']<span class="tooltip">type <strong>vecteur</strong></span></span>';
    } 

    this.toString = function() {
        var result = '[';
        for (var i=0; i<this.value.length ; i++) {
            result += this.value[i].toString() + ' ';
        }
        return result + ']';
    }
}

export function UnitValue() {
    this.type = "unit";

    this.isNumber = false;

    this.equal = function(other) {
        if(other==null || other==undefined) {
            return false;
        }
        if(other.type!="type") {
            return false;
        }
        return true;
    }

    this.toHTML = function() {
        return '';
    } 

    this.toString = function() {
        return "";
    }
}

export function SymbolValue(value) {
    this.value = value;
    this.type = "symbol";
    this.isNumber = false;
    
    this.equal = function(other) {
        if(other==null || other==undefined) {
            return false;
        }
        if(other.type!="symbol") {
            return false;
        }
        return other.value == this.value;
    }

    this.toHTML = function() {
        return '<span class="value">'+this.value+'<span class="tooltip">type <strong>symbol</strong></span></span>';
    } 
    
    this.toString = function() {
        return this.value;
    }
}


export function NilValue() {
    this.type = "nil";

    this.isNumber = false;

    this.equal = function(other) {
        if(other==null || other==undefined) {
            return false;
        }
        if(other.type!="nil") {
            return false;
        }
        return true;
    }

    this.copy = function() {
        return new NilValue();
    }

    this.toHTML = function() {
        return '<span class="value">()<span class="tooltip">type <strong>List[alpha]</strong></span></span>';
    } 

    this.toString = function() {
        return "()";
    }
}

export function PairValue(car,cdr) {
    this.type = "pair";
    this.isNumber = false;

    this.car = car;
    this.cdr = cdr;
    this.contentsToString = function() {
        var str = "";
        str += this.car;
        if(this.cdr.type=="nil") {
            return str;
        } else if(this.cdr.type=="pair") {
            return str+" "+this.cdr.contentsToString();
        } else { // cdr is a value
            return str+" . "+this.cdr.toString();
        }
    }

    this.equal = function(other) {
        if(other==null || other==undefined) {
            return false;
        }
        if(other.type!="pair") {
            return false;
        }
        return this.car.equal(other.car) && this.cdr.equal(other.cdr);
    }
    
    this.copy = function() {
        var car_copy = null;
        if (this.car.copy === undefined) {
            car_copy = this.car;
        } else {
            car_copy = this.car.copy();
        }
        var cdr_copy = this.cdr.copy();
        return new PairValue(car_copy, cdr_copy);
    }

    this.toString = function() {
        return "(" + this.contentsToString() + ")";
    }

    this.toHTML = function() {
        return '<span class="value">('+this.contentsToString()+')<span class="tooltip">type <strong>List</strong></span></span>';
    } 

}


// end of values.mjs
