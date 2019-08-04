
const CONSOLE_OUTPUT_COLOR = 'seagreen';

/**
 * gltf のロードとパースを行うクラス
 * @class Loader
 */
export default class GLTFParse {
    /**
     * @constructor
     */
    constructor(){
        /**
         * gltf で利用する asset メンバの格納用
         * @type {object}
         */
        this.asset = null;
        /**
         * ファイルのフルパス
         * @type {string}
         */
        this.path = '';
        /**
         * 引数として渡されたパス全体
         * @type {string}
         */
        this.fullPath = '';
        /**
         * ファイルの名前だけを抜き出したもの
         * @type {string}
         */
        this.fileName = '';
        /**
         * 直近の fetch の結果
         * @type {mixed}
         */
        this.lastResponse = null;
        /**
         * モジュール内部で利用する定数群
         * @type {object}
         */
        this.const = {
            POINTS: 0,
            LINES: 1,
            LINE_LOOP: 2,
            LINE_STRIP: 3,
            TRIANGLES: 4,
            TRIANGLE_STRIP: 5,
            TRIANGLE_FAN: 6,
            BYTE: 5120,
            UNSIGNED_BYTE: 5121,
            SHORT: 5122,
            UNSIGNED_SHORT: 5123,
            INT: 5124,
            UNSIGNED_INT: 5125,
            FLOAT: 5126,
            FLOAT_VEC2: 35664,
            FLOAT_VEC3: 35665,
            FLOAT_VEC4: 35666,
            INT_VEC2: 35667,
            INT_VEC3: 35668,
            INT_VEC4: 35669,
            BOOL: 35670,
            BOOL_VEC2: 35671,
            BOOL_VEC3: 35672,
            BOOL_VEC4: 35673,
            FLOAT_MAT2: 35674,
            FLOAT_MAT3: 35675,
            FLOAT_MAT4: 35676,
            SAMPLER_2D: 35678,
            SAMPLER_CUBE: 35680
        };
        /**
         * glTF で利用する頂点属性名を WGL で利用しているものに変換するためのテーブル
         * @type {object}
         */
        this.attributeType = {
            position: 'POSITION',   // vec3
            normal:   'NORMAL',     // vec3
            tangent:  'TANGENT',    // vec4
            texCoord: 'TEXCOORD_0', // vec2
            color:    'COLOR_0',    // vec4
            joints:   'JOINTS_0',   // vec4
            weights:  'WEIGHTS_0'   // vec4
        };
        /**
         * 頂点属性の種類によるストライド
         * @type {object}
         */
        this.strideType = {
            SCALAR: 1,
            VEC2: 2,
            VEC3: 3,
            VEC4: 4,
            MAT2: 4,
            MAT3: 9,
            MAT4: 16
        };
        /**
         * glTF の仕様上存在する可能性のある uniform タイプ
         * @type {object}
         */
        this.uniformType = {
            BYTE:           '1i',
            UNSIGNED_BYTE:  '1i',
            SHORT:          '1f',
            UNSIGNED_SHORT: '1f',
            UNSIGNED_INT:   '1i',
            FLOAT:          '1f',
            FLOAT_VEC2:     '2fv',
            FLOAT_VEC3:     '3fv',
            FLOAT_VEC4:     '4fv',
            INT_VEC2:       '2iv',
            INT_VEC3:       '3iv',
            INT_VEC4:       '4iv',
            BOOL:           '1i',
            BOOL_VEC2:      '2iv',
            BOOL_VEC3:      '3iv',
            BOOL_VEC4:      '4iv',
            FLOAT_MAT2:     'matrix2fv',
            FLOAT_MAT3:     'matrix3fv',
            FLOAT_MAT4:     'matrix4fv',
            SAMPLER_2D:     '1i',
            SAMPLER_CUBE:   '1i'
        };
    }
    /**
     * glTF ファイルをロードする
     * @param {string} path - gltf ファイルのパス（*.gltf or *.glb）※glb はまだ未実装
     * @return {Promise}
     */
    load(path){
        return new Promise((resolve, reject) => {
            // パス文字列の整合性を調べる
            if(path == null || typeOf(path) !== '[object String]' || path === ''){
                reject(new Error(`[gltfparse.js] invalid path: ${path}`));
                return;
            }
            // gltf 拡張子を含むファイル名がパスから取り出せるか調べる
            let fileName = path.match(/[^\/]+(\.gltf|\.glb)$/);
            let isBinary = path.search(/\.glb$/) > -1;
            let pathString = '';
            if(fileName != null){
                // ファイルを含むディレクトリまでのパス
                pathString = path.replace(fileName[0], '');
                // 拡張子 gltf の場合、同名の *.bin ファイルを開く必要があるため
                // 拡張子以外の部分だけを抜き出しておく
                fileName = fileName[0].replace(/\.gltf\/?$/, '');
            }else{
                reject(new Error(`[gltfparse.js] invalid path: ${path}`));
                return;
            }
            // 指定されたパス全体（./hoge/fuga.gltf）
            this.fullPath = path;
            // 拡張子を含まないファイル名（./hoge/[fuga].gltf）
            this.fileName = fileName;
            // ディレクトリまでのパス（[./hoge/]fuga.gltf）
            this.path = pathString;

            if(isBinary === true){
                console.log(`%cfetch glb%c: %c${this.fullPath}`, `color: ${CONSOLE_OUTPUT_COLOR}`, 'color: inherit', 'color: darkorange');
                this.fetchGlb(this.path + this.fileName)
                .then((data) => {
                    console.log(data);
                })
                .catch((err) => {
                    console.error(err);
                });
            }else{
                console.log(`%cfetch gltf%c: %c${this.fullPath}`, `color: ${CONSOLE_OUTPUT_COLOR}`, 'color: inherit', 'color: darkorange');
                this.fetchGltf(this.path + this.fileName)
                .then((data) => {
                    console.log(data);
                })
                .catch((err) => {
                    console.error(err);
                });
            }
        });
    }
    /**
     * .gltf 形式
     * @param {string} target - 読み込む *.gltf ファイルのパス
     * @return {Promise}
     */
    fetchGltf(target){
        return new Promise((resolve, reject) => {
            // 指定されたパスへ fetch を行う
            this.fetch(`${target}.gltf`, 'json')
            .then((gltfResponse) => {
                let gltf = gltfResponse;
                this.asset = gltf.asset;
                console.log(`%cgltf asset info%c: `, `color: ${CONSOLE_OUTPUT_COLOR}`, `color: inherit`);
                console.log(this.asset);
                // gltf.buffers は常に配列
                if(gltf.hasOwnProperty('buffers') !== true && Array.isArray(gltf.buffers) !== true){
                    reject(new Error('not found buffers in gltf'));
                    return;
                }
                let promises = [];
                let buffers = [];
                gltf.buffers.forEach((v, index) => {
                    // gltf では bin が外部ファイルなので uri メンバが必要かつ個別にロードが必要
                    promises.push(new Promise((res, rej) => {
                        if(v.hasOwnProperty('uri') !== true || typeOf(v.uri) !== '[object String]' || v.uri === ''){
                            rej(new Error(`[gltfparse.js] invalid gltf.buffers[${index}].uri`));
                            return;
                        }
                        // buffers.uri が存在したらバイナリ取りに行く
                        this.fetch(`${this.path}${v.uri}`, 'bin')
                        .then((binResponse) => {
                            buffers[index] = binResponse;
                            res(binResponse);
                        });
                    }));
                });
                Promise.all(promises)
                .then(() => {
                    resolve({
                        gltf: gltf,
                        buffers: buffers,
                    });
                });
            });
        });
    }
    /**
     * .glb 形式
     * @param {string} target - 読み込む *.glb ファイルのパス
     * @return {Promise}
     */
    fetchGlb(target){
        return new Promise((resolve, reject) => {
            // 指定されたパスへ fetch を行う
            this.fetch(`${target}.glb`, 'bin')
            // .then((gltfResponse) => {
            //     let gltf = gltfResponse;
            //     this.asset = gltf.asset;
            //     console.log(`%cgltf asset info%c: `, `color: ${CONSOLE_OUTPUT_COLOR}`, `color: inherit`);
            //     console.log(this.asset);
            //     // gltf.buffers は常に配列
            //     if(gltf.hasOwnProperty('buffers') !== true && Array.isArray(gltf.buffers) !== true){
            //         reject(new Error('not found buffers in gltf'));
            //         return;
            //     }
            //     let promises = [];
            //     let buffers = [];
            //     gltf.buffers.forEach((v, index) => {
            //         // gltf では bin が外部ファイルなので uri メンバが必要かつ個別にロードが必要
            //         promises.push(new Promise((res, rej) => {
            //             if(v.hasOwnProperty('uri') !== true || typeOf(v.uri) !== '[object String]' || v.uri === ''){
            //                 rej(new Error(`[gltfparse.js] invalid gltf.buffers[${index}].uri`));
            //                 return;
            //             }
            //             // buffers.uri が存在したらバイナリ取りに行く
            //             this.fetch(`${this.path}${v.uri}`, 'bin')
            //             .then((binResponse) => {
            //                 buffers[index] = binResponse;
            //                 res(binResponse);
            //             });
            //         }));
            //     });
            //     Promise.all(promises)
            //     .then(() => {
            //         resolve({
            //             gltf: gltf,
            //             buffers: buffers,
            //         });
            //     });
            // });
        });
    }
    /**
     * loadGltf で取得した gltf ファイルの情報を元にバイナリを分割する
     * @param {object} gltf - *.gltf の中身の JSON をパースしたもの
     * @param {object} bin - *.bin ファイルのバイナリをオブジェクトで渡す
     * @return {object} 分割しオブジェクトに格納したバイナリ
     */
    splitBinary(gltf, bin){
        if(gltf == null || bin == null || typeOf(bin) !== '[object Object]'){return null;}
        if(!gltf.hasOwnProperty('accessors') || !gltf.hasOwnProperty('bufferViews')){return null;}
        let i, j, k;
        let binaries = {};
        let accessors = getKeys(gltf.accessors);
        let bufferViews = getKeys(gltf.bufferViews);
        accessors.map((v) => {
            let viewindex = gltf.accessors[v].bufferView;
            if(gltf.bufferViews[viewindex] == null){return;}
            let bufferindex = gltf.bufferViews[viewindex].buffer;
            if(bin[bufferindex] == null){return;}
            let stride = this.strideType[gltf.accessors[v].type];
            let component = gltf.accessors[v].componentType;
            let count = gltf.accessors[v].count;
            let byteLength = 0;
            let byteOffset = gltf.accessors[v].byteOffset;
            switch(component){
                case this.const.BYTE:
                case this.const.UNSIGNED_BYTE:
                    byteLength = stride;
                    break;
                case this.const.SHORT:
                case this.const.UNSIGNED_SHORT:
                    byteLength = stride * 2;
                    break;
                case this.const.INT:
                case this.const.UNSIGNED_INT:
                case this.const.FLOAT:
                    byteLength = stride * 4;
                    break;
            }
            k = gltf.bufferViews[viewindex].byteOffset + byteOffset;
            j = byteLength * count;
            binaries[v] = bin[bufferindex].slice(k, k + j);
        });
        return binaries;
    }
    /**
     * 分割したバイナリからバッファ類を生成して返す
     * @param {WebGLRenderingContext} gl - WebGL のレンダリングコンテキスト
     * @param {object} gltf - *.gltf の中身の JSON をパースしたもの
     * @param {object} bin - splitBinary で分割した ArrayBuffer を含むオブジェクト
     * @return {Array} 生成したバッファ（VBO or IBO）を含むオブジェクトの配列
     */
    generateMesh(gl, gltf, bin){
        if(gltf == null || bin == null || typeOf(bin) !== '[object Object]'){return null;}
        if(!gltf.hasOwnProperty('nodes') || !gltf.hasOwnProperty('meshes')){return null;}
        if(!gltf.hasOwnProperty('accessors') || !gltf.hasOwnProperty('bufferViews')){return null;}
        let meshes = {};
        let meshindex = getKeys(gltf.meshes);
        meshindex.map((v, i) => {
            meshes[v] = [];
            if(!gltf.meshes[v].hasOwnProperty('primitives') || typeOf(gltf.meshes[v].primitives) !== '[object Array]' || gltf.meshes[v].primitives.length === 0){
                meshes[v] = null;
            }
            gltf.meshes[v].primitives.map((w, j) => {
                meshes[v][j] = {};
                if(!w.hasOwnProperty('attributes') || w.attributes == null){
                    meshes[v][j] = null;
                    console.warn('invalid attributes in meshes ' + i);
                    return;
                }
                let isMode = w.hasOwnProperty('mode');
                let isElements = w.hasOwnProperty('indices');
                let isMaterial = w.hasOwnProperty('material');
                // まずインデックスバッファ（存在しなければ indices は null になるようにする）
                meshes[v][j].ibo = null;
                meshes[v][j].indexLength = null;
                if(isElements === true){
                    let index = w.indices;
                    let type = gltf.accessors[index].componentType;
                    let typedArrayFunc = null;
                    switch(type){
                        case this.const.BYTE:
                        case this.const.UNSIGNED_BYTE:
                            typedArrayFunc = Uint8Array;
                            break;
                        case this.const.SHORT:
                        case this.const.UNSIGNED_SHORT:
                            typedArrayFunc = Uint16Array;
                            break;
                        case this.const.INT:
                        case this.const.UNSIGNED_INT:
                            typedArrayFunc = Uint32Array;
                            break;
                    }
                    if(typedArrayFunc === null){
                        console.warn('invalid indices in meshes ' + i);
                        return;
                    }
                    meshes[v][j].indices = new typedArrayFunc(bin[index]); // @@@ indices は余分にメモリ使ってるんでゆくゆくはキャッシュしないようにする
                    let ibo = gl.createBuffer();
                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
                    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, meshes[v][j].indices, gl.STATIC_DRAW);
                    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
                    meshes[v][j].ibo = ibo;
                    meshes[v][j].indexLength = gltf.accessors[index].count;
                }
                // 続いて VBO を処理する attribute 名は gltf 側に記載された semantic として出す
                meshes[v][j].attributeName = Object.keys(w.attributes);
                meshes[v][j].attributeStride = [];
                meshes[v][j].vertexList = []; // @@@ 頂点配列は直接 VBO にすればいいのでゆくゆくは配列にキャッシュしないようにする
                meshes[v][j].vboList = [];
                meshes[v][j].attributeName.map((x, l) => {
                    let index = w.attributes[x];
                    meshes[v][j].vertexList[l] = new Float32Array(bin[index]);
                    let vbo = gl.createBuffer();
                    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
                    gl.bufferData(gl.ARRAY_BUFFER, meshes[v][j].vertexList[l], gl.STATIC_DRAW);
                    gl.bindBuffer(gl.ARRAY_BUFFER, null);
                    meshes[v][j].vboList[l] = vbo;
                    meshes[v][j].attributeStride[l] = this.strideType[gltf.accessors[index].type]
                });
                // プリミティブタイプ（描画時のプリミティブ）
                meshes[v][j].primitiveType = gl.POINTS;
                if(isMode === true){
                    meshes[v][j].primitiveType = w.mode;
                }
                // マテリアル（のインデックス）
                meshes[v][j].materialIndex = null;
                if(isMaterial){
                    meshes[v][j].materialIndex = w.material;
                }
            });
        });
        return meshes;
    }
    /**
     * マテリアルを生成する
     * @param {object} gltf - *.gltf の中身の JSON をパースしたもの
     * @return {object} 生成したデータを含むオブジェクト
     */
    generateMaterial(gltf){
        if(gltf == null || !gltf.hasOwnProperty('materials')){return null;}
        let materials = gltf.materials;
        return materials;
    }
    /**
     * 分割したバイナリからアニメーションを生成する
     * @param {WebGLRenderingContext} gl - WebGL のレンダリングコンテキスト
     * @param {object} gltf - *.gltf の中身の JSON をパースしたもの
     * @param {object} bin - splitBinary で分割した ArrayBuffer を含むオブジェクト
     * @return {object} 生成したデータを含むオブジェクト
     */
    generateAnimation(gl, gltf, bin){
        if(gltf == null || bin == null || typeOf(bin) !== '[object Object]'){return null;}
        if(!gltf.hasOwnProperty('animations')){return null;}
        if(!gltf.hasOwnProperty('accessors') || !gltf.hasOwnProperty('bufferViews')){return null;}
        let animations = gltf.animations;
        let aniindex = getKeys(animations);
        aniindex.map((v, i) => {
            animations[v].data = {};
            animations[v].strides = {};
            let keys = getKeys(animations[v].parameters);
            keys.map((w, j) => {
                let accesskey = animations[v].parameters[w];
                let data = bin[accesskey];
                let accessor = gltf.accessors[accesskey];
                let stride = this.strideType[accessor.type];
                let component = accessor.componentType;
                let typedArrayFunc = Float32Array;
                switch(component){
                    case this.const.BYTE:
                        typedArrayFunc = Int8Array;
                        break;
                    case this.const.UNSIGNED_BYTE:
                        typedArrayFunc = Uint8Array;
                        break;
                    case this.const.INT:
                        typedArrayFunc = Int32Array;
                        break
                    case this.const.UNSIGNED_INT:
                        typedArrayFunc = Uint32Array;
                        break;
                }
                animations[v].data[w] = new typedArrayFunc(data);
                animations[v].strides[w] = stride;
            });
        });
        return animations;
    }
    /**
     * プログラム等の情報を gltf ファイルから読み出し WGL に食わせやすい形に整形する
     * @param {WebGLRenderingContext} gl - WebGL のレンダリングコンテキスト
     * @param {object} gltf - *.gltf の中身の JSON をパースしたもの
     * @param {object} bin - splitBinary で分割した ArrayBuffer を含むオブジェクト
     * @return {Array} 生成したシェーダやプログラムの情報を含むオブジェクトの配列
     */
    generateProgram(gl, gltf, bin){
        if(gltf == null || bin == null || typeOf(bin) !== '[object Object]'){return null;}
        if(!gltf.hasOwnProperty('shaders') || !gltf.hasOwnProperty('programs') || !gltf.hasOwnProperty('techniques')){return null;}
        let programs = gltf.programs;
        let prgindex = getKeys(gltf.programs);
        let techindex = getKeys(gltf.techniques);
        techindex.map((x) => {
            let tech = gltf.techniques[x];
            let targetProgram = programs[tech.program];
            // attribute
            let attributeName = targetProgram.attributes; // a_normal, a_position etc
            let attributeStride = [];
            attributeName.map((w, j) => {
                let parameterName = gltf.techniques[x].attributes[w]; // normal, position etc
                let param = gltf.techniques[x].parameters[parameterName];
                let z = 1;
                if(param.hasOwnProperty('type')){
                    switch(param.type){
                        case this.const.FLOAT:
                            z = 1;
                            break;
                        case this.const.FLOAT_VEC2:
                            z = 2;
                            break;
                        case this.const.FLOAT_VEC3:
                            z = 3;
                            break;
                        case this.const.FLOAT_VEC4:
                            z = 4;
                            break;
                    }
                    attributeStride.push(z);
                }
            });
            // uniform
            let uniformName = getKeys(tech.uniforms); // u_diffuse u_projectionMatrix etc
            let uniformType = [];
            let uniformValue = [];
            let uniformSemantic = [];
            let uniformNode = [];
            let uniname = getKeys(this.uniformType);
            uniformName.map((w, j) => {
                let parameterName = tech.uniforms[w]; // diffuse projectionMatrix etc
                let param = tech.parameters[parameterName];
                for(let i = 0; i < uniname.length; ++i){
                    if(param.type === this.const[uniname[i]]){
                        uniformType.push(this.uniformType[uniname[i]]);
                        break;
                    }
                }
                if(param.hasOwnProperty('value')){uniformValue[j] = param.value;}
                if(param.hasOwnProperty('semantic')){uniformSemantic[j] = param.semantic;}
                if(param.hasOwnProperty('node')){uniformNode[j] = param.node;}
            });
            // state
            targetProgram.state = tech.states;
            targetProgram.attributeName        = attributeName;   // position
            targetProgram.attributeStride      = attributeStride; // 3
            targetProgram.uniformName          = uniformName;     // modelViewMatrix
            targetProgram.uniformType          = uniformType;     // matrix4fv
            targetProgram.uniformValue         = uniformValue;    // [0, 0, 0, ...]
            targetProgram.uniformSemantic      = uniformSemantic; // MODELVIEW
            targetProgram.uniformNode          = uniformNode;     // xxxxxNode → nodes に同名のものがあるはず
            targetProgram.fragmentShaderSource = gltf.shaders[targetProgram.fragmentShader].uri; // FS のファイル名
            targetProgram.vertexShaderSource   = gltf.shaders[targetProgram.vertexShader].uri;   // VS のファイル名
        });
        return programs;
    }
    fetch(target, type){
        return new Promise((resolve, reject) => {
            let headers = new Headers({
                'Pragma': 'no-cache',
                'Cache-Control': 'no-cache'
            });
            let option = {
                method: 'GET',
                headers: headers,
                mode: 'cors',
                cache: 'default'
            };
            fetch(target, option)
            .then((res) => {
                switch(type){
                    case 'text':
                        return res.text();
                    case 'json':
                        return res.json();
                    case 'bin':
                        return res.arrayBuffer();
                    case 'blob':
                        return res.blob();
                    default:
                        reject(new Error(`[gltfparse.js] invalid type: ${type}`));
                        break;
                }
            })
            .then((res) => {
                this.lastResponse = res;
                resolve(res);
            })
            .catch((err) => {
                this.lastResponse = null;
                reject(err);
            });
        });
    }
    getLastResponse(){
        return this.lastResponse;
    }
}

window.GLTFParse = GLTFParse;

/**
 * toString を用いた型チェック文字列を返す
 * @param {mixed} any - 調査したいなにか
 * @return {string} toString.call の返却文字列
 */
function typeOf(any){
    return Object.prototype.toString.call(any);
}
/**
 * object 及び Array から key を抜き出し返す
 * @param {object|Array} any - 対象となるオブジェクト及び配列
 * @return {Array} key の配列（引数に配列が渡された場合は添字のインデックス配列）
 */
function getKeys(any){
    let arr = [];
    switch(typeOf(any)){
        case '[object Array]':
            if(any.length > 0){
                arr = any.map((v, i) => {return i;});
            }
            break;
        case '[object Object]':
            arr = Object.keys(any);
            break;
        default:
            arr = null;
            break
    }
    return arr;
}
