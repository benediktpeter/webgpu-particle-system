import "../dist/site.css";
import {Renderer} from "./renderer";
import {ParticleGUI} from "./gui";

let gui = new ParticleGUI();
let renderer = new Renderer();

function frame() {
    renderer.updateData(gui)
        .then(()=>renderer.frame()
            .then(()=>requestAnimationFrame(frame))
        )
}

function setupRendererAndStartAnimation() {
    renderer.initCheck()
        .then(() => renderer.initRenderer(gui)
            .then(() => requestAnimationFrame(frame))
        );
}

setupRendererAndStartAnimation()
