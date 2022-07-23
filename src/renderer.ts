import {CheckWebGPU} from "./helper";

import quadFragmentShader from './shaders/quad.frag.wgsl'
import fullScreenQuadVertexShader from './shaders/particle_quad.vert.wgsl'

import {loadTexture} from "./textures";
import {VertexUniformBuffer} from "./vertexUniformBuffer";
import {vec3} from "gl-matrix";
import {Camera} from "./camera";
import {Particles} from "./particles";
import {FragmentUniformBuffer} from "./fragmentUniformBuffer";

export class Renderer {
    lastTime: number = 0.0;
    deltaTime: number = 0.0;

    device: any;
    context: any;

    testQuadPipeline: any;

    private format: string = 'bgra8unorm';
    private vertexUniformBuffer : any;
    private fragmentUniformBuffer: any;
    private uniformBindGroup: any;

    private canvasWidth: number = 0;
    private canvasHeight: number = 0;

    private camera? : Camera;
    private cameraUniformBuffer?: GPUBuffer;
    private particleSystem?: Particles;



    calculateDeltaTime(): void {
        if (!this.lastTime) {
            this.lastTime = performance.now();
            this.deltaTime = 0.0; // set to 1/maxframerate instead?
            return;
        }
        const currentTime = performance.now();
        this.deltaTime = (currentTime - this.lastTime) / 1000.0
        this.lastTime = currentTime;

    }

    public initCheck = async () => {
        const checkgpu = CheckWebGPU();
        if (checkgpu.includes('Your current browser does not support WebGPU!')) {
            console.log(checkgpu);
            window.alert(checkgpu)
            throw('Your current browser does not support WebGPU!');
        }
    }

    public initRenderer = async () => {
        const canvas = document.getElementById('canvas-webgpu') as HTMLCanvasElement;
        this.canvasWidth = canvas.width;
        this.canvasHeight = canvas.height;
        const adapter = await navigator.gpu?.requestAdapter() as GPUAdapter;
        this.device = await adapter?.requestDevice() as GPUDevice;
        this.context = canvas.getContext('webgpu') as GPUCanvasContext;
        this.format = 'bgra8unorm';
        this.context.configure({
            device: this.device,
            format: this.format,
            alphaMode: "opaque"
        });

        await this.initTestQuadPipeline()
    }

    public async initTestQuadPipeline() {
        this.testQuadPipeline = this.device.createRenderPipeline({
            layout: "auto",
            vertex: {
                module: this.device.createShaderModule({
                    code: fullScreenQuadVertexShader
                }),
                entryPoint: "main",
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
                    format: this.format
                }]
            },
            primitive: {
                topology: "triangle-list"
            }
        });

        this.vertexUniformBuffer = new VertexUniformBuffer(this.device, this.canvasHeight, this.canvasWidth, 10, 10);
        this.fragmentUniformBuffer = new FragmentUniformBuffer(this.device, vec3.fromValues(0,1,0));
        this.camera = new Camera([0,0,-100], [0,0,0]);
        this.cameraUniformBuffer = this.device.createBuffer({
            size: 16*4,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        this.writeCameraBuffer();

        this.particleSystem = new Particles(this.device, true);

        const particleTexture = await loadTexture(this.device, "1x1-white.png");
        this.uniformBindGroup = this.device.createBindGroup({
            layout: this.testQuadPipeline.getBindGroupLayout(0),
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

    }

    //this should probably be moved into the camera class
    private writeCameraBuffer() {
        if(!this.camera) {
            throw new Error("renderer.camera not defined!")
        }
        const cameraMat = new Float32Array([...this.camera.getViewProjectionMatrix()]);
        this.device.queue.writeBuffer(this.cameraUniformBuffer, 0, cameraMat.buffer);
    }

    public renderTestQuad() {
        //update particles
        this.particleSystem?.update(this.deltaTime);

        //update uniforms
        this.writeCameraBuffer()

        //render
        const commandEncoder = this.device.createCommandEncoder();
        const textureView = this.context.getCurrentTexture().createView();
        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: textureView,
                clearValue: {r: 0.1, g: 0.170, b: 0.250, a: 1.0}, //background color
                loadOp: 'clear',
                storeOp: 'store'
            }]
        });
        renderPass.setPipeline(this.testQuadPipeline);
        renderPass.setBindGroup(0, this.uniformBindGroup as GPUBindGroup);
        if(this.particleSystem)
            renderPass.setVertexBuffer(0, this.particleSystem.particleBuffer);
        else
            console.log("particle system not setup");

        renderPass.draw(6, this.particleSystem?.numParticles, 0, 0);
        renderPass.end();

        this.device.queue.submit([commandEncoder.finish()]);
    }


    public frame() {
        // Note: It likely makes more sense to have a separate update class later

        this.calculateDeltaTime();

        this.renderTestQuad();
    }
}
