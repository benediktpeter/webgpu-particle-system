import quadFragmentShader from './shaders/particle_quad.frag.wgsl'
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
    private timestampsQueriesAllowed: boolean = false;
    private benchmarkActive: boolean = false;
    private benchmark?: BenchmarkLogger;
    private gui?: ParticleGUI;

    private textureName: string = "";
    private useAdditiveBlending: boolean = true;


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
        if (!navigator.gpu) {
            window.alert("Your browser does not support WebGPU!")
            throw ("Your browser does not support WebGPU!");
        }
    }


    public initRenderer = async (gui: ParticleGUI) => {
        this.gui = gui;

        const canvas = document.getElementById('canvas-webgpu') as HTMLCanvasElement;
        this.canvasWidth = canvas.width;
        this.canvasHeight = canvas.height;
        const adapter = await navigator.gpu?.requestAdapter() as GPUAdapter;

		let deviceDescriptor : GPUDeviceDescriptor = {
            requiredLimits: {
                maxStorageBufferBindingSize : 512 * 1024 * 1024,    // 512mb
            },
			requiredFeatures: ["timestamp-query"]
        };


        try {
            // If timestamp queries are not allowed in the browser, this will throw an exception
            this.device = await adapter.requestDevice(deviceDescriptor);
            this.timestamps = new TimeStamps(this.device);
            this.timestampsQueriesAllowed = true;

            // make the benchmark div visible if timestamp queries are possible
            const benchmarkDiv = document.getElementById("benchmark");
            // @ts-ignore
            benchmarkDiv.style.display = "block";

            // add callback to button
            const buttonElement = document.getElementById("benchmark-button");
            const self = this;
            // @ts-ignore
            buttonElement.onclick = function(ev) {
                const duration = (<HTMLInputElement>document.getElementById("benchmark-duration")).value;
                const benchmarkName = (<HTMLInputElement>document.getElementById("benchmark-name")).value;
                self.startBenchmark(Number(duration), benchmarkName);
            };

        } catch (error) {
            console.log("Timestamp queries not supported by this browser.")
            this.device = null;
        } finally {
            // if timestamp queries are not available, request the device without requiring timestamp-queries
            if (!this.device) {
				deviceDescriptor = {
					requiredLimits: {
						maxStorageBufferBindingSize : 512 * 1024 * 1024,    // 512mb
					}
				};
                this.device = await adapter.requestDevice(deviceDescriptor);
			}
        }

        this.context = canvas.getContext('webgpu') as GPUCanvasContext;
        this.format = 'bgra8unorm';
        this.context.configure({
            device: this.device,
            format: this.format,
            alphaMode: "opaque"
        });

        await this.setupParticleRenderingPipelines()
    }

    public async setupParticleRenderingPipelines() {

        this.createRenderPipelines(true);

        this.vertexUniformBuffer = new VertexUniformBuffer(this.device, this.canvasHeight, this.canvasWidth, 10, 10);
        this.fragmentUniformBuffer = new FragmentUniformBuffer(this.device, vec3.fromValues(0,1,0), vec3.fromValues(1,0,0), 5.0, 0.2);
        this.camera = new OrbitCamera([0,0,1], [0,0,0], [0,1,0], 90, this.canvasWidth/this.canvasHeight);
        this.cameraUniformBuffer = this.device.createBuffer({
            size: 16*4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        this.writeCameraBuffer();


        // @ts-ignore
        this.particleSystem = new Particles(this.device, this.gui.guiData.numberOfParticles);
        if(this.timestamps) {
            this.particleSystem.timestamps = this.timestamps;
        }


        await this.createUniformBindGroups("circle_05.png");

        this.createParticleBufferBindGroup()
    }

    private createRenderPipelines(useAdditiveBlending: boolean = true) {
        let additiveBlending = {
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
        };

        let noBlending = {
            color: {
                srcFactor: 'one',
                dstFactor: 'zero',
                operation: 'add',
            },
            alpha: {
                srcFactor: 'one',
                dstFactor: 'one',
                operation: 'add',
            },
        };


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
                                offset: 3 * 4,
                                format: 'float32'
                            },
                            {
                                // rotated right vector
                                shaderLocation: 2,
                                offset: 8*4,
                                format: 'float32x3'
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
                    blend: useAdditiveBlending ? additiveBlending : noBlending
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
                    blend: useAdditiveBlending ? additiveBlending : noBlending
                }]
            },
            primitive: {
                topology: "triangle-list"
            }
        });

        if (!this.particleRenderPipelineVertexPulling) {
            throw new Error("Vertex Pulling Pipeline creation failed.")
        }
    }

    private async createUniformBindGroups(textureFilePath: string) {
        const particleTexture = await loadTexture(this.device, textureFilePath);
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
                        size: 16 * 4
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
            // @ts-ignore
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
                        size: 16 * 4
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
    }

    private createParticleBufferBindGroup() {
        if(!this.particleRenderPipelineVertexPulling || !this.particleSystem) {
            throw new Error("error creating particle buffer");
        }
        this.particleBufferBindGroup = this.device.createBindGroup({
            layout: this.particleRenderPipelineVertexPulling.getBindGroupLayout(1),
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.particleSystem.particleBuffer as GPUBuffer,
                        offset: 0,
                        size: this.particleSystem.particleBuffer?.size
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
        if(this.benchmarkActive) {
            if(this.benchmark?.isExpired()) {
                this.benchmarkActive = false;
            } else {
                // @ts-ignore
                this.benchmark?.addEntry(this.timestamps);
            }
        }
    }

    public async frame() {
        // Note: It likely makes more sense to have a separate update class later

        this.calculateDeltaTime();

        this.renderParticles();
    }

    public async updateData(gui : ParticleGUI): Promise<void> {
        // update simulation properties
        this.particleSystem?.updateData(gui);

        // update rendering properties
        if(!this.fragmentUniformBuffer) {
            throw new Error("Fragment uniform Buffer not defined!")
        }

        const guiData = gui.guiData;

        let particleColor = vec3.fromValues(1,1,1);
        let particleColor2 = vec3.fromValues(1,1,1);
        if (guiData.useCustomColors) {
            particleColor = vec3ToColor(vec3FromArray(guiData.particleColor));
            particleColor2 = vec3ToColor(vec3FromArray(guiData.particleColor2));
        }

        this.fragmentUniformBuffer?.setColor(vec3.fromValues(particleColor[0], particleColor[1],particleColor[2]));
        this.fragmentUniformBuffer?.setColor2(vec3.fromValues(particleColor2[0], particleColor2[1],particleColor2[2]));
        this.fragmentUniformBuffer?.setAlphaFactor(guiData.particleBrightness);

        this.vertexUniformBuffer?.setHeight(guiData.particleHeight, guiData.usePixelSize);
        this.vertexUniformBuffer?.setWidth(guiData.particleWidth, guiData.usePixelSize);
        this.vertexUniformBuffer?.setUsePixelSizes(guiData.usePixelSize)
        this.vertexUniformBuffer?.setEnableRotation(guiData.enableRotation)

        this.useVertexPulling = guiData.vertexPulling;

        if(this.useAdditiveBlending != guiData.useAdditiveBlending) {
            this.useAdditiveBlending = guiData.useAdditiveBlending;
            this.createRenderPipelines(this.useAdditiveBlending)
            await this.createUniformBindGroups(this.textureName)
            this.createParticleBufferBindGroup()
        }

        if(this.textureName != guiData.texture) {
            this.textureName = guiData.texture;
            await this.createUniformBindGroups(this.textureName)
            this.createParticleBufferBindGroup()
        }
    }

    //this should probably be moved into the camera class
    private writeCameraBuffer() {
        if(!this.camera) {
            throw new Error("renderer.camera not defined!")
        }
        const cameraMat = new Float32Array([...this.camera.getViewProjectionMatrix()]);
        this.device.queue.writeBuffer(this.cameraUniformBuffer, 0, cameraMat.buffer);
    }

    public startBenchmark(time: number, name: string) {
        console.log("starting benchmark for " + time + " seconds.")
        if(!this.timestampsQueriesAllowed){
            throw new Error("Timestamps queries not allowed by the browser.")
        }
        this.benchmarkActive = true;
        // @ts-ignore
        this.benchmark = new BenchmarkLogger(time, this.particleSystem?.numParticles, this.gui.guiData.vertexPulling, name, this.gui?.guiData.particleWidth, this.gui?.guiData.particleHeight);
    }
}
