import {CheckWebGPU} from "./helper";

import quadFragmentShader from './shaders/quad.frag.wgsl'
import particleQuadVertexShader from './shaders/particle_quad.vert.wgsl'

import {loadTexture} from "./textures";
import {VertexUniformBuffer} from "./vertexUniformBuffer";
import {vec3} from "gl-matrix";
import {Particles} from "./particles";
import {FragmentUniformBuffer} from "./fragmentUniformBuffer";
import {ParticleGUI} from "./gui";
import {vec3FromArray, vec3ToColor} from "./utils";
import {OrbitCamera} from "./orbitCamera";
import {FpsCounter} from "./fpsCounter";
import {TimeStamps} from "./timestamps";
import {BenchmarkLogger} from "./benchmarkLogger";

export class Renderer {
    lastTime: number = 0.0;
    deltaTime: number = 0.0;

    device: any;
    context: any;

    particleRenderPipelineInstancing: any;
    particleRenderPipelineVertexPulling?: GPURenderPipeline;
    useVertexPulling: boolean = true;

    private format: string = 'bgra8unorm';
    private vertexUniformBuffer : any;
    private fragmentUniformBuffer?: FragmentUniformBuffer;
    private uniformBindGroup: any;
    private uniformBindGroupVP: any;
    private particleBufferBindGroup?: GPUBindGroup; //this could be moved to the Particles class
    private previousNumParticles: number = 0;

    private canvasWidth: number = 0;
    private canvasHeight: number = 0;

    private camera?: OrbitCamera;
    private cameraUniformBuffer?: GPUBuffer;
    private particleSystem?: Particles;

    private fpsCounter?: FpsCounter;

    private timestamps?: TimeStamps;
    private benchmark?: BenchmarkLogger;


    calculateDeltaTime(): void {
        if (!this.lastTime) {
            this.lastTime = performance.now();
            this.deltaTime = 0.0;
            this.fpsCounter = new FpsCounter();
            return;
        }
        const currentTime = performance.now();
        this.deltaTime = (currentTime - this.lastTime) / 1000.0
        this.lastTime = currentTime;
        this.fpsCounter?.update()
    }

    public initCheck = async () => {
        const checkgpu = CheckWebGPU();
        if (checkgpu.includes('Your current browser does not support WebGPU!')) {
            console.log(checkgpu);
            window.alert(checkgpu)
            throw('Your current browser does not support WebGPU!');
        }
    }

    public initRenderer = async (useCPU: boolean = false) => {
        const canvas = document.getElementById('canvas-webgpu') as HTMLCanvasElement;
        this.canvasWidth = canvas.width;
        this.canvasHeight = canvas.height;
        const adapter = await navigator.gpu?.requestAdapter() as GPUAdapter;
        try {
            this.device = await adapter.requestDevice({
                requiredFeatures: ["timestamp-query"],
            });
            this.timestamps = new TimeStamps(this.device);
        } catch (error) {
            console.log("Timestamp queries not supported by this browser.")
            this.device = null;
        } finally {
            if (!this.device)
                this.device = await adapter.requestDevice();
        }
        this.context = canvas.getContext('webgpu') as GPUCanvasContext;
        this.format = 'bgra8unorm';
        this.context.configure({
            device: this.device,
            format: this.format,
            alphaMode: "opaque"
        });

        this.benchmark = new BenchmarkLogger(5);

        await this.initParticleRenderingPipeline()
    }

