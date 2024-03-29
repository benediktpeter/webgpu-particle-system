import * as dat from 'dat.gui';
import {Particles} from "./particles";

import presetsJSON from "./presets/presets.json"

export class ParticleGUI {
    gui = new dat.GUI();
    private _guiData = {
        refParticleGUI: this,

        vertexPulling: false,

        particleColor2: [252,118,39,255],
        particleColor: [230,220,155,255],

        numberOfParticles: 1000000,
        spawnY: 0,
        treeRadius: 1,

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
        useAdditiveBlending: true,

        enableWind: false,
        windX: -1,
        windZ: -1,
        windY: 0,
        windStrength: 0.7,
        enableRotation: false,

        gravityY: -1,

        speedFactor: 1,

        spawnsPerSecond: 300000,

        usePixelSize: false
    }

    constructor() {
        // @ts-ignore
        this._guiData['Leaves Preset'] = function () {
            //this.refParticleGUI.setPresetLeaves()
        };


        this.gui.remember(this._guiData);

        this.gui.add(this._guiData, 'mode', ['default', 'snow', 'tree'])

        this.gui.add(this._guiData, 'speedFactor').min(0).max(3).step(0.01);

        this.gui.add(this._guiData, "vertexPulling");
        this.gui.add(this._guiData, "useSpawnCap");
        this.gui.add(this._guiData, "useBufferAliasing");

        this.gui.add(this._guiData, "particleHeight");
        this.gui.add(this._guiData, "particleWidth");
        this.gui.add(this._guiData, "usePixelSize");

        this.gui.add(this._guiData, 'numberOfParticles');
        this.gui.add(this._guiData, "spawnY").min(-5).max(5).step(0.01);
        this.gui.add(this._guiData, "treeRadius").min(0).max(5).step(0.01)
        this.gui.add(this._guiData, 'minParticleLifetime');
        this.gui.add(this._guiData, 'maxParticleLifetime');
        this.gui.add(this._guiData, 'spawnsPerSecond')

        this.gui.add(this._guiData, 'enableWind')
        this.gui.add(this._guiData, "windX").min(-2).max(2).step(0.01);
        this.gui.add(this._guiData, "windY").min(-2).max(2).step(0.01);
        this.gui.add(this._guiData, "windZ").min(-2).max(2).step(0.01);
        this.gui.add(this._guiData, "windStrength").min(0).max(3).step(0.01);
        this.gui.add(this._guiData, "enableRotation");
        this.gui.add(this._guiData, 'gravityY').min(-3).max(3).step(0.01);

        this.gui.add(this._guiData, 'particleBrightness');
        this.gui.add(this._guiData, 'useCustomColors')
        this.gui.addColor(this._guiData, 'particleColor');
        this.gui.addColor(this._guiData, 'particleColor2');

        this.gui.add(this._guiData, 'texture', ['circle_05.png', 'circle_01.png', '1x1-white.png', 'leaf1.png'])
        this.gui.add(this._guiData, 'useAdditiveBlending')

        this.addPresets()
    }


    get guiData() {
        if (this._guiData.numberOfParticles > Particles.MAX_NUM_PARTICLES) {
            window.alert("Too many particles. Maximum number of particles: " + Particles.MAX_NUM_PARTICLES);
            this._guiData.numberOfParticles = Particles.MAX_NUM_PARTICLES;
        }
        return this._guiData;
    }

    private addPresets() {
        Object.getOwnPropertyNames(presetsJSON.remembered).forEach(presetName => {
            if(presetName == "Default") return;
            // @ts-ignore
            const preset = presetsJSON.remembered[presetName];
            this.addPreset(preset[0], presetName);
        })
        this.gui.preset = "Default";
    }

    private addPreset(data: any, name: string) : void {
        Object.getOwnPropertyNames(data).forEach(property => {
            // @ts-ignore
            this.setGUIValue(property, data[property])
        })
        this.gui.saveAs(name);
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

        this.setGUIValue("enableWind", true);
        this.setGUIValue("windX", -1)
        this.setGUIValue("windY", -0.5)
        this.setGUIValue("windZ", 0)
        this.setGUIValue("windStrength", 0.7)
        this.setGUIValue('enableRotation', true)

        this.gui.saveAs("Leaves")
        this.gui.preset = "Default";
    }

}
