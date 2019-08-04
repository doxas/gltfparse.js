
const PATH_STRING = './resource/assassin_gai/scene.gltf';
// const PATH_STRING = './resource/ac-cobra-classic/source/AC Cobra 1.glb';

window.addEventListener('load', () => {
    let w = new WebGLFrame();

    let g = new GLTFParse();
    g.load(PATH_STRING);
});

