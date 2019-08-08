
import baseVs from './shader/base.vert';
import baseFs from './shader/base.frag';
import noiseVs from './shader/noise.vert';
import noiseFs from './shader/noise.frag';

import glcubic from './gl3Core.js';

// variable ===============================================================
let gl3, gl, run, vec3, mat4, qtn, count, nowTime, framebuffer;
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
// const PATH_STRING = './resource/ac-cobra-classic/source/AC Cobra 1.glb';
const PATH_STRING = './resource/E6.glb';

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
            if(this.vertexCount === 0){this.vertexCount = mesh.texCoord0.count;}
        }
        if(mesh.hasOwnProperty('texCoord1') === true){
            this.texCoord1VBO = gl3.createVbo(mesh.texCoord1.data);
            if(this.vertexCount === 0){this.vertexCount = mesh.texCoord1.count;}
        }
        if(this.texCoord0VBO != null && this.texCoord1VBO != null){
            this.VBO.push(this.texCoord0VBO, this.texCoord1VBO);
        }else if(this.texCoord0VBO != null && this.texCoord1VBO == null){
            this.VBO.push(this.texCoord0VBO, this.texCoord0VBO);
        }else if(this.texCoord0VBO == null && this.texCoord1VBO != null){
            this.VBO.push(this.texCoord1VBO, this.texCoord1VBO);
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
        let texture = null;
        if(mat.baseColorTexture.image != null && gl3.textures[mat.baseColorTexture.index] == null){
            gl3.createTextureFromObject(mat.baseColorTexture.image, mat.baseColorTexture.index);
        }
        if(mat.baseColorTexture.image != null && gl3.textures[mat.baseColorTexture.index] != null){
            texture = gl3.textures[mat.baseColorTexture.index].texture;
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mat.baseColorTexture.sampler.minFilter);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, mat.baseColorTexture.sampler.magFilter);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, mat.baseColorTexture.sampler.wrapS);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, mat.baseColorTexture.sampler.wrapT);
        }
        this.material.baseColor = {
            index: mat.baseColorTexture.index,
            texture: texture,
            texCoordIndex: mat.baseColorTexture.texCoordIndex,
            factor: mat.baseColorTexture.factor,
        };
        texture = null;
        if(mat.metallicRoughnessTexture.image != null && gl3.textures[mat.metallicRoughnessTexture.index] == null){
            gl3.createTextureFromObject(mat.metallicRoughnessTexture.image, mat.metallicRoughnessTexture.index);
        }
        if(mat.metallicRoughnessTexture.image != null && gl3.textures[mat.metallicRoughnessTexture.index] != null){
            texture = gl3.textures[mat.metallicRoughnessTexture.index].texture;
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mat.metallicRoughnessTexture.sampler.minFilter);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, mat.metallicRoughnessTexture.sampler.magFilter);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, mat.metallicRoughnessTexture.sampler.wrapS);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, mat.metallicRoughnessTexture.sampler.wrapT);
        }
        this.material.metallicRoughness = {
            index: mat.metallicRoughnessTexture.index,
            texture: texture,
            texCoordIndex: mat.metallicRoughnessTexture.texCoordIndex,
            metallicFactor: mat.metallicRoughnessTexture.metallicFactor,
            roughnessFactor: mat.metallicRoughnessTexture.roughnessFactor,
        };
        texture = null;
        if(mat.normalTexture.image != null && gl3.textures[mat.normalTexture.index] == null){
            gl3.createTextureFromObject(mat.normalTexture.image, mat.normalTexture.index);
        }
        if(mat.normalTexture.image != null && gl3.textures[mat.normalTexture.index] != null){
            texture = gl3.textures[mat.normalTexture.index].texture;
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mat.normalTexture.sampler.minFilter);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, mat.normalTexture.sampler.magFilter);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, mat.normalTexture.sampler.wrapS);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, mat.normalTexture.sampler.wrapT);
        }
        this.material.normal = {
            index: mat.normalTexture.index,
            texture: texture,
            texCoordIndex: mat.normalTexture.texCoordIndex,
            scale: mat.normalTexture.scale,
        };
        texture = null;
        if(mat.occlusionTexture.image != null && gl3.textures[mat.occlusionTexture.index] == null){
            gl3.createTextureFromObject(mat.occlusionTexture.image, mat.occlusionTexture.index);
        }
        if(mat.occlusionTexture.image != null && gl3.textures[mat.occlusionTexture.index] != null){
            texture = gl3.textures[mat.occlusionTexture.index].texture;
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mat.occlusionTexture.sampler.minFilter);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, mat.occlusionTexture.sampler.magFilter);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, mat.occlusionTexture.sampler.wrapS);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, mat.occlusionTexture.sampler.wrapT);
        }
        this.material.occlusion = {
            index: mat.occlusionTexture.index,
            texture: texture,
            texCoordIndex: mat.occlusionTexture.texCoordIndex,
            strength: mat.occlusionTexture.strength,
        };
        texture = null;
        if(mat.emissiveTexture.image != null && gl3.textures[mat.emissiveTexture.index] == null){
            gl3.createTextureFromObject(mat.emissiveTexture.image, mat.emissiveTexture.index);
        }
        if(mat.emissiveTexture.image != null && gl3.textures[mat.emissiveTexture.index] != null){
            texture = gl3.textures[mat.emissiveTexture.index].texture;
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mat.emissiveTexture.sampler.minFilter);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, mat.emissiveTexture.sampler.magFilter);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, mat.emissiveTexture.sampler.wrapS);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, mat.emissiveTexture.sampler.wrapT);
        }
        this.material.emissive = {
            index: mat.emissiveTexture.index,
            texture: texture,
            texCoordIndex: mat.emissiveTexture.texCoordIndex,
            factor: mat.emissiveTexture.factor,
        };
    }
}

