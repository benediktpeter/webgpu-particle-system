@binding(1) @group(0) var textureSampler : sampler;
@binding(2) @group(0) var textureData : texture_2d<f32>;

@fragment
fn main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
    return textureSample(textureData, textureSampler, uv);
}


