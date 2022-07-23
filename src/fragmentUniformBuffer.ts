import {vec3, vec4} from "gl-matrix";

export class FragmentUniformBuffer {

    private _device: GPUDevice;
    private readonly _uniformBuffer : GPUBuffer;

    private _bufferSize = 4; // float

    private readonly COLOR_OFFSET : number = 0;


    constructor(device: GPUDevice, color: vec3) {
        this._bufferSize = Math.max(this._bufferSize, 16);

        this._device = device;
        this._uniformBuffer = device.createBuffer({
            size: this._bufferSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.setColor(color);

    }

    public setColor(color: vec3) : void {
        console.log(this._device)

        this._device.queue.writeBuffer(this._uniformBuffer, this.COLOR_OFFSET, color as ArrayBuffer);
    }


    get device(): GPUDevice {
        return this._device;
    }

    get uniformBuffer(): GPUBuffer {
        return this._uniformBuffer;
    }

    get bufferSize(): number {
        return this._bufferSize;
    }
}