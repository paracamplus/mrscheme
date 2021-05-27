export const TreeLib = {};
import { M$ } from './message101.mjs';
import { PrimitiveError } from './primerror.mjs';
import { TypeFun, TypeVariable, makeTypeBool, TypeList } from "./type101.mjs";
import { ECOTree } from "./ecotree.mjs";

TreeLib.installPrimEnv = function(penv) {
    /* binary trees */
    penv.register("ab-vide",new TreeLib.primitiveABEmpty());
    penv.register("ab-noeud",new TreeLib.primitiveABNode());
    penv.register("ab-etiquette",new TreeLib.primitiveABValue());
    penv.register("ab-gauche",new TreeLib.primitiveABLeft());
    penv.register("ab-droit",new TreeLib.primitiveABRight());
    penv.register("ab-noeud?",new TreeLib.primitiveABNodeP());
    penv.register("ab-affiche",new TreeLib.primitiveABDraw());

    /* general trees */
    penv.register(M$("ag-noeud").toString(),new TreeLib.primitiveAGNode());
    penv.register(M$("ag-etiquette").toString(),new TreeLib.primitiveAGValue());
    penv.register(M$("ag-foret").toString(),new TreeLib.primitiveAGForest());
    penv.register(M$("ag-affiche").toString(),new TreeLib.primitiveAGDraw());

    /* old names 
    penv.register("ab-draw",new TreeLib.primitiveABDraw());
    penv.register(M$("gt-node").toString(),new TreeLib.primitiveAGNode());
    penv.register(M$("gt-value").toString(),new TreeLib.primitiveAGValue());
    penv.register(M$("gt-forest").toString(),new TreeLib.primitiveAGForest());
    penv.register(M$("gt-draw").toString(),new TreeLib.primitiveAGDraw());
*/
    
};

/*** Binary trees ***/

TreeLib.TypeBEmpty = function () {
  this.type = "BEmpty";
  this.toString = function() {
    return "BEmpty";
  }
  this.show = function() {
    return "ab-vide";  // for users
  }
  this.convert = function(other,mvars) {
    if(other.type=="BEmpty" || other.type=="BTree") {
      return true;
    } else if(other.type=="Option") {
      return other.convert(this,mvars);
    } else if(other.type=="Sum") {
      return other.convert(this,mvars);
    } else if(other.type=="Var") {
      return mvars.convertVar(this,other.ref);
    } else {
      return false;
    }
  }
  this.updateVars = function(mvars,trans) {
    return new TreeLib.TypeBEmpty();
  }
  this.normalize = function(mvars) {
    return new TreeLib.TypeBEmpty();
  }
}

TreeLib.BTreeId = 0;

TreeLib.BEmptyValue = function() {
  this.type = "bempty";

    this.id = TreeLib.BTreeId;
    TreeLib.BTreeId++;
  this.isNumber = false;

  this.equal = function(other) {
    if(other==null || other==undefined) {
      return false;
    }
    if(other.type!="bempty") {
      return false;
    }
    return true;
  }

    this.copy = function() {
        return new TreeLib.BEmptyValue();
    }

  this.toHTML = function() {
      return '<span class="value">'+this.contentToHTML()+'<span class="tooltip">type <strong>'+M$('BEmpty').toString()+'</strong></span></span>';
  } 
  this.contentToHTML = function() {
    return "*ab-empty*";
  }

  this.toString = function() {
    return "*ab-empty*";
  }
};


TreeLib.BTreeValue = function(value,left,right) {
  this.type = "btree";
  this.isNumber = false;
    this.id = TreeLib.BTreeId;
    TreeLib.BTreeId++;
  
  this.value = value;
  this.left = left;
  this.right = right;

  this.equal = function(other) {
    if(other==null || other==undefined) {
      return false;
    }
    if(other.type!="btree") {
      return false;
    }
    return this.value.equal(other.value) && 
    this.left.equal(other.left) && this.right.equal(other.right);
  }
  
    this.copy = function() {
        return new TreeLib.BTreeValue(this.value,this.left.copy(),this.right.copy());
    }

  this.toString = function() {
      return "*"+M$("bin-tree").toString()+":"+this.id+"*";
  }

  this.contentToHTML = function() {
      return "*"+M$("bin-tree").toString()+":"+this.id+"*";
  }

  this.toHTML = function() {
    return '<span class="value">'+this.contentToHTML()+'<span class="tooltip">type <strong>'+M$('BTree').toString()+'</strong></span></span>';
  } 

};

TreeLib.BTreeViewId = 0;

