import {vec3, vec4} from 'gl-matrix';
import {ParticleGUI} from "./gui";

import simulationComputeShader from './shaders/particle.simulation.wgsl'
import {SimulationUniformBuffer} from "./simulationUniformBuffer";
import {TimeStamps} from "./timestamps";

export class Particles {

    public static readonly INSTANCE_SIZE = 3*4 + 4 + 3*4 + 4;    // vec3 position, float lifetime, vec3 velocity, padding
    public static readonly MAX_NUM_PARTICLES = 16776960; // Math.floor((512 * 1024 * 1024) / Particles.INSTANCE_SIZE) - Particles.INSTANCE_SIZE;

    private _numParticles: number = 1000;
    private _originPos : vec3 = vec3.fromValues(0,0,0);
    private _initialVelocity: number = 1.2;
    private _minParticleLifetime: number = 2;
    private _maxParticleLifetime: number = 5;
    private _gravity: vec3 = [0,-1,0]
    private _maxNumParticlesSpawnPerSecond: number = 80;
    private _useSpawnCap: boolean = true;
    private _useBufferAliasing: boolean = true;

    private readonly _device : GPUDevice;

    private _particleBuffer? : GPUBuffer;
    private _simulationPipeline?: GPUComputePipeline;
    private _simulationUniformBuffer?: SimulationUniformBuffer;
    private _simulationBindGroup?: GPUBindGroup;

    private _spawnCounterBuffer?: GPUBuffer;
    private _spawnCap: number = 1;

    private _simulationStartTime: any;
    private _timestamps?: TimeStamps;


    constructor(device: GPUDevice, numParticles: number) {
        this._device = device;
        this._numParticles = numParticles;

        this.initGPU();
    }

    private createGPUParticleBuffer() {
        this._particleBuffer = this._device.createBuffer({
            size: this._numParticles * Particles.INSTANCE_SIZE,     // INSTANCE_SIZE = 32
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST
        });
        this._simulationStartTime = performance.now();
    }

    private initGPU() {
        console.log("setting up gpu particles");

        this.createGPUParticleBuffer();
        this._simulationUniformBuffer = new SimulationUniformBuffer(this._device);
        this._spawnCounterBuffer = this._device.createBuffer({
            size: 4,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
        })

        // create compute shader pipeline
        const computePipelineDescr : GPUComputePipelineDescriptor = {
            layout: 'auto',
            compute: {
                module: this._device.createShaderModule({
                    code: simulationComputeShader
                }),
                entryPoint: 'simulate'
            }
        }
        this._simulationPipeline = this._device.createComputePipeline(computePipelineDescr);

        // create compute shader bind group
        this.createSimulationBindGroup();
    }

    private createSimulationBindGroup() {
        if(!this._simulationPipeline || !this._simulationUniformBuffer) {
            throw new Error("simulation pipeline or uniform buffer not defined")
        }
        if(!this._spawnCounterBuffer) {
            throw new Error("spawn counter buffer not defined")
        }
        const bindGroupDescr: GPUBindGroupDescriptor = {
            layout: this._simulationPipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this._particleBuffer as GPUBuffer,
                        offset: 0,
                        size: this._particleBuffer?.size
                    }
                },
                {
                    binding: 1,
                    resource: {
                        buffer: this._simulationUniformBuffer.uniformBuffer,
                        offset: 0,
                        size: this._simulationUniformBuffer.bufferSize
                    }
                },
                {
                    binding: 2,
                    resource: {
                        buffer: this._spawnCounterBuffer,
                        offset: 0,
                        size: this._spawnCounterBuffer?.size
                    }
                },
                {
                    binding: 3,
                    resource: {
                        buffer: this._spawnCounterBuffer,
                        offset: 0,
                        size: this._spawnCounterBuffer?.size
                    }
                }
            ]
        }
        this._simulationBindGroup = this._device.createBindGroup(bindGroupDescr)
    }

    public update(deltaTime : number) : void {

        if (!this._simulationPipeline) {
            throw new Error("Simulation pipeline not defined")
        }
        if (!this._simulationBindGroup) {
            throw new Error("Simulation bind group not defined")
        }

        // set spawn counter to 0
        if(this._spawnCounterBuffer) {
            this._device.queue.writeBuffer(this._spawnCounterBuffer, 0, Float32Array.of(0),0);
        }

        // update uniform data
        this._simulationUniformBuffer?.setDeltaTime(deltaTime);
        this._simulationUniformBuffer?.setMinLifetime(this._minParticleLifetime);
        this._simulationUniformBuffer?.setMaxLifetime(this._maxParticleLifetime);
        this._simulationUniformBuffer?.setGravity(this._gravity);
        this._simulationUniformBuffer?.setOrigin(this._originPos);
        this._simulationUniformBuffer?.setInitialVelocity(this._initialVelocity);
        this._simulationUniformBuffer?.setRandSeed(vec4.fromValues(Math.random(),Math.random(),Math.random(),Math.random()));

        this._spawnCap += this._numParticles * 0.001 * deltaTime;
        this._simulationUniformBuffer?.setMaxSpawnCount(Math.floor( this._spawnCap) + 1);
        this._simulationUniformBuffer?.setUseSpawnCap(this._useSpawnCap && this._spawnCap != 0);
        this._simulationUniformBuffer?.setUseSpawnCapAliasing(this._useBufferAliasing);

        // compute pass
        const commandEncoder = this._device.createCommandEncoder();
        this._timestamps?.writeTimestamp(commandEncoder,0);
        const passEncoder = commandEncoder.beginComputePass();
        passEncoder.setPipeline(this._simulationPipeline);
        passEncoder.setBindGroup(0, this._simulationBindGroup)
        passEncoder.dispatchWorkgroups(Math.ceil(this._numParticles / 256))
        passEncoder.end();
        this._timestamps?.writeTimestamp(commandEncoder,1);

        this._device.queue.submit([commandEncoder.finish()])
    }

    public updateData(gui: ParticleGUI): void {
        // setting data that does not affect overall gpu and cpu pipeline
        this._minParticleLifetime = gui.guiData.minParticleLifetime;
        this._maxParticleLifetime = gui.guiData.maxParticleLifetime;
        this._useSpawnCap = gui.guiData.useSpawnCap;
        this._useBufferAliasing = gui.guiData.useBufferAliasing;

        if (gui.guiData.numberOfParticles != this._numParticles) {
            let oldParticleBuffer = this._particleBuffer;
            const oldNumParticles = this._numParticles
            this._numParticles = gui.guiData.numberOfParticles;
            this.createGPUParticleBuffer()  //create a new buffer of the correct length

            if (oldParticleBuffer && this._particleBuffer) {
                // copy data from the old buffer to the new one
                const commandEncoder = this._device.createCommandEncoder();
                commandEncoder.copyBufferToBuffer(oldParticleBuffer, 0, this._particleBuffer, 0, Math.min(this._numParticles, oldNumParticles));
                this._device.queue.submit([commandEncoder.finish()]);
            } else {
                throw new Error("Particle Buffer now defined");
            }

            oldParticleBuffer?.destroy()    // destroy the old buffer

            this.createSimulationBindGroup() // recreate the bind group
        }
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

    set timestamps(value: TimeStamps) {
        this._timestamps = value;
    }
}
