import {mat4, vec3, vec4} from 'gl-matrix';

export class Particles {

    public static readonly INSTANCE_SIZE = 3*4 //+ 4; // vec3 position, float lifetime

    private _numParticles = 3;
    private _originPos : vec3 = vec3.fromValues(0,0,0);

    private _device : GPUDevice;
    private _particleBuffer? : GPUBuffer;

    private _useCPU : boolean;


    private _particlePositionsCPU : Float32Array = new Float32Array();


    constructor(device: GPUDevice, useCPU: boolean) {
        if(!useCPU) {
            throw new Error("GPU particle computation has not been implemented yet.")
        }
        this._device = device;
        //this._particleBuffer = particleBuffer;
        this._useCPU = useCPU;

        if(this._useCPU) {
            this.initCPU();
        } else {
            this.initGPU();
        }
    }

    private initCPU() : void {
        //we use hardcoded values for now
        this._particlePositionsCPU = new Float32Array(3*3); // might need 4
        this._particlePositionsCPU.set([0,0,0], 0);
        this._particlePositionsCPU.set([-3,3,0], 3);
        this._particlePositionsCPU.set([3,0,3], 6);

        //create vertexbuffer
        this._particleBuffer = this._device.createBuffer({
            size: this._numParticles * Particles.INSTANCE_SIZE,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE,
            mappedAtCreation: true,
        });

        //write particle positions into gpu buffer
        new Float32Array(this._particleBuffer.getMappedRange()).set(this._particlePositionsCPU);
        this._particleBuffer.unmap();
        //extract into separate method?

    }


    private initGPU() {
        console.log("GPU particles not yet implemented");
    }

    public update(deltatime : number) : void {
        //todo: implement per frame update for cpu and gpu
    }


    get numParticles(): number {
        return this._numParticles;
    }

    get originPos(): vec3 {
        return this._originPos;
    }

    get particleBuffer(): GPUBuffer {
        return <GPUBuffer>this._particleBuffer;
    }


}