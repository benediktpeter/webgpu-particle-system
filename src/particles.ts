import {mat4, vec2, vec3, vec4} from 'gl-matrix';
import {multiplyVec3WithNumber} from "./utils";
import {ParticleGUI} from "./gui";

export class Particles {

    public static readonly INSTANCE_SIZE = 3*4 //+ 4; // vec3 position, float lifetime

    private _numParticles = 1000;
    private _originPos : vec3 = vec3.fromValues(0,0,0);
    private _initialVelocity: number = 0.5;
    private _particleLifetime: number = 5;
    private _gravity: vec3 = [0,-0.5,0]
    private _maxNumParticlesSpawnPerSecond: number = 80;

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

            this._particleLifetimesCPU.set([0], i);
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

    public update(deltaTime : number) : void {
        if(this._useCPU)
            this.updateCPU(deltaTime);
    }

    public updateData(gui: ParticleGUI): void {
        //todo: handle switching between cpu and gpu mode

        if (this._useCPU) {
            // update number of particles
            if (gui.guiData.numberOfParticles > this._numParticles) {
                let newPosArray = new Float32Array(gui.guiData.numberOfParticles * 3);
                let newVelArray = new Float32Array(gui.guiData.numberOfParticles * 3);
                let newLifetimeArray = new Float32Array(gui.guiData.numberOfParticles);

                newPosArray.set(this._particlePositionsCPU, 0);
                newVelArray.set(this._particleVelocitiesCPU, 0);
                newLifetimeArray.set(this._particleLifetimesCPU, 0);

                this._numParticles = gui.guiData.numberOfParticles;
                this._particlePositionsCPU = newPosArray;
                this._particleVelocitiesCPU = newVelArray;
                this._particleLifetimesCPU = newLifetimeArray;

                console.log("Particle limit increased to " + this._numParticles)
            } else if (gui.guiData.numberOfParticles < this._numParticles) {
                this._numParticles = gui.guiData.numberOfParticles;
                this._particlePositionsCPU = this._particlePositionsCPU.slice(0, 3 * this._numParticles)
                this._particleVelocitiesCPU = this._particleVelocitiesCPU.slice(0, 3 * this._numParticles)
                this._particleLifetimesCPU = this._particleLifetimesCPU.slice(0, this._numParticles)

                console.log("Particle limit decreased to " + this._numParticles)
            }

        } else {
            console.log("GPU particle simulation not yet implemented.")
        }
    }


    private updateCPU(deltaTime: number) {
        const maxSpawnsPerFrame = Math.max(this._maxNumParticlesSpawnPerSecond * deltaTime , 1);
        let particlesSpawnedThisFrame = 0;

        for (let i = 0; i < this._numParticles; i++) {
            let pos = vec3.fromValues(this._particlePositionsCPU[3 * i], this._particlePositionsCPU[3 * i + 1], this._particlePositionsCPU[3 * i + 2])
            let velocity = vec3.fromValues(this._particleVelocitiesCPU[3 * i], this._particleVelocitiesCPU[3 * i + 1], this._particleVelocitiesCPU[3 * i + 2])
            let lifetime = this._particleLifetimesCPU[i];

            // respawn expired particles
            if (lifetime <= 0) {
                if(particlesSpawnedThisFrame >= maxSpawnsPerFrame)  // limit the number of particles that can spawn
                    continue;

                pos = this._originPos;
                velocity = Particles.getRandomVec3(true)
                vec3.scale(velocity, velocity, this._initialVelocity);  // set length to initial velocity
                lifetime = this._particleLifetime;
                particlesSpawnedThisFrame++;

                // update data in arrays
                this._particlePositionsCPU.set(pos, i * 3);
                this._particleVelocitiesCPU.set(velocity, i * 3);
                this._particleLifetimesCPU.set([lifetime], i);
                continue;
            }

            // apply gravity to velocity
            velocity = vec3.add(velocity, velocity, multiplyVec3WithNumber(this.gravity, deltaTime));

            // apply velocity to position
            vec3.add(pos, pos, multiplyVec3WithNumber(velocity, deltaTime));

            // update lifetime
            lifetime -= deltaTime;

            // update data in arrays
            this._particlePositionsCPU.set(pos, i * 3);
            this._particleVelocitiesCPU.set(velocity, i * 3);
            this._particleLifetimesCPU.set([lifetime], i);
        }

        // update GPU buffers
        // since GPUBufferUsage.WRITE and GPUBufferUsage.VERTEX cannot be combined the buffers have to be destroyed and recreated in order to update it
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

    get maxNumParticlesSpawnPerSecond(): number {
        return this._maxNumParticlesSpawnPerSecond;
    }

    set maxNumParticlesSpawnPerSecond(value: number) {
        this._maxNumParticlesSpawnPerSecond = value;
    }
}