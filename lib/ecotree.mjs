
import { jQuery } from './jquerylight.mjs';

/*-------------------------------------------------------------------------------------------
 |     ECOTree.js
 |--------------------------------------------------------------------------------------------
 | (c) 2006 Emilio Cortegoso Lobato
 |
 |     ECOTree is a javascript component for tree drawing. It implements the node positioning
 |     algorithm of John Q. Walker II "Positioning nodes for General Trees".
 |
 |     Basic features include:
 |       - Layout features: Different node sizes, colors, link types, alignments, separations
 |                          root node positions, etc...
 |       - Nodes can include a title and an hyperlink, and a hidden metadata.
 |       - Subtrees can be collapsed and expanded at will.
 |       - Single and Multiple selection modes.
 |       - Search nodes using title and metadata as well.
 |
 |     This code is free source, but you will be kind if you don't distribute modified versions
 |     with the same name, to avoid version collisions. Otherwise, please hack it!
 |
 |     References:
 |
 |     Walker II, J. Q., "A Node-Positioning Algorithm for General Trees"
 |                      Software — Practice and Experience 10, 1980 553-561.
 |                      (Obtained from C++ User's journal. Feb. 1991)
 |
 |     Last updated: June 21, 2010, Bob Good
 |     Version: 1.5 - Couple of more Firefox issues with text offset
 |
 |     Last updated: June 21, 2010, Bob Good
 |     Version: 1.4 - fixed some FireFox issues
 |
 |     Last updated: June 4, 2010, Bob Good
 |     Version: 1.3 - fixed color problem caused by "change all" ECOlor => eColor
 |
 |     Last updated: May 11, 2010, Bob Good
 |     Version: 1.2 - added thirdwalk correction factors because was drawing nodes off the screen
 |
 |     Last updated: October 26th, 2006
 |     Version: 1.0
 |
 |   Modifications from version 1.5 made July 15, 2010 by
 |      Kevin Dorff of the
 |          Institute for Computational Biomedicine
 |          Weill Cornell Medical College
 |      http://icb.med.cornell.edu
 |
 |   Original code from:
 |      http://www.codeproject.com/KB/scripting/graphic_javascript_tree.aspx
 |
 |   Changes from 1.5
 |     * Requires jQuery (tested with 1.4.2)
 |     * Requires excanvas (tested with r3, assuming you want to support Internet Explorer)
 |     * Now that you can use Canvas in IE (with excanvas), Firefox, Chrome, Safari,
 |       this code ONLY supports rendering to Canvas (removed VML).
 |       It is possible this version won't work properly with old browsers, as it has
 |       not been extensively tested.
 |     * When adding a node, if you specify a width or height of -1 it will
 |       "measure" the text and size the box and size it accordingly
 |     * Size the div surrounding the canvas so it fit the constraints
 |       of the visible graph and hide the overflow
 |     * Ability to specify the radius of the node corners via config.nodeRadius
 |     * Reformatted code (braces and such).
 |
 \------------------------------------------------------------------------------------------*/
 
const ECONode = function (id, pid, dsc, w, h, c, bc, target, meta) {
    this.id = id;
    this.pid = pid;
    this.dsc = dsc;
    this.w = w;
    this.h = h;
    this.c = c;
    this.bc = bc;
    this.target = target;
    this.meta = meta;
 
    this.siblingIndex = 0;
    this.dbIndex = 0;
 
    this.XPosition = 0;
    this.YPosition = 0;
    this.prelim = 0;
    this.modifier = 0;
    this.leftNeighbor = null;
    this.rightNeighbor = null;
    this.nodeParent = null;
    this.nodeChildren = [];
 
    this.isCollapsed = false;
    this.canCollapse = false;
 
    this.isSelected = false;
}
 
ECONode.prototype._getLevel = function () {
    if (this.nodeParent.id == -1) {
        return 0;
    }
    else return this.nodeParent._getLevel() + 1;
}
 
ECONode.prototype._isAncestorCollapsed = function () {
    if (this.nodeParent.isCollapsed) {
        return true;
    } else {
        if (this.nodeParent.id == -1) {
            return false;
        } else {
            return this.nodeParent._isAncestorCollapsed();
        }
    }
}
 
ECONode.prototype._setAncestorsExpanded = function () {
    if (this.nodeParent.id == -1) {
        return;
    } else {
        this.nodeParent.isCollapsed = false;
        return this.nodeParent._setAncestorsExpanded();
    }
}
 
