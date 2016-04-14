/**
 * Created by Mu jiayi on 4/12/2016.
 */
// Last updated November 2010 by Simon Sarris
// www.simonsarris.com
// sarris@acm.org
//
// Free to use and distribute at will
// So long as you are nice to people, etc

// This is a self-executing function that I added only to stop this
// new script from interfering with the old one. It's a good idea in general, but not
// something I wanted to go over during this tutorial

// holds all our boxes
var objects = [];

// New, holds the 8 tiny boxes that will be our selection handles
// the selection handles will be in this order:
// 0  1
  var selectionHandles = [];

// Hold canvas information
  var canvas;
  var ctx;
  var WIDTH;
  var HEIGHT;
  var INTERVAL = 20;  // how often, in milliseconds, we check to see if a redraw is needed

  var isDrag = false;
  var isResizeDrag = false;
  var expectResize = -1; // New, will save the # of the selection handle if the mouse is over one.
  var mx, my; // mouse coordinates

  // when set to true, the canvas will redraw everything
  // invalidate() just sets this to false right now
  // we want to call invalidate() whenever we make a change
  var canvasValid = false;

// The node (if any) being selected.
// If in the future we want to select multiple objects, this will get turned into an array
  var mySel = null;

// The selection color and width. Right now we have a red selection with a small width
  var mySelColor = '#ff00ff';
  var mySelWidth = 2;
  var mySelBoxColor = '#0ff0ff'; // New for selection boxes
  var mySelBoxSize = 6;

// we use a fake canvas to draw individual shapes for selection testing
  var ghostcanvas;
  var gctx; // fake canvas context

// since we can drag from anywhere in a node
// instead of just its x/y corner, we need to save
// the offset of the mouse when we start dragging.
  var offsetx, offsety;

// Padding and border style widths for mouse offsets
  var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;




// Box object to hold data
  function All() {
    this.x = 0;
    this.y = 0;
    this.r = 0;
    this.sr = 0;
    this.w = 0; // default width and height?
    this.h = 0;
    this.toPoint = {x:0,y:0};
    this.arrowPoint1 = {x:0,y:0};
    this.arrowPoint2 = {x:0,y:0};
    this.arrowToPoint = {x:0,y:0};
    this.arrowLineAngle = 0;
    this.fill = '#444444';
    this.stroke = '#000000';
  }

// New methods on the Box class
  All.prototype = {
    // we used to have a solo draw function
    // but now each box is responsible for its own drawing
    // mainDraw() will call this with the normal canvas
    // myDown will call this with the ghost canvas with 'black'
    draw: function(context, optionalColor) {
      if (context === gctx) {
        context.fillStyle = 'black'; // always want black for the ghost canvas
      } else {
        context.fillStyle = this.fill;
        context.strokeStyle = this.stroke;
      }

      // We can skip the drawing of elements that have moved off the screen:
      if (this.x > WIDTH || this.y > HEIGHT) return;
      if (this.x + this.w < 0 || this.y + this.h < 0) return;

      if(this.r!=0){
        context.beginPath();
        context.arc(this.x,this.y,this.r,0*Math.PI,2*Math.PI);
        context.fill();
        context.stroke();
      }else if(this.sr !=0){
        context.beginPath();
        context.arc(this.x,this.y,this.sr,0*Math.PI,2*Math.PI);
        context.fill();
      }else if(this.w !=0 || this.h !=0){
        context.fillRect(this.x,this.y,this.w,this.h);
      }else if(this.toPoint.x!=0 || this.toPoint.y!=0){
        context.beginPath();
        context.lineWidth = 3;
        context.moveTo(this.x,this.y);
        context.lineTo(this.toPoint.x,this.toPoint.y);
        context.stroke();
      }else{
        context.beginPath();
        context.lineWidth = 3;
        context.moveTo(this.x,this.y);
        context.lineTo(this.arrowToPoint.x,this.arrowToPoint.y);
        context.lineTo(this.arrowPoint1.x,this.arrowPoint1.y);
        context.moveTo(this.arrowToPoint.x,this.arrowToPoint.y);
        context.lineTo(this.arrowPoint2.x,this.arrowPoint2.y);
        context.stroke();
      }

      // draw selection
      // this is a stroke along the box and also 8 new selection handles
        if (mySel === this && this.toPoint.x!=0 || mySel === this && this.toPoint.y!=0
            || mySel === this && this.arrowToPoint.x!=0 || mySel === this && this.arrowToPoint.y!=0) {
        context.strokeStyle = mySelColor;
        context.lineWidth = mySelWidth;
        //context.strokeRect(this.x,this.y,this.w,this.h);

        // draw the boxes

        //  var half = mySelBoxSize / 2;

        // 0  1  2
        // 3     4
        // 5  6  7

        // top left, middle, right
        selectionHandles[0].x = this.x;
        selectionHandles[0].y = this.y;

        if(this.toPoint.x!=0 || this.toPoint.y!=0) {
          selectionHandles[1].x = this.toPoint.x;
          selectionHandles[1].y = this.toPoint.y;
        }else{
          selectionHandles[1].x = this.arrowToPoint.x;
          selectionHandles[1].y = this.arrowToPoint.y;
        }

        context.fillStyle = mySelBoxColor;
        for (var i = 0; i < 2; i ++) {
          var cur = selectionHandles[i];
          context.fillRect(cur.x-1, cur.y-3, mySelBoxSize, mySelBoxSize);
        }
      } else if(mySel === this){
          context.strokeStyle = mySelColor;
          context.lineWidth = mySelWidth;
          if(mySel.r !=0){
            ctx.beginPath();
            ctx.arc(mySel.x,mySel.y,mySel.r,0*Math.PI,2*Math.PI);
            ctx.stroke();
          }else if(mySel.sr !=0){
            ctx.beginPath();
            ctx.arc(mySel.x,mySel.y,mySel.sr,0*Math.PI,2*Math.PI);
            ctx.stroke();
          }else if(mySel.w !=0 || mySel.h !=0){
            ctx.strokeRect(mySel.x,mySel.y,mySel.w,mySel.h);
          }
        }

    } // end draw

  }

