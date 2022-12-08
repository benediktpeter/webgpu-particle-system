var<private> rand_seed : vec2<f32>;

// This random number generator function was taken from https://github.com/austinEng/webgpu-samples
fn rand() -> f32 {
  rand_seed.x = fract(cos(dot(rand_seed, vec2<f32>(23.14077926, 232.61690225))) * 136.8168);
  rand_seed.y = fract(cos(dot(rand_seed, vec2<f32>(54.47856553, 345.84153136))) * 534.7645);
  return rand_seed.y;
}

fn randUnitVec3() -> vec3<f32> {
    var result = vec3<f32>();

    result.x = rand() * 2 - 1;
    result.y = rand() * 2 - 1;
    result.z = rand() * 2 - 1;

    // divide coordinates with their own cosinus to make the direction seemingly uniform (rather than clustering at edges)
    result.x /= cos(result.x);
    result.y /= cos(result.y);
    result.z /= cos(result.z);

    return normalize(result);
}

fn createQuaternion(axis: vec3<f32>, angleRad: f32) -> vec4<f32> {
    let halfAngle = angleRad / 2;
    var quat: vec4<f32>;
    quat.x = axis.x * sin(halfAngle);
    quat.y = axis.y * sin(halfAngle);
    quat.z = axis.z * sin(halfAngle);
    quat.w = cos(halfAngle);
    return quat;
}

fn multiplyQuaternions(quat1: vec4<f32>, quat2: vec4<f32>) -> vec4<f32>{
  var result: vec4<f32>;
  result.x = (quat1.w * quat2.x) + (quat1.x * quat2.w) + (quat1.y * quat2.z) - (quat1.z * quat2.y);
  result.y = (quat1.w * quat2.y) - (quat1.x * quat2.z) + (quat1.y * quat2.w) + (quat1.z * quat2.x);
  result.z = (quat1.w * quat2.z) + (quat1.x * quat2.y) - (quat1.y * quat2.x) + (quat1.z * quat2.w);
  result.w = (quat1.w * quat2.w) - (quat1.x * quat2.x) - (quat1.y * quat2.y) - (quat1.z * quat2.z);
  return result;
}

fn rotateVertexWithQuaternion(vertex: vec3<f32>, rotationQuat: vec4<f32>) -> vec3<f32> {
   let vertexQuat = vec4<f32>(vertex, 0);
   let rotationQuatInverse = vec4<f32>(-rotationQuat.xyz, rotationQuat.w);

   // newVertex = rotationQuat * vertexQuat * rotationQuat^-1
   var result: vec4<f32>;
   result = multiplyQuaternions(rotationQuat, vertexQuat);    //rotation * pos
   result = multiplyQuaternions(result, rotationQuatInverse); // * inv
   return result.xyz;
}

struct Particle {
    position: vec3<f32>,
    lifetime: f32,
    velocity: vec3<f32>,
    rightRotation: vec3<f32>
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
    maxSpawnCount: u32,
    useSpawnCap: u32,    // using u32 since boolean types are not mentioned in https://www.w3.org/TR/WGSL/#alignment-and-size
    useAliasedSpawnCount: u32,
    mode: u32,   // 0: default, 1: snow,
    wind: vec4<f32>,  // w...intensity
    treeRadius: f32
}

@binding(0) @group(0) var<storage, read_write> data : Particles;

// spawnCounter and spawCounterNonAtomic are both bound to the same buffer to allow non-atomic access to the counter
@binding(2) @group(0) var<storage, read_write> spawnCounter : atomic<u32>;
@binding(3) @group(0) var<storage, read_write> spawnCounterNonAtomic : u32;

@binding(1) @group(0) var<uniform> params : SimulationParams;

@compute @workgroup_size(256)
fn simulate(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
    let idx = GlobalInvocationID.x;

    // combine the per frame seed with the particle id to get a unique seed for every particle
    rand_seed = params.seed.xy * f32(idx) * 0.0001 + params.seed.zw;

    // load particle from buffer
    var particle = data.particles[idx];

    //reset expired particles
    var spawnLimitReached = false;
    if(params.useAliasedSpawnCount == 0){
        spawnLimitReached = params.useSpawnCap != 0 && atomicLoad(&spawnCounter) >= params.maxSpawnCount;
    } else {
        spawnLimitReached = params.useSpawnCap != 0 && spawnCounterNonAtomic >= params.maxSpawnCount;
    }

    if (particle.lifetime <= 0 && !spawnLimitReached) {
        atomicAdd(&spawnCounter, 1);
        particle.lifetime = params.minLifetime + (params.maxLifetime - params.minLifetime) * rand();
        particle.rightRotation = randUnitVec3();

        if(params.mode == 0) {  // Default mode
            particle.position = params.origin;

            var velocityAbs = params.initialVelocity;
            velocityAbs = velocityAbs * (rand() * 0.3 + 0.7); // add randomness to velocity
            particle.velocity = vec3<f32>(0,0,0);
            particle.velocity = randUnitVec3() * velocityAbs;

        } else if (params.mode == 1) {  // Snow mode
           particle.position = vec3<f32>(0);
           particle.position.y = params.origin.y;
           particle.position.x = 20 * (rand() - 0.5);
           particle.position.z = 20 * (rand() - 0.5);

           particle.velocity = vec3<f32>(0,0,0);
           particle.velocity = randUnitVec3() * 0.015;

        } else if (params.mode == 2) {  // tree mode
            particle.position = params.origin + randUnitVec3() * (rand() * params.treeRadius);
            particle.velocity = vec3<f32>(0,0,0);
            particle.velocity = randUnitVec3() * 0.015;
        }
    }

    // apply gravity
    particle.velocity = particle.velocity + (params.gravity * params.deltaTime);

    // apply wind
    particle.position += params.wind.xyz * params.wind.w * params.deltaTime;

    // rotation
    var rotationAngle = (params.deltaTime * 0.3) % (2 * 3.14159);
    var rotationAxis = normalize(cross(particle.velocity, params.wind.xyz));
    var rotationQuat = createQuaternion(rotationAxis, rotationAngle);
    particle.rightRotation = rotateVertexWithQuaternion(particle.rightRotation, rotationQuat).xyz;

    // update particle data
    particle.position = particle.position + (particle.velocity * params.deltaTime);
    particle.lifetime = particle.lifetime - params.deltaTime;

    // write updated particle data into buffer
    data.particles[idx] = particle;
}
