import {vec3} from "gl-matrix";

export function vec3FromArray(array: number[]) : vec3 {
    return vec3.fromValues(array[0], array[1], array[2]);
}

export function vec3ToColor(rgb : vec3): vec3 {
    const factor = 1.0 / 255;
    return multiplyVec3WithNumber(rgb, factor);
}

// helper method for multiplying a vec3 with a number
export function multiplyVec3WithNumber(vector: vec3, scalar: number): vec3 {
    return vec3.fromValues(vector[0] * scalar, vector[1] * scalar, vector[2] * scalar);
}