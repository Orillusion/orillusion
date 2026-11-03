/**
 * Uniforms shared by the fluid particle and debug stages. Layout (bytes):
 *   0   modelView : mat4x4f  object world → view
 *   64  proj      : mat4x4f
 *   128 projInv   : mat4x4f
 *   192 particle  : vec4f  x = radius, y = stride (floats), z = position offset (floats), w = thickness alpha
 *   208 camera    : vec4f  x = near, y = far, z = debug feature
 *   224 size      : vec4f  xy = depth map size, zw = screen size
 *   240 thickSize : vec4f  xy = thickness map size
 * @internal
 */
export let FluidUniforms_wgsl: string = /*wgsl*/ `
struct FluidUniforms {
    modelView: mat4x4f,
    proj: mat4x4f,
    projInv: mat4x4f,
    particle: vec4f,
    camera: vec4f,
    size: vec4f,
    thickSize: vec4f,
};
`;

/**
 * Sphere-impostor particle stages. Each particle is a camera-facing
 * quad; fragments outside the disc are dropped.
 * - fsDepth: linear view-space depth of the sphere surface. Fluid hidden
 *   by the opaque scene is stored negated: the depth filters skip it
 *   instead of treating it as the fluid's edge. 0 means no fluid.
 * - fsThickness: thickness contribution, accumulated with additive blending.
 * - fsBackDepth: linear depth of the far side of the sphere, clamped to the
 *   opaque scene; kept with a "greater" depth test, it gives the far side of
 *   the fluid volume for geometric thickness.
 * @internal
 */
export let FluidParticle_wgsl: string = /*wgsl*/ `
${FluidUniforms_wgsl}

@group(0) @binding(0) var<uniform> u: FluidUniforms;
@group(0) @binding(1) var<storage, read> particles: array<f32>;
@group(0) @binding(2) var sceneDepth: texture_depth_2d;

struct VOut {
    @builtin(position) pos: vec4f,
    @location(0) corner: vec2f,
    @location(1) center: vec3f,
};

struct DepthOut {
    @location(0) depth: f32,
    @builtin(frag_depth) fragDepth: f32,
};

@vertex
fn vs(@builtin(vertex_index) vi: u32, @builtin(instance_index) ii: u32) -> VOut {
    var corners = array<vec2f, 6>(
        vec2f(-1.0, -1.0), vec2f(1.0, -1.0), vec2f(1.0, 1.0),
        vec2f(-1.0, -1.0), vec2f(1.0, 1.0), vec2f(-1.0, 1.0),
    );
    let base = ii * u32(u.particle.y) + u32(u.particle.z);
    let local = vec3f(particles[base], particles[base + 1u], particles[base + 2u]);
    let center = (u.modelView * vec4f(local, 1.0)).xyz;
    let corner = corners[vi];

    var out: VOut;
    out.pos = u.proj * vec4f(center + vec3f(corner * u.particle.x, 0.0), 1.0);
    out.corner = corner;
    out.center = center;
    return out;
}

// View-space depth of the opaque scene under a pixel of a map of size mapSize.
fn sceneViewZ(fragXY: vec2f, mapSize: vec2f) -> f32 {
    let dim = vec2f(textureDimensions(sceneDepth));
    let p = vec2i(fragXY * dim / mapSize);
    let d = textureLoad(sceneDepth, p, 0);
    #if USE_LOGDEPTH
        return pow(u.camera.y + 1.0, d) - 1.0;
    #else
        let v = u.projInv * vec4f(0.0, 0.0, d, 1.0);
        return v.z / v.w;
    #endif
}

// View-space point on the visible hemisphere; the camera looks down +z.
fn spherePoint(in: VOut, r2: f32) -> vec3f {
    let radius = u.particle.x;
    return vec3f(in.center.xy + in.corner * radius, in.center.z - sqrt(1.0 - r2) * radius);
}

@fragment
fn fsDepth(in: VOut) -> DepthOut {
    let r2 = dot(in.corner, in.corner);
    if (r2 > 1.0) {
        discard;
    }
    let viewPos = spherePoint(in, r2);
    let hidden = viewPos.z > sceneViewZ(in.pos.xy, u.size.xy);
    let clip = u.proj * vec4f(viewPos, 1.0);
    var out: DepthOut;
    out.depth = select(viewPos.z, -viewPos.z, hidden);
    out.fragDepth = clip.z / clip.w;
    return out;
}

@fragment
fn fsThickness(in: VOut) -> @location(0) f32 {
    let r2 = dot(in.corner, in.corner);
    if (r2 > 1.0) {
        discard;
    }
    if (spherePoint(in, r2).z > sceneViewZ(in.pos.xy, u.thickSize.xy)) {
        discard;
    }
    return u.particle.w * sqrt(1.0 - r2);
}

@fragment
fn fsBackDepth(in: VOut) -> DepthOut {
    let r2 = dot(in.corner, in.corner);
    if (r2 > 1.0) {
        discard;
    }
    let sceneZ = sceneViewZ(in.pos.xy, u.size.xy);
    if (spherePoint(in, r2).z > sceneZ) {
        discard;
    }
    let radius = u.particle.x;
    let far = vec3f(in.center.xy + in.corner * radius, min(in.center.z + sqrt(1.0 - r2) * radius, sceneZ));
    let clip = u.proj * vec4f(far, 1.0);
    var out: DepthOut;
    out.depth = far.z;
    out.fragDepth = clamp(clip.z / clip.w, 0.0, 1.0);
    return out;
}
`;

