import "./site.css";
import {Renderer} from "./renderer";


let renderer = new Renderer();
renderer.initRenderer()
    .then(() => renderer.initTriangle()
        .then(()=>renderer.renderTriangle())
);

window.addEventListener('resize', function() {
    renderer.initRenderer()
        .then(() => renderer.initTriangle()
            .then(()=>renderer.renderTriangle())
        );
});
