// add to init:  	m_sphere = new sphere();
//add to render:  	m_sphere.draw(model_transform);	


function sphere()
{
	
var a = vec4(0.0, 0.0, -.3,1);
var b = vec4(0.0, 0.842809, 0.333333, 1);
var c = vec4(-0.86497, -0.271405, 0.333333, 1);
var d = vec4(0.86497, -0.271405, 0.333333,1);


	this.numTimesToSubdivide = 5;
	this.vertices = [];
	this.true_normals = [];
	this.indices = [];
		
	this.triangle = function(a, b, c) 
		{
			 this.vertices.push(a);
			 this.vertices.push(b);      
			 this.vertices.push(c);
			 
			 this.true_normals.push(a[0],a[1], a[2], 0.0);
			 this.true_normals.push(b[0],b[1], b[2], 0.0);
			 this.true_normals.push(c[0],c[1], c[2], 0.0);

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
			
			gl.bindTexture( gl.TEXTURE_2D, null);
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

		gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
		gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.true_normal_buffer );
		gl.vertexAttribPointer( tNormal, 4, gl.FLOAT, false, 0, 0 );
		
		gl.drawArrays( gl.TRIANGLES, 0, this.vertices.length );
	}
}