//Initialize a new Box, add it, and invalidate the canvas
//  function addRect(x, y, w, h, fill) {
//Initialize a new Circle, add it, and invalidate the canvas
    function addObject(x, y, radius, sr, w, h,toPointX, toPointY,arrowToPointX,arrowToPointY, fill,stroke) {
      var all = new All;
      all.x = x;
      all.y = y;
      if(radius != 0){
        all.r = radius;
        all.fill = fill;
        all.stroke = stroke;
      }else if(sr != 0){
        all.sr = sr;
        all.fill = fill;
      }else if(w!=0 ||h!=0){
        all.w = w;
        all.h = h;
        all.fill = fill;
      }else if(toPointX!=0 || toPointY!=0){
        all.toPoint.x = toPointX;
        all.toPoint.y = toPointY;
        all.fill = fill;
      }else{
        //how to draw arrow: (reference)http://www.dbp-consulting.com/tutorials/canvas/CanvasArrow.html
        //the length of hypotenuse
        var ht = 20;
        all.arrowToPoint.x = arrowToPointX;
        all.arrowToPoint.y = arrowToPointY;
        all.arrowLineAngle = Math.atan2( y-arrowToPointY, x-arrowToPointX);

        // the angle of the arrow
        var angle = 5*Math.PI/6;
        all.arrowPoint1.x = arrowToPointX + Math.cos(all.arrowLineAngle+Math.PI+angle) * ht;
        all.arrowPoint1.y = arrowToPointY + Math.sin(all.arrowLineAngle+Math.PI+angle) * ht;
        all.arrowPoint2.x = arrowToPointX + Math.cos(all.arrowLineAngle+Math.PI-angle) * ht;
        all.arrowPoint2.y = arrowToPointY + Math.sin(all.arrowLineAngle+Math.PI-angle) * ht;
        all.fill = fill;
      }
      objects.push(all);
      invalidate();
    }

