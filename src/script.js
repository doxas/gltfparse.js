
import baseVs from './shader/base.vert';
import baseFs from './shader/base.frag';
import noiseVs from './shader/noise.vert';
import noiseFs from './shader/noise.frag';

import glcubic from './gl3Core.js';

// variable ===============================================================
let gl3, gl, run, mat4, qtn, count, nowTime, framebuffer;
let canvas, canvasWidth, canvasHeight;
let audio;

// shader
let basePrg, noisePrg;

// geometry
let gltfNode = [];

// test
let gRoughness = 0.5;
let gMetallic  = 0.5;

// const PATH_STRING = './resource/assassin_gai/scene.gltf';
const PATH_STRING = './resource/ac-cobra-classic/source/AC Cobra 1.glb';

class Mesh {
    constructor(mesh){
        this.textureIsUpdate = false;
        this.primitive       = gl.POINTS;
        this.positionVBO     = null;
        this.normalVBO       = null;
        this.colorVBO        = null;
        this.texCoord0VBO    = null;
        this.texCoord1VBO    = null;
        this.VBO             = [];
        this.IBO             = null;
        this.vertexCount     = 0;
        this.indexCount      = 0;
        this.indexIsInt      = false;
        this.material        = {};
        // primitive type
        if(mesh.hasOwnProperty('primitiveType') === true){
            this.primitive = gl[mesh.primitiveType];
        }
        // attribute
        if(mesh.hasOwnProperty('position') === true){
            this.positionVBO = gl3.createVbo(mesh.position.data);
            this.VBO.push(this.positionVBO);
            this.vertexCount = mesh.position.count;
        }
        if(mesh.hasOwnProperty('normal') === true){
            this.normalVBO = gl3.createVbo(mesh.normal.data);
            this.VBO.push(this.normalVBO);
            if(this.vertexCount === 0){this.vertexCount = mesh.normal.count;}
        }
        if(mesh.hasOwnProperty('color') === true){
            this.colorVBO = gl3.createVbo(mesh.color.data);
            this.VBO.push(this.colorVBO);
            if(this.vertexCount === 0){this.vertexCount = mesh.color.count;}
        }
        if(mesh.hasOwnProperty('texCoord0') === true){
            this.texCoord0VBO = gl3.createVbo(mesh.texCoord0.data);
            this.VBO.push(this.texCoord0VBO);
            if(this.vertexCount === 0){this.vertexCount = mesh.texCoord0.count;}
        }
        if(mesh.hasOwnProperty('texCoord1') === true){
            this.texCoord1VBO = gl3.createVbo(mesh.texCoord1.data);
            this.VBO.push(this.texCoord1VBO);
            if(this.vertexCount === 0){this.vertexCount = mesh.texCoord1.count;}
        }
        // indices
        if(mesh.hasOwnProperty('indices') === true){
            this.indexIsInt = mesh.indices.data instanceof Uint32Array;
            if(this.indexIsInt === true){
                this.IBO = gl3.createIboInt(mesh.indices.data)
            }else{
                this.IBO = gl3.createIbo(mesh.indices.data);
            }
        }
        // material
        let mat = mesh.material;
        if(mat.baseColorTexture.image != null && gl3.textures[mat.baseColorTexture.index] == null){
            gl3.createTextureFromObject(mat.baseColorTexture.image, mat.baseColorTexture.index);
        }
        this.material.baseColor = {
            index: mat.baseColorTexture.index,
            texture: gl3.textures[mat.baseColorTexture.index].texture,
            texCoordIndex: mat.baseColorTexture.texCoordIndex,
            factor: mat.baseColorTexture.factor,
        };
        if(mat.metallicRoughnessTexture.image != null && gl3.textures[mat.metallicRoughnessTexture.index] == null){
            gl3.createTextureFromObject(mat.metallicRoughnessTexture.image, mat.metallicRoughnessTexture.index);
        }
        this.material.metallicRoughness = {
            index: mat.metallicRoughnessTexture.index,
            texture: gl3.textures[mat.metallicRoughnessTexture.index].texture,
            texCoordIndex: mat.metallicRoughnessTexture.texCoordIndex,
            metallicFactor: mat.metallicRoughnessTexture.metallicFactor,
            roughnessFactor: mat.metallicRoughnessTexture.roughnessFactor,
        };
        if(mat.normalTexture.image != null && gl3.textures[mat.normalTexture.index] == null){
            gl3.createTextureFromObject(mat.normalTexture.image, mat.normalTexture.index);
        }
        this.material.normal = {
            index: mat.normalTexture.index,
            texture: gl3.textures[mat.normalTexture.index].texture,
            texCoordIndex: mat.normalTexture.texCoordIndex,
            scale: mat.normalTexture.scale,
        };
        if(mat.occlusionTexture.image != null && gl3.textures[mat.occlusionTexture.index] == null){
            gl3.createTextureFromObject(mat.occlusionTexture.image, mat.occlusionTexture.index);
        }
        this.material.occlusion = {
            index: mat.occlusionTexture.index,
            texture: gl3.textures[mat.occlusionTexture.index].texture,
            texCoordIndex: mat.occlusionTexture.texCoordIndex,
            strength: mat.occlusionTexture.strength,
        };
        if(mat.emissiveTexture.image != null && gl3.textures[mat.emissiveTexture.index] == null){
            gl3.createTextureFromObject(mat.emissiveTexture.image, mat.emissiveTexture.index);
        }
        this.material.emissive = {
            index: mat.emissiveTexture.index,
            texture: gl3.textures[mat.emissiveTexture.index].texture,
            texCoordIndex: mat.emissiveTexture.texCoordIndex,
            factor: mat.emissiveTexture.factor,
        };
    }
}