ECONode.prototype._getChildrenCount = function () {
    if (this.isCollapsed) {
        return 0;
    }
    if (this.nodeChildren == null) {
        return 0;
    } else {
        return this.nodeChildren.length;
    }
}
 
ECONode.prototype._getLeftSibling = function () {
    if (this.leftNeighbor != null && this.leftNeighbor.nodeParent == this.nodeParent) {
        return this.leftNeighbor;
    } else {
        return null;
    }
}
 
ECONode.prototype._getRightSibling = function () {
    if (this.rightNeighbor != null && this.rightNeighbor.nodeParent == this.nodeParent) {
        return this.rightNeighbor;
    } else {
        return null;
    }
}
 
ECONode.prototype._getChildAt = function (i) {
    return this.nodeChildren[i];
}
 
ECONode.prototype._getChildrenCenter = function (tree) {
    const node = this._getFirstChild();
    const node1 = this._getLastChild();
    return node.prelim + ((node1.prelim - node.prelim) + tree._getNodeSize(node1)) / 2;
}
 
ECONode.prototype._getFirstChild = function () {
    return this._getChildAt(0);
}
 
ECONode.prototype._getLastChild = function () {
    return this._getChildAt(this._getChildrenCount() - 1);
}
 
ECONode.prototype._drawChildrenLinks = function (tree) {
    var s = [];
    var xa = 0, ya = 0, xb = 0, yb = 0, xc = 0, yc = 0, xd = 0, yd = 0;
    var node1 = null;
 
    switch (tree.config.iRootOrientation) {
        case ECOTree.RO_TOP:
            xa = this.XPosition + (this.w / 2);
            ya = this.YPosition + this.h;
            break;
 
        case ECOTree.RO_BOTTOM:
            xa = this.XPosition + (this.w / 2);
            ya = this.YPosition;
            break;
 
        case ECOTree.RO_RIGHT:
            xa = this.XPosition;
            ya = this.YPosition + (this.h / 2);
            break;
 
        case ECOTree.RO_LEFT:
            xa = this.XPosition + this.w;
            ya = this.YPosition + (this.h / 2);
            break;
    }
 
    for (var k = 0; k < this.nodeChildren.length; k++) {
        node1 = this.nodeChildren[k];
 
        switch (tree.config.iRootOrientation) {
            case ECOTree.RO_TOP:
                xd = xc = node1.XPosition + (node1.w / 2);
                yd = node1.YPosition;
                xb = xa;
                switch (tree.config.iNodeJustification) {
                    case ECOTree.NJ_TOP:
                        yb = yc = yd - tree.config.iLevelSeparation / 2;
                        break;
                    case ECOTree.NJ_BOTTOM:
                        yb = yc = ya + tree.config.iLevelSeparation / 2;
                        break;
                    case ECOTree.NJ_CENTER:
                        yb = yc = ya + (yd - ya) / 2;
                        break;
                }
                break;
 
            case ECOTree.RO_BOTTOM:
                xd = xc = node1.XPosition + (node1.w / 2);
                yd = node1.YPosition + node1.h;
                xb = xa;
                switch (tree.config.iNodeJustification) {
                    case ECOTree.NJ_TOP:
                        yb = yc = yd + tree.config.iLevelSeparation / 2;
                        break;
                    case ECOTree.NJ_BOTTOM:
                        yb = yc = ya - tree.config.iLevelSeparation / 2;
                        break;
                    case ECOTree.NJ_CENTER:
                        yb = yc = yd + (ya - yd) / 2;
                        break;
                }
                break;
 
            case ECOTree.RO_RIGHT:
                xd = node1.XPosition + node1.w;
                yd = yc = node1.YPosition + (node1.h / 2);
                yb = ya;
                switch (tree.config.iNodeJustification) {
                    case ECOTree.NJ_TOP:
                        xb = xc = xd + tree.config.iLevelSeparation / 2;
                        break;
                    case ECOTree.NJ_BOTTOM:
                        xb = xc = xa - tree.config.iLevelSeparation / 2;
                        break;
                    case ECOTree.NJ_CENTER:
                        xb = xc = xd + (xa - xd) / 2;
                        break;
                }
                break;
 
            case ECOTree.RO_LEFT:
                xd = node1.XPosition;
                yd = yc = node1.YPosition + (node1.h / 2);
                yb = ya;
                switch (tree.config.iNodeJustification) {
                    case ECOTree.NJ_TOP:
                        xb = xc = xd - tree.config.iLevelSeparation / 2;
                        break;
                    case ECOTree.NJ_BOTTOM:
                        xb = xc = xa + tree.config.iLevelSeparation / 2;
                        break;
                    case ECOTree.NJ_CENTER:
                        xb = xc = xa + (xd - xa) / 2;
                        break;
                }
                break;
        }
 
        // Canvas Rendering
        tree.ctx.save();
        tree.ctx.strokeStyle = tree.config.linkColor;
        tree.ctx.beginPath();
        switch (tree.config.linkType) {
            case "M":
                tree.ctx.moveTo(xa, ya);
                tree.ctx.lineTo(xb, yb);
                tree.ctx.lineTo(xc, yc);
                tree.ctx.lineTo(xd, yd);
                break;
 
            case "B":
                tree.ctx.moveTo(xa, ya);
                tree.ctx.bezierCurveTo(xb, yb, xc, yc, xd, yd);
                break;
        }
        tree.ctx.stroke();
        tree.ctx.restore();
    }
 
    return s.join('');
}
 
