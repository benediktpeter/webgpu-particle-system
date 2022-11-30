import * as dat from 'dat.gui';
import {Particles} from "./particles";

export class ParticleGUI {
    gui = new dat.GUI();
    private _guiData = {
        vertexPulling: false,

        particleColor2: [252,118,39,255],
        particleColor: [230,220,155,255],

        numberOfParticles: 1000000,
        minParticleLifetime: 1,
        maxParticleLifetime: 5,
        particleHeight: 15,
        particleWidth: 15,
        particleBrightness: 0.2,

        useSpawnCap: true,
        useBufferAliasing: true,

        texture: "circle_05.png",

        mode: "default",

        useCustomColors: true
    }

    constructor() {
        this.gui.remember(this._guiData);
        this.gui.add(this._guiData, 'mode', ['default', 'snow'])

        this.gui.add(this._guiData, "vertexPulling");
        this.gui.add(this._guiData, "useSpawnCap");
        this.gui.add(this._guiData, "useBufferAliasing");

        this.gui.add(this._guiData, "particleHeight");
        this.gui.add(this._guiData, "particleWidth");

        this.gui.add(this._guiData, 'numberOfParticles');
        this.gui.add(this._guiData, 'minParticleLifetime');
        this.gui.add(this._guiData, 'maxParticleLifetime');
        this.gui.add(this._guiData, 'particleBrightness');

        this.gui.add(this._guiData, 'useCustomColors')
        this.gui.addColor(this._guiData, 'particleColor');
        this.gui.addColor(this._guiData, 'particleColor2');

        this.gui.add(this._guiData, 'texture', ['circle_05.png', 'circle_01.png', '1x1-white.png'])
    }


    get guiData() {
        if (this._guiData.numberOfParticles > Particles.MAX_NUM_PARTICLES) {
            window.alert("Too many particles. Maximum number of particles: " + Particles.MAX_NUM_PARTICLES);
            this._guiData.numberOfParticles = Particles.MAX_NUM_PARTICLES;
        }

        return this._guiData;
    }
}
