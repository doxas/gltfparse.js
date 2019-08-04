
const PATH_STRING = './resource/assassin_gai/scene.gltf';

window.addEventListener('load', () => {
    let w = new WebGLFrame();

    let g = new GLTFParse();
    g.load(PATH_STRING);
});