export const ECOTree = function (obj, elm) {
    this.config = {
        iMaxDepth : 100,
        iLevelSeparation : 40,
        iSiblingSeparation : 40,
        iSubtreeSeparation : 80,
        iRootOrientation : ECOTree.RO_TOP,
        iNodeJustification : ECOTree.NJ_TOP,
        topXCorrection : 0,
        topYCorrection : 0,
        topXAdjustment : 0,
        topYAdjustment : 0,
        linkType : "M",
        linkColor : "blue",
        nodeColor : "#CCCCFF",
        nodeFill : ECOTree.NF_GRADIENT,
        nodeBorderColor : "blue",
        nodeSelColor : "#FFFFCC",
        nodeRadius : 5,
        levelColors : ["#5555FF","#8888FF","#AAAAFF","#CCCCFF"],
        levelBorderColors : ["#5555FF","#8888FF","#AAAAFF","#CCCCFF"],
        colorStyle : ECOTree.CS_NODE,
        useTarget : true,
        searchMode : ECOTree.SM_DSC,
        selectMode : ECOTree.SL_MULTIPLE,
        defaultNodeWidth : 80,
        defaultNodeHeight : 40,
        defaultTarget : 'javascript:void(0);',
        //expandedImage : './img/less.gif',
        //collapsedImage : './img/plus.gif',
        //transImage : './img/trans.gif'
    };
 
    //if (jQuery("#eco_tree_ruler_span").length == 0) {
    if ( !jQuery("#eco_tree_ruler_span") ) {
        const b = jQuery("#EvaluationResults");
        const span = jQuery.createElement('span', {
            id: 'eco_tree_ruler_span',
            'class': 'econode',
            'style': 'visibility:hidden' });
        b.append(span);
        //b.append("<span id='eco_tree_ruler_span' class='econode' style='visibility:hidden'></span>");
    }
 
    this.version = "1.5-icb";
    this.obj = obj;
    this.treeContainer = jQuery("#" + elm);
    this.__elm__ = elm; // QNC
    this.self = this;
 
    this.ctx = null;
    this.canvasoffsetTop = 0;
    this.canvasoffsetLeft = 0;
 
    this.chartHeight = -1;
    this.chartWidth = -1;
 
    this.maxLevelHeight = [];
    this.maxLevelWidth = [];
    this.previousLevelNode = [];
 
    this.rootYOffset = 0;
    this.rootXOffset = 0;
 
    this.nDatabaseNodes = [];
    this.mapIDs = {};
 
    this.root = new ECONode(-1, null, null, 2, 2);
    this.iSelectedNode = -1;
    this.iLastSearch = 0;
 
}
 
//Constant values
 
//Tree orientation
ECOTree.RO_TOP = 0;
ECOTree.RO_BOTTOM = 1;
ECOTree.RO_RIGHT = 2;
ECOTree.RO_LEFT = 3;
 
//Level node alignment
ECOTree.NJ_TOP = 0;
ECOTree.NJ_CENTER = 1;
ECOTree.NJ_BOTTOM = 2;
 
//Node fill type
ECOTree.NF_GRADIENT = 0;
ECOTree.NF_FLAT = 1;
 
//Colorizing style
ECOTree.CS_NODE = 0;
ECOTree.CS_LEVEL = 1;
 
//Search method: Title, metadata or both
ECOTree.SM_DSC = 0;
ECOTree.SM_META = 1;
ECOTree.SM_BOTH = 2;
 
//Selection mode: single, multiple, no selection
ECOTree.SL_MULTIPLE = 0;
ECOTree.SL_SINGLE = 1;
ECOTree.SL_NONE = 2;
 
