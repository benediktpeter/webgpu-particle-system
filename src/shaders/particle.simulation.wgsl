struct Particle {
    position: vec3<f32>,
    lifetime: f32,
    velocity: vec3<f32>
}

struct Particles {
  particles : array<Particle>
};

@binding(0) @group(0) var<storage, read_write> data : Particles;
//todo: uniform buffer

@compute @workgroup_size(256)
fn simulate(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
    let idx = GlobalInvocationID.x;

    // load particle from buffer
    var particle = data.particles[idx];

    particle.velocity = vec3<f32>(0,0,0.000000001);  // todo: delete, this is just so the buffer binding does not get deleted by the compiler


    // write updated particle data into buffer
    data.particles[idx] = particle;
}