class Node {
    constructor(node, parentMatrix, root){
        this.name                = node.name;
        this.isRoot              = root === true;
        this.modelMatrixIsUpdate = false;
        this.children            = [];
        this.position            = node.translation != null ? node.translation : [0.0, 0.0, 0.0];
        this.rotation            = node.rotation != null ? node.rotation : [0.0, 0.0, 0.0, 0.0];
        this.scaling             = node.sclae != null ? node.scale : [1.0, 1.0, 1.0];
        this.parentMatrix        = parentMatrix != null ? parentMatrix : mat4.identity(mat4.create());
        this.defaultMatrix       = node.matrix;
        this.mMatrix             = mat4.identity(mat4.create());
        this.vMatrix             = mat4.identity(mat4.create());
        this.pMatrix             = mat4.identity(mat4.create());
        this.mvMatrix            = mat4.identity(mat4.create());
        this.mvpMatrix           = mat4.identity(mat4.create());
        this.inverseMatrix       = mat4.identity(mat4.create());
        this.normalMatrix        = mat4.identity(mat4.create());

        if(node.mesh != null && Array.isArray(node.mesh) === true){
            this.mesh = node.mesh.map((v) => {
                return new Mesh(v);
            });
        }

        this.updateMatrix(null, null, true);
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
            this.rotation = qtn.rotate(angle, vec3.normalize(v));
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
    updateMatrix(vMatrix, pMatrix, forceUpdate){
        let force = forceUpdate === true;
        if(this.modelMatrixIsUpdate === true || force === true){
            let m = mat4.compose(this.position, this.rotation, this.scaling);
            if(this.defaultMatrix == null){
                this.mMatrix = mat4.copy(m);
            }else{
                this.mMatrix = mat4.multiply(m, this.defaultMatrix);
            }
            if(this.parentMatrix != null){
                this.mMatrix = mat4.multiply(this.parentMatrix, this.mMatrix);
            }
            force = true;
        }
        this.modelMatrixIsUpdate = false;

        let v = vMatrix;
        let p = pMatrix;
        if(v == null){
            v = this.vMatrix;
        }else{
            this.vMatrix = v;
        }
        if(p == null){
            p = this.pMatrix;
        }else{
            this.pMatrix = p;
        }
        mat4.multiply(v, this.mMatrix, this.mvMatrix);
        mat4.multiply(p, this.mvMatrix, this.mvpMatrix);
        mat4.inverse(this.mMatrix, this.inverseMatrix);
        mat4.transpose(this.inverseMatrix, this.normalMatrix);

        this.children.forEach((w, index) => {
            // 子ノードの親行列を更新してから再計算させる
            w.parentMatrix = this.mMatrix;
            w.updateMatrix(v, p, force);
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
        vec3          = gl3.Math.Vec3;
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
            // gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            // gl.activeTexture(gl.TEXTURE1);
            // gl.bindTexture(gl.TEXTURE_2D, null);
            // gl3.deleteFramebuffer(framebuffer);
            canvasWidth = window.innerWidth;
            canvasHeight = window.innerHeight;
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            // framebuffer = gl3.createFramebuffer(canvasWidth, canvasHeight, 1);
            // gl.bindTexture(gl.TEXTURE_2D, framebuffer.texture);
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
            ['position', 'normal', 'texCoord0', 'texCoord1'],
            [3, 3, 2, 2],
            [
                'mvMatrix',
                'mvpMatrix',
                'normalMatrix',
                'lightPosition',
                'baseColorTexture',
                'metallicRoughnessTexture',
                'normalTexture',
                'occlusionTexture',
                'emissiveTexture',
                'baseColorTexCoordZero',
                'metallicRoughnessTexCoordZero',
                'normalTexCoordZero',
                'occlusionTexCoordZero',
                'emissiveTexCoordZero',
                'baseColorTextureExists',
                'metallicRoughnessTextureExists',
                'normalTextureExists',
                'occlusionTextureExists',
                'emissiveTextureExists',
                'baseColorFactor',
                'metallicFactor',
                'roughnessFactor',
                'normalScale',
                'occlusionStrength',
                'emissiveFactor',
                'flags',
            ], [
                'matrix4fv',
                'matrix4fv',
                'matrix4fv',
                '3fv',
                '1i',
                '1i',
                '1i',
                '1i',
                '1i',
                '1i',
                '1i',
                '1i',
                '1i',
                '1i',
                '1i',
                '1i',
                '1i',
                '1i',
                '1i',
                '4fv',
                '1f',
                '1f',
                '1f',
                '1f',
                '3fv',
                '4iv',
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
        // framebuffer = gl3.createFramebuffer(canvasWidth, canvasHeight, 1);

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
        let cameraPosition = [0.0, 0.0, 5.0];
        let centerPoint    = [0.0, 0.0, 0.0];
        let upDirection    = [0.0, 1.0, 0.0];
        let lightPosition  = [2.0, 5.0, 9.0];
        let ambientColor   = [0.1, 0.1, 0.1];
        let cameraFarClip  = 10.0;
        let targetTexture  = 0;

        // audio
        // audio.src[0].play();

        gltfNode.forEach((v) => {
            if(v.isRoot === true){
                v.setPosition([1.7, -1.2, 7.1]);
                v.setScale([0.0001, 0.0001, 0.0001]);
                v.updateMatrix(vMatrix, pMatrix);
            }
        });

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
                cameraFarClip,
                vMatrix, pMatrix, vpMatrix
            );

            // gltf update
            gltfNode.forEach((v) => {
                if(v.isRoot === true){
                    // v.setRotate(nowTime * 0.1, [0, 1, 0]);
                    // v.setPosition([15000.0, -10000.0, 70000.0]);
                    v.updateMatrix(vMatrix, pMatrix);
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
                // if(v.name.match(/sash_glass/)){
                // }
                v.mesh.forEach((w) => {
                    basePrg.pushShader([
                        v.mvMatrix,
                        v.mvpMatrix,
                        v.normalMatrix,
                        lightPosition,
                        w.material.baseColor.index,
                        w.material.metallicRoughness.index,
                        w.material.normal.index,
                        w.material.occlusion.index,
                        w.material.emissive.index,
                        w.material.baseColor.texCoordIndex,
                        w.material.metallicRoughness.texCoordIndex,
                        w.material.normal.texCoordIndex,
                        w.material.occlusion.texCoordIndex,
                        w.material.emissive.texCoordIndex,
                        w.material.baseColor.texture != null,
                        w.material.metallicRoughness.texture != null,
                        w.material.normal.texture != null,
                        w.material.occlusion.texture != null,
                        w.material.emissive.texture != null,
                        w.material.baseColor.factor,
                        w.material.metallicRoughness.metallicFactor,
                        w.material.metallicRoughness.roughnessFactor,
                        w.material.normal.scale,
                        w.material.occlusion.strength,
                        w.material.emissive.factor,
                        [false, false, false, false],
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
            // torusVBO.map((v) => {
            //     gl3.deleteBuffer(v);
            // });
            // gl3.deleteBuffer(torusIBO);
            // planeVBO.map((v) => {
            //     gl3.deleteBuffer(v);
            // });
            // gl3.deleteBuffer(planeIBO);
            // gl3.deleteFramebuffer(framebuffer);
            gl3.textures.map((v) => {
                if(v == null || v.texture == null){return;}
                gl3.deleteTexture(v.texture);
            });
        }
    }
}

window.WebGLFrame = WebGLFrame;