TreeLib.BTreeView = function(btree) {
    this.type = "btreeview";
    this.isNumber = false;
    this.id = TreeLib.BTreeViewId;
    TreeLib.BTreeViewId++;

    this.btree = btree;
    
    this.equal = function(other) {
        return this===other;
    }

    this.toString = function() {
        return this.btree.toString();
    }

    this.contentToHTML = function() {
        return '<div class="btreeview" id="btreeview'+this.id+'"></div>';
    }

    this.maxBuild = 0;

    this.buildNode = function(treeview, parent, btree) {
        if(btree.type=="btree") {
            if(btree.id>this.maxBuild) {
                this.maxBuild=btree.id+1;
            }
            
            var label = "";
            var str = btree.value.toString();
            for(var i=0;(i<str.length) && (i<8);i++) {
                label+=str.charAt(i);
            }
          
            if(str.length>8) {
                label+="...";
            }
  
            treeview.add(btree.id,parent,label);
            this.buildNode(treeview,btree.id,btree.left);
            this.buildNode(treeview,btree.id,btree.right);
        } else if(btree.type=="bempty") {
            var id = this.maxBuild;
            this.maxBuild++;
            treeview.add(id,parent,"",10,10);
        } else {
            throw "not a binary tree (please report)";
        }
    }

    this.afterOutput = function() {
        var treeview = new ECOTree('btreeview','btreeview'+this.id);
        treeview.config.defaultNodeWidth = 64;
        treeview.config.defaultNodeHeight = 20;
        treeview.config.iLevelSeparation = 20;
        treeview.config.iSiblingSeparation = 20;
        treeview.config.iSubtreeSeparation = 40;
        treeview.linkType = "B";
        this.maxBuild = 0;
        this.buildNode(treeview,-1,this.btree);
        treeview.UpdateTree();
    }

    this.toHTML = function() {
        return '<span class="value">'+this.contentToHTML()+'<span class="tooltip">type <strong>'+M$('BTreeView').toString()+'</strong></span></span>';
    }
}