/**
 * Geometric thickness: distance between the far side and the near side of
 * the fluid volume per pixel, in world units. Unlike accumulated thickness
 * it does not depend on how densely the particles sample the volume.
 * @internal
 */
export let FluidGeometricThickness_wgsl: string = /*wgsl*/ `
${FluidUniforms_wgsl}

@group(0) @binding(0) var<uniform> u: FluidUniforms;
@group(0) @binding(1) var frontDepth: texture_2d<f32>;
@group(0) @binding(2) var backDepth: texture_2d<f32>;

@vertex
fn vs(@builtin(vertex_index) vi: u32) -> @builtin(position) vec4f {
    var p = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
    return vec4f(p[vi], 0.0, 1.0);
}

@fragment
fn fs(@builtin(position) pos: vec4f) -> @location(0) f32 {
    let uv = pos.xy / u.thickSize.xy;
    let p = vec2i(uv * vec2f(textureDimensions(frontDepth)));
    let front = textureLoad(frontDepth, p, 0).r;
    let back = textureLoad(backDepth, p, 0).r;
    if (front <= 0.0 || back <= 0.0) {
        return 0.0;
    }
    return max(back - front, 0.0);
}
`;

/**
 * Parameters of one separable blur pass. Layout (bytes):
 *   0  dir     : vec2f  (1,0) horizontal or (0,1) vertical
 *   8  dstSize : vec2f  size of the target being written
 *   16 params  : vec4f  depth filters: x = projected particle constant, y = max filter size, z = depth threshold,
 *                                      w = background clamp offset (narrow-range)
 *                       gaussian:  x = filter size
 *   32 params2 : vec4f  depth filters: x = world size of one target pixel per unit of depth,
 *                                      y = largest depth threshold scale at grazing angles
 * @internal
 */
export let FluidBlurParams_wgsl: string = /*wgsl*/ `
struct BlurParams {
    dir: vec2f,
    dstSize: vec2f,
    params: vec4f,
    params2: vec4f,
};

@group(0) @binding(0) var<uniform> b: BlurParams;
@group(0) @binding(1) var src: texture_2d<f32>;

@vertex
fn vs(@builtin(vertex_index) vi: u32) -> @builtin(position) vec4f {
    var p = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
    return vec4f(p[vi], 0.0, 1.0);
}

// Source texel for a target pixel offset by \`offset\` target pixels.
fn srcTexelAt(fragXY: vec2f, offset: vec2f) -> vec2i {
    let srcDim = vec2f(textureDimensions(src));
    let q = (fragXY + offset) * srcDim / b.dstSize;
    return clamp(vec2i(q), vec2i(0), vec2i(srcDim) - 1);
}

// Source texel for a target pixel offset by k pixels along the blur direction.
fn srcTexel(fragXY: vec2f, k: i32) -> vec2i {
    return srcTexelAt(fragXY, b.dir * f32(k));
}

// Depth threshold, widened where the surface is seen at a grazing angle: there a small height
// bump shows up as a depth step of about height / tan(angle). The local depth slope per pixel,
// over the world size of a pixel, estimates 1 / tan(angle).
fn grazingThreshold(fragXY: vec2f, depth: f32) -> f32 {
    let k = 2.0;
    let x0 = textureLoad(src, srcTexelAt(fragXY, vec2f(-k, 0.0)), 0).r;
    let x1 = textureLoad(src, srcTexelAt(fragXY, vec2f(k, 0.0)), 0).r;
    let y0 = textureLoad(src, srcTexelAt(fragXY, vec2f(0.0, -k)), 0).r;
    let y1 = textureLoad(src, srcTexelAt(fragXY, vec2f(0.0, k)), 0).r;
    if (min(min(x0, x1), min(y0, y1)) <= 0.0) {
        return b.params.z;
    }
    let slope = length(vec2f(x1 - x0, y1 - y0)) / (2.0 * k);
    let pixelWorld = max(depth * b.params2.x, 1e-6);
    return b.params.z * min(1.0 + slope / pixelWorld, b.params2.y);
}
`;

