
let gl3, gl, vec3, mat4, qtn;

const CONSOLE_OUTPUT_COLOR = 'seagreen';

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

/**
 * glTF に含まれるノードの情報
 */
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
        // matrix 属性か translation, rotation, scale のいずれかを含む
        // mesh を含まない場合、レンダリングするジオメトリは存在しない
        this.name        = current.name   != null ? current.name   : null;
        this.mesh        = current.mesh   != null ? current.mesh   : null;
        this.matrix      = current.matrix != null ? current.matrix : null;
        this.translation = current.translation != null ? current.translation : null;
        this.rotation    = current.rotation    != null ? current.rotation    : null;
        this.scale       = current.scale       != null ? current.scale       : null;
        this.children = [];

        // mesh が存在する
        if(this.mesh != null){
            let mesh = data.gltf.meshes[this.mesh];
            this.mesh = [];
            // ひとつの mesh には複数のプリミティブが含まれる可能性がある
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
                    // テクスチャ自体を含まない場合もあり得るが既定値としてユニットは 0 を指定
                    // ただしここでは画像をオブジェクトのメンバにしているだけでテクスチャは生成されていない
                    // その他の係数は存在確認を行って適宜キャッシュする
                    let baseColorImage                 = null;
                    let baseColorSampler               = null;
                    let baseColorImageIndex            = 0;
                    let baseColorTexCoordIndex         = 0;
                    let baseColorFactor                = [1.0, 1.0, 1.0, 1.0];
                    let metallicRoughnessImage         = null;
                    let metallicRoughnessSampler       = null;
                    let metallicRoughnessImageIndex    = 0;
                    let metallicRoughnessTexCoordIndex = 0;
                    let metallicFactor                 = 0.5;
                    let roughnessFactor                = 0.5;
                    if(material.hasOwnProperty('pbrMetallicRoughness') === true){
                        if(material.pbrMetallicRoughness.hasOwnProperty('baseColorTexture') === true){
                            baseColorImageIndex = material.pbrMetallicRoughness.baseColorTexture.index;
                            baseColorImage = data.images[baseColorImageIndex];
                            baseColorSampler = data.gltf.samplers[data.gltf.textures[baseColorImageIndex].sampler];
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
                            metallicRoughnessSampler = data.gltf.samplers[data.gltf.textures[metallicRoughnessImageIndex].sampler];
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
                    let normalSampler          = null;
                    let normalImageIndex       = 0;
                    let normalTexCoordIndex    = 0;
                    let normalScale            = 1.0;
                    let occlusionImage         = null;
                    let occlusionSampler       = null;
                    let occlusionImageIndex    = 0;
                    let occlusionTexCoordIndex = 0;
                    let occlusionStrength      = 1.0;
                    let emissiveImage          = null;
                    let emissiveSampler        = null;
                    let emissiveImageIndex     = 0;
                    let emissiveTexCoordIndex  = 0;
                    let emissiveFactor         = [0.0, 0.0, 0.0];
                    if(material.hasOwnProperty('normalTexture') === true){
                        normalImageIndex = material.normalTexture.index;
                        normalImage = data.images[normalImageIndex];
                        normalSampler = data.gltf.samplers[data.gltf.textures[normalImageIndex].sampler];
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
                        occlusionSampler = data.gltf.samplers[data.gltf.textures[occlusionImageIndex].sampler];
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
                        emissiveSampler = data.gltf.samplers[data.gltf.textures[emissiveImageIndex].sampler];
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
                            sampler: baseColorSampler,
                            index: baseColorImageIndex,
                            texCoordIndex: baseColorTexCoordIndex,
                            factor: baseColorFactor,
                        },
                        metallicRoughnessTexture: {
                            image: metallicRoughnessImage,
                            sampler: metallicRoughnessSampler,
                            index: metallicRoughnessImageIndex,
                            texCoordIndex: metallicRoughnessTexCoordIndex,
                            metallicFactor: metallicFactor,
                            roughnessFactor: roughnessFactor,
                        },
                        normalTexture: {
                            image: normalImage,
                            sampler: normalSampler,
                            index: normalImageIndex,
                            texCoordIndex: normalTexCoordIndex,
                            scale: normalScale,
                        },
                        occlusionTexture: {
                            image: occlusionImage,
                            sampler: occlusionSampler,
                            index: occlusionImageIndex,
                            texCoordIndex: occlusionTexCoordIndex,
                            strength: occlusionStrength,
                        },
                        emissiveTexture: {
                            image: emissiveImage,
                            sampler: emissiveSampler,
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
    constructor(parentInstance){
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
        /**
         * パースして整形した glTF のノード情報
         * @type {Array}
         */
        this.gltfNode = [];

        this.parent = parentInstance;
        gl3  = this.parent;
        gl   = this.parent.gl;
        vec3 = this.parent.Math.Vec3;
        mat4 = this.parent.Math.Mat4;
        qtn  = this.parent.Math.Qtn;
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
                if(this.parent.isConsoleOutput === true){
                    console.log(`%cfetch glb%c: %c${this.fullPath}`, `color: ${CONSOLE_OUTPUT_COLOR}`, 'color: inherit', 'color: darkorange');
                }
                this.fetchGlb(this.path + this.fileName)
                .then((data) => {
                    return this.parse(data);
                })
                .then((data) => {
                    this.getScene(data);
                    this.generate(data);
                    this.data = data;
                    resolve({
                        asset: this.asset,
                        data: this.data,
                        node: this.gltfNode
                    });
                })
                .catch((err) => {
                    console.error(err);
                });
            }else{
                if(this.parent.isConsoleOutput === true){
                    console.log(`%cfetch gltf%c: %c${this.fullPath}`, `color: ${CONSOLE_OUTPUT_COLOR}`, 'color: inherit', 'color: darkorange');
                }
                this.fetchGltf(this.path + this.fileName)
                .then((data) => {
                    return this.parse(data);
                })
                .then((data) => {
                    this.getScene(data);
                    this.generate(data);
                    this.data = data;
                    resolve({
                        asset: this.asset,
                        data: this.data,
                        node: this.gltfNode
                    });
                })
                .catch((err) => {
                    console.error(err);
                });
            }
        });
    }
    generate(data){
        this.gltfNode = [];
        data.scenes.forEach((v) => {
            // シーンレベルで forEach するので、これがルートノードになる（第三引数）
            this.generateNodeFromGltf(v, null, true);
        });
    }
    generateNodeFromGltf(data, parentMatrix, root){
        let node = new Node(data, parentMatrix, root);
        let index = this.gltfNode.length;
        this.gltfNode.push(node);
        if(Array.isArray(data.children) === true){
            data.children.forEach((v) => {
                let child = this.generateNodeFromGltf(v, this.gltfNode[index].mMatrix);
                this.gltfNode[index].children.push(child);
            });
        }
        return node;
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
                                let objectUrl = window.URL.createObjectURL(blob);
                                img.addEventListener('load', () => {
                                    window.URL.revokeObjectURL(objectUrl);
                                    res(img);
                                }, false);
                                img.src = objectUrl;
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
            if(v.hasOwnProperty('byteOffset') !== true){
                v.byteOffset = 0;
            }
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