//CANVAS functions...
ECOTree._roundedRect = function (ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x, y + radius);
    ctx.lineTo(x, y + height - radius);
    ctx.quadraticCurveTo(x, y + height, x + radius, y + height);
    ctx.lineTo(x + width - radius, y + height);
    ctx.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
    ctx.lineTo(x + width, y + radius);
    ctx.quadraticCurveTo(x + width, y, x + width - radius, y);
    ctx.lineTo(x + radius, y);
    ctx.quadraticCurveTo(x, y, x, y + radius);
    ctx.fill();
    ctx.stroke();
}
 
ECOTree._canvasNodeClickHandler = function (tree, target, nodeid) {
    if (target != nodeid) {
        return;
    }
    tree.selectNode(nodeid, true);
}
 
//Layout algorithm
ECOTree._firstWalk = function (tree, node, level) {
    var leftSibling = null;
 
    node.XPosition = 0;
    node.YPosition = 0;
    node.prelim = 0;
    node.modifier = 0;
    node.leftNeighbor = null;
    node.rightNeighbor = null;
    tree._setLevelHeight(node, level);
    tree._setLevelWidth(node, level);
    tree._setNeighbors(node, level);
    if (node._getChildrenCount() == 0 || level == tree.config.iMaxDepth) {
        leftSibling = node._getLeftSibling();
        if (leftSibling != null) {
            node.prelim = leftSibling.prelim + tree._getNodeSize(leftSibling) + tree.config.iSiblingSeparation;
        } else {
            node.prelim = 0;
        }
    } else {
        var n = node._getChildrenCount();
        for (var i = 0; i < n; i++) {
            var iChild = node._getChildAt(i);
            ECOTree._firstWalk(tree, iChild, level + 1);
        }
 
        var midPoint = node._getChildrenCenter(tree);
        midPoint -= tree._getNodeSize(node) / 2;
        leftSibling = node._getLeftSibling();
        if (leftSibling != null) {
            node.prelim = leftSibling.prelim + tree._getNodeSize(leftSibling) + tree.config.iSiblingSeparation;
            node.modifier = node.prelim - midPoint;
            ECOTree._apportion(tree, node, level);
        } else {
            node.prelim = midPoint;
        }
    }
}
 
ECOTree._apportion = function (tree, node, level) {
    var firstChild = node._getFirstChild();
    var firstChildLeftNeighbor = firstChild.leftNeighbor;
    var j = 1;
    for (var k = tree.config.iMaxDepth - level; firstChild != null && firstChildLeftNeighbor != null && j <= k;) {
        var modifierSumRight = 0;
        var modifierSumLeft = 0;
        var rightAncestor = firstChild;
        var leftAncestor = firstChildLeftNeighbor;
        for (var l = 0; l < j; l++) {
            rightAncestor = rightAncestor.nodeParent;
            leftAncestor = leftAncestor.nodeParent;
            modifierSumRight += rightAncestor.modifier;
            modifierSumLeft += leftAncestor.modifier;
        }
 
        var totalGap = (firstChildLeftNeighbor.prelim + modifierSumLeft +
                        tree._getNodeSize(firstChildLeftNeighbor) + tree.config.iSubtreeSeparation) -
                       (firstChild.prelim + modifierSumRight);
        if (totalGap > 0) {
            var subtreeAux = node;
            var numSubtrees = 0;
            for (; subtreeAux != null && subtreeAux != leftAncestor; subtreeAux = subtreeAux._getLeftSibling()) {
                numSubtrees++;
            }
 
            if (subtreeAux != null) {
                var subtreeMoveAux = node;
                var singleGap = totalGap / numSubtrees;
                for (; subtreeMoveAux != leftAncestor; subtreeMoveAux = subtreeMoveAux._getLeftSibling()) {
                    subtreeMoveAux.prelim += totalGap;
                    subtreeMoveAux.modifier += totalGap;
                    totalGap -= singleGap;
                }
            }
        }
        j++;
        if (firstChild._getChildrenCount() == 0) {
            firstChild = tree._getLeftmost(node, 0, j);
        } else {
            firstChild = firstChild._getFirstChild();
        }
        if (firstChild != null) {
            firstChildLeftNeighbor = firstChild.leftNeighbor;
        }
    }
}
 
