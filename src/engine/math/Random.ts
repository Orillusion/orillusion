/**
 * @internal
 */
export function uniform_real_distribution(min, max) {
    return Math.random() * max + Math.random() * min + (max - min) * Math.random();
}

/**
 * @internal
 */
export function uniform_real_distribution2(min, max, rng) {
    let rd = rng * Math.random();
    return Math.random() * max * rd + Math.random() * min * rd + (max - min) * Math.random() * rd;
}

/**
 * @internal
 */
export function normal_distribution(min, max, skew) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while (v === 0) v = Math.random();
    let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);

    num = num / 10.0 + 0.5; // Translate to 0 -> 1
    if (num > 1 || num < 0) num = normal_distribution(min, max, skew); // resample between 0 and 1 if out of range
    num = Math.pow(num, skew); // Skew
    num *= max - min; // Stretch to fill range
    num += min; // offset to min
    return num;
}

/*
 * This implementation is "Simplex Noise" as presented by
 * Ken Perlin at a relatively obscure and not often cited course
 * session "Real-Time Shading" at Siggraph 2001 (before real
 * time shading actually took on), under the title "hardware noise".
 * The 3D function is numerically equivalent to his Java reference
 * code available in the PDF course notes, although I re-implemented
 * it from scratch to get more readable code. The 1D, 2D and 4D cases
 * were implemented from scratch by me from Ken Perlin's text.
 *
 * This file has no dependencies on any other file, not even its own
 * header file. The header file is made for use by external code only.
 */
/**
 * @internal
 */
export function FASTFLOOR(x) {
    return x > 0 ? Math.floor(x) : Math.floor(x) - 1;
}

/*
 * Permutation table. This is just a random jumble of all numbers 0-255,
 * repeated twice to avoid wrapping the index at 255 for each lookup.
 * This needs to be exactly the same for all instances on all platforms,
 * so it's easiest to just keep it as static explicit data.
 * This also removes the need for any initialisation of this class.
 *
 * Note that making this an int[] instead of a char[] might make the
 * code run faster on platforms with a high penalty for unaligned single
 * byte addressing. Intel x86 is generally single-byte-friendly, but
 * some other CPUs are faster with 4-aligned reads.
 * However, a char[] is smaller, which avoids cache trashing, and that
 * is probably the most important aspect on most architectures.
 * This array is accessed a *lot* by the noise functions.
 * A vector-valued noise over 3D accesses it 96 times, and a
 * float-valued 4D noise 64 times. We want this to fit in the cache!
 */
/**
 * @internal
 */
export let perm = [
    151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71,
    134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226,
    250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97,
    228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180, 151, 160,
    137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139,
    48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124,
    123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228, 251,
    34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180,
];

/*
 * Helper functions to compute gradients-dot-residualvectors (1D to 4D)
 * Note that these generate gradients of more than unit length. To make
 * a close match with the value range of classic Perlin noise, the final
 * noise values need to be rescaled to fit nicely within [-1,1].
 * (The simplex noise functions as such also have different scaling.)
 * Note also that these noise functions are the most practical and useful
 * signed version of Perlin noise. To return values according to the
 * RenderMan specification from the SL noise() and pnoise() functions,
 * the noise values need to be scaled and offset to [0,1], like this:
 * float SLnoise = (noise(x,y,z) + 1.0) * 0.5;
 */
/**
 * @internal
 */
export function grad1(hash, x) {
    let h = hash & 15;
    let grad = 1.0 + (h & 7); // Gradient value 1.0, 2.0, ..., 8.0
    if (h & 8) grad = -grad; // Set a random sign for the gradient
    return grad * x; // Multiply the gradient with the distance
}

/**
 * @internal
 */
export function grad2(hash, x, y) {
    let h = hash & 7; // Convert low 3 bits of hash code
    let u = h < 4 ? x : y; // into 8 simple gradient directions,
    let v = h < 4 ? y : x; // and compute the dot product with (x,y).
    return (h & 1 ? -u : u) + (h & 2 ? -2.0 * v : 2.0 * v);
}

/**
 * @internal
 */
