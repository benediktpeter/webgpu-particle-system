
struct Uniforms {
  position: vec3<f32>,

  halfwidth: f32,
  halfheight : f32//,
  //cameraMatrix : mat4x4<f32>
};
@binding(0) @group(0) var<uniform> uniforms : Uniforms;

struct VertexOutput {
    @builtin(position) position : vec4<f32>,
    @location(0) uv: vec2<f32>
};

@vertex
fn main(@builtin(vertex_index) VertexIndex: u32) -> VertexOutput {
            var halfwidth = uniforms.halfwidth;
            var halfheight = uniforms.halfheight;

            var pos = array<vec2<f32>, 6>(
                vec2<f32>(-halfwidth, halfheight),   //tl
                vec2<f32>(-halfwidth, -halfheight),  //bl
                vec2<f32>(halfwidth, -halfheight),   //br

                vec2<f32>(halfwidth, -halfheight),   //br
                vec2<f32>(halfwidth, halfheight),    //tr
                vec2<f32>(-halfwidth, halfheight)    //tl
            );

            var uvs = array<vec2<f32>, 6>(
                vec2<f32>(0, 1),   //tl
                vec2<f32>(0, 0),  //bl
                vec2<f32>(1, 0),   //br

                vec2<f32>(1, 0),   //br
                vec2<f32>(1, 1),    //tr
                vec2<f32>(0, 1)    //tl
            );


            var output: VertexOutput;
            //todo: transform position
            output.position = vec4<f32>(uniforms.position, 1.0);
            output.position.x = output.position.x + pos[VertexIndex].x;
            output.position.y = output.position.y + pos[VertexIndex].y;

            output.uv = uvs[VertexIndex];
            return output;
}