/**
 * Depth-aware (bilateral) blur of the fluid depth map. The radius
 * follows the projected particle size; samples are weighted by how
 * close their depth is to the center pixel, so separate surfaces are
 * not blended together.
 * @internal
 */
export let FluidBilateralBlur_wgsl: string = /*wgsl*/ `
${FluidBlurParams_wgsl}

@fragment
fn fs(@builtin(position) pos: vec4f) -> @location(0) f32 {
    let depth = textureLoad(src, srcTexel(pos.xy, 0), 0).r;
    if (depth <= 0.0) {
        // No fluid (0) or hidden fluid (negative): keep the marker.
        return depth;
    }
    let filterSize = i32(min(b.params.y, ceil(b.params.x / depth)));
    let sigma = max(f32(filterSize) / 3.0, 1e-3);
    let twoSigma2 = 2.0 * sigma * sigma;
    let sigmaDepth = grazingThreshold(pos.xy, depth) / 3.0;
    let twoSigmaDepth2 = 2.0 * sigmaDepth * sigmaDepth;

    var sum = 0.0;
    var wsum = 0.0;
    for (var k = -filterSize; k <= filterSize; k++) {
        let s = textureLoad(src, srcTexel(pos.xy, k), 0).r;
        if (s <= 0.0) {
            continue;
        }
        let x = f32(k);
        let dz = s - depth;
        let w = exp(-x * x / twoSigma2) * exp(-dz * dz / twoSigmaDepth2);
        sum += s * w;
        wsum += w;
    }
    return sum / wsum;
}
`;

/**
 * Narrow-range filter of the fluid depth map (Truong & Yuksel 2018).
 * Only samples within a depth range around the center are averaged.
 * The range starts at center ± threshold and widens as in-range samples
 * are met walking outward, so it follows sloped surfaces. Samples in
 * front of the range (another surface) drop out together with their
 * mirrored sample, which keeps the result unbiased; samples behind it,
 * or without fluid (0), count at center + clamp offset, which rounds
 * free silhouettes off instead of pulling them toward the background.
 * Skipped instead, so the surface stays flat up to the geometry:
 * - fluid hidden by the scene (negative), where it runs behind an object;
 * - samples without fluid whose opaque surface lies within the clamp
 *   offset behind the center, where the fluid meets a wall or the floor.
 * - fs: 1D pass along b.dir, radius from the projected particle size.
 * - fs2D: small 2D pass over the ring of radius 1 and 2, run last to
 *   remove the axis-aligned streaks of the separable passes.
 * @internal
 */
