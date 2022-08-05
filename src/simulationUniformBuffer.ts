import {vec3} from "gl-matrix";

export class SimulationUniformBuffer {

    private readonly _uniformBuffer : GPUBuffer;
    private _device: GPUDevice;

    private readonly _bufferSize = 4 + 3*4 + 3*4 + 4 + 4 + 4;    // f deltatime, v3 gravity, v3 origin, f lifetime, f initialVelocity, f seed

    private readonly DELTATIME_OFFSET = 0;
    private readonly GRAVITY_OFFSET = 16; //4+12 (align 16)
    private readonly ORIGIN_OFFSET = 32;
    private readonly LIFETIME_OFFSET = this.ORIGIN_OFFSET + 3*4;
    private readonly INITIAL_VELOCITY_OFFSET = this.LIFETIME_OFFSET + 4;
    private readonly RAND_SEED_OFFSET = this.INITIAL_VELOCITY_OFFSET + 4;


    constructor(device: GPUDevice) {
        this._device = device;
        this._bufferSize += 16 // error says the size needs to be 56

        this._uniformBuffer = device.createBuffer({
            size: this._bufferSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
    }

    get uniformBuffer(): GPUBuffer {
        return this._uniformBuffer;
    }

    get bufferSize(): number {
        return this._bufferSize;
    }

    public setDeltaTime(deltaTime: number) : void {
        this._device.queue.writeBuffer(this._uniformBuffer, this.DELTATIME_OFFSET, Float32Array.of(deltaTime));
    }

    public setGravity(gravity: vec3) : void {
        this._device.queue.writeBuffer(this._uniformBuffer, this.GRAVITY_OFFSET, Float32Array.from(gravity) as ArrayBuffer);    //this conversion prevents an overload error
    }

    public setOrigin(origin : vec3) : void {
        this._device.queue.writeBuffer(this._uniformBuffer, this.ORIGIN_OFFSET, Float32Array.from(origin) as ArrayBuffer);
    }

    public setLifetime(lifetime: number) : void {
        this._device.queue.writeBuffer(this._uniformBuffer, this.LIFETIME_OFFSET, Float32Array.of(lifetime));
    }

    public setInitialVelocity(initialVelocity: number) : void {
        this._device.queue.writeBuffer(this._uniformBuffer, this.INITIAL_VELOCITY_OFFSET, Float32Array.of(initialVelocity));
    }

    public setRandSeed(seed: number) : void {
        this._device.queue.writeBuffer(this._uniformBuffer, this.RAND_SEED_OFFSET, Float32Array.of(seed));
    }

}