TreeLib.TypeBTree = function(elemType) {
  this.type = "BTree";
  this.elemType = elemType;
  this.toString = function() {
    return "BTree[" + this.elemType.toString() + "]";
  }
  this.show = function() {
    return "ArbreBinaire[" + this.elemType.show() + "]";
  }
  this.convert = function(other,mvars) {
    if(other.type=="BEmpty") {
      return this;
    } else if(other.type=="BTree") {
      return this.elemType.convert(other.elemType,mvars);
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
    return new TreeLib.TypeBTree(nelemType);
  }
  this.normalize = function(mvars) {
    var nelemType = this.elemType.normalize(mvars);
    return new TreeLib.TypeBTree(nelemType);
  }
};

TreeLib.TypeBTreeView = function() {
  this.type = "BTreeView";
  this.toString = function() {
      return "BTreeView";
  }
  this.show = function() {
      return "VisuArbreBinaire";
  }
  this.convert = function(other,mvars) {
    if(other.type=="BTreeView") {
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
    return new TreeLib.TypeBTreeView();
  }
  this.normalize = function(mvars) {
    return new TreeLib.TypeBTreeView();
  }
};


TreeLib.primitiveABEmpty = function() {
  this.typeRepr = new TypeFun(new Array(),new TreeLib.TypeBEmpty());
  
  this.arity = 0;
  this.nary = false;
  
    this.exec = function(evaluator,lexenv,expr,args) {
    
    return new TreeLib.BEmptyValue();
  }
  
}

TreeLib.primitiveABNode = function() {
  this.typeRepr = new TypeFun(new Array(new TypeVariable(0), new TreeLib.TypeBTree(new TypeVariable(0)), new TreeLib.TypeBTree(new TypeVariable(0)))
                              ,new TreeLib.TypeBTree(new TypeVariable(0)));
  
  this.arity = 3;
  this.nary = false;
  
  this.exec = function(evaluator,lexenv,expr,args) {
    if(args[1].type!="btree" && args[1].type!="bempty") {
      return new PrimitiveError(expr.get(1),"ab-noeud",args,"Not a binary tree");
    }     
    if(args[2].type!="btree" && args[2].type!="bempty") {
      return new PrimitiveError(expr.get(2),"ab-noeud",args,"Not a binary tree");
    }     

      return new TreeLib.BTreeValue(args[0],args[1].copy(),args[2].copy());
  }
  
}

TreeLib.primitiveABValue = function() {
  this.typeRepr = new TypeFun(new Array(new TreeLib.TypeBTree(new TypeVariable(0))),new TypeVariable(0));
  
  this.arity = 1;
  this.nary = false;
  
  this.exec = function(evaluator,lexenv,expr,args) {
    if(args[0].type!="btree") {
      return new PrimitiveError(expr.get(1),"ab-etiquette",args,"Not a binary tree node");
    }
    return args[0].value;
  }  
}

TreeLib.primitiveABLeft = function() {
  this.typeRepr = new TypeFun(new Array(new TreeLib.TypeBTree(new TypeVariable(0))),new TreeLib.TypeBTree(new TypeVariable(0)));
  
  this.arity = 1;
  this.nary = false;
  
  this.exec = function(evaluator,lexenv,expr,args) {
    if(args[0].type!="btree") {
      return new PrimitiveError(expr.get(1),"ab-gauche",args,"Not a binary tree node");
    }
    return args[0].left;
  }  
}

TreeLib.primitiveABRight = function() {
  this.typeRepr = new TypeFun(new Array(new TreeLib.TypeBTree(new TypeVariable(0))),new TreeLib.TypeBTree(new TypeVariable(0)));
  
  this.arity = 1;
  this.nary = false;
  
  this.exec = function(evaluator,lexenv,expr,args) {
    if(args[0].type!="btree") {
      return new PrimitiveError(expr.get(1),"ab-droit",args,"Not a binary tree node");
    }
    return args[0].right;
  }  
}

TreeLib.primitiveABNodeP = function() {
  this.typeRepr = new TypeFun(new Array(new TreeLib.TypeBTree(new TypeVariable(0))),makeTypeBool());
  
  this.arity = 1;
  this.nary = false;
  
  this.exec = function(evaluator,lexenv,expr,args) {

    if(args[0].type=="btree") {
      return new BoolValue(true);
    } else if(args[0].type=="bempty") {
      return new BoolValue(false);
    }
    return new PrimitiveError(expr.get(1),"ab-noeud?",args,"Not a binary tree");
  }  
}

TreeLib.primitiveABDraw = function() {
    this.typeRepr = new TypeFun(new Array(new TreeLib.TypeBTree(new TypeVariable(0))),new TreeLib.TypeBTreeView());
    
    this.arity = 1;
    this.nary = false;
  
  this.exec = function(evaluator,lexenv,expr,args) {

      if(args[0].type!="btree" && args[0].type!="bempty") {
          return new PrimitiveError(expr.get(1),"ab-affiche",args,"Not a binary tree");
      }

      return new TreeLib.BTreeView(args[0]);
  }  
}

/*** General (n-ary) trees ***/

TreeLib.GTreeId = 0;

TreeLib.GTreeValue = function(value,children) {
  this.type = "gtree";
  this.isNumber = false;
    this.id = TreeLib.GTreeId;
    TreeLib.GTreeId++;
    
  this.value = value;
  // represented as a scheme list
  this.children = children;

  this.equal = function(other) {
    if(other==null || other==undefined) {
      return false;
    }
    if(other.type!="gtree") {
      return false;
    }
    if(!this.value.equal(other.value)) {
      return false;
    }

    return this.children.equal(other.children);
  }

    this.copy = function() {
        var children_copy = this.children.copy();
        return new TreeLib.GTreeValue(this.value, children_copy);
    }

  this.toString = function() {
      return "*"+M$("gen-tree").toString()+":"+this.id+"*";
  }

  this.contentToHTML = function() {
      return "*"+M$("gen-tree").toString()+":"+this.id+"*";
  }

  this.toHTML = function() {
      return '<span class="value">'+this.contentToHTML()+'<span class="tooltip">type <strong>'+M$("GTree").toString()+'</strong></span></span>';
  } 

};

TreeLib.GTreeViewId = 0;

TreeLib.GTreeView = function(gtree) {
    this.type = "gtreeview";
    this.isNumber = false;
    this.id = TreeLib.GTreeViewId;
    TreeLib.GTreeViewId++;

    this.gtree = gtree;
    
    this.equal = function(other) {
        return this===other;
    }

    this.toString = function() {
        return this.gtree.toString();
    }

    this.contentToHTML = function() {
        return '<div class="gtreeview" id="gtreeview'+this.id+'"></div>';
    }

    this.maxBuild = 0;

    this.buildNode = function(treeview, parent,gtree) {
        if(gtree.type=="gtree") {
            if(gtree.id>this.maxBuild) {
                this.maxBuild=gtree.id+1;
            }

           var label = "";
            var str = gtree.value.toString();
            for(var i=0;(i<str.length) && (i<8);i++) {
                label+=str.charAt(i);
            }
            if(str.length>8) {
                label+="...";
            }
            
            treeview.add(gtree.id,parent,label);
            var forest = gtree.children;
            while(forest.type=="pair") {
                this.buildNode(treeview,gtree.id,forest.car);
                forest = forest.cdr;
            }
        } else {
            throw "not a general tree (please report)";
        }
    }

    this.afterOutput = function() {
        var treeview = new ECOTree('gtreeview','gtreeview'+this.id);
        treeview.config.defaultNodeWidth = 64;
        treeview.config.defaultNodeHeight = 20;
        treeview.config.iLevelSeparation = 20;
        treeview.config.iSiblingSeparation = 20;
        treeview.config.iSubtreeSeparation = 40;
        treeview.linkType = "B";
        this.maxBuild = 0;
        this.buildNode(treeview,-1,this.gtree);
        treeview.UpdateTree();
    }

    this.toHTML = function() {
        return '<span class="value">'+this.contentToHTML()+'<span class="tooltip">type <strong>'+M$("GTree").toString()+'</strong></span></span>';
    }
}

  
TreeLib.TypeGTree = function(elemType) {
  this.type = "GTree";
  this.elemType = elemType;
  this.toString = function() {
    return "GTree[" + this.elemType.toString() + "]";
  }
  this.show = function() {
    return "ArbreGeneral[" + this.elemType.show() + "]";
  }
  this.convert = function(other,mvars) {
    if(other.type=="GTree") {
      return this.elemType.convert(other.elemType,mvars);
    } else if(other.type=="Option") {
      return other.convert(this,mvars);
    } else if(other.type=="Sum") {
      return other.convert(this,mvars);
    } else if(other.type=="Var") {
      return mvars.convertVar(this,other.ref);
    } else {
      return false;
    }
  }
  this.updateVars = function(mvars,trans) {
    var nelemType = this.elemType.updateVars(mvars,trans);
    return new TreeLib.TypeGTree(nelemType);
  }
  this.normalize = function(mvars) {
    var nelemType = this.elemType.normalize(mvars);
    return new TreeLib.TypeGTree(nelemType);
  }
}

TreeLib.TypeGTreeView = function() {
  this.type = "GTreeView";
  this.toString = function() {
      return "GTreeView";
  }
  this.show = function() {
      return "VisuArbreBinaire";
  }
  this.convert = function(other,mvars) {
    if(other.type=="GTreeView") {
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
    return new TreeLib.TypeGTreeView();
  }
  this.normalize = function(mvars) {
    return new TreeLib.TypeGTreeView();
  }
};


TreeLib.primitiveAGNode = function() {
  this.typeRepr = new TypeFun(new Array(new TypeVariable(0), new TypeList(new TreeLib.TypeGTree(new TypeVariable(0))))
                              ,new TreeLib.TypeGTree(new TypeVariable(0)));
  
  this.arity = 2;
  this.nary = false;
  
    this.exec = function(evaluator,lexenv,expr,args) {
        if(args[1].type!="pair" && args[1].type!='nil') {
            return new PrimitiveError(expr.get(1),M$("gt-node").toString(),args,M$("Not a list"));
        }
        var npair = args[1].copy();
        var pair = npair;
        while(pair.type!="nil") {
            if(pair.car.type!='gtree') {
                return new PrimitiveError(expr.get(1),M$("gt-node").toString(),args,M$("Not a list of general trees"));
            }
            pair = pair.cdr;
        }
        return new TreeLib.GTreeValue(args[0],npair);
  }
  
}

TreeLib.primitiveAGValue = function() {
    this.typeRepr = new TypeFun(new Array(new TreeLib.TypeGTree(new TypeVariable(0))),new TypeVariable(0));
    
    this.arity = 1;
    this.nary = false;
    
    this.exec = function(evaluator, lexenv, expr,args) {
      if(args[0].type!="gtree") {
        return new PrimitiveError(expr.get(1),M$("gt-value").toString(),args,M$("Not a general tree node"));
    }
      return args[0].value;
  }  
}

TreeLib.primitiveAGForest = function() {
    this.typeRepr = new TypeFun(new Array(new TreeLib.TypeGTree(new TypeVariable(0))),new TypeList(new TreeLib.TypeGTree(new TypeVariable(0))));
    
    this.arity = 1;
    this.nary = false;
    
    this.exec = function(evaluator,lexenv,expr,args) {
        if(args[0].type!="gtree") {
            return new PrimitiveError(expr.get(1),M$("gt-forest").toString(),args,M$("Not a general tree node"));
        }
        return args[0].children;
  }  
}


TreeLib.primitiveAGDraw = function() {
    this.typeRepr = new TypeFun(new Array(new TreeLib.TypeGTree(new TypeVariable(0))),new TreeLib.TypeGTreeView());
    
    this.arity = 1;
    this.nary = false;
  
  this.exec = function(evaluator,lexenv,expr,args) {

      if(args[0].type!="gtree") {
          return new PrimitiveError(expr.get(1),M$("gt-draw").toString(),args,M$("Not a general tree"));
      }
      
      return new TreeLib.GTreeView(args[0]);
  }  
}
