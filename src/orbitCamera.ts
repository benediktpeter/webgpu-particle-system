import {glMatrix, mat4, quat, vec3} from "gl-matrix";

export class OrbitCamera {

    private _position : vec3;
    private _target: vec3;
    private _up: vec3

    private _rotationQuat = quat.create();

    _projectionMatrix : mat4;
    _viewMatrix: mat4 = mat4.create();

    readonly ZOOM_FACTOR = 0.001;
    readonly MAX_ZOOM = 500;
    readonly MIN_ZOOM = 0.01;
    readonly MOVE_FACTOR = 1.0;

    private _prevMouseX: number = 0;
    private _prevMouseY: number = 0;

    private currentXRotation = 0.0;


    constructor(eye: vec3, center: vec3, up: vec3, fov: number = 60, aspect: number = 16.0/9, near: number = 0.001, far: number = 10000.0) {
        this._position = eye;
        this._target = center;
        this._up = up;

        this._projectionMatrix = OrbitCamera.perspectiveWebGpuFormat(glMatrix.toRadian(fov), aspect, near, far)
        this.updateViewMatrix();

        const canvas = document.getElementById('canvas-webgpu') as HTMLCanvasElement;
        canvas.onwheel = (evt) => {
            this.onMouseWheel(evt.deltaY)
        };
        canvas.addEventListener('mousemove', this.onMouseMove);
    }

    public getViewProjectionMatrix() : mat4 {
        this.updateViewMatrix()
        let viewProjectionMatrix = mat4.create();
        mat4.multiply(viewProjectionMatrix, this._projectionMatrix, this._viewMatrix);
        return viewProjectionMatrix;
    }

    private onMouseWheel(deltaY : number) : void {
        this._position[2] += deltaY * this.ZOOM_FACTOR;
        this._position[2] = Math.min(this.MAX_ZOOM, this._position[2]);
        this._position[2] = Math.max(this.MIN_ZOOM, this._position[2]);
        console.log(this._position)
    }

    private updateViewMatrix() {
        const translationMatrix = mat4.create();
        const rotationMatrix = mat4.create();

        mat4.lookAt(translationMatrix, this._position, this._target, this._up);
        mat4.fromQuat(rotationMatrix, this._rotationQuat);

        this._viewMatrix = translationMatrix;
        this._viewMatrix = mat4.multiply(this._viewMatrix, translationMatrix, rotationMatrix);
    }

    private rotate(angleX: number, angleY: number, angleZ: number): void {
        // lock vertical rotation between -89 and 89 degrees
        this.currentXRotation += angleX;
        let boundedXRotation = Math.max(-89, this.currentXRotation);
        boundedXRotation = Math.min(89, boundedXRotation);
        const angleXDifference = boundedXRotation - this.currentXRotation;
        angleX += angleXDifference;
        this.currentXRotation = boundedXRotation;


        let offsetQuat = quat.create();
        offsetQuat = quat.fromEuler(offsetQuat, angleX, angleY, angleZ);
        quat.multiply(this._rotationQuat, offsetQuat, this._rotationQuat);
        this.updateViewMatrix();
    }

    private onMouseMove = (event: MouseEvent): void => {
        let currentX = event.clientX;
        let currentY = event.clientY;
        if (event.buttons === 1) {
            let offsetX = (currentX - this._prevMouseX) * this.MOVE_FACTOR;

            //let offsetY = (currentY - this._prevMouseY) * this.MOVE_FACTOR;
            let offsetY = 0;

            this.rotate(0.0, offsetX, 0.0);
            this.rotate(offsetY, 0.0, 0.0);
        }
        this._prevMouseX = currentX;
        this._prevMouseY = currentY;
    };

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


    get position(): vec3 {
        return this._position;
    }

    set position(value: vec3) {
        this._position = value;
        this.updateViewMatrix()
    }

    get target(): vec3 {
        return this._target;
    }

    set target(value: vec3) {
        this._target = value;
        this.updateViewMatrix()
    }

    get up(): vec3 {
        return this._up;
    }

    set up(value: vec3) {
        this._up = value;
        this.updateViewMatrix()
    }
}
