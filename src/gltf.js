
const CONSOLE_OUTPUT_COLOR = 'seagreen';

class GLTFNode {
    /**
     * glTF の頂点属性名テーブル
     * @type {object}
     */
    static get ATTRIBUTE_TYPE(){
        return {
            POSITION:   'position',  // vec3
            NORMAL:     'normal',    // vec3
            TANGENT:    'tangent',   // vec4
            TEXCOORD_0: 'texCoord0', // vec2
            TEXCOORD_1: 'texCoord1', // vec2
            COLOR_0:    'color',     // vec4
            JOINTS_0:   'joints',    // vec4
            WEIGHTS_0:  'weights',   // vec4
        };
    }
    /**
     * glTF のプリミティブタイプテーブル
     * @type {object}
     */
    static get PRIMITIVE_TYPE(){
        return {
            0: 'POINTS',
            1: 'LINES',
            2: 'LINE_LOOP',
            3: 'LINE_STRIP',
            4: 'TRIANGLES',
            5: 'TRIANGLE_STRIP',
            6: 'TRIANGLE_FAN',
        };
    }
    /**
     * GLTFNode
     * @param {object} currenta - このノードの情報
     * @param {object} data - データ構造の出力先（最終的に GLTFParse.data になるオブジェクト）
     */
    constructor(current, data){
        this.name     = current.name   != null ? current.name   : null;
        this.matrix   = current.matrix != null ? current.matrix : null;
        this.mesh     = current.mesh   != null ? current.mesh   : null;
        this.children = [];

        // mesh exists
        if(this.mesh != null){
            let mesh = data.gltf.meshes[this.mesh];
            this.mesh = [];
            mesh.primitives.forEach((v, index) => {
                this.mesh[index] = {
                    primitiveType: GLTFNode.PRIMITIVE_TYPE[v.mode],
                };
                let key = Object.keys(v.attributes);
                key.forEach((w, idx) => {
                    this.mesh[index][GLTFNode.ATTRIBUTE_TYPE[w]] = data.parsedBuffers[v.attributes[w]];
                });
                if(v.hasOwnProperty('indices') === true){
                    this.mesh[index].indices = data.parsedBuffers[v.indices];
                }
                // material exists
                if(v.hasOwnProperty('material') === true){
                    let material = data.gltf.materials[v.material];
                    // テクスチャ座標は texCoord0 と texCoord1 を取り得るので既定値を 0 にする
                    // その他の係数は存在確認を行って適宜キャッシュする
                    let baseColorImage                 = null;
                    let baseColorImageIndex            = 0;
                    let baseColorTexCoordIndex         = 0;
                    let baseColorFactor                = null;
                    let metallicRoughnessImage         = null;
                    let metallicRoughnessImageIndex    = 0;
                    let metallicRoughnessTexCoordIndex = 0;
                    let metallicFactor                 = null;
                    let roughnessFactor                = null;
                    if(material.hasOwnProperty('pbrMetallicRoughness') === true){
                        if(material.pbrMetallicRoughness.hasOwnProperty('baseColorTexture') === true){
                            baseColorImageIndex = material.pbrMetallicRoughness.baseColorTexture.index;
                            baseColorImage = data.images[baseColorImageIndex];
                            if(material.pbrMetallicRoughness.baseColorTexture.hasOwnProperty('texCoord') === true){
                                baseColorTexCoordIndex = material.pbrMetallicRoughness.baseColorTexture.texCoord;
                            }
                        }
                        if(material.pbrMetallicRoughness.hasOwnProperty('baseColorFactor') === true){
                            baseColorFactor = material.pbrMetallicRoughness.baseColorFactor;
                        }
                        if(material.pbrMetallicRoughness.hasOwnProperty('metallicRoughnessTexture') === true){
                            metallicRoughnessImageIndex = material.pbrMetallicRoughness.metallicRoughnessTexture.index;
                            metallicRoughnessImage = data.images[metallicRoughnessImageIndex];
                            if(material.pbrMetallicRoughness.metallicRoughnessTexture.hasOwnProperty('texCoord') === true){
                                metallicRoughnessTexCoordIndex = material.pbrMetallicRoughness.metallicRoughnessTexture.texCoord;
                            }
                        }
                        if(material.pbrMetallicRoughness.hasOwnProperty('metallicFactor') === true){
                            metallicFactor = material.pbrMetallicRoughness.metallicFactor;
                        }
                        if(material.pbrMetallicRoughness.hasOwnProperty('roughnessFactor') === true){
                            roughnessFactor = material.pbrMetallicRoughness.roughnessFactor;
                        }
                    }
                    let normalImage            = null;
                    let normalImageIndex       = 0;
                    let normalTexCoordIndex    = 0;
                    let normalScale            = null;
                    let occlusionImage         = null;
                    let occlusionImageIndex    = 0;
                    let occlusionTexCoordIndex = 0;
                    let occlusionStrength      = null;
                    let emissiveImage          = null;
                    let emissiveImageIndex     = 0;
                    let emissiveTexCoordIndex  = 0;
                    let emissiveFactor         = null;
                    if(material.hasOwnProperty('normalTexture') === true){
                        normalImageIndex = material.normalTexture.index;
                        normalImage = data.images[normalImageIndex];
                        if(material.normalTexture.hasOwnProperty('scale') === true){
                            normalScale = material.normalTexture.scale;
                        }
                        if(material.normalTexture.hasOwnProperty('texCoord') === true){
                            normalTexCoordIndex = material.normalTexture.texCoord;
                        }
                    }
                    if(material.hasOwnProperty('occlusionTexture') === true){
                        occlusionImageIndex = material.occlusionTexture.index;
                        occlusionImage = data.images[occlusionImageIndex];
                        if(material.occlusionTexture.hasOwnProperty('strength') === true){
                            occlusionStrength = material.occlusionTexture.strength;
                        }
                        if(material.occlusionTexture.hasOwnProperty('texCoord') === true){
                            occlusionTexCoordIndex = material.occlusionTexture.texCoord;
                        }
                    }
                    if(material.hasOwnProperty('emissiveTexture') === true){
                        emissiveImageIndex = material.emissiveTexture.index;
                        emissiveImage = data.images[emissiveImageIndex];
                        if(material.emissiveTexture.hasOwnProperty('texCoord') === true){
                            emissiveTexCoordIndex = material.emissiveTexture.texCoord;
                        }
                    }
                    if(material.hasOwnProperty('emissiveFactor') === true){
                        emissiveFactor = material.emissiveFactor;
                    }
                    this.mesh[index].material = {
                        baseColorTexture: {
                            image: baseColorImage,
                            index: baseColorImageIndex,
                            texCoordIndex: baseColorTexCoordIndex,
                            factor: baseColorFactor,
                        },
                        metallicRoughnessTexture: {
                            image: metallicRoughnessImage,
                            index: metallicRoughnessImageIndex,
                            texCoordIndex: metallicRoughnessTexCoordIndex,
                            metallicFactor: metallicFactor,
                            roughnessFactor: roughnessFactor,
                        },
                        normalTexture: {
                            image: normalImage,
                            index: normalImageIndex,
                            texCoordIndex: normalTexCoordIndex,
                            scale: normalScale,
                        },
                        occlusionTexture: {
                            image: occlusionImage,
                            index: occlusionImageIndex,
                            texCoordIndex: occlusionTexCoordIndex,
                            strength: occlusionStrength,
                        },
                        emissiveTexture: {
                            image: emissiveImage,
                            index: emissiveImageIndex,
                            texCoordIndex: emissiveTexCoordIndex,
                            factor: emissiveFactor,
                        },
                    };
                    // ルート階層に名前付きでキャッシュしておく
                    // これはテクスチャをマテリアル名で一括置換する場合などのための施策
                    if(data.materials.hasOwnProperty(material.name) !== true){
                        data.materials[material.name] = [];
                    }
                    data.materials[material.name].push(this.mesh[index].material);
                }
            });
        }

        if(
            current.hasOwnProperty('nodes') &&
            Array.isArray(current.nodes) === true &&
            current.nodes.length > 0
        ){
            // nodes メンバがあるということは scene
            current.nodes.forEach((v, index) => {
                let child = data.gltf.nodes[v];
                let node = new GLTFNode(child, data);
                this.children.push(node);
                if(node.name != null){
                    if(data.nodes.hasOwnProperty(node.name) !== true){
                        data.nodes[node.name] = [];
                    }
                    data.nodes[node.name].push(node);
                }
            });
        }else{
            // scene 以外は node
            if(Array.isArray(current.children) === true){
                // children がある場合だけ再帰
                current.children.forEach((v, index) => {
                    let child = data.gltf.nodes[v];
                    let node = new GLTFNode(child, data);
                    this.children.push(node);
                    if(node.name != null){
                        if(data.nodes.hasOwnProperty(node.name) !== true){
                            data.nodes[node.name] = [];
                        }
                        data.nodes[node.name].push(node);
                    }
                });
            }
        }
    }
}

