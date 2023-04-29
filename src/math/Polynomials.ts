/**
 * @internal
 * @group Math
 */
export class Polynomials { }

// Returns the highest root for the cubic x^3 + px^2 + qx + r
/**
 * @internal
 */
export function cubicPolynomialRoot(p: number, q: number, r: number) {
    let rcp3 = 1.0 / 3.0;
    let half = 0.5;
    let po3 = p * rcp3;
    let po3_2 = po3 * po3;
    let po3_3 = po3_2 * po3;
    let b = po3_3 - po3 * q * half + r * half;
    let a = -po3_2 + q * rcp3;
    let a3 = a * a * a;
    let det = a3 + b * b;

    if (det >= 0) {
        let r0 = Math.sqrt(det) - b;
        r0 = r0 > 0 ? Math.pow(r0, rcp3) : -Math.pow(-r0, rcp3);

        return -po3 - a / r0 + r0;
    }

    let abs = Math.sqrt(-a3);
    let arg = Math.acos(-b / abs);
    abs = Math.pow(abs, rcp3);
    abs = abs - a / abs;
    arg = -po3 + abs * Math.cos(arg * rcp3);
    return arg;
}

// Calculates all real roots of polynomial ax^2 + bx + c (and returns how many)
/**
 * @internal
 */
export function quadraticPolynomialRootsGeneric(a, b, c, out: { r0; r1 }) {
    let eps = 0.00001;
    if (Math.abs(a) < eps) {
        if (Math.abs(b) > eps) {
            out.r0 = -c / b;
            return 1;
        } else {
            return 0;
        }
    }

    let disc = b * b - 4 * a * c;
    if (disc < 0.0) {
        return 0;
    }

    let halfRcpA = 0.5 / a;
    let sqrtDisc = Math.sqrt(disc);
    out.r0 = (sqrtDisc - b) * halfRcpA;
    out.r1 = (-sqrtDisc - b) * halfRcpA;
    return 2;
}

// Calculates all the roots for the cubic ax^3 + bx^2 + cx + d. Max num roots is 3.
/**
 * @internal
 */
export function cubicPolynomialRootsGeneric(roots: number[], a: number, b: number, c: number, d: number) {
    let numRoots = 0;
    if (Math.abs(a) >= 0.0001) {
        let p = b / a;
        let q = c / a;
        let r = d / a;
        roots[0] = cubicPolynomialRoot(p, q, r);
        numRoots++;

        let la = a;
        let lb = b + a * roots[0];
        let lc = c + b * roots[0] + a * roots[0] * roots[0];
        numRoots += quadraticPolynomialRootsGeneric(la, lb, lc, { r0: roots[1], r1: roots[2] });
    } else {
        numRoots += quadraticPolynomialRootsGeneric(b, c, d, { r0: roots[1], r1: roots[2] });
    }

    return numRoots;
}

// // Specialized version of QuadraticPolynomialRootsGeneric that returns the largest root
// /**
//  * @internal
//  */
// export function quadraticPolynomialRoot(a, b, c) {
//     let r0;
//     let r1;
//     quadraticPolynomialRootsGeneric(a, b, c, { r0: r0, r1: r1 });
//     return r0;
// }
