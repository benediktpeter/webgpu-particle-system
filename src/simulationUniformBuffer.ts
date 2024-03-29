import {vec3, vec4} from "gl-matrix";

export class SimulationUniformBuffer {

    private readonly _uniformBuffer : GPUBuffer;
    private _device: GPUDevice;

    private readonly _bufferSize = 112;

    private readonly DELTATIME_OFFSET = 0;
    private readonly GRAVITY_OFFSET = 16;
    private readonly ORIGIN_OFFSET = 32;
    private readonly MIN_LIFETIME_OFFSET = this.ORIGIN_OFFSET + 3*4;
    private readonly MAX_LIFETIME_OFFSET = this.MIN_LIFETIME_OFFSET + 4;
    private readonly INITIAL_VELOCITY_OFFSET = this.MAX_LIFETIME_OFFSET + 4;
    private readonly RAND_SEED_OFFSET = this.INITIAL_VELOCITY_OFFSET + 4;
    private readonly MAX_SPAWN_COUNT_OFFSET = this.RAND_SEED_OFFSET + 24;
    private readonly USE_SPAWN_CAP_OFFSET = this.MAX_SPAWN_COUNT_OFFSET + 4;
    private readonly USE_ALIASING_SPAWN_CAP_OFFSET = this.USE_SPAWN_CAP_OFFSET + 4;
    private readonly MODE_OFFSET = this.USE_ALIASING_SPAWN_CAP_OFFSET + 4;
    private readonly WIND_OFFSET = this.MODE_OFFSET + 4;
    private readonly TREE_RADIUS_OFFSET = this.WIND_OFFSET + 4*4;


    constructor(device: GPUDevice) {
        this._device = device;
        this._bufferSize += 16;

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
        this._device.queue.writeBuffer(this._uniformBuffer, this.GRAVITY_OFFSET, Float32Array.from(gravity) as ArrayBuffer);
    }

    public setOrigin(origin : vec3) : void {
        this._device.queue.writeBuffer(this._uniformBuffer, this.ORIGIN_OFFSET, Float32Array.from(origin) as ArrayBuffer);
    }

    public setMinLifetime(minLifetime: number) : void {
        this._device.queue.writeBuffer(this._uniformBuffer, this.MIN_LIFETIME_OFFSET, Float32Array.of(minLifetime));
    }

    public setMaxLifetime(maxLifetime: number) : void {
        this._device.queue.writeBuffer(this._uniformBuffer, this.MAX_LIFETIME_OFFSET, Float32Array.of(maxLifetime));
    }

    public setInitialVelocity(initialVelocity: number) : void {
        this._device.queue.writeBuffer(this._uniformBuffer, this.INITIAL_VELOCITY_OFFSET, Float32Array.of(initialVelocity));
    }

    public setRandSeed(seed: vec4) : void {
        this._device.queue.writeBuffer(this._uniformBuffer, this.RAND_SEED_OFFSET, Float32Array.from(seed) as ArrayBuffer);
    }

    public setWind(wind: vec4) : void {
        this._device.queue.writeBuffer(this._uniformBuffer, this.WIND_OFFSET, Float32Array.from(wind) as ArrayBuffer);
    }

    public setMaxSpawnCount(maxSpawnCount: number) : void {
        this._device.queue.writeBuffer(this._uniformBuffer, this.MAX_SPAWN_COUNT_OFFSET, Uint32Array.of(maxSpawnCount));
    }

    public setUseSpawnCap(useSpawnCap: boolean) : void {
        this._device.queue.writeBuffer(this._uniformBuffer, this.USE_SPAWN_CAP_OFFSET, Uint32Array.of(useSpawnCap ? 1 : 0));
    }

    public setUseSpawnCapAliasing(useAliasing: boolean) : void {
        this._device.queue.writeBuffer(this._uniformBuffer, this.USE_ALIASING_SPAWN_CAP_OFFSET, Uint32Array.of(useAliasing ? 1 : 0));
    }

    public setTreeRadius(treeRadius: number) : void {
        this._device.queue.writeBuffer(this._uniformBuffer, this.TREE_RADIUS_OFFSET, Float32Array.of(treeRadius));
    }

    public setMode(mode: string) : void {
        let modeEnum: number;
        switch (mode) {
            case "default": {
                modeEnum = 0;
                break;
            }
            case "snow": {
                modeEnum = 1;
                break;
            }
            case "tree": {
                modeEnum = 2;
                break;
            }
            default: {
                console.error("Invalid simulation mode. Default mode selected.")
                modeEnum = 0;
            }
        }
        this._device.queue.writeBuffer(this._uniformBuffer, this.MODE_OFFSET, Uint32Array.of(modeEnum));
    }
}
