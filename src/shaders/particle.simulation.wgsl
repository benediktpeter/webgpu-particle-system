/*
fn randOld(seed : vec2<f32>) -> f32 {
	return fract(sin(dot(seed, vec2<f32>(12.9898, 4.1414))) * 43758.5453);
}
*/

/*fn rand1(seed: vec2<f32>) -> f32 {
    let randU = rand(seed) * 2 - 1;
    return randU / cos(randU);
}*/

//TODO: reference to austin eng
var<private> rand_seed : vec2<f32>;

fn rand() -> f32 {
  rand_seed.x = fract(cos(dot(rand_seed, vec2<f32>(23.14077926, 232.61690225))) * 136.8168);
  rand_seed.y = fract(cos(dot(rand_seed, vec2<f32>(54.47856553, 345.84153136))) * 534.7645);
  return rand_seed.y;
}

fn randUnitVec3(/*seed: f32, idx: f32*/) -> vec3<f32> {
    var result = vec3<f32>();

    result.x = rand() * 2 - 1;
    result.y = rand() * 2 - 1;
    result.z = rand() * 2 - 1;

    result.x /= cos(result.x);  //todo: reference
    result.y /= cos(result.y);
    result.z /= cos(result.z);

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
    seed: vec4<f32>,
    maxIdx: u32
}

@binding(0) @group(0) var<storage, read_write> data : Particles;

//todo: implement
@binding(2) @group(0) var<storage, read_write> spawnCounter : atomic<u32>;
//@binding(3) @group(0) var<storage, read_write> data : NonAtomicCounter;


@binding(1) @group(0) var<uniform> params : SimulationParams;

@compute @workgroup_size(256)
fn simulate(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
    let idx = GlobalInvocationID.x;

    // combine the per frame seed with the particle id to get a unique seed for every particle
    rand_seed = params.seed.xy * f32(idx) * 0.0001 + params.seed.zw;

    // load particle from buffer
    var particle = data.particles[idx];

    //reset expired particles
    if (particle.lifetime <= 0 && atomicLoad(&spawnCounter) < 1000) {
        atomicAdd(&spawnCounter, 1);
        if(params.maxIdx != 0 && idx > params.maxIdx) {
            //return;
        }

        particle.lifetime = params.minLifetime + (params.maxLifetime - params.minLifetime) * rand();
        particle.position = params.origin;

        var velocityAbs = params.initialVelocity;
        velocityAbs = velocityAbs * (rand() * 0.3 + 0.7); // add randomness to velocity
        particle.velocity = vec3<f32>(0,0,0);
        particle.velocity = randUnitVec3() * velocityAbs;
    }

    // apply gravity
    particle.velocity = particle.velocity + (params.gravity * params.deltaTime);

    // update particle data
    particle.position = particle.position + (particle.velocity * params.deltaTime);
    particle.lifetime = particle.lifetime - params.deltaTime;

    // write updated particle data into buffer
    data.particles[idx] = particle;
}
