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
        .then(() => renderer.initRenderer()
            .then(() => requestAnimationFrame(frame))
        );
}

setupAndRenderTestQuad()
