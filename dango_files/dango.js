// canvas and gl variables
var canvas;
var gl;
 
// various parameters
var index = 0;
var scaleFactor = 1;
var h = 0; // height of dango
var maxHeight = 2;
var minHeight = 0; // not used in calculations yet. May be added to sin function.
var minx = 0.5;
var miny = 0.5;
var maxx = 1;
var maxy = 1;
var squishFactors = vec2(1,1);

// this controls the pitch of the camera
var theta = 0;
var ypos = 0;

// holds vertices and normals and texCoords
var points = [];
var normals = [];
var texCoords = [];

// holds colors
var colors = [
    vec4( 0.5, 0.5, 0.5, 1.0 ), // grey
    vec4( 0.9, 0.9, 0.9, 1.0 ), // almost white
    vec4( 1.0, 1.0, 1.0, 1.0 ), // white
    vec4( 0.0, 0.0, 0.0, 1.0 ) // black 
];

// camera parameters
var near  = 0.1;
var far   = 100;
var fovy  = 45.0;
var yaw   = 0;
var scoot = 0;
var dist  = -5;
var jump  = 0;
var aspect;

// tetrahedron vertices
var va = vec4(0.0, 0.0, -.3,1);
var vb = vec4(0.0, 0.842809, 0.333333, 1);
var vc = vec4(-0.86497, -0.271405, 0.333333, 1);
var vd = vec4(0.86497, -0.271405, 0.333333,1);

// texture things
var texSize = 64;

var texture;
var image = new Image();
image.src = "wall_texture.png";

var texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];

// cube vertices
var roomVertices = [
    vec4( -0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5,  0.5,  0.5, 1.0 ),
    vec4(  0.5,  0.5,  0.5, 1.0 ),
    vec4(  0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5, -0.5, -0.5, 1.0 ),
    vec4( -0.5,  0.5, -0.5, 1.0 ),
    vec4(  0.5,  0.5, -0.5, 1.0 ),
    vec4(  0.5, -0.5, -0.5, 1.0 )
];

function configureTexture(image) {
    texture = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB,
        gl.UNSIGNED_BYTE, image);
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, 
        gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );

    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
}

// pushes cube vertices and texture coordinates
function quad(a, b, c, d) {

     pointsArray.push(roomVertices[a]);
     texCoords.push(texCoord[0]);

     pointsArray.push(roomVertices[b]);
     texCoords.push(texCoord[1]); 

     pointsArray.push(roomVertices[c]);
     texCoords.push(texCoord[2]); 
    
     pointsArray.push(roomVertices[a]);
     texCoords.push(texCoord[0]); 

     pointsArray.push(roomVertices[c]);
     texCoords.push(texCoord[2]); 

     pointsArray.push(roomVertices[d]);
     texCoords.push(texCoord[3]);
}

function colorCube() {
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}

// light information
var lightPosition = vec4(0.0, 5.0, 0.0, 0.0 );
// holds information on light in this order: light ambient color, light diffuse color, and specular color
var lightArray = [
    vec4( 1.0, 0.8, 0.8, 1.0 ),
    vec4( 1.0, 0.8, 0.8, 1.0 ),
    vec4( 1.0, 0.8, 0.8, 1.0 )
];
materialShininess = 20;

var ambientColor, diffuseColor, specularColor;

// model view and projection matrix declarations and location declarations
var modelViewMatrix, projectionMatrix, squishMatrix;
var modelViewMatrixLoc, projectionMatrixLoc, squishMatrixLoc;

// color product locations
var apLoc, dpLoc, spLoc, shininessLoc;

// pushes vertices and normals of triangle
function triangle(a, b, c, complexity) {
     
     points.push(a);
     points.push(b);
     points.push(c);
     index += 3;
    
     /*if (flatShading) { // per triangle normals
        var normal = computeFlat(a,b,c);
        for (var i = 0; i < 3; i++)
            normalsArray.push(normal[0], normal[1], normal[2], 0.0);
        */
     //} else { // analytical normals
        normals.push(a[0],a[1], a[2], 0.0);
        normals.push(b[0],b[1], b[2], 0.0);
        normals.push(c[0],c[1], c[2], 0.0);
    //}
}

// computes flat normals
function computeFlat(a, b, c){
    var u = subtract(b,a);
    var v = subtract(c,a);

    var normal = normalize(cross(v,u));

    return normal;
}

// recursively determines vertices of sphere
function divideTriangle(a, b, c, count, complexity) {
    if ( count > 0 ) {
                
        var ab = mix( a, b, 0.5);
        var ac = mix( a, c, 0.5);
        var bc = mix( b, c, 0.5);
                
        ab = normalize(ab, true);
        ac = normalize(ac, true);
        bc = normalize(bc, true);
                                
        divideTriangle( a, ab, ac, count - 1, complexity );
        divideTriangle( ab, b, bc, count - 1, complexity );
        divideTriangle( bc, c, ac, count - 1, complexity );
        divideTriangle( ab, bc, ac, count - 1, complexity );
    }
    else { 
        triangle( a, b, c, complexity );
    }
}

// uses tetrahedron vertices to push sphere vertices
function tetrahedron(a, b, c, d, n) {
    divideTriangle(a, b, c, n, n);
    divideTriangle(d, c, b, n, n);
    divideTriangle(a, d, b, n, n);
    divideTriangle(a, c, d, n, n);
}



