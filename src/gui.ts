import * as dat from 'dat.gui';
import {Particles} from "./particles";

export class ParticleGUI {
    gui = new dat.GUI();
    private _guiData = {
        refParticleGUI: this,

        vertexPulling: false,

        particleColor2: [252,118,39,255],
        particleColor: [230,220,155,255],

        numberOfParticles: 1000000,
        spawnY: 0,  //todo: add radius for tree mode
        minParticleLifetime: 1,
        maxParticleLifetime: 5,
        particleHeight: 15,
        particleWidth: 15,
        particleBrightness: 0.2,

        useSpawnCap: true,
        useBufferAliasing: true,

        texture: "circle_05.png",

        mode: "default",

        useCustomColors: true,
        useAdditiveBlending: true
    }

    constructor() {
        // @ts-ignore
        this._guiData['Leaves Preset'] = function () {
            this.refParticleGUI.setPresetLeaves()
        };

        // @ts-ignore
        this._guiData['Default Preset'] = function () {
            this.refParticleGUI.setPresetDefault()
        };


        this.gui.remember(this._guiData);

        //this.gui.add(this._guiData, 'Default Preset');//todo: add when implemented
        this.gui.add(this._guiData, 'Leaves Preset');

        this.gui.add(this._guiData, 'mode', ['default', 'snow', 'tree'])

        this.gui.add(this._guiData, "vertexPulling");
        this.gui.add(this._guiData, "useSpawnCap");
        this.gui.add(this._guiData, "useBufferAliasing");

        this.gui.add(this._guiData, "particleHeight");
        this.gui.add(this._guiData, "particleWidth");

        this.gui.add(this._guiData, 'numberOfParticles');
        this.gui.add(this._guiData, "spawnY").min(-5).max(5).step(0.01);
        this.gui.add(this._guiData, 'minParticleLifetime');
        this.gui.add(this._guiData, 'maxParticleLifetime');
        this.gui.add(this._guiData, 'particleBrightness');

        this.gui.add(this._guiData, 'useCustomColors')
        this.gui.addColor(this._guiData, 'particleColor');
        this.gui.addColor(this._guiData, 'particleColor2');

        this.gui.add(this._guiData, 'texture', ['circle_05.png', 'circle_01.png', '1x1-white.png', 'leaf1.png'])
        this.gui.add(this._guiData, 'useAdditiveBlending')

    }


    get guiData() {
        if (this._guiData.numberOfParticles > Particles.MAX_NUM_PARTICLES) {
            window.alert("Too many particles. Maximum number of particles: " + Particles.MAX_NUM_PARTICLES);
            this._guiData.numberOfParticles = Particles.MAX_NUM_PARTICLES;
        }
        return this._guiData;
    }

    public setGUIValue(propertyName: string, value: any) : void {
        //console.log(value)
        this.gui.__controllers.forEach(controller => {
            if(controller.property == propertyName){
                controller.setValue(value);
                controller.updateDisplay();
                return;
            }
        }
        );
    }

    public setPresetLeaves() : void {
        this.gui.__controllers.forEach(controller => {
                switch (controller.property) {
                    case "mode":
                        controller.setValue("tree");
                        controller.updateDisplay();
                        break;
                    case "useAdditiveBlending":
                        controller.setValue(false);
                        controller.updateDisplay();
                        break;
                    case "particleHeight":
                        controller.setValue(35);
                        controller.updateDisplay();
                        break;
                    case "particleWidth":
                        controller.setValue(35);
                        controller.updateDisplay();
                        break;
                    case "numberOfParticles":
                        controller.setValue(100000);
                        controller.updateDisplay();
                        break;
                    case "useCustomColors":
                        controller.setValue(false);
                        controller.updateDisplay();
                        break;
                    case "texture":
                        controller.setValue("leaf1.png");
                        controller.updateDisplay();
                        break;
                }
            }
        );
    }

    public setPresetSnow() : void {
        //todo: implement
    }

    public setPresetDefault() : void {
        Object.getOwnPropertyNames(this._guiData).forEach(property => {
            console.log(property)
            // @ts-ignore
            this.setGUIValue(property, this._guiData[property]) //todo: this takes the current values. add a copy of the initial values
        })
    }
}