ECOTree._secondWalk = function (tree, node, level, X, Y) {
    if (level <= tree.config.iMaxDepth) {
        var xTmp = tree.rootXOffset + node.prelim + X;
        var yTmp = tree.rootYOffset + Y;
        var maxsizeTmp = 0;
        var nodesizeTmp = 0;
        var corrTmp = 0;
        var flag = false;
 
        switch (tree.config.iRootOrientation) {
            case ECOTree.RO_TOP:
            case ECOTree.RO_BOTTOM:
                maxsizeTmp = tree.maxLevelHeight[level];
                nodesizeTmp = node.h;
                break;
 
            case ECOTree.RO_RIGHT:
            case ECOTree.RO_LEFT:
                maxsizeTmp = tree.maxLevelWidth[level];
                flag = true;
                nodesizeTmp = node.w;
                break;
        }
        switch (tree.config.iNodeJustification) {
            case ECOTree.NJ_TOP:
                node.XPosition = xTmp;
                node.YPosition = yTmp;
                break;
 
            case ECOTree.NJ_CENTER:
                node.XPosition = xTmp;
                node.YPosition = yTmp + (maxsizeTmp - nodesizeTmp) / 2;
                break;
 
            case ECOTree.NJ_BOTTOM:
                node.XPosition = xTmp;
                node.YPosition = (yTmp + maxsizeTmp) - nodesizeTmp;
                break;
        }
        if (flag) {
            var swapTmp = node.XPosition;
            node.XPosition = node.YPosition;
            node.YPosition = swapTmp;
        }
        switch (tree.config.iRootOrientation) {
            case ECOTree.RO_BOTTOM:
                node.YPosition = -node.YPosition - nodesizeTmp;
                break;
 
            case ECOTree.RO_RIGHT:
                node.XPosition = -node.XPosition - nodesizeTmp;
                break;
        }
        if (node._getChildrenCount() != 0) {
            ECOTree._secondWalk(tree, node._getFirstChild(), level + 1, X + node.modifier,
                    Y + maxsizeTmp + tree.config.iLevelSeparation);
        }
        var rightSibling = node._getRightSibling();
        if (rightSibling != null) {
            ECOTree._secondWalk(tree, rightSibling, level, X, Y);
        }
 
        // adjust for large tree, where "left:' offset has gone negative (off the screen)
        if (node.XPosition < 0) {
            corrTmp = 0 - node.XPosition;
            if (corrTmp > tree.config.topXCorrection) {
                tree.config.topXCorrection = corrTmp;
            }
        }
 
        // adjust for large tree, where "top:' offset has gone negative (off the screen)
        if (node.YPosition < 0) {
            corrTmp = 0 - node.YPosition;
            if (corrTmp > tree.config.topYCorrection) {
                tree.config.topYCorrection = corrTmp;
            }
        }
    }
}
 

ECOTree._thirdWalk = function (tree, node, level) {
    if (level <= tree.config.iMaxDepth) {
        node.XPosition = node.XPosition + tree.config.topXCorrection;
        node.YPosition = node.YPosition + tree.config.topYCorrection;
 
        if (node._getChildrenCount() != 0) {
            ECOTree._thirdWalk(tree, node._getFirstChild(), level + 1);
        }
 
        var rightSibling = node._getRightSibling();
        if (rightSibling != null) {
            ECOTree._thirdWalk(tree, rightSibling, level);
        }
    }
}
 
ECOTree.prototype._positionTree = function () {
    this.maxLevelHeight = [];
    this.maxLevelWidth = [];
    this.previousLevelNode = [];
 
    ECOTree._firstWalk(this.self, this.root, 0);
 
    switch (this.config.iRootOrientation) {
        case ECOTree.RO_TOP:
        case ECOTree.RO_LEFT:
            this.rootXOffset = this.config.topXAdjustment + this.root.XPosition;
            this.rootYOffset = this.config.topYAdjustment + this.root.YPosition;
            break;
 
        case ECOTree.RO_BOTTOM:
        case ECOTree.RO_RIGHT:
            this.rootXOffset = this.config.topXAdjustment + this.root.XPosition;
            this.rootYOffset = this.config.topYAdjustment + this.root.YPosition;
    }
 
    this.config.topXCorrection = 0;
    this.config.topYCorrection = 0;
    ECOTree._secondWalk(this.self, this.root, 0, 0, 0);
 
    // Adjust for very large trees off of the screen
 
    if ((this.config.topXCorrection > 0) || (this.config.topYCorrection > 0)) {
        ECOTree._thirdWalk(this.self, this.root, 0);
    }
}
 
ECOTree.prototype._setLevelHeight = function (node, level) {
    if (this.maxLevelHeight[level] == null) {
        this.maxLevelHeight[level] = 0;
    }
    if (this.maxLevelHeight[level] < node.h) {
        this.maxLevelHeight[level] = node.h;
    }
}
 
