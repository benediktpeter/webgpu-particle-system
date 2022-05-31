import {CheckWebGPU} from "./helper";

import triangleVertexShader from './shaders/singleTriangle.vert.wgsl'
import vertexColorFragment from './shaders/vertexColor.frag.wgsl'

export class Renderer {
    lastTime: number = 0.0;
    deltaTime: number = 0.0;

    device: any;
    context: any;
    pipeline: any;


    calculateDeltaTime(): void {
        //note: if there are multiple render passes this cannot be called in a renderpass function
        if (!this.lastTime) {
            this.lastTime = performance.now();
            this.deltaTime = 0.0; // set to 1/maxframerate instead?
            return;
        }
        const currentTime = performance.now();
        this.deltaTime = (currentTime - this.lastTime) / 1000.0
        this.lastTime = currentTime;
    }

    public initRenderer = async () => {
        const checkgpu = CheckWebGPU();
        if (checkgpu.includes('Your current browser does not support WebGPU!')) {
            console.log(checkgpu);
            window.alert(checkgpu)
            throw('Your current browser does not support WebGPU!');
        }
    }

    public initTriangle = async () => {
        const canvas = document.getElementById('canvas-webgpu') as HTMLCanvasElement;
        const adapter = await navigator.gpu?.requestAdapter() as GPUAdapter;
        this.device = await adapter?.requestDevice() as GPUDevice;
        this.context = canvas.getContext('webgpu') as GPUCanvasContext;
        const format = 'bgra8unorm';
        this.context.configure({
            device: this.device,
            format: format,
            compositingAlphaMode: "opaque"
        });

        this.pipeline = this.device.createRenderPipeline({
            layout: "auto",
            vertex: {
                module: this.device.createShaderModule({
                    code: triangleVertexShader
                }),
                entryPoint: "main"
            },
            fragment: {
                module: this.device.createShaderModule({
                    code: vertexColorFragment
                }),
                entryPoint: "main",
                targets: [{
                    format: format
                }]
            },
            primitive: {
                topology: "triangle-list"
            }
        });
    }

    public renderTriangle = async () => {
        this.calculateDeltaTime();
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
        renderPass.setPipeline(this.pipeline);
        renderPass.draw(3, 1, 0, 0);
        renderPass.end();

        this.device.queue.submit([commandEncoder.finish()]);
    }
}



export const RenderTriangleold = async () => {
    const checkgpu = CheckWebGPU();
    if (checkgpu.includes('Your current browser does not support WebGPU!')) {
        console.log(checkgpu);
        window.alert(checkgpu)
        throw('Your current browser does not support WebGPU!');
    }

    const canvas = document.getElementById('canvas-webgpu') as HTMLCanvasElement;
    const adapter = await navigator.gpu?.requestAdapter() as GPUAdapter;
    const device = await adapter?.requestDevice() as GPUDevice;
    const context = canvas.getContext('webgpu') as GPUCanvasContext;
    const format = 'bgra8unorm';
    context.configure({
        device: device,
        format: format,
        compositingAlphaMode: "opaque"
    });

    const pipeline = device.createRenderPipeline({
        layout: "auto",
        vertex: {
            module: device.createShaderModule({
                code: triangleVertexShader
            }),
            entryPoint: "main"
        },
        fragment: {
            module: device.createShaderModule({
                code: vertexColorFragment
            }),
            entryPoint: "main",
            targets: [{
                format: format
            }]
        },
        primitive: {
            topology: "triangle-list"
        }
    });

    //render
    const commandEncoder = device.createCommandEncoder();
    const textureView = context.getCurrentTexture().createView();
    const renderPass = commandEncoder.beginRenderPass({
        colorAttachments: [{
            view: textureView,
            clearValue: {r: 0.1, g: 0.170, b: 0.250, a: 1.0}, //background color
            loadOp: 'clear',
            storeOp: 'store'
        }]
    });
    renderPass.setPipeline(pipeline);
    renderPass.draw(3, 1, 0, 0);
    renderPass.end();

    device.queue.submit([commandEncoder.finish()]);
}
