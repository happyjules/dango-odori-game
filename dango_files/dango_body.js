// add to init:  	m_sphere = new sphere();
//add to render:  	m_sphere.draw(model_transform);	


var empty = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];

var texCoord = [
    vec2(1, 0),
    vec2(1, 1),
    vec2(0, 1),
    vec2(0, 0)
];

function sphere()
{
	
var a = vec4(0.0, 0.0, -.3,1);
var b = vec4(0.0, 0.842809, 0.333333, 1);
var c = vec4(-0.86497, -0.271405, 0.333333, 1);
var d = vec4(0.86497, -0.271405, 0.333333,1);

this.setTexture = function(){
        this.texCoordsArray.push(texCoord[3]);
        this.texCoordsArray.push(texCoord[2]);
        this.texCoordsArray.push(texCoord[1]);
        this.texCoordsArray.push(texCoord[3]);
        this.texCoordsArray.push(texCoord[1]);
        this.texCoordsArray.push(texCoord[0]); 
    }


	this.numTimesToSubdivide = 5;
	this.vertices = [];
	this.true_normals = [];
	this.indices = [];
	this.texCoordsArray = [];
		
	this.triangle = function(a, b, c) 
		{
			 this.vertices.push(a);
			 this.vertices.push(b);      
			 this.vertices.push(c);
			 
			 this.true_normals.push(a[0],a[1], a[2], 0.0);
			 this.true_normals.push(b[0],b[1], b[2], 0.0);
			 this.true_normals.push(c[0],c[1], c[2], 0.0);

			 this.setTexture();

		}


	this.divideTriangle = function(a, b, c, count) 
		{
			if ( count > 0 ) {
						
				var ab = mix( a, b, 0.5);
				var ac = mix( a, c, 0.5);
				var bc = mix( b, c, 0.5);
						
				ab = normalize(ab, true);
				ac = normalize(ac, true);
				bc = normalize(bc, true);
										
				this.divideTriangle( a, ab, ac, count - 1 );
				this.divideTriangle( ab, b, bc, count - 1 );
				this.divideTriangle( bc, c, ac, count - 1 );
				this.divideTriangle( ab, bc, ac, count - 1 );
			}
			else { 
				this.triangle( a, b, c );
			}
		}
	
	this.populate_vertices = ( function (self) 
		{
			self.divideTriangle(a, b, c, self.numTimesToSubdivide);
			self.divideTriangle(d, c, b, self.numTimesToSubdivide);
			self.divideTriangle(a, d, b, self.numTimesToSubdivide);
			self.divideTriangle(a, c, d, self.numTimesToSubdivide); 
		} 
		)(this);
	
	this.init_buffers = ( function (self)
		{
			self.position_buffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, self.position_buffer);
			gl.bufferData(gl.ARRAY_BUFFER, flatten(self.vertices), gl.STATIC_DRAW);	
			
			self.true_normal_buffer = gl.createBuffer();
			gl.bindBuffer( gl.ARRAY_BUFFER, self.true_normal_buffer);
			gl.bufferData( gl.ARRAY_BUFFER, flatten(self.true_normals), gl.STATIC_DRAW );

			 self.tBuffer = gl.createBuffer();
          	gl.bindBuffer( gl.ARRAY_BUFFER, self.tBuffer );
          	gl.bufferData( gl.ARRAY_BUFFER, flatten(self.texCoordsArray), gl.STATIC_DRAW );

          	self.image = document.getElementById("white");
          	self.texture = gl.createTexture();
          	gl.bindTexture(gl.TEXTURE_2D, self.texture);

          	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, 
            gl.RGB, gl.UNSIGNED_BYTE, self.image);
            gl.generateMipmap( gl.TEXTURE_2D );

            gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST );
            gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
            gl.bindTexture(gl.TEXTURE_2D, null);

		}
		)(this);
	
	this.update_uniforms = function(model_transform)
	{		
 	gl.uniform1i(useTextureLoc, 0);
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(model_transform) );
    gl.uniformMatrix4fv(squishMatrixLoc, false, flatten(squishMatrix));

    gl.uniform4fv( apLoc, flatten(ambientProduct) );
    gl.uniform4fv( dpLoc, flatten(diffuseProduct) );
    gl.uniform4fv( spLoc, flatten(specularProduct) );
 
	}


	this.draw = function(model_transform)
	{		
		this.update_uniforms(model_transform);

   		gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.tBuffer);
        gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
		gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.true_normal_buffer );
		gl.vertexAttribPointer( tNormal, 4, gl.FLOAT, false, 0, 0 );
		
		gl.drawArrays( gl.TRIANGLES, 0, this.vertices.length);
	}
}