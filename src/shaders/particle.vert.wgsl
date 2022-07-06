struct VertexOutput {
    @builtin(position) position : vec4<f32>
};

struct VertexInput {
  @location(0) position : vec3<f32>
};

@vertex
fn main(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    output.position = vec4<f32>(input.position, 1.0f); // is this syntax correct?

    return output;
}