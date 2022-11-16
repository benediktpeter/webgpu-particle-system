export class VertexUniformBuffer {

    private readonly _uniformBuffer : GPUBuffer;

    private _bufferSize = 4 + 4; //float, float
    private readonly HALFWIDTH_OFFSET : number = 0;
    private readonly HALFHEIGHT_OFFSET : number = this.HALFWIDTH_OFFSET + 4;

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
    }

    get uniformBuffer(): GPUBuffer {
        return this._uniformBuffer;
    }

    get bufferSize(): number {
        return this._bufferSize;
    }

    public setHeight(height: number): void {
        let halfHeight = (height * 0.5) / this._canvasHeight;
        this._device.queue.writeBuffer(this._uniformBuffer, this.HALFHEIGHT_OFFSET, Float32Array.of(halfHeight));
    }

    public setWidth(width: number) : void {
        let halfWidth = (width * 0.5) / this._canvasWidth;
        this._device.queue.writeBuffer(this._uniformBuffer, this.HALFWIDTH_OFFSET, Float32Array.of(halfWidth));
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
