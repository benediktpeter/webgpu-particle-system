struct ParticleFragmentUniforms {
   color: vec4<f32>
}

@binding(2) @group(0) var textureSampler : sampler;
@binding(3) @group(0) var textureData : texture_2d<f32>;
@binding(4) @group(0) var<uniform> particleUniforms: ParticleFragmentUniforms;

@fragment
fn main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {

    var textureColor : vec4<f32> = textureSample(textureData, textureSampler, uv);
    textureColor = textureColor * particleUniforms.color;
    return textureColor;
}


