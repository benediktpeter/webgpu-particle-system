import {TimeStamps} from "./timestamps";

export class BenchmarkLogger {

    private text: string;
    private duration: number;
    private startTimestamp: number;

    constructor(duration: number) {
        this.duration = duration;
        this.startTimestamp = performance.now();

        this.text = "frame_duration";    //only for now
    }

    public async addEntry(timestamps: TimeStamps) {
        console.log("adding entry") //todo: delete
        if(this.duration == 0) return;
        if(performance.now() - this.startTimestamp > this.duration * 1000){
            this.createFile();
            this.duration = 0;
            return;
        }

        const timestampEntries = await timestamps.getAllBufferEntries(); //todo: if await causes problems here retrieve buffer data in render function instead and give array to this function
        const startComputeTime = timestampEntries[TimeStamps.START_COMPUTE_IDX];
        const endRenderTime = timestampEntries[TimeStamps.END_RENDER_IDX];

        this.text += "\n" + (startComputeTime - endRenderTime); // + "," + next...
    }


    public createFile() {
        console.log("creating file")
        this.downloadFile("log.csv", this.text);
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



}
