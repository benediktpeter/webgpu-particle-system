import {mat4, vec3, vec4} from 'gl-matrix';

export class Particles {

    public static readonly INSTANCE_SIZE = 3*4 //+ 4; // vec3 position, float lifetime

    private _numParticles = 50;
    private _originPos : vec3 = vec3.fromValues(0,0,0);
    private _initialVelocity: number = 1;
    private _particleLifetime: number = 5;
    private _gravity: vec3 = [0,-0.5,0]

    private _device : GPUDevice;
    private _particleBuffer? : GPUBuffer;

    private _useCPU : boolean;


    private _particlePositionsCPU : Float32Array = new Float32Array();
    private _particleVelocitiesCPU : Float32Array = new Float32Array();
    private _particleLifetimesCPU : Float32Array = new Float32Array();



    constructor(device: GPUDevice, useCPU: boolean) {
        if(!useCPU) {
            throw new Error("GPU particle computation has not been implemented yet.")
        }
        this._device = device;
        this._useCPU = useCPU;

        if(this._useCPU) {
            this.initCPU();
        } else {
            this.initGPU();
        }
    }

    private initCPU() : void {
        // spawn all particles at the origin
        this._particlePositionsCPU = new Float32Array(3 * this._numParticles);
        for (let i = 0; i < this._numParticles; i++ ) {
            this._particlePositionsCPU.set(this._originPos, 3 * i);
        }

        // create vertex buffer
        this.createPositionsVertexBuffer();


        // initialize velocities and lifetimes
        this._particleVelocitiesCPU = new Float32Array(3 * this._numParticles);
        this._particleLifetimesCPU = new Float32Array(this._numParticles);
        for (let i = 0; i < this._numParticles; i++) {
            let velocity = Particles.getRandomVec3(true)
            vec3.scale(velocity, velocity, this._initialVelocity);  // set length to initial velocity
            this._particleVelocitiesCPU.set(velocity, 3 * i)

            this._particleLifetimesCPU.set([this._particleLifetime], i);
        }

        // write particle positions into gpu buffer
        // @ts-ignore
        new Float32Array(this._particleBuffer.getMappedRange()).set(this._particlePositionsCPU);
        // @ts-ignore
        this._particleBuffer.unmap();

    }


    private createPositionsVertexBuffer(writeData: boolean = false) {
        this._particleBuffer = this._device.createBuffer({
            size: this._numParticles * Particles.INSTANCE_SIZE,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE,
            mappedAtCreation: true,
        });
        if (writeData){
            new Float32Array(this._particleBuffer.getMappedRange()).set(this._particlePositionsCPU);
            this._particleBuffer.unmap();
        }
    }
    private initGPU() {
        console.log("GPU particles not yet implemented");
    }

    public update(deltatime : number) : void {
        if(this._useCPU)
            this.updateCPU(deltatime);
    }


    private updateCPU(deltatime: number) {
        for (let i = 0; i < this._numParticles; i++) {
            let pos = vec3.fromValues(this._particlePositionsCPU[3 * i], this._particlePositionsCPU[3 * i + 1], this._particlePositionsCPU[3 * i + 2])
            let velocity = vec3.fromValues(this._particleVelocitiesCPU[3 * i], this._particleVelocitiesCPU[3 * i + 1], this._particleVelocitiesCPU[3 * i + 2])
            let lifetime = this._particleLifetimesCPU[i];

            // respawn expired particles
            if (lifetime <= 0) {
                // todo: spawn new particle at index i(*3)
            }

            // apply gravity to velocity
            velocity = vec3.add(velocity, velocity, Particles.multiplyVec3WithNumber(this.gravity, deltatime));

            // apply force to position
            vec3.add(pos, pos, Particles.multiplyVec3WithNumber(velocity, deltatime));

            // update lifetime
            lifetime -= deltatime;

            // update data in arrays
            this._particlePositionsCPU.set(pos, i * 3);
            this._particleVelocitiesCPU.set(velocity, i * 3);
            this._particleLifetimesCPU.set([lifetime], i);
        }

        // update GPU buffers
        // since GPUBufferUsage.WRITE and GPUBufferUsage.VERTEX cannot be combined the buffer has to be destroyed and recreated in order to update it
        this._particleBuffer?.destroy()
        this.createPositionsVertexBuffer(true)
    }

    private static getRandomVec3(normalize: boolean = false) {
        let result = vec3.create();
        //fill with random numbers between -1 and 1
        result[0] = (Math.random() - 0.5) * 2;
        result[1] = (Math.random() - 0.5) * 2;
        result[2] = (Math.random() - 0.5) * 2;
        if (normalize)
            vec3.normalize(result, result);
        return result;
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


    get initialVelocity(): number {
        return this._initialVelocity;
    }

    set initialVelocity(value: number) {
        this._initialVelocity = value;
    }


    get gravity(): vec3 {
        return this._gravity;
    }

    set gravity(value: vec3) {
        this._gravity = value;
    }

    // helper method for multiplying a vec3 with a number
    private static multiplyVec3WithNumber(vector: vec3, scalar: number): vec3 {
        return vec3.fromValues(vector[0] * scalar, vector[1] * scalar, vector[2] * scalar);
    }
}