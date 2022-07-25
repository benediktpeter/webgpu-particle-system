import * as dat from 'dat.gui';

export class ParticleGUI {
    gui = new dat.GUI();
    private _guiData = {
        message: "Hello World!",
        particleColor: [255,0,255] //alpha?
    }

    constructor() {
        this.gui.remember(this._guiData);

        this.gui.addColor(this._guiData, 'particleColor');
    }


    get guiData() {
        return this._guiData;
    }
}