// canvas and gl variables
var canvas;
var gl;

var dangoSphere;
var drawCube;
var drawSquare;
var numberOfDango = 5;

var instructionsToggle = true;
var winToggle = false;

var audio = new Audio("dango_files/gulp.mp3");

var score = 0;

// various dango parameters
var index = 0;
var scaleFactor = 1;
var h = 0; // height of dango
var maxHeight = 4;
var minHeight = 0;
var minx = 0.5;
var squishFactors = vec2(1,1);
var miny = 0.5;
var maxx = 1;
var maxy = 1;
var cycle = 0;

var cos10 = Math.cos(radians(2));
var sin10 = Math.sin(radians(2));

// camera parameters
var aspect;
var near  = 0.1;
var far   = 100;
var fovy  = 45.0;

var yaw   = 0;
var theta = 0; // pitch

var scoot = 0; // x-position
var dist  = -3; // z-position
var jump  = []; // y-position
var ypos = 0;

//control position of chopstick
var grab;
var grabPosition = 0;
var grabTime;
var time;
var firstMoment = true;
var deg = 2;

// holds vertices and normals and texCoords
var points  = [];
var normals = [];

var positions = [
    vec3( 1, 0, -5),
    vec3( 5, 0, -4),
    vec3(-4, 0, -4),
    vec3( 3, 0, -2),
    vec3(-2, 0, -3),
    vec3( 5, 0, -5),
    vec3(-2, 0, -2),
    vec3(-1, 0, -2),
    vec3( 1, 0, -4),
    vec3( 0, 0, -3)
];

// DANGO

var dangoToggle = [
    true,
    true,
    true,
    true,
    true
];

//color info for different colored dango
var dangoColor = [
    vec4( 0.588, 1,     0.71,  1.0 ), //green
    vec4( 0.682, 0.47,  0.776, 1.0 ), //purple
    vec4( 0.8,   0.462, 0.58,  1.0 ), //pink
    vec4( 0.423, 0.654, 0.8,   1.0 ), //blue
    vec4( 1,     1,     1,     1.0 ) //white
]

// holds color info
var colors = [
    vec4( 0.5, 0.5, 0.5, 1.0 ), // grey
    vec4( 0.9, 0.9, 0.9, 1.0 ), // almost white
    vec4( 1.0, 1.0, 1.0, 1.0 ), // white
    vec4( 0.0, 0.0, 0.0, 1.0 ), // black
    vec4( 1.0, 0.3, 0.3, 1.0 ) // red?
];

// camera parameters
var near  = 0.1;
var far   = 100;
var fovy  = 45.0;
var yaw   = 0;
var scoot = 0;
var dist  = -5;
var aspect;

var stopAnimating = false;

// light information
var lightPosition = vec4(0.0, 4.5, 0.0, 0.0 );
// holds information on light in this order: light ambient color, light diffuse color, and specular color
var lightArray = [
    vec4( 0.5, 0.5, 0.5, 1.0 ),
    vec4( 0.5, 0.5, 0.5, 1.0 ),
    vec4( 0.5, 0.5, 0.5, 1.0 )
];
materialShininess = 20;

var ambientColor, diffuseColor, specularColor;

// model view and projection matrix declarations and location declarations
var modelViewMatrix, projectionMatrix, squishMatrix;
var modelViewMatrixLoc, projectionMatrixLoc, squishMatrixLoc;
var useTextureLoc;
// color product locations
var apLoc, dpLoc, spLoc, shininessLoc;

// calculates height of dango wrt time
function setBounceHeight(t) {
    for(var x = 0; x < numberOfDango +1; x++){
        var j = (x+2)/(x+1);
        jump[x] = maxHeight*Math.pow((Math.sin(j* t/1000)), 2);
    }

}

// calculates scaling factors of dango wrt height
function squish(t) {
    // if(!dangoToggle[i])
    //     return vec2(1, 1);
    var j = maxHeight*Math.pow(Math.sin(2*t/1000), 2);
    var my = maxHeight/(maxx - minx); //-4
    var mx = -my; //4
    var x = (j*.8 +mx)/mx; 
    var y = (j+my*miny)/my;
    return vec2(x, y);
}
//code for direction
//0 forward , 1 left , 2 right , 3 back
function detectCollisionMove(i, direction) {
    a = vec3(scoot, 2, dist);
    //Get dango position 
    var dango = vec3(positions[i]);
    if(!dangoToggle[i])
        dango = vec3(positions[i+5]);

    //Check x distance
    var xDist = a[0] + dango[0];
     //check in z direction.
    var zDist = a[2] + dango[2];

        //if trying to move left and right
     console.log(xDist);
    if(direction == 1 || direction == 2){
        if(zDist > 2 || zDist < -2)
            return false;
        if(xDist > 1 || xDist < -1.5)
            return false;
        if(direction == 1  && xDist < 0)
            return true;
        if(direction == 2 && xDist > 0 )
            return true;
    }
    else{
         if(xDist > 1 || xDist < -1.5)
            return false;
        if(zDist > 2.5 || zDist < -2.5)
            return false;
        if(direction == 0 && zDist < 0)
            return true;
        if(direction == 3 && zDist > 0)
            return true;
    }
    return false;
}
 
