import {TimeStamps} from "./timestamps";

export class BenchmarkLogger {

    private text: string;
    private duration: number;
    private startTimestamp: number;

    private numParticles: number;
    private particleWidth: number;
    private particleHeight: number;
    private vertexPulling: boolean;
    private gpu: string;
    private other: string;

    constructor(duration: number, numParticles: number, vertexPulling: boolean, gpu: string, particleWidth: number, particleHeight: number, other?: string) {
        this.duration = duration;
        this.startTimestamp = performance.now();

        this.text = "start_comp,end_comp,start_render,end_render";
        this.numParticles = numParticles;
        this.vertexPulling = vertexPulling;
        this.gpu = gpu;
        this.other = other == undefined ? "" : other;
        this.particleHeight = particleHeight;
        this.particleWidth = particleWidth;
    }

    public async addEntry(timestamps: TimeStamps) {
        if(this.duration == 0) return;
        if(performance.now() - this.startTimestamp > this.duration * 1000){
            this.createFile();
            this.duration = 0;
            return;
        }

        const timestampEntries = await timestamps.getAllBufferEntries();
        const startComputeTime = timestampEntries[TimeStamps.START_COMPUTE_IDX];
        const endComputeTime = timestampEntries[TimeStamps.END_COMPUTE_IDX];
        const startRenderTime = timestampEntries[TimeStamps.START_RENDER_IDX];
        const endRenderTime = timestampEntries[TimeStamps.END_RENDER_IDX];

        // Note: time values in nanoseconds
        this.text += "\n" + startComputeTime + "," + endComputeTime + "," + startRenderTime + "," + endRenderTime;
    }


    public createFile() {
        console.log("creating file")
        this.downloadFile("log_"+ this.gpu +"_" + this.numParticles + "particles" + this.particleHeight + "x" + this.particleWidth + (this.vertexPulling ? "_usingVertexPulling" : "_usingInstancing") +".csv", this.text);
    }


    private downloadFile(filename: string, text: string): void {
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }

    public isExpired(): boolean {
        return this.duration == 0;
    }

}