ECOTree.prototype._setLevelWidth = function (node, level) {
    if (this.maxLevelWidth[level] == null) {
        this.maxLevelWidth[level] = 0;
    }
    if (this.maxLevelWidth[level] < node.w) {
        this.maxLevelWidth[level] = node.w;
    }
}
 
ECOTree.prototype._setNeighbors = function(node, level) {
    node.leftNeighbor = this.previousLevelNode[level];
    if (node.leftNeighbor != null) {
        node.leftNeighbor.rightNeighbor = node;
    }
    this.previousLevelNode[level] = node;
}
 
ECOTree.prototype._getNodeSize = function (node) {
    switch (this.config.iRootOrientation) {
        case ECOTree.RO_TOP:
        case ECOTree.RO_BOTTOM:
            return node.w;
 
        case ECOTree.RO_RIGHT:
        case ECOTree.RO_LEFT:
            return node.h;
    }
    return 0;
}
 
ECOTree.prototype._getLeftmost = function (node, level, maxlevel) {
    if (level >= maxlevel) {
        return node;
    }
    if (node._getChildrenCount() == 0) {
        return null;
    }
 
    var n = node._getChildrenCount();
    for (var i = 0; i < n; i++) {
        var iChild = node._getChildAt(i);
        var leftmostDescendant = this._getLeftmost(iChild, level + 1, maxlevel);
        if (leftmostDescendant != null) {
            return leftmostDescendant;
        }
    }
 
    return null;
}
 
ECOTree.prototype._selectNodeInt = function (dbindex, flagToggle) {
    if (this.config.selectMode == ECOTree.SL_SINGLE) {
        if ((this.iSelectedNode != dbindex) && (this.iSelectedNode != -1)) {
            this.nDatabaseNodes[this.iSelectedNode].isSelected = false;
        }
        this.iSelectedNode = (this.nDatabaseNodes[dbindex].isSelected && flagToggle) ? -1 : dbindex;
    }
    this.nDatabaseNodes[dbindex].isSelected = (flagToggle) ? !this.nDatabaseNodes[dbindex].isSelected : true;
}
 
ECOTree.prototype._collapseAllInt = function (flag) {
    var node = null;
    for (var n = 0; n < this.nDatabaseNodes.length; n++) {
        node = this.nDatabaseNodes[n];
        if (node.canCollapse) {
            node.isCollapsed = flag;
        }
    }
    this.UpdateTree();
}
 
ECOTree.prototype._selectAllInt = function (flag) {
    var node = null;
    for (var k = 0; k < this.nDatabaseNodes.length; k++) {
        node = this.nDatabaseNodes[k];
        node.isSelected = flag;
    }
    this.iSelectedNode = -1;
    this.UpdateTree();
}
 
ECOTree.prototype._drawTree = function () {
    var s = [];
    var node = null;
    var color = "";
    var border = "";
 
    for (var n = 0; n < this.nDatabaseNodes.length; n++) {
        node = this.nDatabaseNodes[n];
 
        switch (this.config.colorStyle) {
            case ECOTree.CS_NODE:
                color = node.c;
                border = node.bc;
                break;
            case ECOTree.CS_LEVEL:
                var iColor = node._getLevel() % this.config.levelColors.length;
                color = this.config.levelColors[iColor];
                iColor = node._getLevel() % this.config.levelBorderColors.length;
                border = this.config.levelBorderColors[iColor];
                break;
        }
 
        if (!node._isAncestorCollapsed()) {
            // Canvas rendering
            this.ctx.save();
            this.ctx.strokeStyle = border;
            switch (this.config.nodeFill) {
                case ECOTree.NF_GRADIENT:
                    var lgradient = this.ctx.createLinearGradient(node.XPosition, 0, node.XPosition + node.w, 0);
                    lgradient.addColorStop(0.0, ((node.isSelected) ? this.config.nodeSelColor : color));
                    lgradient.addColorStop(1.0, "#F5FFF5");
                    this.ctx.fillStyle = lgradient;
                    break;
 
                case ECOTree.NF_FLAT:
                    this.ctx.fillStyle = ((node.isSelected) ? this.config.nodeSelColor : color);
                    break;
            }
 
            ECOTree._roundedRect(this.ctx, node.XPosition, node.YPosition, node.w, node.h, this.config.nodeRadius);
            this.ctx.restore();
 
            //HTML elements for text ... DIVs to be placed over the Canvas
            s.push('<div id="' + node.id + '" class="econode" style="position:absolute;top:' + (node.YPosition + this.canvasoffsetTop) + 'px; left:' + (node.XPosition + this.canvasoffsetLeft) + 'px; width:' + node.w + '; height:' + node.h + ';z-index:100;" ');

            if (this.config.selectMode != ECOTree.SL_NONE) {
                // QNC useless:
                //s.push('onclick="javascript:ECOTree._canvasNodeClickHandler(' + this.obj + ',event.target.id,\'' + node.id + '\');" ');
            }
            s.push('>');
            s.push('<font face=Verdana size=1>');
            // if (node.canCollapse) {
            //     s.push('<a id="c' + node.id + '" href="javascript:' + this.obj + '.collapseNode(\'' + node.id + '\', true);" >');
            //     s.push('<img border=0 src="' + ((node.isCollapsed) ? this.config.collapsedImage : this.config.expandedImage) + '" >');
            //     s.push('</a>');
            //     s.push('<img src="' + this.config.transImage + '" >');
            // }
            if (node.target && this.config.useTarget) {
                s.push('<a id="t' + node.id + '" href="' + node.target + '">');
                s.push(node.dsc);
                s.push('</a>');
            } else {
                s.push(node.dsc);
            }
            s.push('</font>');
            s.push('</div>');

            if (!node.isCollapsed) {
                s.push(node._drawChildrenLinks(this.self));
            }
        }
    }
    return s.join('');
}
 