class Node {
    constructor(node, parentMatrix, root){
        this.isRoot              = root === true;
        this.modelMatrixIsUpdate = false;
        this.children            = [];
        this.position            = [0.0, 0.0, 0.0];
        this.rotation            = [0.0, 0.0, 0.0, 0.0];
        this.scaling             = [1.0, 1.0, 1.0];
        this.defaultMatrix       = node.matrix != null ? node.matrix : mat4.identity(mat4.create());
        this.parentMatrix        = parentMatrix != null ? parentMatrix : mat4.identity(mat4.create());
        this.mMatrix             = mat4.identity(mat4.create());
        this.vMatrix             = mat4.identity(mat4.create());
        this.mvMatrix            = mat4.identity(mat4.create());
        this.vpMatrix            = mat4.identity(mat4.create());
        this.mvpMatrix           = mat4.identity(mat4.create());
        this.inverseMatrix       = mat4.identity(mat4.create());
        this.normalMatrix        = mat4.identity(mat4.create());

        if(node.mesh != null && Array.isArray(node.mesh) === true){
            this.mesh = node.mesh.map((v) => {
                return new Mesh(v);
            });
        }

        this.updateMatrix();
    }
    setPosition(v){
        if(
            (Array.isArray(v) === true && v.length === 3) ||
            (v instanceof Float32Array === true && v.length === 3)
        ){
            this.position = v;
            this.modelMatrixIsUpdate = true;
        }
    }
    setRotate(angle, v){
        if(
            (angle != null && Array.isArray(v) === true && v.length === 3) ||
            (angle != null && v instanceof Float32Array === true && v.length === 3)
        ){
            this.rotation = [v[0], v[1], v[2], angle];
            this.modelMatrixIsUpdate = true;
        }
    }
    setScale(v){
        if(
            (Array.isArray(v) === true && v.length === 3) ||
            (v instanceof Float32Array === true && v.length === 3)
        ){
            this.scaling = v;
            this.modelMatrixIsUpdate = true;
        }
    }
    updateMatrix(vMatrix, vpMatrix){
        let m = mat4.identity(mat4.create());
        let v = vMatrix;
        let vp = vpMatrix;
        if(this.parentMatrix != null){
            mat4.multiply(m, this.parentMatrix, m);
        }
        if(v == null){
            v = this.vMatrix;
        }else{
            this.vMatrix = v;
        }
        if(vp == null){
            vp = this.vpMatrix;
        }else{
            this.vpMatrix = vp;
        }
        mat4.translate(m, this.position, m);
        mat4.rotate(m, this.rotation[3], [this.rotation[0], this.rotation[1], this.rotation[2]] , m);
        mat4.scale(m, this.scaling, m);
        mat4.multiply(m, this.defaultMatrix, this.mMatrix);
        mat4.multiply(v, this.mMatrix, this.mvMatrix);
        mat4.multiply(vp, this.mMatrix, this.mvpMatrix);
        mat4.inverse(this.mMatrix, this.inverseMatrix);
        mat4.transpose(this.inverseMatrix, this.normalMatrix);

        this.modelMatrixIsUpdate = false;

        this.children.forEach((w, index) => {
            // 子ノードの親行列を更新してから再計算させる
            w.parentMatrix = this.mMatrix;
            w.updateMatrix(v, vp);
        });
    }
}