    public async initParticleRenderingPipeline(useCPU: boolean = false) {
        this.particleRenderPipelineInstancing = this.device.createRenderPipeline({
            layout: "auto",
            vertex: {
                module: this.device.createShaderModule({
                    code: particleQuadVertexShader
                }),
                entryPoint: "main_instancing",
                buffers: [
                    {
                        // instanced particles buffer
                        arrayStride: Particles.INSTANCE_SIZE,
                        stepMode: 'instance',
                        attributes: [
                            {
                                // position
                                shaderLocation: 0,
                                offset: 0,
                                format: 'float32x3',
                            },
                            {
                                // lifetime
                                shaderLocation: 1,
                                offset: 3*4,
                                format: 'float32'
                            }
                        ],
                    }
                ]
            },
            fragment: {
                module: this.device.createShaderModule({
                    code: quadFragmentShader
                }),
                entryPoint: "main",
                targets: [{
                    format: this.format,
                    blend: {
                        color: {
                            srcFactor: 'src-alpha',
                            dstFactor: 'one',
                            operation: 'add',
                        },
                        alpha: {
                            srcFactor: 'zero',
                            dstFactor: 'one',
                            operation: 'add',
                        },
                    }
                }]
            },
            primitive: {
                topology: "triangle-list"
            }
        });


        this.particleRenderPipelineVertexPulling = this.device.createRenderPipeline({
            layout: "auto",
            vertex: {
                module: this.device.createShaderModule({
                    code: particleQuadVertexShader
                }),
                entryPoint: "main_vertex_pulling"
            },
            fragment: {
                module: this.device.createShaderModule({
                    code: quadFragmentShader
                }),
                entryPoint: "main",
                targets: [{
                    format: this.format,
                    blend: {
                        color: {
                            srcFactor: 'src-alpha',
                            dstFactor: 'one',
                            operation: 'add',
                        },
                        alpha: {
                            srcFactor: 'zero',
                            dstFactor: 'one',
                            operation: 'add',
                        },
                    }
                }]
            },
            primitive: {
                topology: "triangle-list"
            }
        });

        if(!this.particleRenderPipelineVertexPulling) {
            throw new Error("Vertex Pulling Pipeline creation failed.")
        }


        this.vertexUniformBuffer = new VertexUniformBuffer(this.device, this.canvasHeight, this.canvasWidth, 10, 10);
        this.fragmentUniformBuffer = new FragmentUniformBuffer(this.device, vec3.fromValues(0,1,0), vec3.fromValues(1,0,0), 5.0, 0.2);
        this.camera = new OrbitCamera([0,0,-1], [0,0,0], [0,1,0], 90, this.canvasWidth/this.canvasHeight);
        this.cameraUniformBuffer = this.device.createBuffer({
            size: 16*4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        this.writeCameraBuffer();

        this.particleSystem = new Particles(this.device, useCPU);
        if(this.timestamps) this.particleSystem.timestamps = this.timestamps;

        const particleTexture = await loadTexture(this.device, "circle_05.png");
        this.uniformBindGroup = this.device.createBindGroup({
            layout: this.particleRenderPipelineInstancing.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: (this.vertexUniformBuffer as VertexUniformBuffer).uniformBuffer,
                        offset: 0,
                        size: (this.vertexUniformBuffer as VertexUniformBuffer).bufferSize
                    }
                },
                {
                    binding: 2,
                    resource: particleTexture.sampler
                },
                {
                    binding: 3,
                    resource: particleTexture.texture.createView()
                },
                {
                    binding: 1,
                    resource: {
                        buffer: this.cameraUniformBuffer,
                        offset: 0,
                        size: 16*4
                    }
                },
                {
                    binding: 4,
                    resource: {
                        buffer: (this.fragmentUniformBuffer as FragmentUniformBuffer).uniformBuffer,
                        offset: 0,
                        size: (this.fragmentUniformBuffer as FragmentUniformBuffer).bufferSize
                    }
                }
            ]
        });


