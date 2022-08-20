import "../dist/site.css";
import {Renderer} from "./renderer";
import {ParticleGUI} from "./gui";

let gui = new ParticleGUI();
let renderer = new Renderer();

function frame() {
    renderer.updateData(gui);
    renderer.frame();
    requestAnimationFrame(frame);
}

function setupAndRenderTestQuad() {
    renderer.initCheck()
        .then(() => renderer.initRenderer(gui.guiData.useCPU)
            .then(() => requestAnimationFrame(frame))
        );
}

setupAndRenderTestQuad()


window.addEventListener('resize', function() {
    console.log("resizing window")
    setupAndRenderTestQuad()
});
