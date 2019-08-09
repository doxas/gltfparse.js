
import baseVs from './shader/base.vert';
import baseFs from './shader/base.frag';
import noiseVs from './shader/noise.vert';
import noiseFs from './shader/noise.frag';

import glcubic from './gl3Core.js';

// variable ===============================================================
let gl3, gl, run, vec3, mat4, qtn, count, nowTime, framebuffer;
let canvas, canvasWidth, canvasHeight;
let touches;
let audio;

// shader
let basePrg, noisePrg;

// geometry
let gltfNode;

// camera
let cameraOrbitality   = true;
let cameraScaleBias    = 0.2;
let cameraDistance     = 8.0;
let cameraMinDistance  = 4.0;
let cameraMaxDistance  = 32.0;
let cameraPosition     = [0.0, 0.0, cameraDistance];
let centerPoint        = [0.0, 0.0, 0.0];
let cameraUpDirection  = [0.0, 1.0, 0.0];
let dCameraPosition    = [0.0, 0.0, cameraDistance];
let dCenterPoint       = [0.0, 0.0, 0.0];
let dCameraUpDirection = [0.0, 1.0, 0.0];
let dCameraDirection   = [0.0, 0.0, -1.0];
let cameraRotateX      = 0.0;
let cameraRotateY      = 0.0;
let cameraScale        = 0.0;
let cameraTranslate    = [0.0, 0.0, 0.0];
let cameraDirection    = [0.0, 0.0, -1.0];
let clickStart         = false;
let clickButton        = 0;
let prevPosition       = [0, 0];
let offsetPosition     = [0, 0];
let qt  = null;
let qtx = null;
let qty = null;

// test
let gRoughness = 0.5;
let gMetallic  = 0.5;

