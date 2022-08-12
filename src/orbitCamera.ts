import {glMatrix, mat4, vec3} from "gl-matrix";

var createOrbitCamera = require("orbit-camera")


export class OrbitCamera {

    _orbitCamera : any;
    _projectionMatrix : mat4;
    _viewMatrix: mat4;

    ZOOM_FACTOR = 0.001;

    constructor(eye: vec3, center: vec3, up: vec3, fov: number = 60, aspect: number = 16.0/9, near: number = 0.001, far: number = 1000.0) {
        this._orbitCamera = createOrbitCamera(eye, center, up);
        this._projectionMatrix = OrbitCamera.perspectiveWebGpuFormat(glMatrix.toRadian(fov), aspect, near, far)
        this._viewMatrix = this._orbitCamera.view();

        const canvas = document.getElementById('canvas-webgpu') as HTMLCanvasElement;
        canvas.onwheel = (evt) => {
            this.onMouseWheel(evt.deltaY)
        };
    }

    public getViewProjectionMatrix() : mat4 {
        this._orbitCamera.view(this._viewMatrix)
        let viewProjectionMatrix = mat4.create();
        mat4.multiply(viewProjectionMatrix, this._projectionMatrix, this._viewMatrix);
        return viewProjectionMatrix;
    }

    private onMouseWheel(deltaY : number) : void {
        this._orbitCamera.zoom(-deltaY * this.ZOOM_FACTOR);
        console.log("new matrix: " + this._orbitCamera.view())
    }

    // creates the perspective matrix in the format used by WebGPU (z in range [0,1] rather than [-1,1])
    private static perspectiveWebGpuFormat(fov: number, aspect: number, near: number, far: number) {
        let out = mat4.create();

        const f = Math.tan(Math.PI * 0.5 - 0.5 * fov);
        const rangeInv = 1 / (near - far);

        out[0]  = f / aspect;
        out[1]  = 0;
        out[2]  = 0;
        out[3]  = 0;

        out[4]  = 0;
        out[5]  = f;
        out[6]  = 0;
        out[7]  = 0;

        out[8]  = 0;
        out[9]  = 0;
        out[10] = far * rangeInv;
        out[11] = -1;

        out[12] = 0;
        out[13] = 0;
        out[14] = near * far * rangeInv;
        out[15] = 0;

        return out;
    }


}