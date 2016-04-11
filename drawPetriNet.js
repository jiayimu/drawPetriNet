//Copyright 2016 by Jiayi Mu
// reference: Simon Sarris
// www.simonsarris.com
// sarris@acm.org


//all object to hold data for all drawn circle
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

// holds all our circles
var objects = [];

var canvas;
var ctx;
var WIDTH;
var HEIGHT;
var INTERVAL = 20;  // how often, in milliseconds, we check to see if a redraw is needed

var isDrag = false;
var mx, my; // mouse coordinates

// when set to true, the canvas will redraw everything
// invalidate() just sets this to false right now
// we want to call invalidate() whenever we make a change
var canvasValid = false;

// The node (if any) being selected.
// If in the future we want to select multiple objects, this will get turned into an array
var mySel;

// The selection color and width. Right now we have a red selection with a small width
var mySelColor = '#CCff00';
var mySelWidth = 2;

// we use a fake canvas to draw individual shapes for selection testing
var ghostcanvas;
var gctx; // fake canvas context

// since we can drag from anywhere in a node
// instead of just its x/y corner, we need to save
// the offset of the mouse when we start dragging.
var offsetx, offsety;

// Padding and border style widths for mouse offsets
var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;

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
    stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingLeft'], 10)      || 0;
    stylePaddingTop  = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingTop'], 10)       || 0;
    styleBorderLeft  = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderLeftWidth'], 10)  || 0;
    styleBorderTop   = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderTopWidth'], 10)   || 0;
  }

  // make draw() fire every INTERVAL milliseconds
  setInterval(draw, INTERVAL);

  // set our events. Up and down are for dragging,
  // double click is for making new boxes
  canvas.onmousedown = myDown;
  canvas.onmouseup = myUp;
  canvas.ondblclick = myDblClick;
}

//wipes the canvas context
function clear(c) {
  c.clearRect(0, 0, WIDTH, HEIGHT);
}

// While draw is called as often as the INTERVAL variable demands,
// It only ever does something if the canvas gets invalidated by our code
function draw() {
  if (canvasValid == false) {
    clear(ctx);

    // Add stuff you want drawn in the background all the time here

    var len = objects.length;
    for (var i = 0; i < len; i++) {
      drawshape(ctx, objects[i], objects[i].fill,objects[i].stroke);
    }


    // draw selection
    // right now this is just a stroke along the edge of the selected box
    if (mySel != null) {
      ctx.strokeStyle = mySelColor;
      ctx.lineWidth = mySelWidth;
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
      }else if(mySel.toPoint.x!=0 || mySel.toPoint.y!=0){
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.moveTo(mySel.x,mySel.y);
        ctx.lineTo(mySel.toPoint.x,mySel.toPoint.y);
        ctx.stroke();
      }else{
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.moveTo(mySel.x,mySel.y);
        ctx.lineTo(mySel.arrowToPoint.x,mySel.arrowToPoint.y);
        ctx.lineTo(mySel.arrowPoint1.x,mySel.arrowPoint1.y);
        ctx.moveTo(mySel.arrowToPoint.x,mySel.arrowToPoint.y);
        ctx.lineTo(mySel.arrowPoint2.x,mySel.arrowPoint2.y);
        ctx.stroke();
      }
    }

    // Add stuff you want drawn on top all the time here


    canvasValid = true;
  }
}

// Draws a single shape to a single context
// draw() will call this with the normal canvas
// myDown will call this with the ghost canvas
function drawshape(context, shape, fill,stroke) {

  context.fillStyle = fill;
  context.strokeStyle = stroke;
  // We can skip the drawing of elements that have moved off the screen:
  if (shape.x > WIDTH || shape.y > HEIGHT) return;
  if (shape.x + shape.r < 0 || shape.y + shape.r < 0) return;

  if(shape.r!=0){
    context.beginPath();
    context.arc(shape.x,shape.y,shape.r,0*Math.PI,2*Math.PI);
    context.fill();
    context.stroke();
  }else if(shape.sr !=0){
    context.beginPath();
    context.arc(shape.x,shape.y,shape.sr,0*Math.PI,2*Math.PI);
    context.fill();
  }else if(shape.w !=0 || shape.h !=0){
    context.fillRect(shape.x,shape.y,shape.w,shape.h);
  }else if(shape.toPoint.x!=0 || shape.toPoint.y!=0){
    context.beginPath();
    context.lineWidth = 3;
    context.moveTo(shape.x,shape.y);
    context.lineTo(shape.toPoint.x,shape.toPoint.y);
    context.stroke();
  }else{
    context.beginPath();
    context.lineWidth = 3;
    context.moveTo(shape.x,shape.y);
    context.lineTo(shape.arrowToPoint.x,shape.arrowToPoint.y);
    context.lineTo(shape.arrowPoint1.x,shape.arrowPoint1.y);
    context.moveTo(shape.arrowToPoint.x,shape.arrowToPoint.y);
    context.lineTo(shape.arrowPoint2.x,shape.arrowPoint2.y);
    context.stroke();
  }
}

function checkKey(e,context,shape){
  if(e.keyCode == 46){
    if(shape.r!=0){
      //context.clearRect(shape.x-shape.r,shape.y-shape.r,2*shape.r,2*shape.r);
      objects.splice(mySel,1);
    }else if(shape.sr !=0){
      context.clearRect(shape.x-shape.sr,shape.y-shape.sr,2*shape.sr,2*shape.sr);
    }else{
      context.clearRect(shape.x,shape.y,shape.w,shape.h);
    }
  }
}

// Happens when the mouse is moving inside the canvas
function myMove(e){
  if (isDrag){
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
  }
}

// Happens when the mouse is clicked in the canvas
function myDown(e){
  getMouse(e);
  clear(gctx);
  var l = objects.length;
  for (var i = l-1; i >= 0; i--) {
    // draw shape onto ghost context
    drawshape(gctx, objects[i], 'black','red');

    // get image data at the mouse x,y pixel
    var imageData = gctx.getImageData(mx, my, 1, 1);

    // if the mouse pixel exists, select and break
    if (imageData.data[3] > 0) {
      mySel = objects[i];
      offsetx = mx - mySel.x;
      offsety = my - mySel.y;
      mySel.x = mx - offsetx;
      mySel.y = my - offsety;
      isDrag = true;
      canvas.onmousemove = myMove;
      invalidate();
      clear(gctx);
      return;
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
  canvas.onmousemove = null;
}

// adds a new node
function myDblClick(e) {
  getMouse(e);

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
