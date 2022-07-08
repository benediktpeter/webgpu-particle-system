import {mat4, vec2, vec3} from "gl-matrix";

export class Camera {

    private _position: vec3;
    private _target: vec3 = vec3.fromValues(0,0,0);

    private _projectionMatrix: mat4 = mat4.create()
    private _viewMatrix: mat4 = mat4.create();
    private _viewProjectionMatrix: mat4 = mat4.create();


    constructor(position: vec3, target: vec3, fov: number = (2 * Math.PI) / 5, aspect: number = 16.0/9, near: number = 0.001, far: number = 100.0) {
        this._position = position;
        this._target = target;

        mat4.perspective(this._projectionMatrix, fov, aspect, near, far);
        this.updateMatrix();
    }

    private updateMatrix() : void {
        // update view matrix
        this._viewMatrix = mat4.create();
        mat4.lookAt(this._viewMatrix, this._position, this._target, vec3.fromValues(0,1,0));

        // multiply projection matrix with view matrix to get view projection matrix
        mat4.multiply(this._viewProjectionMatrix, this._projectionMatrix, this._viewMatrix);
    }


    get position(): vec3 {
        return this._position;
    }

    set position(value: vec3) {
        this._position = value;
    }

    get target(): vec3 {
        return this._target;
    }

    set target(value: vec3) {
        this._target = value;
    }

    public getViewProjectionMatrix(): mat4 {
        this.updateMatrix();
        return this._viewProjectionMatrix;
    }

}