
export const CanvasLib = {};
import { TypeFun, TypeReal } from "./type101.mjs";

CanvasLib.installPrimEnv = function(penv) {
  /* binary trees */
  penv.register("empty-image",new CanvasLib.primitiveEmptyImage());  
  penv.register("overlay",new CanvasLib.primitiveOverlay());  
  penv.register("draw-line",new CanvasLib.primitiveDrawLine());  
  penv.register("fill-triangle",new CanvasLib.primitiveFillTriangle());  
  penv.register("draw-ellipse",new CanvasLib.primitiveDrawEllipse());  
  penv.register("fill-ellipse",new CanvasLib.primitiveFillEllipse());   
  /* nouveaux noms */
    penv.register("image-vide",new CanvasLib.primitiveEmptyImage());  
    penv.register("superposition",new CanvasLib.primitiveOverlay());  
    penv.register("ligne",new CanvasLib.primitiveDrawLine());  
    penv.register("triangle",new CanvasLib.primitiveFillTriangle());  
    penv.register("ellipse-contour",new CanvasLib.primitiveDrawEllipse());   
    penv.register("contour-ellipse",new CanvasLib.primitiveDrawEllipse());  
    penv.register("ellipse",new CanvasLib.primitiveFillEllipse());  
};

// manque image-hauteur, image-largeur, quart-de-tour, symetrique, vignette

