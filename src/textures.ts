export class Texture {

    texture: GPUTexture;
    sampler: GPUSampler;

    constructor(texture: GPUTexture, sampler: GPUSampler) {
        this.texture = texture;
        this.sampler = sampler;
    }
}


export const loadTexture = async(device: GPUDevice, filePath: string) => {

    // load image file
    const img = document.createElement('img');
    img.src = '../assets/' + filePath;
    await img.decode();
    const imageBitmap = await createImageBitmap(img);

    const texture = device.createTexture({
        size: [imageBitmap.width, imageBitmap.height, 1],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING |
            GPUTextureUsage.COPY_DST |
            GPUTextureUsage.RENDER_ATTACHMENT
    });

    device.queue.copyExternalImageToTexture(
        { source: imageBitmap },
        { texture: texture },
        [imageBitmap.width, imageBitmap.height]
    );


    // sampler with linear filtering and clamp-to-edge
    const sampler = device.createSampler({
        minFilter: 'linear',
        magFilter: 'linear',
        addressModeU: "clamp-to-edge",
        addressModeV: "clamp-to-edge"
    });

    return new Texture(texture, sampler);
}
