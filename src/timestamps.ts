export class TimeStamps {

    private readonly _capacity = 4;
    public static readonly START_COMPUTE_IDX = 0;
    public static readonly END_COMPUTE_IDX = 1;
    public static readonly START_RENDER_IDX = 2;
    public static readonly END_RENDER_IDX = 3;

    private _querySet : GPUQuerySet;
    private _queryBuffer: GPUBuffer;
    private _device: GPUDevice;


    constructor(device: GPUDevice) {
        this._device = device
        this._querySet = device.createQuerySet({
            type: "timestamp",
            count: this._capacity,
        });
        this._queryBuffer = device.createBuffer({
            size: 8 * this._capacity,
            usage: GPUBufferUsage.QUERY_RESOLVE
                | GPUBufferUsage.STORAGE
                | GPUBufferUsage.COPY_SRC
                | GPUBufferUsage.COPY_DST,
        });

    }

    public async getWholeBuffer() {
        return await TimeStamps.readBuffer(this._device, this._queryBuffer);
    }

    public async getBufferEntry(index: number) : Promise<number>{
        const buffer = await this.getWholeBuffer()
        const array = new BigInt64Array(buffer);
        return Number(array[index]);
    }

    public async getAllBufferEntries(): Promise<number[]> {
        let result: number[] = new Array(5);
        const buffer = await this.getWholeBuffer()
        const bufferArray = new BigInt64Array(buffer);
        for(let i = 0; i < 5; i++) {
            result[i] = Number(bufferArray[i])
        }
        return result;
    }

    public writeTimestamp(commandEncoder: GPUCommandEncoder, queryIndex: number = 0) {
        commandEncoder.writeTimestamp(this.querySet, queryIndex);
    }

    public resolveQuerySet(commandEncoder : GPUCommandEncoder){
        commandEncoder.resolveQuerySet(this.querySet,0, this.capacity, this.queryBuffer, 0);
    }

    private static readBuffer = async(device: GPUDevice, buffer: GPUBuffer) => {
        //todo: make non static, maybe inline
        const size = buffer.size;
        const gpuReadBuffer = device.createBuffer({size, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
        const copyEncoder = device.createCommandEncoder();
        copyEncoder.copyBufferToBuffer(buffer, 0, gpuReadBuffer, 0, size);
        const copyCommands = copyEncoder.finish();
        device.queue.submit([copyCommands]);
        await gpuReadBuffer.mapAsync(GPUMapMode.READ);
        return gpuReadBuffer.getMappedRange();
    }


    get capacity(): number {
        return this._capacity;
    }

    get querySet(): any {
        return this._querySet;
    }

    get queryBuffer(): any {
        return this._queryBuffer;
    }
}