export let FluidNarrowRangeFilter_wgsl: string = /*wgsl*/ `
${FluidBlurParams_wgsl}

// Linear view depth of the opaque scene (FluidSceneLinearDepth_wgsl).
@group(0) @binding(2) var sceneLinear: texture_2d<f32>;

fn sceneAt(fragXY: vec2f, offset: vec2f) -> f32 {
    let dim = vec2f(textureDimensions(sceneLinear));
    let q = (fragXY + offset) * dim / b.dstSize;
    return textureLoad(sceneLinear, clamp(vec2i(q), vec2i(0), vec2i(dim) - 1), 0).r;
}

struct NarrowRange {
    low: f32,
    high: f32,
};

const NR_IN_FRONT: f32 = -1.0;
const NR_HIDDEN: f32 = -2.0;

// Classifies a sample against a range: returns the depth to use, NR_IN_FRONT for a sample in
// front of the range (drops the pair) or NR_HIDDEN for a sample to skip (see above).
fn classify(s: f32, sceneZ: f32, center: f32, thr: f32, range: ptr<function, NarrowRange>, background: f32) -> f32 {
    if (s < 0.0) {
        return NR_HIDDEN;
    }
    if (s == 0.0) {
        return select(background, NR_HIDDEN, sceneZ - center < b.params.w);
    }
    if (s < (*range).low) {
        return NR_IN_FRONT;
    }
    if (s > (*range).high) {
        return background;
    }
    (*range).low = min((*range).low, s - thr);
    (*range).high = max((*range).high, s + thr);
    return s;
}

@fragment
fn fs(@builtin(position) pos: vec4f) -> @location(0) f32 {
    let depth = textureLoad(src, srcTexel(pos.xy, 0), 0).r;
    if (depth <= 0.0) {
        return depth;
    }
    let filterSize = i32(min(b.params.y, ceil(b.params.x / depth)));
    let sigma = max(f32(filterSize) / 2.0, 1e-3);
    let invTwoSigma2 = 1.0 / (2.0 * sigma * sigma);
    let thr = grazingThreshold(pos.xy, depth);
    let background = depth + b.params.w;

    var negSide = NarrowRange(depth - thr, depth + thr);
    var posSide = NarrowRange(depth - thr, depth + thr);
    var sum = depth;
    var wsum = 1.0;
    for (var r = 1; r <= filterSize; r++) {
        let g = exp(-f32(r * r) * invTwoSigma2);
        let off = b.dir * f32(r);
        let a = classify(textureLoad(src, srcTexel(pos.xy, -r), 0).r, sceneAt(pos.xy, -off), depth, thr, &negSide, background);
        let c = classify(textureLoad(src, srcTexel(pos.xy, r), 0).r, sceneAt(pos.xy, off), depth, thr, &posSide, background);
        if (a == NR_IN_FRONT || c == NR_IN_FRONT) {
            continue;
        }
        let wa = select(0.0, g, a >= 0.0);
        let wc = select(0.0, g, c >= 0.0);
        sum += a * wa + c * wc;
        wsum += wa + wc;
    }
    return sum / wsum;
}

@fragment
fn fs2D(@builtin(position) pos: vec4f) -> @location(0) f32 {
    let depth = textureLoad(src, srcTexelAt(pos.xy, vec2f(0.0)), 0).r;
    if (depth <= 0.0) {
        return depth;
    }
    let thr = grazingThreshold(pos.xy, depth);
    let background = depth + b.params.w;
    var range = NarrowRange(depth - thr, depth + thr);
    var sum = depth;
    var wsum = 1.0;
    // Each offset and its mirror form a pair, so one sample in front drops both.
    for (var r = 1; r <= 2; r++) {
        for (var i = 0; i < 2 * r; i++) {
            let o1 = vec2f(f32(r), f32(r - i));
            let o2 = vec2f(f32(r - i), -f32(r));
            for (var k = 0; k < 2; k++) {
                let o = select(o1, o2, k == 1);
                let g = exp(-dot(o, o) / 8.0);
                let a = classify(textureLoad(src, srcTexelAt(pos.xy, -o), 0).r, sceneAt(pos.xy, -o), depth, thr, &range, background);
                let c = classify(textureLoad(src, srcTexelAt(pos.xy, o), 0).r, sceneAt(pos.xy, o), depth, thr, &range, background);
                if (a == NR_IN_FRONT || c == NR_IN_FRONT) {
                    continue;
                }
                let wa = select(0.0, g, a >= 0.0);
                let wc = select(0.0, g, c >= 0.0);
                sum += a * wa + c * wc;
                wsum += wa + wc;
            }
        }
    }
    return sum / wsum;
}
`;

/**
 * Linear view depth of the opaque scene at the fluid depth-map size, for
 * the narrow-range filter to tell where the fluid meets geometry.
 * @internal
 */