        this.uniformBindGroupVP = this.device.createBindGroup({
            layout: this.particleRenderPipelineVertexPulling.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: (this.vertexUniformBuffer as VertexUniformBuffer).uniformBuffer,
                        offset: 0,
                        size: (this.vertexUniformBuffer as VertexUniformBuffer).bufferSize
                    }
                },
                {
                    binding: 2,
                    resource: particleTexture.sampler
                },
                {
                    binding: 3,
                    resource: particleTexture.texture.createView()
                },
                {
                    binding: 1,
                    resource: {
                        buffer: this.cameraUniformBuffer,
                        offset: 0,
                        size: 16*4
                    }
                },
                {
                    binding: 4,
                    resource: {
                        buffer: (this.fragmentUniformBuffer as FragmentUniformBuffer).uniformBuffer,
                        offset: 0,
                        size: (this.fragmentUniformBuffer as FragmentUniformBuffer).bufferSize
                    }
                }
            ]
        });

        this.createParticleBufferBindGroup()
    }

    private createParticleBufferBindGroup() {
        if(!this.particleRenderPipelineVertexPulling || !this.particleSystem) {
            throw new Error("error creating particle buffer");
        }
        this.particleBufferBindGroup = this.device.createBindGroup({    //todo: only call when buffer size changed
            layout: this.particleRenderPipelineVertexPulling.getBindGroupLayout(1),
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.particleSystem.particleBuffer as GPUBuffer,
                        offset: 0,
                        size: this.particleSystem.particleBuffer?.size  //todo: change to max buffer size?
                    }
                }
            ]
        })
    }

    public renderParticles() {
        // update particles
        this.particleSystem?.update(this.deltaTime);

        // update uniforms
        this.writeCameraBuffer()

        // render
        const commandEncoder = this.device.createCommandEncoder();
        if(this.timestamps) {
            this.timestamps.writeTimestamp(commandEncoder, 2);
        }
        const textureView = this.context.getCurrentTexture().createView();

        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: textureView,
                clearValue: {r: 0.1, g: 0.170, b: 0.250, a: 1.0}, //background color
                loadOp: 'clear',
                storeOp: 'store'
            }]
        });
        if (!this.particleSystem) {
            throw new Error("particle system not setup");
        }

        if(!this.useVertexPulling) {
            renderPass.setPipeline(this.particleRenderPipelineInstancing);
            renderPass.setBindGroup(0, this.uniformBindGroup as GPUBindGroup);
            // @ts-ignore
            renderPass.setVertexBuffer(0, this.particleSystem.particleBuffer);
            renderPass.draw(6, this.particleSystem?.numParticles, 0, 0);
            renderPass.end();
        } else {
            renderPass.setPipeline(this.particleRenderPipelineVertexPulling);
            renderPass.setBindGroup(0, this.uniformBindGroupVP as GPUBindGroup);
            // recreate the bind group if the particle buffer has been resized
            if(this.previousNumParticles != this.particleSystem.numParticles) {
                this.createParticleBufferBindGroup()
                this.previousNumParticles = this.particleSystem.numParticles;
            }
            renderPass.setBindGroup(1, this.particleBufferBindGroup as GPUBindGroup);

            renderPass.draw(<number>this.particleSystem?.numParticles * 6, 1, 0, 0);
            renderPass.end();
        }
        if(this.timestamps) {
            this.timestamps?.writeTimestamp(commandEncoder,3);
            this.timestamps.resolveQuerySet(commandEncoder);
        }

        this.device.queue.submit([commandEncoder.finish()]);

        // Log frame time
        if(this.timestamps) {
            const beginRenderTS = this.timestamps.getBufferEntry(0);
            const endRenderTS = this.timestamps.getBufferEntry(3);

            Promise.all([beginRenderTS, endRenderTS]).then(data => {
                console.log("Frame time: " + (data[1] - data[0]) / 1000000 + " ms")
            })
            console.log(this.benchmark)
            this.benchmark?.addEntry(this.timestamps);
        }
    }

    public frame() {
        // Note: It likely makes more sense to have a separate update class later

        this.calculateDeltaTime();

        this.renderParticles();
    }

    public updateData(gui : ParticleGUI): void {
        // update simulation properties
        this.particleSystem?.updateData(gui);


        // update rendering properties
        if(!this.fragmentUniformBuffer) {
            throw new Error("Fragment uniform Buffer not defined!")
        }

        const guiData = gui.guiData;

        const particleColor = vec3ToColor(vec3FromArray(guiData.particleColor));
        this.fragmentUniformBuffer?.setColor(vec3.fromValues(particleColor[0], particleColor[1],particleColor[2]));
        const particleColor2 = vec3ToColor(vec3FromArray(guiData.particleColor2));
        this.fragmentUniformBuffer?.setColor2(vec3.fromValues(particleColor2[0], particleColor2[1],particleColor2[2]));
        this.fragmentUniformBuffer?.setAlphaFactor(guiData.particleBrightness);

        this.vertexUniformBuffer?.setHeight(guiData.particleHeight);
        this.vertexUniformBuffer?.setWidth(guiData.particleWidth);

        this.useVertexPulling = guiData.vertexPulling;

    }

    //this should probably be moved into the camera class
    private writeCameraBuffer() {
        if(!this.camera) {
            throw new Error("renderer.camera not defined!")
        }
        const cameraMat = new Float32Array([...this.camera.getViewProjectionMatrix()]);
        this.device.queue.writeBuffer(this.cameraUniformBuffer, 0, cameraMat.buffer);
    }
}