// initialize our canvas, add a ghost canvas, set draw loop
// then add everything we want to intially exist on the canvas
  function init() {
    canvas = document.getElementById('canvas');
    HEIGHT = canvas.height;
    WIDTH = canvas.width;
    ctx = canvas.getContext('2d');
    ghostcanvas = document.createElement('canvas');
    ghostcanvas.height = HEIGHT;
    ghostcanvas.width = WIDTH;
    gctx = ghostcanvas.getContext('2d');

    //fixes a problem where double clicking causes text to get selected on the canvas
    canvas.onselectstart = function () { return false; }

    // fixes mouse co-ordinate problems when there's a border or padding
    // see getMouse for more detail
    if (document.defaultView && document.defaultView.getComputedStyle) {
      stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingLeft'], 10)     || 0;
      stylePaddingTop  = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingTop'], 10)      || 0;
      styleBorderLeft  = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderLeftWidth'], 10) || 0;
      styleBorderTop   = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderTopWidth'], 10)  || 0;
    }

    // make mainDraw() fire every INTERVAL milliseconds
    setInterval(mainDraw, INTERVAL);

    // set our events. Up and down are for dragging,
    // double click is for making new boxes
    canvas.onmousedown = myDown;
    canvas.onmouseup = myUp;
    canvas.ondblclick = myDblClick;
    canvas.onmousemove = myMove;

    // set up the selection handle boxes
    for (var i = 0; i < 2; i ++) {
      var rect = new All;
      selectionHandles.push(rect);
    }

    // add custom initialization here:

  }

//wipes the canvas context
  function clear(c) {
    c.clearRect(0, 0, WIDTH, HEIGHT);
  }

// Main draw loop.
// While draw is called as often as the INTERVAL variable demands,
// It only ever does something if the canvas gets invalidated by our code
  function mainDraw() {
    if (canvasValid == false) {
      clear(ctx);

      // Add stuff you want drawn in the background all the time here

      // draw all boxes
      var l = objects.length;
      for (var i = 0; i < l; i++) {
        objects[i].draw(ctx); // we used to call drawshape, but now each box draws itself
      }

      // Add stuff you want drawn on top all the time here

      canvasValid = true;
    }
  }

// Happens when the mouse is moving inside the canvas
  function myMove(e){
    if (isDrag) {
      var px = mySel.x;
      var py = mySel.y;

      getMouse(e);

      mySel.x = mx - offsetx;
      mySel.y = my - offsety;

      var dx = mySel.x - px;
      var dy = mySel.y - py;
      if(mySel.toPoint.x!=0 || mySel.toPoint.y!=0) {
        mySel.toPoint.x += dx;
        mySel.toPoint.y += dy;
      }else if(mySel.arrowToPoint.x!=0 || mySel.arrowToPoint.y!=0){
        mySel.arrowToPoint.x += dx;
        mySel.arrowToPoint.y += dy;
        mySel.arrowPoint1.x += dx;
        mySel.arrowPoint1.y += dy;
        mySel.arrowPoint2.x += dx;
        mySel.arrowPoint2.y += dy;
      }

      // something is changing position so we better invalidate the canvas!
      invalidate();
    } else if (isResizeDrag) {
      // time ro resize!
      var oldx = mySel.x;
      var oldy = mySel.y;

      if(expectResize == 0) {
        mySel.x = mx;
        mySel.y = my;

        var ht = 20;
        mySel.arrowLineAngle = Math.atan2( my-mySel.arrowToPoint.y, mx-mySel.arrowToPoint.x);

        // the angle of the arrow
        var angle = 5*Math.PI/6;
        mySel.arrowPoint1.x = mySel.arrowToPoint.x + Math.cos(mySel.arrowLineAngle+Math.PI+angle) * ht;
        mySel.arrowPoint1.y = mySel.arrowToPoint.y + Math.sin(mySel.arrowLineAngle+Math.PI+angle) * ht;
        mySel.arrowPoint2.x = mySel.arrowToPoint.x + Math.cos(mySel.arrowLineAngle+Math.PI-angle) * ht;
        mySel.arrowPoint2.y = mySel.arrowToPoint.y + Math.sin(mySel.arrowLineAngle+Math.PI-angle) * ht;

      }else if(mySel.arrowToPoint.x!=0 || mySel.arrowToPoint.y!=0){
        mySel.arrowToPoint.x = mx;
        mySel.arrowToPoint.y = my;

        var ht = 20;
        mySel.arrowLineAngle = Math.atan2( mySel.y-my, mySel.x-mx);

        // the angle of the arrow
        var angle = 5*Math.PI/6;
        mySel.arrowPoint1.x = mx + Math.cos(mySel.arrowLineAngle+Math.PI+angle) * ht;
        mySel.arrowPoint1.y = my + Math.sin(mySel.arrowLineAngle+Math.PI+angle) * ht;
        mySel.arrowPoint2.x = mx + Math.cos(mySel.arrowLineAngle+Math.PI-angle) * ht;
        mySel.arrowPoint2.y = my + Math.sin(mySel.arrowLineAngle+Math.PI-angle) * ht;
      }else if(mySel.toPoint.x!=0 || mySel.toPoint.y!=0){
        mySel.toPoint.x = mx;
        mySel.toPoint.y = my;
      }

        invalidate();
    }

    getMouse(e);
    // if there's a selection see if we grabbed one of the selection handles
    if (mySel !== null && !isResizeDrag) {
      for (var i = 0; i < 2; i++) {
        // 0  1  2
        // 3     4
        // 5  6  7

        var cur = selectionHandles[i];

        // we dont need to use the ghost context because
        // selection handles will always be rectangles
        if (mx >= cur.x && mx <= cur.x + mySelBoxSize &&
          my >= cur.y && my <= cur.y + mySelBoxSize) {
          // we found one!
          expectResize = i;
          invalidate();

          switch (i) {
            case 0:
              this.style.cursor='crosshair';
              break;
            case 1:
              this.style.cursor='crosshair';
              break;
          }
          return;
        }

      }
      // not over a selection box, return to normal
      isResizeDrag = false;
      expectResize = -1;
      this.style.cursor='auto';
    }

  }