/**
 * gltf のロードとパースを行うクラス
 * @class Loader
 */
export default class GLTFParse {
    /**
     * モジュール内部で利用する定数群
     * @type {object}
     */
    static get CONST(){
        return {
            BYTE:                 5120,
            UNSIGNED_BYTE:        5121,
            SHORT:                5122,
            UNSIGNED_SHORT:       5123,
            INT:                  5124,
            UNSIGNED_INT:         5125,
            FLOAT:                5126,
            ARRAY_BUFFER:         34962,
            ELEMENT_ARRAY_BUFFER: 34963,
            FLOAT_VEC2:           35664,
            FLOAT_VEC3:           35665,
            FLOAT_VEC4:           35666,
            INT_VEC2:             35667,
            INT_VEC3:             35668,
            INT_VEC4:             35669,
            BOOL:                 35670,
            BOOL_VEC2:            35671,
            BOOL_VEC3:            35672,
            BOOL_VEC4:            35673,
            FLOAT_MAT2:           35674,
            FLOAT_MAT3:           35675,
            FLOAT_MAT4:           35676,
            SAMPLER_2D:           35678,
            SAMPLER_CUBE:         35680,
        };
    }
    /**
     * 頂点属性の種類によるストライド
     * @type {object}
     */
    static get STRIDE_TYPE(){
        return {
            SCALAR: 1,
            VEC2:   2,
            VEC3:   3,
            VEC4:   4,
            MAT2:   4,
            MAT3:   9,
            MAT4:   16,
        };
    }
    /**
     * @constructor
     */
    constructor(){
        /**
         * バイナリデータをパース・変換したデータ
         * @type {object}
         */
        this.data = null;
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
         * @type {any}
         */
        this.lastResponse = null;
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
                if(isBinary === true){
                    fileName = fileName[0].replace(/\.glb\/?$/, '');
                }else{
                    fileName = fileName[0].replace(/\.gltf\/?$/, '');
                }
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
                    return this.parse(data);
                })
                .then((data) => {
                    this.getScene(data);
                    this.data = data;
                    resolve(data);
                })
                .catch((err) => {
                    console.error(err);
                });
            }else{
                console.log(`%cfetch gltf%c: %c${this.fullPath}`, `color: ${CONSOLE_OUTPUT_COLOR}`, 'color: inherit', 'color: darkorange');
                this.fetchGltf(this.path + this.fileName)
                .then((data) => {
                    return this.parse(data);
                })
                .then((data) => {
                    this.getScene(data);
                    this.data = data;
                    resolve(data);
                })
                .catch((err) => {
                    console.error(err);
                });
            }
        });
    }
    /**
     * .glb 形式のバイナリから chunk データを抜き出す
     * @param {ArrayBuffer} data - glb ファイルのバイナリ
     * @return {object}
     */
    getChunkInGlb(data){
        if(data == null){
            throw new Error('[gltfparse.js] invalid glb');
            return;
        }
        let magic       = String.fromCharCode.apply(null, new Uint8Array(data, 0, 4));
        let version     = new Uint32Array(data, 4, 1);
        let length      = new Uint32Array(data, 8, 1);
        let chunkLength = new Uint32Array(data, 12, 1);
        let type        = String.fromCharCode.apply(null, new Uint8Array(data, 16, 4));
        if(magic.toLowerCase() !== 'gltf' || type.toLowerCase() !== 'json'){
            throw new Error('[gltfparse.js] invalid chank data in glb');
            return;
        }
        if(version == null || version[0] == null || version[0] !== 2){
            throw new Error(`[gltfparse.js] this glb is a not supported version: ${version}`);
            return;
        }
        if(chunkLength == null || chunkLength[0] == null || chunkLength[0] === 0){
            throw new Error(`[gltfparse.js] invalid chunk data length: ${chunkLength}`);
            return;
        }
        let chunk = String.fromCharCode.apply(null, new Uint8Array(data, 20, chunkLength[0]));
        let json = JSON.parse(chunk);
        return {
            magic: magic,
            version: version[0],
            length: length[0],
            chunk: chunk,
            chunkLength: chunkLength[0],
            bufferBegin: 20 + chunkLength[0],
            type: type,
            json: json,
            data: data,
        };
    }
    /**
     * .gltf 形式
     * @param {string} target - 読み込む *.gltf ファイルのパス
     * @return {Promise}
     */
    fetchGltf(target){
        return new Promise((resolve, reject) => {
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
                            res();
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
            this.fetch(`${target}.glb`, 'bin')
            .then((gltfResponse) => {
                // 読み込んだバイナリから chunk の情報を抜き出す
                let glb = this.getChunkInGlb(gltfResponse);
                // gltf 形式の JSON に相当
                let gltf = glb.json;
                this.asset = gltf.asset;
                console.log(`%cgltf asset info%c: `, `color: ${CONSOLE_OUTPUT_COLOR}`, `color: inherit`);
                console.log(this.asset);
                // gltf.buffers は常に配列
                if(gltf.hasOwnProperty('buffers') !== true && Array.isArray(gltf.buffers) !== true){
                    reject(new Error('not found buffers in glb'));
                    return;
                }
                let length = new Uint32Array(glb.data, 0, 1);
                let type = String.fromCharCode.apply(null, new Uint8Array(glb.data, 4, 4));
                let begin = 8 + glb.bufferBegin;
                let buffers = [];
                gltf.buffers.forEach((v, index) => {
                    // glb では bin ファイルではなく同じバイナリにすべて含まれるものとして処理する
                    buffers[index] = glb.data.slice(begin, begin + v.byteLength);
                    begin += v.byteLength;
                });
                // slice は参照ではなくコピーなので元データはクリアしておく
                glb.data = null;
                resolve({
                    gltf: gltf,
                    buffers: buffers,
                });
            });
        });
    }
    parse(data){
        return new Promise((lastResolve, lastReject) => {
            data.binaries = this.splitBinary(data.gltf, data.buffers);
            // いち早くメモリを解放させるため null 代入
            data.buffers = null;
            // 紛らわしいので消す
            delete data.buffers;
            // 必要なリソースのさらなる読み込み・パース
            new Promise((resolve, reject) => {
                // accessor
                if(data.gltf.hasOwnProperty('accessors') === true && data.gltf.accessors.length > 0){
                    data.parsedBuffers = [];
                    data.gltf.accessors.forEach((v, index) => {
                        let begin = 0;
                        if(v.hasOwnProperty('byteOffset') === true){
                            begin = v.byteOffset;
                        }
                        let func = this.getTypedArrayFunctionFromComponent(v.componentType);
                        data.parsedBuffers[index] = {
                            data: new func(data.binaries[v.bufferView].arrayBuffer, begin, v.count * GLTFParse.STRIDE_TYPE[v.type]),
                            min: v.min,
                            max: v.max,
                            componentType: v.componentType,
                            type: v.type,
                            count: v.count,
                        };
                    });
                }
                // images
                if(data.gltf.hasOwnProperty('images') === true && data.gltf.images.length > 0){
                    let promises = data.gltf.images.map((v, index) => {
                        return new Promise((res, rej) => {
                            if(v.hasOwnProperty('mimeType') === true && v.hasOwnProperty('bufferView') === true){
                                // binary
                                let blob = new Blob([data.binaries[v.bufferView].arrayBuffer], {type: v.mimeType});
                                let img = new Image();
                                img.src = window.URL.createObjectURL(blob);
                                res(img);
                            }else if(v.hasOwnProperty('uri') === true){
                                // fetch file
                                let img = new Image();
                                img.addEventListener('load', () => {
                                    res(img);
                                }, false);
                                img.src = this.path + v.uri;
                            }
                        });
                    });
                    Promise.all(promises)
                    .then((images) => {
                        data.images = images;
                        resolve();
                    });
                }else{
                    resolve();
                }
            })
            .then(() => {
                // TODO: animation
                lastResolve(data);
            });
        });
    }
    /**
     * loadGltf で取得した gltf ファイルの情報を元にバイナリを分割する
     * @param {object} gltf - *.gltf の中身の JSON をパースしたもの
     * @param {object} bin - *.bin ファイルのバイナリをオブジェクトで渡す
     * @return {object} 分割しオブジェクトに格納したバイナリ
     */
    splitBinary(gltf, bin){
        if(gltf == null || bin == null || Array.isArray(bin) !== true){return null;}
        if(gltf.hasOwnProperty('accessors') !== true || gltf.hasOwnProperty('bufferViews') !== true){return null;}
        let binaries = [];
        // bufferViews を基準に走査するが、bufferViews.length > accessors.length という状況が
        // glb の場合は特に、バイナリに画像を含んだりしているのであり得るという点に注意
        gltf.bufferViews.forEach((v, index) => {
            let data = {
                bufferView: v,
                arrayBuffer: bin[v.buffer].slice(v.byteOffset, v.byteOffset + v.byteLength)
            };
            binaries[index] = data;
        });
        return binaries;
    }
    /**
     * this.parse が解決し、gl のコンテキストが設定済みの場合に実行可能
     * scene の情報を生成して返す
     * @param {object} data
     */
    getScene(data){
        let gltf      = data.gltf;
        let accessors = data.gltf.accessors;
        let binaries  = data.binaries;
        let images    = data.images;
        if(
            gltf == null ||
            gltf.hasOwnProperty('scenes') !== true ||
            Array.isArray(gltf.scenes) !== true ||
            gltf.scenes.length === 0 ||
            Array.isArray(binaries) !== true ||
            binaries.length === 0 ||
            Array.isArray(accessors) !== true ||
            accessors.length === 0 ||
            (Array.isArray(images) === true && images.length === 0)
        ){
            throw new Error('[gltfparse.js] invalid scenedata');
            return;
        }
        // scene メンバを追加
        data.scenes = [];    // シーンは配列
        data.nodes = {};     // ノードは名前で引けるようにオブジェクト
        data.materials = {}; // マテリアルも名前で引けるようにオブジェクト
        data.activeScene = gltf.scene == null ? 0 : gltf.scene;
        gltf.scenes.forEach((v, index) => {
            data.scenes[index] = new GLTFNode(v, data);
        });
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
    getTypedArrayFunctionFromComponent(componentType){
        let typedArrayFunc = null;
        switch(componentType){
            case GLTFParse.CONST.BYTE:
                typedArrayFunc = Int8Array;
                break;
            case GLTFParse.CONST.UNSIGNED_BYTE:
                typedArrayFunc = Uint8Array;
                break;
            case GLTFParse.CONST.SHORT:
                typedArrayFunc = Int16Array;
                break;
            case GLTFParse.CONST.UNSIGNED_SHORT:
                typedArrayFunc = Uint16Array;
                break;
            case GLTFParse.CONST.INT:
                typedArrayFunc = Int32Array;
                break;
            case GLTFParse.CONST.UNSIGNED_INT:
                typedArrayFunc = Uint32Array;
                break;
            case GLTFParse.CONST.FLOAT:
                typedArrayFunc = Float32Array;
                break;
            default:
                break
        }
        return typedArrayFunc;
    }
    getLastResponse(){
        return this.lastResponse;
    }
}

window.GLTFParse = GLTFParse;

/**
 * toString を用いた型チェック文字列を返す
 * @param {any} any - 調査したいなにか
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
