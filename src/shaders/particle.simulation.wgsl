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
    lifetime: f32,
    initialVelocity: f32
}

@binding(0) @group(0) var<storage, read_write> data : Particles;
//todo: uniform buffer "params"

@compute @workgroup_size(256)
fn simulate(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
    // hardcoded uniforms, todo: replace with actual uniform buffer later
    var params : SimulationParams;
    params.deltaTime = 1.0 / 60.0;
    params.gravity = vec3<f32>(0,-1,0);
    params.origin = vec3<f32>(0,0,0);
    params.lifetime = 5;
    params.initialVelocity = 0.01;


    let idx = GlobalInvocationID.x;

    // load particle from buffer
    var particle = data.particles[idx];


    if (particle.lifetime <= 0) {
        particle.lifetime = 5;
        particle.position = params.origin;

        particle.velocity = vec3<f32>(0,0,0);
        //todo: random velocity
        /*particle.velocity.x = sin(f32(idx));
        particle.velocity.y = cos(f32(idx));
        particle.velocity.z = cos(f32(idx)*3);*/

        //particle.velocity = normalize(particle.velocity + vec3<f32>(0,-0.00000001,0)) * params.initialVelocity;

    }

    // apply gravity
    particle.velocity = particle.velocity + (params.gravity * params.deltaTime);

    // update particle data
    particle.position = particle.position + particle.velocity;
    particle.lifetime = particle.lifetime - params.deltaTime;

    // write updated particle data into buffer
    data.particles[idx] = particle;
}