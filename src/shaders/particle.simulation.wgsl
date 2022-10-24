fn rand(seed : vec2<f32>) -> f32 {
	return fract(sin(dot(seed, vec2<f32>(12.9898, 4.1414))) * 43758.5453);
}

fn randUnitVec3(seed: f32, idx: f32) -> vec3<f32> {
    var result = vec3<f32>();
    result.x = rand(vec2<f32>(seed*idx, seed));
    result.y = rand(vec2<f32>(result.x, idx));
    result.z = rand(vec2<f32>(idx, result.y));
    result = (result * 2) - 1;
    return normalize(result);
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
    randSeed: f32,
    maxIdx: u32
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
        if(params.maxIdx != 0 && idx > params.maxIdx) {
            return;
        }

        particle.lifetime = params.minLifetime + (params.maxLifetime - params.minLifetime) * rand(vec2<f32>(params.randSeed, f32(idx)));
        particle.position = params.origin;

        var velocityAbs = params.initialVelocity;
        velocityAbs = velocityAbs * (rand(vec2<f32>(params.randSeed, f32(idx)) - 0.5));    // add randomness to velocity
        particle.velocity = vec3<f32>(0,0,0);
        particle.velocity = randUnitVec3(params.randSeed, f32(idx)) * velocityAbs;
    }

    // apply gravity
    particle.velocity = particle.velocity + (params.gravity * params.deltaTime);

    // update particle data
    particle.position = particle.position + (particle.velocity * params.deltaTime);
    particle.lifetime = particle.lifetime - params.deltaTime;

    // write updated particle data into buffer
    data.particles[idx] = particle;
}