export let FluidSceneLinearDepth_wgsl: string = /*wgsl*/ `
${FluidUniforms_wgsl}

@group(0) @binding(0) var<uniform> u: FluidUniforms;
@group(0) @binding(1) var sceneDepth: texture_depth_2d;

@vertex
fn vs(@builtin(vertex_index) vi: u32) -> @builtin(position) vec4f {
    var p = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
    return vec4f(p[vi], 0.0, 1.0);
}

@fragment
fn fs(@builtin(position) pos: vec4f) -> @location(0) f32 {
    let dim = vec2f(textureDimensions(sceneDepth));
    let d = textureLoad(sceneDepth, vec2i(pos.xy * dim / u.size.xy), 0);
    #if USE_LOGDEPTH
        return pow(u.camera.y + 1.0, d) - 1.0;
    #else
        let v = u.projInv * vec4f(0.0, 0.0, d, 1.0);
        return v.z / v.w;
    #endif
}
`;

/**
 * Gaussian blur of the thickness map.
 * @internal
 */
export let FluidGaussianBlur_wgsl: string = /*wgsl*/ `
${FluidBlurParams_wgsl}

@fragment
fn fs(@builtin(position) pos: vec4f) -> @location(0) f32 {
    if (textureLoad(src, srcTexel(pos.xy, 0), 0).r == 0.0) {
        return 0.0;
    }
    let filterSize = i32(b.params.x);
    let sigma = max(f32(filterSize) / 3.0, 1e-3);
    let twoSigma2 = 2.0 * sigma * sigma;
    var sum = 0.0;
    var wsum = 0.0;
    for (var k = -filterSize; k <= filterSize; k++) {
        let x = f32(k);
        let w = exp(-x * x / twoSigma2);
        sum += textureLoad(src, srcTexel(pos.xy, k), 0).r * w;
        wsum += w;
    }
    return sum / wsum;
}
`;

/**
 * Reconstruct view-space position and normal from a fluid depth map.
 * Expects `u: FluidUniforms` and `fluidDepth: texture_2d<f32>`.
 * @internal
 */
export let FluidSurface_wgsl: string = /*wgsl*/ `
fn fluidViewPos(p: vec2i) -> vec3f {
    let dim = vec2i(textureDimensions(fluidDepth));
    let q = clamp(p, vec2i(0), dim - 1);
    let z = textureLoad(fluidDepth, q, 0).r;
    if (z <= 0.0) {
        // No fluid: a far point, so fluidNormal prefers the other neighbor.
        return vec3f(0.0, 0.0, 1e6);
    }
    let uv = (vec2f(q) + 0.5) / vec2f(dim);
    let clip = u.proj * vec4f(0.0, 0.0, z, 1.0);
    let ndc = vec4f(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0, clip.z / clip.w, 1.0);
    let v = u.projInv * ndc;
    return v.xyz / v.w;
}

// Normal facing the camera. For each axis the neighbor with the smaller
// depth step is used, so silhouettes do not bend the normal.
fn fluidNormal(p: vec2i, center: vec3f) -> vec3f {
    var ddx = fluidViewPos(p + vec2i(1, 0)) - center;
    let ddx2 = center - fluidViewPos(p - vec2i(1, 0));
    if (abs(ddx2.z) < abs(ddx.z)) {
        ddx = ddx2;
    }
    var ddy = fluidViewPos(p + vec2i(0, 1)) - center;
    let ddy2 = center - fluidViewPos(p - vec2i(0, 1));
    if (abs(ddy2.z) < abs(ddy.z)) {
        ddy = ddy2;
    }
    var n = normalize(cross(ddx, ddy));
    if (n.z > 0.0) {
        n = -n;
    }
    return n;
}
`;

/**
 * Full-screen debug view selected by `u.camera.z` (FluidDebug):
 * depth maps are distance-darkened and slope-shaded, thickness maps
 * map to grey, normals map to RGB. Pixels without fluid keep the scene.
 * @internal
 */
