fn randUnitVec3(seed: f32, idx: f32) -> vec3<f32> {
    var result = vec3<f32>(0,0,0);
    result.x = f32(sin(seed + (idx*idx)));
    result.y = cos(seed + (idx*idx*idx));
    result.z = cos(seed*seed + idx*idx);
    return normalize(result);
}

fn randNum(seed: f32, idx: f32) -> f32 {
    var result = sin(seed + idx);
    result = cos(result + idx*idx);
    return 0.5 * (result + 1);
}


struct Particle {
    position: vec3<f32>,
    lifetime: f32,
    velocity: vec3<f32>
}

struct Particles {
  particles : array<Particle>
};

struct SimulationParams {
    deltaTime: f32,
    gravity: vec3<f32>,
    origin: vec3<f32>,
    minLifetime: f32,
    maxLifetime: f32,
    initialVelocity: f32,
    randSeed: f32
}

@binding(0) @group(0) var<storage, read_write> data : Particles;
@binding(1) @group(0) var<uniform> params : SimulationParams;

@compute @workgroup_size(256)
fn simulate(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
    let idx = GlobalInvocationID.x;

    // load particle from buffer
    var particle = data.particles[idx];

    //reset expired particles
    if (particle.lifetime <= 0) {
        particle.lifetime = params.minLifetime + (params.maxLifetime - params.minLifetime) * randNum(params.randSeed, f32(idx));
        particle.position = params.origin;

        particle.velocity = vec3<f32>(0,0,0);
        particle.velocity = randUnitVec3(params.randSeed, f32(idx)) * params.initialVelocity;

    }

    // apply gravity
    particle.velocity = particle.velocity + (params.gravity * params.deltaTime);

    // update particle data
    particle.position = particle.position + (particle.velocity * params.deltaTime);
    particle.lifetime = particle.lifetime - params.deltaTime;

    // write updated particle data into buffer
    data.particles[idx] = particle;
}