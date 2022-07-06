import {CheckWebGPU} from "./helper";

import quadFragmentShader from './shaders/quad.frag.wgsl'
import fullScreenQuadVertexShader from './shaders/particle_quad.vert.wgsl'

import {loadTexture} from "./textures";
import {VertexUniformBuffer} from "./vertexUniformBuffer";
import {vec3} from "gl-matrix";

export class Renderer {
    lastTime: number = 0.0;
    deltaTime: number = 0.0;

    device: any;
    context: any;

    testQuadPipeline: any;

    private format: string = 'bgra8unorm';
    private vertexUniformBuffer : any;
    private uniformBindGroup: any;

    private canvasWidth: number = 0;
    private canvasHeight: number = 0;



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
                entryPoint: "main"
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

        this.vertexUniformBuffer = new VertexUniformBuffer(this.device, this.canvasHeight, this.canvasWidth, vec3.fromValues(-0.2, 0.2, 1), 50, 50);

        const testTexture = await loadTexture(this.device, "circle_01.png");
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
                    binding: 1,
                    resource: testTexture.sampler
                },
                {
                    binding: 2,
                    resource: testTexture.texture.createView()
                }
            ]
        });

    }

    public renderTestQuad() {
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
        renderPass.draw(6, 1, 0, 0);
        renderPass.end();

        this.device.queue.submit([commandEncoder.finish()]);
    }


    public frame() {
        // Note: It likely makes more sense to have a separate update class later

        this.calculateDeltaTime();

        this.renderTestQuad();
    }
}