export function grad3(hash, x, y, z) {
    let h = hash & 15; // Convert low 4 bits of hash code into 12 simple
    let u = h < 8 ? x : y; // gradient directions, and compute dot product.
    let v = h < 4 ? y : h == 12 || h == 14 ? x : z; // Fix repeats at h = 12 to 15
    return (h & 1 ? -u : u) + (h & 2 ? -v : v);
}

/**
 * @internal
 */
export function grad4(hash, x, y, z, t) {
    let h = hash & 31; // Convert low 5 bits of hash code into 32 simple
    let u = h < 24 ? x : y; // gradient directions, and compute dot product.
    let v = h < 16 ? y : z;
    let w = h < 8 ? z : t;
    return (h & 1 ? -u : u) + (h & 2 ? -v : v) + (h & 4 ? -w : w);
}

// A lookup table to traverse the simplex around a given point in 4D.
// Details can be found where this table is used, in the 4D noise method.
/* TODO: This should not be required, backport it from Bill's GLSL code! */
/**
 * @internal
 */
export let simplex = [
    [0, 1, 2, 3],
    [0, 1, 3, 2],
    [0, 0, 0, 0],
    [0, 2, 3, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [1, 2, 3, 0],
    [0, 2, 1, 3],
    [0, 0, 0, 0],
    [0, 3, 1, 2],
    [0, 3, 2, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [1, 3, 2, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [1, 2, 0, 3],
    [0, 0, 0, 0],
    [1, 3, 0, 2],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [2, 3, 0, 1],
    [2, 3, 1, 0],
    [1, 0, 2, 3],
    [1, 0, 3, 2],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [2, 0, 3, 1],
    [0, 0, 0, 0],
    [2, 1, 3, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [2, 0, 1, 3],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [3, 0, 1, 2],
    [3, 0, 2, 1],
    [0, 0, 0, 0],
    [3, 1, 2, 0],
    [2, 1, 0, 3],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [3, 1, 0, 2],
    [0, 0, 0, 0],
    [3, 2, 0, 1],
    [3, 2, 1, 0],
];

/**
 * @internal
 */
export function snoise1(x) {
    let i0 = FASTFLOOR(x);
    let i1 = i0 + 1;
    let x0 = x - i0;
    let x1 = x0 - 1.0;

    let n0, n1;

    let t0 = 1.0 - x0 * x0;
    //  if(t0 < 0.0f) t0 = 0.0f; // this never happens for the 1D case
    t0 *= t0;
    n0 = t0 * t0 * grad1(perm[i0 & 0xff], x0);

    let t1 = 1.0 - x1 * x1;
    //  if(t1 < 0.0f) t1 = 0.0f; // this never happens for the 1D case
    t1 *= t1;
    n1 = t1 * t1 * grad1(perm[i1 & 0xff], x1);
    // The maximum value of this noise is 8*(3/4)^4 = 2.53125
    // A factor of 0.395 would scale to fit exactly within [-1,1], but
    // we want to match PRMan's 1D noise, so we scale it down some more.
    return 0.25 * (n0 + n1);
}

// 2D simplex noise
/**
 * @internal
 */
export function snoise2(x, y) {
    const F2 = 0.366025403; // F2 = 0.5*(sqrt(3.0)-1.0)
    const G2 = 0.211324865; // G2 = (3.0-Math.sqrt(3.0))/6.0

    let n0, n1, n2; // Noise contributions from the three corners

    // Skew the input space to determine which simplex cell we're in
    let s = (x + y) * F2; // Hairy factor for 2D
    let xs = x + s;
    let ys = y + s;
    let i = FASTFLOOR(xs);
    let j = FASTFLOOR(ys);

    let t = (i + j) * G2;
    let X0 = i - t; // Unskew the cell origin back to (x,y) space
    let Y0 = j - t;
    let x0 = x - X0; // The x,y distances from the cell origin
    let y0 = y - Y0;

    // For the 2D case, the simplex shape is an equilateral triangle.
    // Determine which simplex we are in.
    let i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
    if (x0 > y0) {
        i1 = 1;
        j1 = 0;
    } // lower triangle, XY order: (0,0)->(1,0)->(1,1)
    else {
        i1 = 0;
        j1 = 1;
    } // upper triangle, YX order: (0,0)->(0,1)->(1,1)

    // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
    // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
    // c = (3-sqrt(3))/6

    let x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
    let y1 = y0 - j1 + G2;
    let x2 = x0 - 1.0 + 2.0 * G2; // Offsets for last corner in (x,y) unskewed coords
    let y2 = y0 - 1.0 + 2.0 * G2;

    // Wrap the integer indices at 256, to avoid indexing perm[] out of bounds
    let ii = i & 0xff;
    let jj = j & 0xff;

    // Calculate the contribution from the three corners
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 < 0.0) n0 = 0.0;
    else {
        t0 *= t0;
        n0 = t0 * t0 * grad2(perm[ii + perm[jj]], x0, y0);
    }

    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 < 0.0) n1 = 0.0;
    else {
        t1 *= t1;
        n1 = t1 * t1 * grad2(perm[ii + i1 + perm[jj + j1]], x1, y1);
    }

    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 < 0.0) n2 = 0.0;
    else {
        t2 *= t2;
        n2 = t2 * t2 * grad2(perm[ii + 1 + perm[jj + 1]], x2, y2);
    }

    // Add contributions from each corner to get the final noise value.
    // The result is scaled to return values in the interval [-1,1].
    return 40.0 * (n0 + n1 + n2); // TODO: The scale factor is preliminary!
}

// 3D simplex noise
/**
 * @internal
 */
export function snoise3(x, y, z) {
    // Simple skewing factors for the 3D case
    const F3 = 0.333333333;
    const G3 = 0.166666667;

    let n0, n1, n2, n3; // Noise contributions from the four corners

    // Skew the input space to determine which simplex cell we're in
    let s = (x + y + z) * F3; // Very nice and simple skew factor for 3D
    let xs = x + s;
    let ys = y + s;
    let zs = z + s;
    let i = FASTFLOOR(xs);
    let j = FASTFLOOR(ys);
    let k = FASTFLOOR(zs);

    let t = (i + j + k) * G3;
    let X0 = i - t; // Unskew the cell origin back to (x,y,z) space
    let Y0 = j - t;
    let Z0 = k - t;
    let x0 = x - X0; // The x,y,z distances from the cell origin
    let y0 = y - Y0;
    let z0 = z - Z0;

    // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
    // Determine which simplex we are in.
    let i1, j1, k1; // Offsets for second corner of simplex in (i,j,k) coords
    let i2, j2, k2; // Offsets for third corner of simplex in (i,j,k) coords

    /* This code would benefit from a backport from the GLSL version! */
    if (x0 >= y0) {
        if (y0 >= z0) {
            i1 = 1;
            j1 = 0;
            k1 = 0;
            i2 = 1;
            j2 = 1;
            k2 = 0;
        } // X Y Z order
        else if (x0 >= z0) {
            i1 = 1;
            j1 = 0;
            k1 = 0;
            i2 = 1;
            j2 = 0;
            k2 = 1;
        } // X Z Y order
        else {
            i1 = 0;
            j1 = 0;
            k1 = 1;
            i2 = 1;
            j2 = 0;
            k2 = 1;
        } // Z X Y order
    } else {
        // x0<y0
        if (y0 < z0) {
            i1 = 0;
            j1 = 0;
            k1 = 1;
            i2 = 0;
            j2 = 1;
            k2 = 1;
        } // Z Y X order
        else if (x0 < z0) {
            i1 = 0;
            j1 = 1;
            k1 = 0;
            i2 = 0;
            j2 = 1;
            k2 = 1;
        } // Y Z X order
        else {
            i1 = 0;
            j1 = 1;
            k1 = 0;
            i2 = 1;
            j2 = 1;
            k2 = 0;
        } // Y X Z order
    }

    // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
    // a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
    // a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
    // c = 1/6.

    let x1 = x0 - i1 + G3; // Offsets for second corner in (x,y,z) coords
    let y1 = y0 - j1 + G3;
    let z1 = z0 - k1 + G3;
    let x2 = x0 - i2 + 2.0 * G3; // Offsets for third corner in (x,y,z) coords
    let y2 = y0 - j2 + 2.0 * G3;
    let z2 = z0 - k2 + 2.0 * G3;
    let x3 = x0 - 1.0 + 3.0 * G3; // Offsets for last corner in (x,y,z) coords
    let y3 = y0 - 1.0 + 3.0 * G3;
    let z3 = z0 - 1.0 + 3.0 * G3;

    // Wrap the integer indices at 256, to avoid indexing perm[] out of bounds
    let ii = i & 0xff;
    let jj = j & 0xff;
    let kk = k & 0xff;

    // Calculate the contribution from the four corners
    let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
    if (t0 < 0.0) n0 = 0.0;
    else {
        t0 *= t0;
        n0 = t0 * t0 * grad3(perm[ii + perm[jj + perm[kk]]], x0, y0, z0);
    }

    let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
    if (t1 < 0.0) n1 = 0.0;
    else {
        t1 *= t1;
        n1 = t1 * t1 * grad3(perm[ii + i1 + perm[jj + j1 + perm[kk + k1]]], x1, y1, z1);
    }

    let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
    if (t2 < 0.0) n2 = 0.0;
    else {
        t2 *= t2;
        n2 = t2 * t2 * grad3(perm[ii + i2 + perm[jj + j2 + perm[kk + k2]]], x2, y2, z2);
    }

    let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
    if (t3 < 0.0) n3 = 0.0;
    else {
        t3 *= t3;
        n3 = t3 * t3 * grad3(perm[ii + 1 + perm[jj + 1 + perm[kk + 1]]], x3, y3, z3);
    }

    // Add contributions from each corner to get the final noise value.
    // The result is scaled to stay just inside [-1,1]
    return 32.0 * (n0 + n1 + n2 + n3); // TODO: The scale factor is preliminary!
}

// 4D simplex noise
/**
 * @internal
 */
export function snoise4(x, y, z, w) {
    // The skewing and unskewing factors are hairy again for the 4D case
    const F4 = 0.309016994; // F4 = (Math.sqrt(5.0)-1.0)/4.0
    const G4 = 0.138196601; // G4 = (5.0-Math.sqrt(5.0))/20.0

    let n0, n1, n2, n3, n4; // Noise contributions from the five corners

    // Skew the (x,y,z,w) space to determine which cell of 24 simplices we're in
    let s = (x + y + z + w) * F4; // Factor for 4D skewing
    let xs = x + s;
    let ys = y + s;
    let zs = z + s;
    let ws = w + s;
    let i = FASTFLOOR(xs);
    let j = FASTFLOOR(ys);
    let k = FASTFLOOR(zs);
    let l = FASTFLOOR(ws);

    let t = (i + j + k + l) * G4; // Factor for 4D unskewing
    let X0 = i - t; // Unskew the cell origin back to (x,y,z,w) space
    let Y0 = j - t;
    let Z0 = k - t;
    let W0 = l - t;

    let x0 = x - X0; // The x,y,z,w distances from the cell origin
    let y0 = y - Y0;
    let z0 = z - Z0;
    let w0 = w - W0;

    // For the 4D case, the simplex is a 4D shape I won't even try to describe.
    // To find out which of the 24 possible simplices we're in, we need to
    // determine the magnitude ordering of x0, y0, z0 and w0.
    // The method below is a good way of finding the ordering of x,y,z,w and
    // then find the correct traversal order for the simplex were in.
    // First, six pair-wise comparisons are performed between each possible pair
    // of the four coordinates, and the results are used to add up binary bits
    // for an integer index.
    let c1 = x0 > y0 ? 32 : 0;
    let c2 = x0 > z0 ? 16 : 0;
    let c3 = y0 > z0 ? 8 : 0;
    let c4 = x0 > w0 ? 4 : 0;
    let c5 = y0 > w0 ? 2 : 0;
    let c6 = z0 > w0 ? 1 : 0;
    let c = c1 + c2 + c3 + c4 + c5 + c6;

    let i1, j1, k1, l1; // The integer offsets for the second simplex corner
    let i2, j2, k2, l2; // The integer offsets for the third simplex corner
    let i3, j3, k3, l3; // The integer offsets for the fourth simplex corner

    // simplex[c] is a 4-vector with the numbers 0, 1, 2 and 3 in some order.
    // Many values of c will never occur, since e.g. x>y>z>w makes x<z, y<w and x<w
    // impossible. Only the 24 indices which have non-zero entries make any sense.
    // We use a thresholding to set the coordinates in turn from the largest magnitude.
    // The number 3 in the "simplex" array is at the position of the largest coordinate.
    i1 = simplex[c][0] >= 3 ? 1 : 0;
    j1 = simplex[c][1] >= 3 ? 1 : 0;
    k1 = simplex[c][2] >= 3 ? 1 : 0;
    l1 = simplex[c][3] >= 3 ? 1 : 0;
    // The number 2 in the "simplex" array is at the second largest coordinate.
    i2 = simplex[c][0] >= 2 ? 1 : 0;
    j2 = simplex[c][1] >= 2 ? 1 : 0;
    k2 = simplex[c][2] >= 2 ? 1 : 0;
    l2 = simplex[c][3] >= 2 ? 1 : 0;
    // The number 1 in the "simplex" array is at the second smallest coordinate.
    i3 = simplex[c][0] >= 1 ? 1 : 0;
    j3 = simplex[c][1] >= 1 ? 1 : 0;
    k3 = simplex[c][2] >= 1 ? 1 : 0;
    l3 = simplex[c][3] >= 1 ? 1 : 0;
    // The fifth corner has all coordinate offsets = 1, so no need to look that up.

    let x1 = x0 - i1 + G4; // Offsets for second corner in (x,y,z,w) coords
    let y1 = y0 - j1 + G4;
    let z1 = z0 - k1 + G4;
    let w1 = w0 - l1 + G4;
    let x2 = x0 - i2 + 2.0 * G4; // Offsets for third corner in (x,y,z,w) coords
    let y2 = y0 - j2 + 2.0 * G4;
    let z2 = z0 - k2 + 2.0 * G4;
    let w2 = w0 - l2 + 2.0 * G4;
    let x3 = x0 - i3 + 3.0 * G4; // Offsets for fourth corner in (x,y,z,w) coords
    let y3 = y0 - j3 + 3.0 * G4;
    let z3 = z0 - k3 + 3.0 * G4;
    let w3 = w0 - l3 + 3.0 * G4;
    let x4 = x0 - 1.0 + 4.0 * G4; // Offsets for last corner in (x,y,z,w) coords
    let y4 = y0 - 1.0 + 4.0 * G4;
    let z4 = z0 - 1.0 + 4.0 * G4;
    let w4 = w0 - 1.0 + 4.0 * G4;

    // Wrap the integer indices at 256, to avoid indexing perm[] out of bounds
    let ii = i & 0xff;
    let jj = j & 0xff;
    let kk = k & 0xff;
    let ll = l & 0xff;

    // Calculate the contribution from the five corners
    let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0 - w0 * w0;
    if (t0 < 0.0) n0 = 0.0;
    else {
        t0 *= t0;
        n0 = t0 * t0 * grad4(perm[ii + perm[jj + perm[kk + perm[ll]]]], x0, y0, z0, w0);
    }

    let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1 - w1 * w1;
    if (t1 < 0.0) n1 = 0.0;
    else {
        t1 *= t1;
        n1 = t1 * t1 * grad4(perm[ii + i1 + perm[jj + j1 + perm[kk + k1 + perm[ll + l1]]]], x1, y1, z1, w1);
    }

    let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2 - w2 * w2;
    if (t2 < 0.0) n2 = 0.0;
    else {
        t2 *= t2;
        n2 = t2 * t2 * grad4(perm[ii + i2 + perm[jj + j2 + perm[kk + k2 + perm[ll + l2]]]], x2, y2, z2, w2);
    }

    let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3 - w3 * w3;
    if (t3 < 0.0) n3 = 0.0;
    else {
        t3 *= t3;
        n3 = t3 * t3 * grad4(perm[ii + i3 + perm[jj + j3 + perm[kk + k3 + perm[ll + l3]]]], x3, y3, z3, w3);
    }

    let t4 = 0.6 - x4 * x4 - y4 * y4 - z4 * z4 - w4 * w4;
    if (t4 < 0.0) n4 = 0.0;
    else {
        t4 *= t4;
        n4 = t4 * t4 * grad4(perm[ii + 1 + perm[jj + 1 + perm[kk + 1 + perm[ll + 1]]]], x4, y4, z4, w4);
    }

    // Sum up and scale the result to cover the range [-1,1]
    return 27.0 * (n0 + n1 + n2 + n3 + n4); // TODO: The scale factor is preliminary!
}
//---------------------------------------------------------------------
