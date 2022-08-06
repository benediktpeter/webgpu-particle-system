import * as dat from 'dat.gui';

export class ParticleGUI {
    gui = new dat.GUI();
    private _guiData = {
        useCPU: false,

        particleColor: [255,0,255], //alpha?

        numberOfParticles: 1000,
        minParticleLifetime: 1,
        maxParticleLifetime: 5
    }

    constructor() {
        this.gui.remember(this._guiData);

        this.gui.add(this._guiData, "useCPU");

        this.gui.add(this._guiData, 'numberOfParticles');
        this.gui.add(this._guiData, 'minParticleLifetime')
        this.gui.add(this._guiData, 'maxParticleLifetime')


        this.gui.addColor(this._guiData, 'particleColor');
    }


    get guiData() {
        return this._guiData;
    }
}