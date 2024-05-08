// This function takes the translation and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// You can use the MatrixMult function defined in project5.html to multiply two 4x4 matrices in the same format.
function GetModelViewMatrix( translationX, translationY, translationZ, rotationX, rotationY )
{
	// [TO-DO] Modify the code below to form the transformation matrix.
	var cosX = Math.cos(rotationX);
	var sinX = Math.sin(rotationX);
	var cosY = Math.cos(rotationY);
	var sinY = Math.sin(rotationY);
	
 	var mvp = [
		cosY,        	0, 				sinY, 			0,
		sinX*sinY,   	cosX, 			-sinX*cosY, 	0,
		-cosX*sinY,  	sinX, 			cosX*cosY,  	0,
		translationX,	translationY, 	translationZ, 	1
	];
	
	return mvp;
}


// [TO-DO] Complete the implementation of the following class.

class MeshDrawer {
    constructor() {
        const MeshVS = `
            attribute vec3 pos;
            attribute vec2 texCoord;
            attribute vec3 normal;
            uniform mat4 mvp;
            uniform mat4 mv;
            uniform mat3 normalMatrix;
            uniform int swap;
            uniform vec3 lightDir;
            uniform float shininess;
            varying vec2 vTexCoord;
            varying vec3 vNormal;
            varying vec3 cameraSpacePos;

            void main() {
                vec3 position = pos;
                if (swap == 1) {
                    position = vec3(pos.x, pos.z, pos.y);
                }
                gl_Position = mvp * vec4(position, 1.0);
                vTexCoord = texCoord;

                vNormal = normalize(normalMatrix * normal);
                cameraSpacePos = (mv * vec4(pos, 1.0)).xyz;
            }
        `;

        const MeshFS = `
            precision mediump float;
            uniform sampler2D tex;
            uniform int showTexture;
            uniform vec3 lightDir;
            uniform float shininess;
            varying vec2 vTexCoord;
            varying vec3 vNormal;
            varying vec3 cameraSpacePos;

            void main() {
                vec3 N = normalize(vNormal);
                vec3 L = normalize(lightDir);
                vec3 V = normalize(-cameraSpacePos);

                vec3 H = normalize(L + V);
                float intensity = max(dot(N, L), 0.0);
                float specular = pow(max(dot(N, H), 0.0), shininess);

                vec4 color;

                if (showTexture == 1) {
                    color = texture2D(tex, vTexCoord);
                } else {
                    color = vec4(1.0, 1.0, 1.0, 1.0); // White color
                }

                gl_FragColor = vec4(color.rgb * intensity + vec3(specular), color.a);
            }
        `;

        this.prog = InitShaderProgram(MeshVS, MeshFS);
        this.mvp = gl.getUniformLocation(this.prog, 'mvp');
        this.mv = gl.getUniformLocation(this.prog, 'mv');
        this.normalMatrix = gl.getUniformLocation(this.prog, 'normalMatrix');
        this.vertPos = gl.getAttribLocation(this.prog, 'pos');
        this.vertTexCoord = gl.getAttribLocation(this.prog, 'texCoord');
        this.vertNormal = gl.getAttribLocation(this.prog, 'normal');
        this.showTextureUniform = gl.getUniformLocation(this.prog, 'showTexture');
        this.swapCoord = gl.getUniformLocation(this.prog, 'swap');
        this.lightDir = gl.getUniformLocation(this.prog, 'lightDir');
        this.shininessUniform = gl.getUniformLocation(this.prog, 'shininess');
        this.showText = true;

        this.vertbuffer = gl.createBuffer();
        this.texbuffer = gl.createBuffer();
        this.normalsbuffer = gl.createBuffer();
        this.texture = gl.createTexture();
    }

    setMesh(vertPos, texCoords, normals) {
        this.numTriangles = vertPos.length / 3;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalsbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
    }

    swapYZ(swap) {
        gl.useProgram(this.prog);
        gl.uniform1i(this.swapCoord, swap);
    }

	// This method is called to draw the triangular mesh.
	// The arguments are the model-view-projection transformation matrixMVP,
	// the model-view transformation matrixMV, the same matrix returned
	// by the GetModelViewProjection function above, and the normal
	// transformation matrix, which is the inverse-transpose of matrixMV.
	draw(matrixMVP, matrixMV, matrixNormal) {
		gl.useProgram(this.prog);

		gl.uniformMatrix4fv(this.mvp, false, matrixMVP);
		gl.uniformMatrix4fv(this.mv, false, matrixMV);
		gl.uniformMatrix3fv(this.normalMatrix, false, matrixNormal);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.enableVertexAttribArray(this.vertPos);
		gl.vertexAttribPointer(this.vertPos, 3, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
		gl.enableVertexAttribArray(this.vertTexCoord);
		gl.vertexAttribPointer(this.vertTexCoord, 2, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalsbuffer);
		gl.enableVertexAttribArray(this.vertNormal);
		gl.vertexAttribPointer(this.vertNormal, 3, gl.FLOAT, false, 0, 0);

		gl.uniform1i(this.showTextureUniform, this.showText ? 1 : 0);

		gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
	}


    setTexture(img) {
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);
    }

    showTexture(show) {
        this.showText = show;
    }
	// This method is called to set the incoming light direction
	setLightDir(x, y, z) {
		gl.useProgram(this.prog);
		gl.uniform3f(this.lightDir, x, y, z);
	}

	// This method is called to set the shininess of the material
	setShininess(shininess) {
		gl.useProgram(this.prog);
		gl.uniform1f(this.shininessUniform, shininess);
	}

}
