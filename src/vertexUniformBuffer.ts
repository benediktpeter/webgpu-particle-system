export class VertexUniformBuffer {

    private readonly _uniformBuffer : GPUBuffer;

    private _bufferSize = 4 + 4 + 4; //float, float, u32
    private readonly HALFWIDTH_OFFSET : number = 0;
    private readonly HALFHEIGHT_OFFSET : number = this.HALFWIDTH_OFFSET + 4;
    private readonly ROTATION_ENABLED_OFFSET : number = this.HALFHEIGHT_OFFSET + 4;

    private readonly PARTICLE_SIZE_FACTOR = 0.001;

    private _canvasHeight : number;
    private _canvasWidth : number;
    private _device: GPUDevice;

    constructor(device: GPUDevice, canvasHeight: number, canvasWidth: number, height: number = 5, width: number = 5) {
        if(canvasHeight <= 0 || canvasWidth <= 0) {
            throw new Error("Invalid canvas dimensions")
        }
        this._canvasHeight = canvasHeight;
        this._canvasWidth = canvasWidth;

        this._device = device;
        this._uniformBuffer = device.createBuffer({
            size: this._bufferSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.setHeight(height);
        this.setWidth(width);
        this.setEnableRotation(false)
    }

    get uniformBuffer(): GPUBuffer {
        return this._uniformBuffer;
    }

    get bufferSize(): number {
        return this._bufferSize;
    }

    public setHeight(height: number): void {
        let halfHeight = (height * 0.5) * this.PARTICLE_SIZE_FACTOR// / this._canvasHeight;
        this._device.queue.writeBuffer(this._uniformBuffer, this.HALFHEIGHT_OFFSET, Float32Array.of(halfHeight));
    }

    public setWidth(width: number) : void {
        let halfWidth = (width * 0.5) * this.PARTICLE_SIZE_FACTOR// / this._canvasWidth;
        this._device.queue.writeBuffer(this._uniformBuffer, this.HALFWIDTH_OFFSET, Float32Array.of(halfWidth));
    }

    public setEnableRotation(enableRotation : boolean) : void {
        this._device.queue.writeBuffer(this._uniformBuffer, this.ROTATION_ENABLED_OFFSET, Uint32Array.of(enableRotation ? 1 : 0))
    }

    get canvasHeight(): number {
        return this._canvasHeight;
    }

    set canvasHeight(value: number) {
        this._canvasHeight = value;
    }

    get canvasWidth(): number {
        return this._canvasWidth;
    }

    set canvasWidth(value: number) {
        this._canvasWidth = value;
    }
}