ECOTree.prototype._calcWidthAndHeight = function () {
 
    this.chartWidth = 0;
    this.chartHeight = 0;
 
    for (var n = 0; n < this.nDatabaseNodes.length; n++) {
        let node = this.nDatabaseNodes[n];
 
        if (!node._isAncestorCollapsed()) {
            this.chartWidth = Math.max(this.chartWidth, node.XPosition + node.w);
            this.chartHeight = Math.max(this.chartHeight, node.YPosition + node.h);
        }
    }
    this.chartWidth += 2;
    this.chartHeight += 2;
}
 
// ECOTree API begins here...
 
ECOTree.prototype.UpdateTree = function () {
 
    // Empty the tree container so we can refill it
    this.treeContainer.empty();
 
    this._positionTree();
    this._calcWidthAndHeight();
 
    // Set the size on the tree container
    this.treeContainer.css({
        'position': 'relative',
        'width': this.chartWidth,
        'height': this.chartHeight,
        'overflow': 'hidden'
    });
 
    // Make the <canvas> element.
    var canvas = document.createElement('canvas');
    jQuery(canvas).attr('width', this.chartWidth)
        .attr('height', this.chartHeight)
        .attr('id', 'ECOTreecanvas_' + this.__elm__)
        .appendTo(this.treeContainer);

    //jQuery(canvas).attr('width', 2000).attr('height', 7000).attr('id', 'ECOTreecanvas').appendTo(this.treeContainer);
    if (jQuery.browser.msie) {
        // For Internet Explorer, have excanvas initialize the canvas method
        canvas = G_vmlCanvasManager.initElement(canvas);
    }
 
    if (canvas && canvas.getContext) {
        this.ctx = canvas.getContext("2d");
        var h = this._drawTree();
        this.treeContainer.append(h);
    }
}
 
ECOTree.prototype.add = function (id, pid, dsc, w, h, c, bc, target, meta) {
    var nw = w || this.config.defaultNodeWidth; //Width, height, colors, target and metadata defaults...
    var nh = h || this.config.defaultNodeHeight;
 
    // See if we need to calculate the width or the height
    if (nw == -1 || nh == -1) {
        var ruler = jQuery("#eco_tree_ruler_span");
        ruler.css({'width' : '', 'height' : ''});
        if (nw != -1) {
            ruler.css({'width' : nw});
        }
        if (nh != -1) {
            ruler.css({'height' : nh});
        }
        ruler.html(dsc);
        if (nw == -1) {
            nw = ruler.innerWidth() + 18;
        }
        if (nh == -1) {
            nh = ruler.innerHeight() + 4;
        }
    }
 
    var color = c || this.config.nodeColor;
    var border = bc || this.config.nodeBorderColor;
    var tg = (this.config.useTarget) ? ((typeof target == "undefined") ? (this.config.defaultTarget) : target) : null;
    var metadata = (typeof meta != "undefined") ? meta : "";
 
    var pnode = null; //Search for parent node in database
    if (pid == -1) {
        pnode = this.root;
    } else {
        for (var k = 0; k < this.nDatabaseNodes.length; k++) {
            if (this.nDatabaseNodes[k].id == pid) {
                pnode = this.nDatabaseNodes[k];
                break;
            }
        }
    }
 
    var node = new ECONode(id, pid, dsc, nw, nh, color, border, tg, metadata);  //New node creation...
    node.nodeParent = pnode;  //Set it's parent
    pnode.canCollapse = true; //It's obvious that now the parent can collapse
    var i = this.nDatabaseNodes.length; //Save it in database
    node.dbIndex = this.mapIDs[id] = i;
    this.nDatabaseNodes[i] = node;
    var h = pnode.nodeChildren.length; //Add it as child of it's parent
    node.siblingIndex = h;
    pnode.nodeChildren[h] = node;
}
 