function bounceHeight(t) {
    h = maxHeight*Math.pow((Math.sin(t/1000)), 2);
    return h;
}

function squish(t) {
    var j = maxHeight*Math.pow(Math.sin(2*t/1000), 2);
    var my = maxHeight/(maxx - minx); //-4
    var mx = -my; //4
    var x = (j*.8 +mx)/mx; 
    var y = (j+my*miny)/my;
    return vec2(x, y);
}

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    aspect = canvas.width/canvas.height;
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);

    //  Load shaders and initialize attribute buffers
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // push dango vertices
    tetrahedron(va, vb, vc, vd, 5);

    // push room vertices
    colorCube();

    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW );
    
    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray(vNormal);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
    
    var vPosition = gl.getAttribLocation( program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
    squishMatrixLoc = gl.getUniformLocation( program, "squishMatrix" );

    gl.uniform4fv( gl.getUniformLocation(program, "lightPosition"),flatten(lightPosition) );

    apLoc = gl.getUniformLocation( program, "ambientProduct");
    dpLoc = gl.getUniformLocation( program, "diffuseProduct");
    spLoc = gl.getUniformLocation( program, "specularProduct");
    gl.uniform1f( gl.getUniformLocation( program, "shininess" ), materialShininess );

    // handle key commands
    document.onkeydown = handleKeyDown;

    render();
}

function handleKeyDown(event) {
    if (event.keyCode == 37) {
        //Left Arrow Key - heading
        yaw -= 1;
    } else if (event.keyCode == 38) {
        //Up Arrow Key - position of camera along y-axis
        jump -= 0.25;
    } else if (event.keyCode == 39) {
        //Right Arrow Key - heading
        yaw += 1;
    } else if (event.keyCode == 40) {
        //Down Arrow Key - position of camera along y-axis
        jump += 0.25;
    } else if (event.keyCode == 73) {
        // i key - forward
        dist += 0.25;
    } else if (event.keyCode == 74) {
        // j key - left
        scoot += 0.25;
    } else if (event.keyCode == 75) {
        // k key - right
        scoot -= 0.25;
    } else if (event.keyCode == 77) {
        // m key - backward
        dist -= 0.25;
    } else if (event.keyCode == 78) {
        // n key - narrow
        fovy *= 0.9;
    } else if (event.keyCode == 87) {
        // w key - widen
        fovy *= 1.1;
    } else if (event.keyCode == 82) {
        // r key - reset view settings
        dist = -5;
        scoot = 0;
        jump = 0;
        fovy = 45;
        yaw = 0;
    }
}

function render(t) {
    
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    jump = bounceHeight(t);
    squishFactors = squish(t);
    squishMatrix = scale(squishFactors[0], squishFactors[1], 1);
    squishMatrix = mult(squishMatrix, translate(0, jump, 0));
    gl.uniformMatrix4fv(squishMatrixLoc, false, flatten(squishMatrix));

    // projection matrix
    projectionMatrix = perspective(fovy, aspect, near, far);
    projectionMatrix = mult(projectionMatrix, rotate(yaw, [0,1,0]));
    projectionMatrix = mult(projectionMatrix, translate(scoot, jump, dist));
    projectionMatrix = mult(projectionMatrix, rotate(theta, [1,0,0]));
    // send projection matrix to html file
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );

    // draw a single dango
    // build model view matrix
    modelViewMatrix = mult(translate(0, ypos, -5), scale(scaleFactor, scaleFactor, scaleFactor));
    // send model view matrix to html file
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );

    // set colors
    ambientProduct  = mult(lightArray[0], colors[1]);
    diffuseProduct  = mult(lightArray[1], colors[2]);
    //if (don't want specular product)
        specularProduct = vec4(0,0,0,0);
    //else
    //    specularProduct = mult(lightArray[2], colorArray[3]);

    // send colors to shader
    gl.uniform4fv( apLoc, flatten(ambientProduct) );
    gl.uniform4fv( dpLoc, flatten(diffuseProduct) );
    gl.uniform4fv( spLoc, flatten(specularProduct) );

    // draw dango
    for( var j = 0; j < index; j += 3)
        gl.drawArrays( gl.TRIANGLES, j, 3 );

    var eye1 = squishMatrix;
    eye1 = mult(eye1, translate(-.1, 0, .5));
    eye1 = mult(eye1, scale(0.04, 0.3, 1));
    gl.uniformMatrix4fv(squishMatrixLoc, false, flatten(eye1));

    // set colors
    ambientProduct  = mult(lightArray[0], colors[3]);
    diffuseProduct  = mult(lightArray[1], colors[3]);
    //if (don't want specular product)
    specularProduct = vec4(0,0,0,1);

    // send colors to shader
    gl.uniform4fv( apLoc, flatten(ambientProduct) );
    gl.uniform4fv( dpLoc, flatten(diffuseProduct) );
    gl.uniform4fv( spLoc, flatten(specularProduct) );
   // draw eye1
     gl.drawArrays( gl.TRIANGLES, 0, index);

    var eye2 = squishMatrix;
    eye2 = mult(eye2, translate(.1, 0, 0.5));
    eye2 = mult(eye2, scale(0.04, 0.3, 1));
    gl.uniformMatrix4fv(squishMatrixLoc, false, flatten(eye2));
    // draw eye2
    gl.drawArrays( gl.TRIANGLES, 0, index);

    // draw room
    gl.drawArrays (gl.TRIANGLES, index, 36)


    window.requestAnimFrame(render);
}