export let FluidDebugView_wgsl: string = /*wgsl*/ `
${FluidUniforms_wgsl}

@group(0) @binding(0) var<uniform> u: FluidUniforms;
@group(0) @binding(1) var fluidDepth: texture_2d<f32>;
@group(0) @binding(2) var fluidThickness: texture_2d<f32>;

${FluidSurface_wgsl}

@vertex
fn vs(@builtin(vertex_index) vi: u32) -> @builtin(position) vec4f {
    var p = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
    return vec4f(p[vi], 0.0, 1.0);
}

@fragment
fn fs(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    let mode = i32(u.camera.z);
    let uv = pos.xy / u.size.zw;
    let pd = vec2i(uv * vec2f(textureDimensions(fluidDepth)));
    let z = textureLoad(fluidDepth, pd, 0).r;
    // Derivatives before any discard: they need uniform control flow.
    let dz = vec2f(dpdx(z), dpdy(z));

    if (mode == 2 || mode == 3) {
        let pt = vec2i(uv * vec2f(textureDimensions(fluidThickness)));
        let t = textureLoad(fluidThickness, pt, 0).r;
        if (t <= 0.0) {
            discard;
        }
        return vec4f(vec3f(1.0 - exp(-t)), 1.0);
    }
    if (z <= 0.0) {
        discard;
    }
    if (mode == 4) {
        let n = fluidNormal(pd, fluidViewPos(pd));
        return vec4f(n * 0.5 + 0.5, 1.0);
    }
    // World size of one screen pixel at depth z (perspective).
    let pixelSize = 2.0 * z / (u.proj[1][1] * u.size.w);
    let slope = abs(normalize(vec3f(dz, pixelSize)).z);
    let c = log2(z + 1.0) / log2(u.camera.y + 1.0);
    return vec4f(vec3f((1.0 - c) * (0.2 + 0.8 * slope)), 1.0);
}
`;

/**
 * Shading parameters of the composite stage. Layout (bytes):
 *   0   fluidColor : vec4f  rgb = absorption color, a = 1 when thickness is geometric (world units)
 *   16  light      : vec4f  xyz = view-space direction toward the light, w = specular power
 *   32  params     : vec4f  x = density, y = refraction strength, z = fresnel clamp, w = minimum thickness
 *   48  flags      : vec4f  x = fixed thickness, y = has environment map, z = environment exposure,
 *                           w = edge fade thickness (0 = off)
 *   64  invView    : mat4x4f
 * @internal
 */
export let FluidShadeUniforms_wgsl: string = /*wgsl*/ `
struct FluidShade {
    fluidColor: vec4f,
    light: vec4f,
    params: vec4f,
    flags: vec4f,
    invView: mat4x4f,
};
`;

/**
 * Final fluid shading, in two entry points sharing group 0:
 * - fsColor: shades the surface into the scene color. It reads the scene
 *   depth (group 1) to drop fluid hidden by opaque geometry and to find
 *   how far the refracted ray travels before it reaches the scene behind;
 *   that point is projected back to the screen to sample the scene color.
 *   Absorption is Beer-Lambert, exp(-density * thickness * (1 - fluidColor));
 *   reflection is the environment cube map weighted by Schlick fresnel;
 *   specular is a Blinn-Phong highlight of one directional light.
 * - fsDepth: writes the fluid surface into the scene depth, so transparent
 *   objects drawn afterwards are clipped by it.
 * @internal
 */
