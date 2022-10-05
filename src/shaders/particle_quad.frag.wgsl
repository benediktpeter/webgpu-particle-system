struct ParticleFragmentUniforms {
   color: vec4<f32>,
   color2: vec4<f32>,
   maxLifetime: f32,
   alphaFactor: f32
}

@binding(2) @group(0) var textureSampler : sampler;
@binding(3) @group(0) var textureData : texture_2d<f32>;
@binding(4) @group(0) var<uniform> particleUniforms: ParticleFragmentUniforms;

@fragment
fn main(@location(0) uv: vec2<f32>, @location(1) lifetime: f32) -> @location(0) vec4<f32> {
    var textureColor : vec4<f32> = textureSample(textureData, textureSampler, uv);

    if(lifetime <= 0) {
        return vec4<f32>(0,0,0,0);
    }

    // interpolate between the two colors
    var colorWeight = lifetime / particleUniforms.maxLifetime;
    var maxLifetimeColor = textureColor * particleUniforms.color;
    var minLifetimeColor = textureColor * particleUniforms.color2;
    var fragColor = maxLifetimeColor * colorWeight + minLifetimeColor * (1.0-colorWeight);
    fragColor.a = textureColor.a * particleUniforms.alphaFactor;
    return fragColor;
}


