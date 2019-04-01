
MySample.main = (function() {
    'use strict';

    let canvas = document.getElementById('canvas-main');
    let gl = canvas.getContext('webgl');

    let scene = {};
        //Position of Eye/Viewer
        //scene geometry (planes and spheres)
    let data = [];

    let buffers = {};
    let shaders = {};

    //Structures that I'm guessing I'll need
    let light = {};
    let ray = {};
        //origin
        //direction
        //timek
    let plane = {};
    let sphere = {};
    let intersection = {};
        // hit: false,
        // t:
        // surfaceNormal:
        // reflectedRay:
        // surfaceMaterial:
    
        


    function lightMat(Ka, La, Kd, Ld){
        let ambient = [];
        let diffuse = [];
        //let L1 = [light1Position[0] - model.,]

        
        ambient[0] = Ka[0]*La[0];
        ambient[1] = Ka[1]*La[1];
        ambient[2] = Ka[2]*La[2];
        //ambient[3] = 1.0;

        let totalLight = new Float32Array([ambient[0], ambient[1], ambient[2]]);
        return totalLight;
        //let diffuse = [];

    }

    function diffuseLightMat(Kd, Ld){
        let ambient = [];
        let diffuse = [];
        //let L1 = [light1Position[0] - model.,]

        
        ambient[0] = Kd[0]*Ld[0];
        ambient[1] = Kd[1]*Ld[1];
        ambient[2] = Kd[2]*Ld[2];
        ambient[3] = Kd[0]*Ld[3];
        ambient[4] = Kd[1]*Ld[4];
        ambient[5] = Kd[2]*Ld[5];
        ambient[6] = Kd[0]*Ld[6];
        ambient[7] = Kd[1]*Ld[7];
        ambient[8] = Kd[2]*Ld[8];
        //ambient[3] = 1.0;

        let totalLight = new Float32Array([ambient[0], ambient[1], ambient[2], ambient[3], ambient[4], ambient[5], ambient[6], ambient[7], ambient[8]]);
        return totalLight;
        //let diffuse = [];

    }
    
    //------------------------------------------------------------------
    //
    // Prepare the data to be rendered
    //
    //------------------------------------------------------------------
    function initializeData() {
        data.vertices = new Float32Array([
            // -0.75, -0.75, 0.0,
            // -0.75, 0.75, 0.0,
            // 0.75, 0.75, 0.0,
            // 0.75, -0.75, 0.0
            -1.0, -1.00, 0.0,
            -1.0, 1.00, 0.0,
            1.0, 1.00, 0.0,
            1.0, -1.00, 0.0
        ]);

        data.indices = new Uint16Array([ 0, 1, 2, 3, 0, 2 ]);


    //Initialize lights
        let Ka = [1.0, 1.0, 1.0];
        let La = [0.1, 0.1, 0.1];
        let Kd = [1.0, 1.0, 1.0];
        let Ld = [
            // 1000.0, 1000.0, 1000.0,
            // 2000.0, 2000.0, 1200.0,
            // 0.0, 0.0, 2000.0

             0.5, 0.5, 0.5,
             0.2, 0.2, 0.0,
             0.0, 0.0, 0.0

        ];
        light.matLight = lightMat(Ka, La);
        light.diffuseLight = diffuseLightMat(Kd, Ld);
        light.lightPosition =[
            0.0, 0.0, -1.0,
            0.0, 10.0, -3.0,
            10.0, 5.0, -3.0
        ];

    //initialize scene
    scene.vEye = new Float32Array([0.0, 0.0, 3.0]);
        // scene.sphere1 = {
        //     center: {
        //         x:0,
        //         y:0,
        //         z:0
        //     },
        //     radius: 10


        // };
    

    }

    //------------------------------------------------------------------
    //
    // Prepare and set the Vertex Buffer Object to render.
    //
    //------------------------------------------------------------------
    function initializeBufferObjects() {
        buffers.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, data.vertices, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        buffers.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data.indices, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }

    //------------------------------------------------------------------
    //
    // Associate the vertex and pixel shaders, and the expected vertex
    // format with the VBO.
    //
    //------------------------------------------------------------------
    function associateShadersWithBuffers() {
        gl.useProgram(shaders.shaderProgram);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertexBuffer);
        let position = gl.getUniformLocation(shaders.shaderProgram, 'aPosition');
        gl.vertexAttribPointer(position, 3, gl.FLOAT, false, data.vertices.BYTES_PER_ELEMENT * 3, 0);
        gl.enableVertexAttribArray(position);

        shaders.locRemove = gl.getUniformLocation(shaders.shaderProgram, 'remove');
    }

    //------------------------------------------------------------------
    //
    // Prepare and set the shaders to be used.
    //
    //------------------------------------------------------------------
    function initializeShaders() {
        return new Promise((resolve, reject) => {
            loadFileFromServer('shaders/ray-trace.vs')
            .then(source => {
                shaders.vertexShader = gl.createShader(gl.VERTEX_SHADER);
                gl.shaderSource(shaders.vertexShader, source);
                gl.compileShader(shaders.vertexShader);
                return loadFileFromServer('shaders/ray-trace.frag');
            })
            .then(source => {
                shaders.fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
                gl.shaderSource(shaders.fragmentShader, source);
                gl.compileShader(shaders.fragmentShader);
            })
            .then(() => {
                shaders.shaderProgram = gl.createProgram();
                gl.attachShader(shaders.shaderProgram, shaders.vertexShader);
                gl.attachShader(shaders.shaderProgram, shaders.fragmentShader);
                gl.linkProgram(shaders.shaderProgram);

                let errVertex = gl.getShaderInfoLog(shaders.vertexShader);
                if (errVertex.length > 0) {
                    console.log('Vertex errors: ', errVertex);
                }
                let errFragment = gl.getShaderInfoLog(shaders.fragmentShader);
                if (errFragment.length > 0) {
                    console.log('Frag errors: ', errFragment);
                }
                resolve();
            })
            .catch(error => {
                console.log('(initializeShaders) something bad happened: ', error);
                reject();
            });
        });
    }

    //------------------------------------------------------------------
    //
    // Scene updates go here.
    //
    //------------------------------------------------------------------
    function update(timeCurrent) {
        gl.uniform1i(shaders.locRemove, 1);
    }

    //------------------------------------------------------------------
    //
    // Rendering code goes here
    //
    //------------------------------------------------------------------
    function render() {
        gl.clearColor(0.3921568627450980392156862745098, 0.58431372549019607843137254901961, 0.92941176470588235294117647058824, 1.0);
        gl.clearDepth(1.0);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        //
        // This sets which buffer to use for the draw call in the render function.
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indexBuffer);
        gl.drawElements(gl.TRIANGLES, data.indices.length, gl.UNSIGNED_SHORT, 0);
    }

    //------------------------------------------------------------------
    //
    // This is the animation loop.
    //
    //------------------------------------------------------------------
    function animationLoop(time) {

        update(time);
        render();

        requestAnimationFrame(animationLoop);
    }

    console.log('initializing...');
    console.log('    raw data')
    initializeData();
    console.log('    vertex buffer objects');
    initializeBufferObjects();
    console.log('    shaders');
    initializeShaders()
    .then(() => {
        console.log('    binding shaders to VBOs');
        associateShadersWithBuffers();
        console.log('initialization complete!');
        requestAnimationFrame(animationLoop);
    });

}());