// Happens when the mouse is clicked in the canvas
  function myDown(e){

    if (e.ctrlKey) {
      getMouse(e);

      //we are over a selection box
      if (expectResize !== -1) {
        isResizeDrag = true;
        return;
      }

      clear(gctx);
      var l = objects.length;
      for (var i = l-1; i >= 0; i--) {
        // draw shape onto ghost context
        objects[i].draw(gctx, 'black');

        // get image data at the mouse x,y pixel
        var imageData = gctx.getImageData(mx, my, 1, 1);
        var index = (mx + my * imageData.width) * 4;

        // if the mouse pixel exists, select and break
        if (imageData.data[3] > 0) {
          objects.splice(i,1);

          invalidate();
          clear(gctx);
          return;
        }

      }
    } else {
      getMouse(e);

      //we are over a selection box
      if (expectResize !== -1) {
        isResizeDrag = true;
        return;
      }

      clear(gctx);
      var l = objects.length;
      for (var i = l-1; i >= 0; i--) {
        // draw shape onto ghost context
        objects[i].draw(gctx, 'black');

        // get image data at the mouse x,y pixel
        var imageData = gctx.getImageData(mx, my, 1, 1);
        var index = (mx + my * imageData.width) * 4;

        // if the mouse pixel exists, select and break
        if (imageData.data[3] > 0) {
          mySel = objects[i];
          offsetx = mx - mySel.x;
          offsety = my - mySel.y;
          mySel.x = mx - offsetx;
          mySel.y = my - offsety;
          isDrag = true;

          invalidate();
          clear(gctx);
          return;
        }

      }
    }

    // havent returned means we have selected nothing
    mySel = null;
    // clear the ghost canvas for next time
    clear(gctx);
    // invalidate because we might need the selection border to disappear
    invalidate();
  }

  function myUp(){
    isDrag = false;
    isResizeDrag = false;
    expectResize = -1;
  }

// adds a new node
  function myDblClick(e) {
    getMouse(e);
    // for this method width and height determine the starting X and Y, too.
    // so I left them as vars in case someone wanted to make them args for something and copy this code

    addObject(mx, my, 40, 0, 0, 0, 0, 0, 0, 0, '#ffffff','#000000');
  }


  function invalidate() {
    canvasValid = false;
  }

// Sets mx,my to the mouse position relative to the canvas
// unfortunately this can be tricky, we have to worry about padding and borders
  function getMouse(e) {
    var element = canvas, offsetX = 0, offsetY = 0;

    if (element.offsetParent) {
      do {
        offsetX += element.offsetLeft;
        offsetY += element.offsetTop;
      } while ((element = element.offsetParent));
    }

    // Add padding and border style widths to offset
    offsetX += stylePaddingLeft;
    offsetY += stylePaddingTop;

    offsetX += styleBorderLeft;
    offsetY += styleBorderTop;

    mx = e.pageX - offsetX;
    my = e.pageY - offsetY
  }

// If you dont want to use <body onLoad='init()'>
// You could uncomment this init() reference and place the script reference inside the body tag
//init();


