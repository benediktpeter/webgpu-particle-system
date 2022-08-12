struct Uniforms {
  halfwidth: f32,
  halfheight : f32
};

struct Camera {
    viewProjectionMatrix: mat4x4<f32>
};

@binding(0) @group(0) var<uniform> uniforms : Uniforms;
@binding(1) @group(0) var<uniform> camera: Camera;

struct VertexInput {
    @location(0) position : vec3<f32>,
    @location(1) lifetime :f32
};

struct VertexOutput {
    @builtin(position) position : vec4<f32>,
    @location(0) uv: vec2<f32>,
    @location(1) lifetime: f32
};

@vertex
fn main(vertexInput: VertexInput, @builtin(vertex_index) VertexIndex: u32) -> VertexOutput {
            var halfwidth = uniforms.halfwidth;
            var halfheight = uniforms.halfheight;

            var quadPos = array<vec2<f32>, 6>(
                vec2<f32>(-halfwidth, halfheight),   //tl
                vec2<f32>(-halfwidth, -halfheight),  //bl
                vec2<f32>(halfwidth, -halfheight),   //br

                vec2<f32>(halfwidth, -halfheight),   //br
                vec2<f32>(halfwidth, halfheight),    //tr
                vec2<f32>(-halfwidth, halfheight)    //tl
            );

            var uvs = array<vec2<f32>, 6>(
                vec2<f32>(0, 1),  //tl
                vec2<f32>(0, 0),  //bl
                vec2<f32>(1, 0),  //br

                vec2<f32>(1, 0),   //br
                vec2<f32>(1, 1),   //tr
                vec2<f32>(0, 1)    //tl
            );


            var transformedPosition : vec4<f32> = camera.viewProjectionMatrix * vec4<f32>(vertexInput.position, 1.0);
            
            var output: VertexOutput;
            output.position = vec4<f32>(transformedPosition.x + quadPos[VertexIndex].x, transformedPosition.y + quadPos[VertexIndex].y, transformedPosition.z, 1.0);
            output.uv = uvs[VertexIndex];
            output.lifetime = vertexInput.lifetime;
            return output;
}