// const PATH_STRING = './resource/assassin_gai/scene.gltf';
// const PATH_STRING = './resource/ac-cobra-classic/source/AC Cobra 1.glb';
// const PATH_STRING = './resource/E6.glb';
const PATH_STRING = './resource/E6/E6_patch.gltf';

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

        qt  = qtn.create();
        qtx = qtn.create();
        qty = qtn.create();

        this.eventSetting();

        this.debugSetting();

        audio = new gl3.Audio(0.5, 0.5);
        // audio.load('sound/amairo.mp3', 0, true, true, () => {
            // gl3.createTextureFromFile('./resource/snoise.png', 0, () => {
                this.shaderLoader();
                this.gltfLoader()
                .then(() => {
                    this.init();
                })
                .catch((err) => {
                    console.error(err);
                });
            // });
        // });
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
            new gl3.GLTF(gl3).load(PATH_STRING)
            .then((gltfData) => {
                gltfNode = gltfData.node;
                console.log('🍆', gltfData);
                resolve();
            })
            .catch((err) => {
                reject(err);
            });
        });
    }

    init(){
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
        let lightPosition  = [5.0, 5.0, 5.0];
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
            cameraUpdate();
            mat4.vpFromCameraProperty(
                cameraPosition,
                centerPoint,
                cameraUpDirection,
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
                        w.material.baseColor.texCoordIndex === 0,
                        w.material.metallicRoughness.texCoordIndex === 0,
                        w.material.normal.texCoordIndex === 0,
                        w.material.occlusion.texCoordIndex === 0,
                        w.material.emissive.texCoordIndex === 0,
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

        touches = false;
        let ua = navigator.userAgent;
        let downEvent = 'mousedown';
        let moveEvent = 'mousemove';
        let upEvent = 'mouseup';
        if(ua.indexOf('iPhone') > 0 || ua.indexOf('iPod') > 0 || ua.indexOf('Android') > 0 && ua.indexOf('Mobile') > 0 || ua.indexOf('iPad') > 0 || ua.indexOf('Android') > 0){
            touches = true;
            downEvent = 'touchstart';
            moveEvent = 'touchmove';
            upEvent   = 'touchend';
        }

        canvas.addEventListener(downEvent, mouseInteractionStart, false);
        canvas.addEventListener(moveEvent, mouseInteractionMove, false);
        canvas.addEventListener(upEvent,   mouseInteractionEnd, false);
        canvas.addEventListener('wheel', wheelScroll, false);
        canvas.addEventListener('contextmenu', (evt) => {evt.preventDefault();}, false);
        function mouseInteractionStart(evt){
            clickStart = true;
            evt.preventDefault();

            let targetEvent = evt;
            if(touches === true && evt.touches != null && evt.touches.length > 0){
                targetEvent = evt.touches[0];
                clickButton = 0;
            }else{
                clickButton = targetEvent.button;
            }
            prevPosition = [
                targetEvent.clientX,
                targetEvent.clientY
            ];
        }
        function mouseInteractionMove(evt){
            if(clickStart !== true){return;}
            evt.stopPropagation();
            evt.preventDefault();
            let targetEvent = evt;
            if(touches === true && evt.touches != null && evt.touches.length > 0){
                targetEvent = evt.touches[0];
                if(evt.touches.length === 3){
                    clickButton = 1;
                }else if(evt.touches.length === 2){
                    clickButton = 2;
                }else{
                    clickButton = 0;
                }
            }
            let w = canvas.width;
            let h = canvas.height;
            let s = 1.0 / Math.min(w, h);
            offsetPosition = [
                targetEvent.clientX - prevPosition[0],
                targetEvent.clientY - prevPosition[1]
            ];
            prevPosition = [targetEvent.clientX, targetEvent.clientY];
            let translateScale = cameraScaleBias * s * 10.0;
            switch(clickButton){
                // case 1:
                case 0:
                    cameraRotateX += offsetPosition[0] * s;
                    cameraRotateY += offsetPosition[1] * s;
                    cameraRotateX = cameraRotateX % 1.0;
                    if(cameraOrbitality === true){
                        cameraRotateY = Math.min(Math.max(cameraRotateY % 1.0, -0.25), 0.25);
                    }else{
                        cameraRotateY = 0.0;
                    }
                    break;
                // case 2:
                case 1:
                    cameraTranslate = [
                        cameraTranslate[0],
                        cameraTranslate[1] + offsetPosition[1] * translateScale,
                        cameraTranslate[2]
                    ];
                    break;
                // case 0:
                case 2:
                    let tangentDirection = vec3.normalize(vec3.cross([0.0, 1.0, 0.0], cameraDirection));
                    cameraTranslate = [
                        cameraTranslate[0] + (offsetPosition[0] * tangentDirection[0] * translateScale)
                                           + (offsetPosition[1] * cameraDirection[0]  * translateScale),
                        cameraTranslate[1],
                        cameraTranslate[2] + (offsetPosition[0] * tangentDirection[2] * translateScale)
                                           + (offsetPosition[1] * cameraDirection[2]  * translateScale)
                    ];
                    break;
            }
        }
        function mouseInteractionEnd(evt){
            clickStart = false;
        }
        function wheelScroll(evt){
            let w = evt.wheelDelta;
            if(w > 0){
                cameraScale = 0.8;
            }else if(w < 0){
                cameraScale = -0.8;
            }
        }
    }
}

function cameraUpdate(){
    let v = [1.0, 0.0, 0.0];
    cameraScale *= 0.75;
    cameraDistance += cameraScale * cameraScaleBias;
    cameraDistance = Math.min(Math.max(cameraDistance, cameraMinDistance), cameraMaxDistance);
    cameraPosition[0] = dCameraPosition[0];
    cameraPosition[1] = dCameraPosition[1];
    cameraPosition[2] = cameraDistance;
    centerPoint[0] = dCenterPoint[0];
    centerPoint[1] = dCenterPoint[1];
    centerPoint[2] = dCenterPoint[2];
    qtn.identity(qt);
    qtn.identity(qtx);
    qtn.identity(qty);
    qtn.rotate(cameraRotateX * gl3.PI2, [0.0, 1.0, 0.0], qtx);
    qtn.toVecIII(v, qtx, v);
    qtn.toVecIII(dCameraDirection, qtx, cameraDirection); // translate vector
    qtn.rotate(cameraRotateY * gl3.PI2, v, qty);
    qtn.multiply(qtx, qty, qt)
    qtn.toVecIII(cameraPosition, qt, cameraPosition);
    qtn.toVecIII(dCameraUpDirection, qt, cameraUpDirection);

    cameraPosition[0] += cameraTranslate[0];
    cameraPosition[1] += cameraTranslate[1];
    cameraPosition[2] += cameraTranslate[2];
    centerPoint[0] += cameraTranslate[0];
    centerPoint[1] += cameraTranslate[1];
    centerPoint[2] += cameraTranslate[2];
}

window.WebGLFrame = WebGLFrame;

