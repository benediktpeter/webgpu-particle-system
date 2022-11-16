export class FpsCounter {

    private _frameCounter = 0;
    private _frameStartTime: number;

    private _targetFPS = 60;

    constructor() {
        this._frameStartTime = performance.now();
    }

    public update() : void {
        let currentTime = performance.now();
        if(currentTime - this._frameStartTime > 1000) {
            const FpsCounterHTML = document.getElementById('fps-counter');
            if (!FpsCounterHTML) {
                throw new Error("FPS counter html element not found")
            }
            // display fps on page
            FpsCounterHTML.textContent = "" + this._frameCounter + " FPS";

            // change color according to framerate
            if (this._frameCounter >= this._targetFPS) {
                FpsCounterHTML.style.color = "DarkGreen";
            }
            else if (this._frameCounter >= this._targetFPS -10) {
                FpsCounterHTML.style.color = "DarkGoldenRod";
            }
            else {
                FpsCounterHTML.style.color = "DarkRed";
            }

            // reset counter
            this._frameStartTime = currentTime;
            this._frameCounter = 0;
        }
        this._frameCounter++;
    }

    get frameCounter(): number {
        return this._frameCounter;
    }

    get targetFPS(): number {
        return this._targetFPS;
    }

    set targetFPS(value: number) {
        this._targetFPS = value;
    }
}