function detectCollision(i) {
    //a is position of the chopsticks
    a = vec3(scoot + .1 - grabPosition*sin10, 2, dist + grabPosition*cos10 + 2);

    if(dangoToggle[i]){
        var dango = vec3(positions[i]); 
        var num = i;
        if ((Math.pow((a[0]+dango[0]),2) + Math.pow((a[1]- jump[num]),2) + Math.pow((a[2]+dango[2]),2) ) < .5)
       {
            audio.play();
            dangoColor[i]  = vec4(0.5+ Math.random()/2, 0.5+ Math.random()/2, 0.5+ Math.random()/2, 1);
            dangoToggle[i] = false;
            return true;
        }
    }
    else{
        var num = i;
        var dango = vec3(positions[i+5]);
        if (( Math.pow((a[0]+dango[0]),2) + Math.pow((a[1]- jump[num]),2) + Math.pow((a[2]+dango[2]),2) ) < .5){
            audio.play();
            dangoColor[i+5]  = vec4(0.5+ Math.random()/2, 0.5+ Math.random()/2, 0.5+ Math.random()/2, 1);
            dangoToggle[i] = true;
            return true;
        }
    }
    return false;
}

function detectFinalCollision(i) {
    //a is position of the chopsticks
    a = vec3(scoot + .1 - grabPosition*sin10, 2, dist + grabPosition*cos10 + 2);
    var dango = vec3(positions[i]); 
    var num = i;
    if(!dangoToggle[i]){
        dango = vec3(positions[i+5]);
    }
    if ((Math.pow((a[0]+dango[0]),2) + Math.pow((a[1]- jump[num]),2) + Math.pow((a[2]+dango[2]),2) ) < .5)
       {
            audio.play();
            dangoToggle[i] = dangoToggle[numberOfDango-1];
            positions[i] = positions[numberOfDango-1];
            numberOfDango--;
            return true;
        }

    return false;
}


window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    aspect = canvas.width/canvas.height;
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);


//Still need to implement restart
    document.getElementById("restart").onclick = function(){;};
 

    //  Load shaders and initialize attribute buffers
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    //colorCube();
    drawCube = new cube();
    drawSquare = new square();
   //Create sphere to draw dango body and eyes
    dangoSphere = new sphere();

   nBuffer = gl.createBuffer();
   gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
   gl.bufferData( gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW );
    
    tNormal = gl.getAttribLocation( program, "tNormal" );
    gl.vertexAttribPointer( tNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray(tNormal);

    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
    
    vPosition = gl.getAttribLocation( program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    vTexCoord = gl.getAttribLocation( program, "vTexCoord" );
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vTexCoord );

    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
    squishMatrixLoc = gl.getUniformLocation( program, "squishMatrix" );

    gl.uniform4fv( gl.getUniformLocation(program, "lightPosition"),flatten(lightPosition) );

    apLoc = gl.getUniformLocation( program, "ambientProduct");
    dpLoc = gl.getUniformLocation( program, "diffuseProduct");
    spLoc = gl.getUniformLocation( program, "specularProduct");
    gl.uniform1f( gl.getUniformLocation( program, "shininess" ), materialShininess );

    useTextureLoc = gl.getUniformLocation( program, "useTexture");
    // handle key commands
    document.onkeydown = handleKeyDown;

    //handle clicks
    document.getElementById("restart").onclick = function(){
        dist = -5;
        scoot = 0;
        fovy = 45;
        yaw = 0;
        score = 0;
        winToggle = false;
    }

    render();
}

function handleKeyDown(event) {
  
    if (event.keyCode == 73) {
        // i key - instructions
        if (instructionsToggle)
            instructionsToggle = false;
        else
            instructionsToggle = true;
    } 
    if(instructionsToggle && event.keyCode != 73)
        return;
     else if (event.keyCode == 87) {
        // W key - forward
        if(dist > 5)
             dist = 5;
        for(var i = 0; i < numberOfDango; i++){
            if(detectCollisionMove(i, 0))
                return;
        }dist += .5;
    } else if (event.keyCode == 65) {
        // A key - left
        if(scoot > 6)
            scoot = 6;
        for(var i = 0; i < numberOfDango; i++){
            if(detectCollisionMove(i, 1))
               return;
        }scoot += 0.5;
    } else if (event.keyCode == 68) {
        // D key - right
        if(scoot < -6)
            scoot = -6;
        for(var i = 0; i < numberOfDango; i++){
            if(detectCollisionMove(i, 2))
                return;
        }
        scoot -= 0.5;
    } else if (event.keyCode == 83) {
        // S key - backward
         if(dist < -5)
             dist = -5;
        for(var i = 0; i < numberOfDango; i++){
            if(detectCollisionMove(i, 3))
                return;
        }
         dist -= 0.5;
    } else if (event.keyCode == 82) {
    // r key - reset view settings
        dist = -5;
        scoot = 0;
        fovy = 45;
        yaw = 0;
    }
    else if( event.keyCode == 32){
        //grab dango if press spacebar
        grab = true;
    } 
    
}


