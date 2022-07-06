import "./site.css";
import {Renderer} from "./renderer";


let renderer = new Renderer();

function frame() {
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


window.addEventListener('resize', function() {
    setupAndRenderTestQuad()
});