ECOTree.prototype.searchNodes = function (str) {
    var node = null;
    var m = this.config.searchMode;
    var sm = (this.config.selectMode == ECOTree.SL_SINGLE);
 
    if (typeof str == "undefined") return;
    if (str == "") return;
 
    var found = false;
    var n = (sm) ? this.iLastSearch : 0;
    if (n == this.nDatabaseNodes.length) n = this.iLastSeach = 0;
 
    str = str.toLocaleUpperCase();
 
    for (; n < this.nDatabaseNodes.length; n++) {
        node = this.nDatabaseNodes[n];
        if (node.dsc.toLocaleUpperCase().indexOf(str) != -1 && ((m == ECOTree.SM_DSC) || (m == ECOTree.SM_BOTH))) {
            node._setAncestorsExpanded();
            this._selectNodeInt(node.dbIndex, false);
            found = true;
        }
        if (node.meta.toLocaleUpperCase().indexOf(str) != -1 && ((m == ECOTree.SM_META) || (m == ECOTree.SM_BOTH))) {
            node._setAncestorsExpanded();
            this._selectNodeInt(node.dbIndex, false);
            found = true;
        }
        if (sm && found) {
            this.iLastSearch = n + 1;
            break;
        }
    }
    this.UpdateTree();
}
 
ECOTree.prototype.selectAll = function () {
    if (this.config.selectMode != ECOTree.SL_MULTIPLE) {
        return;
    }
    this._selectAllInt(true);
}
 
ECOTree.prototype.unselectAll = function () {
    this._selectAllInt(false);
}
 
ECOTree.prototype.collapseAll = function () {
    this._collapseAllInt(true);
}
 
ECOTree.prototype.expandAll = function () {
    this._collapseAllInt(false);
}
 
ECOTree.prototype.collapseNode = function (nodeid, upd) {
    var dbindex = this.mapIDs[nodeid];
    this.nDatabaseNodes[dbindex].isCollapsed = !this.nDatabaseNodes[dbindex].isCollapsed;
    if (upd) {
        this.UpdateTree();
    }
}
 
ECOTree.prototype.selectNode = function (nodeid, upd) {
    this._selectNodeInt(this.mapIDs[nodeid], true);
    if (upd) {
        this.UpdateTree();
    }
}
 
ECOTree.prototype.setNodeTitle = function (nodeid, title, upd) {
    var dbindex = this.mapIDs[nodeid];
    this.nDatabaseNodes[dbindex].dsc = title;
    if (upd) { 
        this.UpdateTree();
    }
}
 
ECOTree.prototype.setNodeMetadata = function (nodeid, meta, upd) {
    var dbindex = this.mapIDs[nodeid];
    this.nDatabaseNodes[dbindex].meta = meta;
    if (upd) {
        this.UpdateTree();
    }
}
 
ECOTree.prototype.setNodeTarget = function (nodeid, target, upd) {
    var dbindex = this.mapIDs[nodeid];
    this.nDatabaseNodes[dbindex].target = target;
    if (upd) {
        this.UpdateTree();
    }
}
 
ECOTree.prototype.setNodeColors = function (nodeid, color, border, upd) {
    var dbindex = this.mapIDs[nodeid];
    if (color) {
        this.nDatabaseNodes[dbindex].c = color;
    }
    if (border) {
        this.nDatabaseNodes[dbindex].bc = border;
    }
    if (upd) {
        this.UpdateTree();
    }
}
 
ECOTree.prototype.getSelectedNodes = function () {
    var node = null;
    var selection = [];
    var selnode = null;
 
    for (var n = 0; n < this.nDatabaseNodes.length; n++) {
        node = this.nDatabaseNodes[n];
        if (node.isSelected) {
            selnode = {
                "id" : node.id,
                "dsc" : node.dsc,
                "meta" : node.meta
            };
            selection[selection.length] = selnode;
        }
    }
    return selection;
}