function render(t) {
    document.getElementById("score").innerHTML = score;
    
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
     projectionMatrix = perspective(fovy, aspect, near, far);
    projectionMatrix = mult(projectionMatrix, translate(scoot, -2, dist));
   
    gl.uniform1i(useTextureLoc, 1);

    // set colors of room
    ambientProduct  = mult(lightArray[0], colors[0]);
    diffuseProduct  = mult(lightArray[1], colors[2]);
    specularProduct = vec4(0,0,0,0);

    squishMatrix = scale(14, 10, 12);
    // build model view matrix
    modelViewMatrix = translate(0, 4.5,0);
    drawCube.draw(modelViewMatrix, 1);

    if(numberOfDango == 0){
        console.log("Winner");
        winToggle = true;
    }
    
    // CHOPSTICKS
    // set colors 
    ambientProduct  = mult(lightArray[0], colors[3]);
    diffuseProduct  = mult(lightArray[1], colors[3]);
    specularProduct = vec4(0, 0, 0, 0);

    if(grab == true) {
            if(score >= 100){
                for(var i = 0; i < numberOfDango; i++){
                    if(detectFinalCollision(i))
                        score +=20;
                }
             }
            else{
                for(var i = 0; i < numberOfDango; i ++){
                  if(detectCollision(i))
                         score += 10; 
                }
            }   // END if condition

        if (firstMoment) {
            grabTime = t;
            firstMoment = false;
            time = 0;
        } else
            time = t - grabTime;

        if (time < 500)
            grabPosition += 0.1;
        else if (time > 500)
            grabPosition -= 0.1;

    }

    if( time != 0 && grabPosition <= 0) {
        grab = false;
        firstMoment = true;
        grabPosition = 0;
    }
    projectionMatrix = perspective(fovy, aspect, near, far);
    squishMatrix = scale(0.05, 0.05, 4);

    modelViewMatrix = mult(rotate(-deg, [0, 1, 0]),translate(-0.5, 0, 0.5 - grabPosition));
    drawCube.draw(modelViewMatrix, 0);  

    modelViewMatrix = mult(translate(0, -0.1, 0), modelViewMatrix);
    drawCube.draw(modelViewMatrix, 0);
  //  gl.uniform1i(useTextureLoc, 0);
    

    gl.uniform1i(useTextureLoc, 0);
    var empty = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, empty);


    // build projection matrix
    projectionMatrix = perspective(fovy, aspect, near, far);
    projectionMatrix = mult(projectionMatrix, translate(scoot, -2, dist));
    //projectionMatrix = mult(projectionMatrix, rotate(yaw, [0,1,0]));
    // send projection matrix to html file
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );

    //all the dangos will be bouncing at the same time in the same motion.
    setBounceHeight(t);

    squishFactors = squish(t);
    squishMatrix = scale(squishFactors[0], squishFactors[1], 1);
  
    // draw dango bodies
    for(var i = 0; i < numberOfDango; i++){
        //set model view matrix

        modelViewMatrix = translate(0,jump[i],0);

        // set colors
        ambientProduct  = mult(lightArray[0], dangoColor[i]);
        diffuseProduct  = mult(lightArray[1], colors[2]);
        specularProduct = vec4(0,0,0,0);

        var dangoPos = mult(modelViewMatrix,translate(positions[i]));
        if (!dangoToggle[i])
            dangoPos = mult(modelViewMatrix,translate(positions[i+5]));
           
        // draw dango
        dangoSphere.draw(dangoPos);
    }

    // set color of eyes to black
    ambientProduct  = mult(lightArray[0], colors[3]);
    diffuseProduct  = mult(lightArray[1], colors[3]);
    squishMatrix = scale(0.04, 0.3, 0.6);
    //draw eyes of the dangos
    for(var k = 0; k < numberOfDango; k++) {
        //set the location of the eyes 
        var eyePos = translate(0, jump[k], 0);

        if (dangoToggle[k]) {
            eyePos = mult(translate(positions[k]), eyePos);
        } else {
            eyePos = mult(translate(positions[k+5]), eyePos);
        }
    
        var eye1 = eyePos;
        eye1 = mult(eye1, translate(-.1, 0, .5));
        dangoSphere.draw(eye1);

        var eye2 = eyePos;
        eye2 = mult(eye2, translate(.1, 0, 0.5));
        dangoSphere.draw(eye2);
    }

    projectionMatrix = mat4();
    modelViewMatrix = mat4();
    squishMatrix = mat4();

    if (instructionsToggle) {
        gl.uniform1i(useTextureLoc, 1);
        drawSquare.draw(modelViewMatrix, 0);
    }

    if (winToggle) {
        gl.uniform1i(useTextureLoc, 1);
        drawSquare.draw(modelViewMatrix, 1);
    }


 
   // if(collision)
    window.requestAnimFrame(render);
}