export default class WebGLFrame {
    static get VERSION(){return 'v0.0.1';}
    constructor(){
        gl3 = new glcubic();
        gl3.init(
            document.getElementById('webgl'),
            null,
            {
                webgl2Mode: true,
                consoleMessage: true
            }
        );
        if(!gl3.ready){
            console.log('initialize error');
            return;
        }
        run           = true;
        canvas        = gl3.canvas;
        gl            = gl3.gl;
        mat4          = gl3.Math.Mat4;
        qtn           = gl3.Math.Qtn;
        canvasWidth   = window.innerWidth;
        canvasHeight  = window.innerHeight;
        canvas.width  = canvasWidth;
        canvas.height = canvasHeight;

        this.eventSetting();

        this.debugSetting();

        audio = new gl3.Audio(0.5, 0.5);
        // audio.load('sound/amairo.mp3', 0, true, true, () => {
            // gl3.createTextureFromFile('./resource/snoise.png', 0, () => {
                this.shaderLoader();
                this.gltfLoader()
                .then((data) => {
                    this.init(data);
                })
                .catch((err) => {
                    console.error(err);
                });
            // });
        // });
    }

    eventSetting(){
        window.addEventListener('keydown', (evt) => {
            if(evt.keyCode === 27){
                run = false;
                if(audio != null && audio.src[0] != null && audio.src[0].loaded){
                    audio.src[0].stop();
                }
            }
        }, false);
        window.addEventListener('resize', () => {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, null);
            gl3.deleteFramebuffer(framebuffer);
            canvasWidth = window.innerWidth;
            canvasHeight = window.innerHeight;
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            framebuffer = gl3.createFramebuffer(canvasWidth, canvasHeight, 1);
            gl.bindTexture(gl.TEXTURE_2D, framebuffer.texture);
        }, false);
    }

    debugSetting(){
        let wrapper = new gl3.Gui.Wrapper();
        document.body.appendChild(wrapper.getElement());

        let roughSlider = new gl3.Gui.Slider('roughness', gRoughness * 100, 0, 100, 1);
        roughSlider.add('input', (evt, self) => {gRoughness = self.getValue() * 0.01;});
        wrapper.append(roughSlider.getElement());
        let metalSlider = new gl3.Gui.Slider('metallic', gMetallic * 100, 0, 100, 1);
        metalSlider.add('input', (evt, self) => {gMetallic = self.getValue() * 0.01;});
        wrapper.append(metalSlider.getElement());
    }

    shaderLoader(){
        // base texture program
        basePrg = gl3.createProgramFromSource(
            baseVs,
            baseFs,
            ['position', 'normal', 'texCoord0'],
            [3, 3, 2],
            [
                'mMatrix',
                'mvMatrix',
                'mvpMatrix',
                'normalMatrix',
                'baseColorFactor',
                'lightPosition',
                'eyePosition',
                'baseColorTexture',
                'metallicRoughnessTexture',
                'normalTexture',
                'metallicFactor',
                'roughnessFactor',
                'normalScale',
            ],
            [
                'matrix4fv',
                'matrix4fv',
                'matrix4fv',
                'matrix4fv',
                '4fv',
                '3fv',
                '3fv',
                '1i',
                '1i',
                '1i',
                '1f',
                '1f',
                '1f',
            ],
        );
        // noise texture program
        noisePrg = gl3.createProgramFromSource(
            noiseVs,
            noiseFs,
            ['position'],
            [3],
            ['textureUnit', 'resolution', 'time'],
            ['1i', '2fv', '1f'],
        );
    }

    gltfLoader(){
        return new Promise((resolve, reject) => {
            new GLTFParse().load(PATH_STRING)
            .then((data) => {
                console.log('🍭', data);
                resolve(data);
            })
            .catch((err) => {
                reject(err);
            });
        });
    }

    generateNodeFromGltf(data, parentMatrix, root){
        let node = new Node(data, parentMatrix, root);
        let index = gltfNode.length;
        gltfNode.push(node);
        if(Array.isArray(data.children) === true){
            data.children.forEach((v) => {
                let child = this.generateNodeFromGltf(v, gltfNode[index].mMatrix);
                gltfNode[index].children.push(child);
            });
        }
        return node;
    }

    init(gltfData){

        // gltf
        gltfData.scenes.forEach((v) => {
            // シーンレベルで forEach するので、これがルートノードになる（第三引数）
            this.generateNodeFromGltf(v, null, true);
        });
        console.log('🍰', gltfNode);

        // plane
        let planePosition = [
            -1.0,  1.0,  0.0,
             1.0,  1.0,  0.0,
            -1.0, -1.0,  0.0,
             1.0, -1.0,  0.0
        ];
        let planeIndex = [
            0, 2, 1,
            1, 2, 3
        ];
        let planeVBO = [
            gl3.createVbo(planePosition)
        ];
        let planeIBO = gl3.createIbo(planeIndex);

        // matrix
        let mMatrix      = mat4.identity(mat4.create());
        let vMatrix      = mat4.identity(mat4.create());
        let pMatrix      = mat4.identity(mat4.create());
        let vpMatrix     = mat4.identity(mat4.create());
        let mvpMatrix    = mat4.identity(mat4.create());
        let normalMatrix = mat4.identity(mat4.create());
        let invMatrix    = mat4.identity(mat4.create());

        // framebuffer
        framebuffer = gl3.createFramebuffer(canvasWidth, canvasHeight, 1);

        // texture
        gl3.textures.map((v, i) => {
            if(v != null && v.texture != null){
                gl.activeTexture(gl.TEXTURE0 + i);
                gl.bindTexture(gl.TEXTURE_2D, v.texture);
            }
        });

        // gl flags
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.BLEND);
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONW_MINUS_SRC_ALPHA, gl.ONE, gl.ONE);

        // variables
        let beginTime = Date.now();
        let nowTime = 0;
        let cameraPosition = [0.0, 5.0, 5.0];
        let centerPoint    = [0.0, 0.0, 0.0];
        let upDirection    = [0.0, 0.707, -0.707];
        let lightPosition  = [2.0, 5.0, 9.0];
        let ambientColor   = [0.1, 0.1, 0.1];
        let targetTexture  = 0;

        // audio
        // audio.src[0].play();

        // rendering
        render();
        function render(){
            nowTime = Date.now() - beginTime;
            nowTime /= 1000;
            count++;

            // animation
            if(run){
                requestAnimationFrame(render);
            }else{
                clean();
                return;
            }

            // canvas
            canvasWidth   = window.innerWidth;
            canvasHeight  = window.innerHeight;
            canvas.width  = canvasWidth;
            canvas.height = canvasHeight;

            // view x proj
            mat4.vpFromCameraProperty(
                cameraPosition,
                centerPoint,
                upDirection,
                60,
                canvasWidth / canvasHeight,
                0.1,
                10.0,
                vMatrix, pMatrix, vpMatrix
            );

            // gltf update
            gltfNode.forEach((v) => {
                if(v.isRoot === true){
                    v.updateMatrix(vMatrix, vpMatrix);
                    v.setRotate(nowTime, [0.0, 1.0, 0.0]);
                }
            });

            // render to framebuffer ==========================================
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            // gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer.framebuffer);
            gl3.sceneView(0, 0, canvasWidth, canvasHeight);
            gl3.sceneClear([0.3, 0.3, 0.4, 1.0], 1.0);

            // program
            basePrg.useProgram();

            // meshes
            gltfNode.forEach((v) => {
                if(Array.isArray(v.mesh) !== true){return;}
                v.mesh.forEach((w) => {
                    basePrg.pushShader([
                        v.mMatrix,
                        v.mvMatrix,
                        v.mvpMatrix,
                        v.normalMatrix,
                        w.material.baseColor.factor,
                        lightPosition,
                        cameraPosition,
                        w.material.baseColor.index,
                        w.material.metallicRoughness.index,
                        w.material.normal.index,
                        // w.material.metallicRoughness.metallicFactor,
                        // w.material.metallicRoughness.roughnessFactor,
                        gMetallic,
                        gRoughness,
                        w.material.normal.scale,
                    ]);
                    if(w.indexCount > 0){
                        basePrg.setAttribute(w.VBO, w.IBO);
                        if(w.indexIsInt === true){
                            gl3.drawElementsInt(w.primitive, w.indexCount);
                        }else{
                            gl3.drawElements(w.primitive, w.indexCount);
                        }
                    }else{
                        basePrg.setAttribute(w.VBO);
                        gl3.drawArrays(w.primitive, w.vertexCount);
                    }
                });
            });

            // render to canvas
            // gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            // gl3.sceneView(0, 0, canvasWidth, canvasHeight);
            // gl3.sceneClear([0.0, 0.0, 0.0, 1.0], 1.0);
            //
            // // program
            // noisePrg.useProgram();
            // noisePrg.setAttribute(planeVBO, planeIBO);
            // noisePrg.pushShader([1, [canvasWidth, canvasHeight], nowTime]);
            // gl3.drawElements(gl.TRIANGLES, planeIndex.length);

            // final
            gl.flush();
        }

        function clean(){
            torusVBO.map((v) => {
                gl3.deleteBuffer(v);
            });
            gl3.deleteBuffer(torusIBO);
            planeVBO.map((v) => {
                gl3.deleteBuffer(v);
            });
            gl3.deleteBuffer(planeIBO);
            gl3.deleteFramebuffer(framebuffer);
            gl3.textures.map((v) => {
                if(v == null || v.texture == null){return;}
                gl3.deleteTexture(v.texture);
            });
        }
    }
}

window.WebGLFrame = WebGLFrame;