export let FluidComposite_wgsl: string = /*wgsl*/ `
${FluidUniforms_wgsl}
${FluidShadeUniforms_wgsl}

@group(0) @binding(0) var<uniform> u: FluidUniforms;
@group(0) @binding(1) var fluidDepth: texture_2d<f32>;
@group(0) @binding(2) var fluidThickness: texture_2d<f32>;
@group(0) @binding(3) var<uniform> s: FluidShade;
@group(1) @binding(0) var sceneColor: texture_2d<f32>;
@group(1) @binding(1) var linearSampler: sampler;
@group(1) @binding(2) var envMap: texture_cube<f32>;
@group(1) @binding(3) var sceneDepth: texture_depth_2d;

${FluidSurface_wgsl}

const WATER_ETA: f32 = 1.0 / 1.333;
const WATER_F0: f32 = 0.02;

@vertex
fn vs(@builtin(vertex_index) vi: u32) -> @builtin(position) vec4f {
    var p = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
    return vec4f(p[vi], 0.0, 1.0);
}

// Thickness at a screen uv, or -1 where there is no fluid to draw.
fn coveredThickness(uv: vec2f) -> f32 {
    let pd = vec2i(uv * vec2f(textureDimensions(fluidDepth)));
    if (textureLoad(fluidDepth, pd, 0).r <= 0.0) {
        return -1.0;
    }
    if (s.flags.x > 0.5) {
        return s.params.w;
    }
    let pt = vec2i(uv * vec2f(textureDimensions(fluidThickness)));
    let thickness = textureLoad(fluidThickness, pt, 0).r;
    return select(-1.0, thickness, thickness > s.params.w);
}

fn depthPixel(uv: vec2f) -> vec2i {
    return vec2i(uv * vec2f(textureDimensions(fluidDepth)));
}

fn encodeDepth(viewPos: vec3f) -> f32 {
    #if USE_LOGDEPTH
        return log2(1.0 + viewPos.z) / log2(u.camera.y + 1.0);
    #else
        let clip = u.proj * vec4f(viewPos, 1.0);
        return clip.z / clip.w;
    #endif
}

// View-space depth of the opaque scene at a screen uv.
fn sceneViewZ(uv: vec2f) -> f32 {
    let dim = vec2f(textureDimensions(sceneDepth));
    let d = textureLoad(sceneDepth, clamp(vec2i(uv * dim), vec2i(0), vec2i(dim) - 1), 0);
    #if USE_LOGDEPTH
        return pow(u.camera.y + 1.0, d) - 1.0;
    #else
        let v = u.projInv * vec4f(0.0, 0.0, d, 1.0);
        return v.z / v.w;
    #endif
}

@fragment
fn fsColor(@builtin(position) pos: vec4f) -> @location(0) vec4f {
    let uv = pos.xy / u.size.zw;
    let thickness = coveredThickness(uv);
    if (thickness < 0.0) {
        discard;
    }
    let pd = depthPixel(uv);
    let viewPos = fluidViewPos(pd);
    let sceneZ = sceneViewZ(uv);
    if (viewPos.z >= sceneZ) {
        discard;
    }
    let n = fluidNormal(pd, viewPos);
    let rayDir = normalize(viewPos);

    let h = normalize(s.light.xyz - rayDir);
    let specular = pow(max(dot(h, n), 0.0), s.light.w);

    // Follow the refracted ray to the depth of the scene behind, project that point back to
    // the screen and sample the scene there. Grazing rays are capped so they cannot run off
    // across the screen. With geometric thickness the ray also stays within the fluid's
    // extent along the view: seen at a grazing angle the scene behind the pixel lies far
    // beyond where the refracted ray reaches the bottom, and the long lever would turn small
    // normal variations into streaks.
    let refr = refract(rayDir, n, WATER_ETA);
    var travel = (sceneZ - viewPos.z) / max(refr.z, 0.25);
    if (s.fluidColor.a > 0.5) {
        travel = min(travel, thickness);
    }
    let hit = u.proj * vec4f(viewPos + refr * travel * s.params.y, 1.0);
    let hitUV = vec2f(hit.x / hit.w * 0.5 + 0.5, 0.5 - hit.y / hit.w * 0.5);
    let transmitted = textureSampleLevel(sceneColor, linearSampler, hitUV, 0.0).rgb;
    let transmittance = exp(-s.params.x * thickness * (1.0 - s.fluidColor.rgb));
    let refraction = transmitted * transmittance;

    var color = refraction;
    if (s.flags.y > 0.5) {
        let reflDir = (s.invView * vec4f(reflect(rayDir, n), 0.0)).xyz;
        let reflection = textureSampleLevel(envMap, linearSampler, reflDir, 0.0).rgb * s.flags.z;
        let fresnel = clamp(WATER_F0 + (1.0 - WATER_F0) * pow(1.0 - max(dot(n, -rayDir), 0.0), 5.0), 0.0, s.params.z);
        color = mix(refraction, reflection, fresnel);
    }
    color += specular;
    // Thin rims at free edges: the smoothed surface bends to grazing there and would show a dark
    // reflection outline and a hard silhouette, so fade toward the unrefracted background.
    if (s.flags.w > 0.0) {
        let background = textureSampleLevel(sceneColor, linearSampler, uv, 0.0).rgb;
        color = mix(background, color, smoothstep(0.0, s.flags.w, thickness));
    }
    return vec4f(color, 1.0);
}

@fragment
fn fsDepth(@builtin(position) pos: vec4f) -> @builtin(frag_depth) f32 {
    let uv = pos.xy / u.size.zw;
    if (coveredThickness(uv) < 0.0) {
        discard;
    }
    return encodeDepth(fluidViewPos(depthPixel(uv)));
}
`;
