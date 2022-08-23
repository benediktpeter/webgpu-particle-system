import * as dat from 'dat.gui';
import {Particles} from "./particles";

export class ParticleGUI {
    gui = new dat.GUI();
    private _guiData = {
        useCPU: false,
        vertexPulling: true,

        particleColor2: [252,118,39,255],
        particleColor: [230,220,155,255],

        numberOfParticles: 100000,
        minParticleLifetime: 1,
        maxParticleLifetime: 5,
        particleHeight: 8,
        particleWidth: 8
    }

    constructor() {
        this.gui.remember(this._guiData);

        this.gui.add(this._guiData, "vertexPulling");

        this.gui.add(this._guiData, "particleHeight");
        this.gui.add(this._guiData, "particleWidth");

        this.gui.add(this._guiData, 'numberOfParticles');
        this.gui.add(this._guiData, 'minParticleLifetime');
        this.gui.add(this._guiData, 'maxParticleLifetime');


        this.gui.addColor(this._guiData, 'particleColor');
        this.gui.addColor(this._guiData, 'particleColor2');
    }


    get guiData() {
        if (this._guiData.numberOfParticles * Particles.INSTANCE_SIZE > 0x7FFFFFF)
        {
            window.alert("Too many particles. Maximum number of particles: " + Math.floor(0x7FFFFFF / 32));
            this._guiData.numberOfParticles = 100000;
        }

        return this._guiData;
    }
}