CanvasLib.TypeImage = function () {
  this.type = "Image";
  this.toString = function() {
    return "Image";
  }
  this.show = function() {
    return "image";  // for users
  }
  this.convert = function(other,mvars) {
    if(other.type=="Image") {
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
    return new CanvasLib.TypeImage();
  }
  this.normalize = function(mvars) {
    return new CanvasLib.TypeImage();
  }
};

CanvasLib.NbImages = 0;

CanvasLib.ImageValue = function(image) {
  this.type = "image";
  this.isNumber = false;
  this.image = image;
  this.id = CanvasLib.NbImages;
  CanvasLib.NbImages++;
  this.copyCount = 0;
  
  this.equal = function(other) {
    if(other==null || other==undefined) {
      return false;
    }
    if(other.type!="image") {
      return false;
    }
    return this.id==other.id; // id comparison
  }
  
  this.toString = function() {
    var str = "image"+this.id;
    return str;
  }
  
  this.contentToHTML = function() {
    this.divId = 'image'+this.id+'-'+this.copyCount;
    this.copyCount++;
    var html = '<div id="'+this.divId+'"></div>';
    this.image.containerId = this.divId;
    return html;
  }

  this.afterOutput = function() {
    this.image.draw();
  }    

  this.toHTML = function() {
    return '<span class="value">'+this.contentToHTML()+'<span class="tooltip">type <strong>Image</strong></span></span>';
  } 

};

// primitives

CanvasLib.primitiveEmptyImage = function() {
  this.typeRepr = new TypeFun(new Array(),new CanvasLib.TypeImage());
  
  this.arity = 0;
  this.nary = false;
  
  this.exec = function(evaluator,lexenv,expr,args) {
    
    return new CanvasLib.ImageValue(new CanvasLib.EmptyImage());
  }
  
}

CanvasLib.primitiveOverlay = function() {
    this.typeRepr = new TypeFun(new Array(new CanvasLib.TypeImage(),new CanvasLib.TypeImage()),new CanvasLib.TypeImage(),true);
  
  this.arity = 2;
  this.nary = true;
  
  this.exec = function(evaluator,lexenv,expr,args) {
      var image = new CanvasLib.EmptyImage();
      //console.log("args",args);
      for(var i=args.length-1;i>=0;i--) {
          if(args[i].type!="image") {
              return new PrimitiveError(expr.get(i+1),"overlay",args,M$("Expecting an image"));
          }
          image = new CanvasLib.OverlayImage(args[i].image,image);
      }

      return new CanvasLib.ImageValue(image);
  }
  
}

CanvasLib.primitiveDrawLine = function() {
  this.typeRepr = new TypeFun(new Array(new TypeReal(), new TypeReal(), new TypeReal(), new TypeReal()),new CanvasLib.TypeImage());
  
  this.arity = 4;
  this.nary = false;
  
  this.exec = function(evaluator,lexenv,expr,args) {
    
    return new CanvasLib.ImageValue(new CanvasLib.DrawLineImage("",args[0].value,args[1].value,args[2].value,args[3].value));
  }
  
}

CanvasLib.primitiveFillTriangle = function() {
  this.typeRepr = new TypeFun(new Array(new TypeReal(), new TypeReal(), new TypeReal(), new TypeReal(), new TypeReal(), new TypeReal()),new CanvasLib.TypeImage());
  
  this.arity = 6;
  this.nary = false;
  
  this.exec = function(evaluator,lexenv,expr,args) {
    
    return new CanvasLib.ImageValue(new CanvasLib.FillTriangleImage("",args[0].value,args[1].value,args[2].value,args[3].value,args[4].value,args[5].value));
  }
  
}

CanvasLib.primitiveDrawEllipse = function() {
  this.typeRepr = new TypeFun(new Array(new TypeReal(), new TypeReal(), new TypeReal(), new TypeReal()),new CanvasLib.TypeImage());
  
  this.arity = 4;
  this.nary = false;
  
  this.exec = function(evaluator,lexenv,expr,args) {
    
    return new CanvasLib.ImageValue(new CanvasLib.DrawEllipseImage("",args[0].value,args[1].value,args[2].value,args[3].value));
  }
  
}

CanvasLib.primitiveFillEllipse = function() {
  this.typeRepr = new TypeFun(new Array(new TypeReal(), new TypeReal(), new TypeReal(), new TypeReal()),new CanvasLib.TypeImage());
  
  this.arity = 4;
  this.nary = false;
  
  this.exec = function(evaluator,lexenv,expr,args) {
    
    return new CanvasLib.ImageValue(new CanvasLib.FillEllipseImage("",args[0].value,args[1].value,args[2].value,args[3].value));
  }
  
}

// canvas engine

CanvasLib.CANVAS_ID_COUNT = 0;
CanvasLib.DEFAULT_IMAGE_WIDTH = 200;
CanvasLib.DEFAULT_IMAGE_HEIGHT = 200;
CanvasLib.DEFAULT_DRAW_COLOR = "#000";
CanvasLib.DEFAULT_FILL_COLOR = "#9cf";

CanvasLib.genCanvasId = function() {
    return "image"+(CanvasLib.CANVAS_ID_COUNT++);
}

CanvasLib.ImageInfos = function(containerId, canvasId, width, height) {
    this.type = "imageInfos";
    this.containerId = containerId;
    this.canvasId = canvasId;
    this.width = width;
    this.height = height;
}

CanvasLib.prepareImage = function(containerId,width,height) {
    if(containerId==null) {
        throw "No container: please report";
    }
    var nwidth = width;
    if(nwidth==null) {
        nwidth = CanvasLib.DEFAULT_IMAGE_WIDTH;
    }
    var nheight = height;
    if(nheight==null) {
        nheight = CanvasLib.DEFAULT_IMAGE_HEIGHT;
    }

    var canvasId = CanvasLib.genCanvasId();
    
    $('#'+containerId).append('<canvas class="canvas101" id="'+canvasId+'" width='+nwidth+' height='+nheight+' /><br>');
        
    return new CanvasLib.ImageInfos(containerId, canvasId, nwidth, nheight);
}

CanvasLib.OverlayImage = function(image1, image2) {
    this.type = "image";
    this.containerId = image1.containerId;
    /*if(image2.containerId!=this.containerId) {
        throw "Wrong containers";
        }*/
    this.image1 = image1;
    this.image2 = image2;

    this.draw = function(canvasId,width,height) {
      this.image1.containerId = this.containerId;
      this.image2.containerId = this.containerId;
        var infos = this.image2.draw(canvasId,width,height);
        this.image1.draw(infos.canvasId,infos.width,infos.height);
        return infos;
    }
}

CanvasLib.EmptyImage = function(containerId) {
    this.type = "image";
    this.containerId = containerId;
    this.draw = function(canvasId,width,height) {
        var infos = new CanvasLib.ImageInfos(this.containerId,canvasId,width,height);
        if(canvasId==null) {
            infos = CanvasLib.prepareImage(this.containerId,width,height);
        }
        return infos;
    }
}

CanvasLib.normalizeX = function(x,width) {
    var nx = x;
    //if(nx<-1.0) nx = -1.0;
    //if(nx>1.0) nx = 1.0;
    var result = Math.round((nx+1.0)*(width/2.0));
    return result;
}

CanvasLib.normalizeY = function(y,height) {
    var ny = -y;
    //if(ny<-1.0) ny = -1.0;
    //if(ny>1.0) ny = 1.0;
    var result = Math.round((ny+1.0)*(height/2.0));
    return result;
}

CanvasLib.DrawLineImage = function(containerId, xx1, yy1, xx2, yy2, color) {
    this.type = "image";
    this.containerId = containerId;
    if(color==null) {
        this.color = CanvasLib.DEFAULT_DRAW_COLOR;
    } else {
        this.color = color;
    }
    this.draw = function(canvasId,width,height) {
        var infos = new CanvasLib.ImageInfos(this.containerId,canvasId,width,height);
        if(canvasId==null) {
            infos = CanvasLib.prepareImage(this.containerId,width,height);
        }
        
        // draw line
        $('#'+infos.canvasId).drawLine({
            strokeStyle : this.color,
            x1 : CanvasLib.normalizeX(xx1, infos.width),
            y1 : CanvasLib.normalizeY(yy1, infos.height),
            x2 : CanvasLib.normalizeX(xx2, infos.width),
            y2 : CanvasLib.normalizeY(yy2, infos.height)});
        
        return infos;
    }
}

CanvasLib.FillTriangleImage = function(containerId, xx1, yy1, xx2, yy2, xx3, yy3, color) {
    this.type = "image";
    this.containerId = containerId;
    if(color==null) {
        this.color = CanvasLib.DEFAULT_FILL_COLOR;
    } else {
        this.color = color;
    }
    this.draw = function(canvasId,width,height) {
        var infos = new CanvasLib.ImageInfos(this.containerId,canvasId,width,height);
        if(canvasId==null) {
            infos = CanvasLib.prepareImage(this.containerId,width,height);
        }
        
        // draw line
        $('#'+infos.canvasId).drawLine({
            strokeStyle : this.color,
            fillStyle : this.color,
            //shadowColor : "black",
            //shadowBlur : 3,
            //shadowX : 1,
            //shadowY : 1,
            x1 : CanvasLib.normalizeX(xx1, infos.width),
            y1 : CanvasLib.normalizeY(yy1, infos.height),
            x2 : CanvasLib.normalizeX(xx2, infos.width),
            y2 : CanvasLib.normalizeY(yy2, infos.height),
            x3 : CanvasLib.normalizeX(xx3, infos.width),
            y3 : CanvasLib.normalizeY(yy3, infos.height)});
        
        return infos;
    }
}

CanvasLib.DrawEllipseImage = function(containerId, xx1, yy1, xx2, yy2, color) {
    this.type = "image";
    this.containerId = containerId;
    if(color==null) {
        this.color = CanvasLib.DEFAULT_DRAW_COLOR;
    } else {
        this.color = color;
    }
    this.draw = function(canvasId,width,height) {
        var infos = new CanvasLib.ImageInfos(this.containerId,canvasId,width,height);
        if(canvasId==null) {
            infos = CanvasLib.prepareImage(this.containerId,width,height);
        }
        
        var x1 = 0;
        var x2 = 0;
        if(xx1<=xx2) {
            x1 = CanvasLib.normalizeX(xx1, infos.width); 
            x2 = CanvasLib.normalizeX(xx2, infos.width);
        } else {
            x1 = CanvasLib.normalizeX(xx2, infos.width); 
            x2 = CanvasLib.normalizeX(xx1, infos.width);
        } 
       
        var y1 = 0;
        var y2 = 0;
        if(yy1>=yy2) {
            y1 = CanvasLib.normalizeY(yy1, infos.height);
            y2 = CanvasLib.normalizeY(yy2, infos.height);
        } else {
            y1 = CanvasLib.normalizeY(yy2, infos.height);
            y2 = CanvasLib.normalizeY(yy1, infos.height);
        }
        //console.log("draw ellipse","x1",x1,"y1",y1,"x2",x2,"y2",y2);

        $('#'+infos.canvasId).drawEllipse({
            strokeStyle : this.color,
            x : x1,
            y : y1,
            width : (x2-x1),
            height : (y2-y1),
            fromCenter : false });
        
        return infos;
    }
}

CanvasLib.FillEllipseImage = function(containerId, xx1, yy1, xx2, yy2, color) {
    this.type = "image";
    this.containerId = containerId;
    if(color==null) {
        this.color = CanvasLib.DEFAULT_FILL_COLOR;
    } else {
        this.color = color;
    }
    this.draw = function(canvasId,width,height) {
        var infos = new CanvasLib.ImageInfos(this.containerId,canvasId,width,height);
        if(canvasId==null) {
            infos = CanvasLib.prepareImage(this.containerId,width,height);
        }
      
var x1 = 0;
        var x2 = 0;
        if(xx1<=xx2) {
            x1 = CanvasLib.normalizeX(xx1, infos.width); 
            x2 = CanvasLib.normalizeX(xx2, infos.width);
        } else {
            x1 = CanvasLib.normalizeX(xx2, infos.width); 
            x2 = CanvasLib.normalizeX(xx1, infos.width);
        } 
       
        var y1 = 0;
        var y2 = 0;
        if(yy1>=yy2) {
            y1 = CanvasLib.normalizeY(yy1, infos.height);
            y2 = CanvasLib.normalizeY(yy2, infos.height);
        } else {
            y1 = CanvasLib.normalizeY(yy2, infos.height);
            y2 = CanvasLib.normalizeY(yy1, infos.height);
        }
  
        $('#'+infos.canvasId).drawEllipse({
            strokeStyle : this.color,
            fillStyle : this.color,
            x : x1,
            y : y1,
            width : (x2-x1),
            height : (y2-y1),
            fromCenter : false });
        
        return infos;
    }
}
