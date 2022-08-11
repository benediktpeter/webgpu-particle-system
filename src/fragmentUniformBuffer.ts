import {vec3, vec4} from "gl-matrix";

export class FragmentUniformBuffer {

    private _device: GPUDevice;
    private readonly _uniformBuffer : GPUBuffer;

    private _bufferSize = 64; // float

    private readonly COLOR_OFFSET : number = 0;
    private readonly COLOR2_OFFSET: number = this.COLOR_OFFSET + 4*4;
    private readonly MAX_LIFETIME_OFFSET: number = this.COLOR2_OFFSET + 4*4;


    constructor(device: GPUDevice, color: vec3, color2: vec3, maxLifetime: number) {
        this._device = device;
        this._uniformBuffer = device.createBuffer({
            size: this._bufferSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.setColor(color);
        this.setColor2(color2)
        this.setMaxLifetime(maxLifetime);
    }

    public setColor(color: vec3) : void {
        this._device.queue.writeBuffer(this._uniformBuffer, this.COLOR_OFFSET, color as ArrayBuffer);
    }

    public setColor2(color2: vec3) : void {
        this._device.queue.writeBuffer(this._uniformBuffer, this.COLOR2_OFFSET, color2 as ArrayBuffer);
    }

    private setMaxLifetime(maxLifetime: number) {
        this._device.queue.writeBuffer(this._uniformBuffer, this.MAX_LIFETIME_OFFSET, Float32Array.of(maxLifetime));
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