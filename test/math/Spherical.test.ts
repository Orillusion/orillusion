import { test, expect, end } from '../util'
import { Cylindrical, OrbitController, Spherical, Vector3 } from '@orillusion/core';

await test('Spherical: cartesian round trip and axis conventions', async () => {
    const s = new Spherical();
    s.setFromVector3(new Vector3(0, 5, 0));
    expect(s.radius).toSubequal(5, 1e-12); expect(s.phi).toSubequal(0, 1e-12);          // +Y is the pole
    s.setCoords(0, 0, 3);
    expect(s.phi).toSubequal(Math.PI / 2, 1e-12); expect(s.theta).toSubequal(0, 1e-12); // +Z is theta 0
    s.setCoords(2, 0, 0);
    expect(s.theta).toSubequal(Math.PI / 2, 1e-12);                                     // +X is theta 90°
    for (const v of [new Vector3(1, 2, 3), new Vector3(-4, 0.5, 2), new Vector3(0.1, -7, -0.3)]) {
        const out = new Spherical().setFromVector3(v).toVector3();
        expect(out.x).toSubequal(v.x, 1e-9); expect(out.y).toSubequal(v.y, 1e-9); expect(out.z).toSubequal(v.z, 1e-9);
    }
    expect(new Spherical().setCoords(0, 0, 0).radius).tobe(0);
})

await test('Spherical: makeSafe, copy/clone, getCoords scratch, three.js alias', async () => {
    const s = new Spherical(2, 0, 1).makeSafe();
    expect(s.phi > 0).tobe(true);
    s.phi = Math.PI; s.makeSafe();
    expect(s.phi < Math.PI).tobe(true);
    const c = s.clone();
    expect(c !== s && c.radius === s.radius && c.phi === s.phi && c.theta === s.theta).tobe(true);
    expect(new Spherical().copy(s).theta).tobe(1);
    expect(s.getCoords() === s.coords).tobe(true);                                     // legacy scratch-vector contract
    const a = new Spherical().setFromCartesianCoords(1, 1, 1), b = new Spherical().setCoords(1, 1, 1);
    expect(a.radius === b.radius && a.phi === b.phi && a.theta === b.theta).tobe(true);
})

await test('OrbitController exposes the public Spherical class', async () => {
    // The controller used to carry a private copy of this class.
    expect(typeof OrbitController).tobe('function');
    expect(Object.getOwnPropertyDescriptor(OrbitController.prototype, 'spherical') != null).tobe(true);
})

await test('Cylindrical: round trip and conventions', async () => {
    const c = new Cylindrical().setFromVector3(new Vector3(3, 7, 0));
    expect(c.radius).toSubequal(3, 1e-12); expect(c.theta).toSubequal(Math.PI / 2, 1e-12); expect(c.y).tobe(7);
    for (const v of [new Vector3(1, 2, 3), new Vector3(-4, -0.5, 2), new Vector3(0, 9, -3)]) {
        const out = new Cylindrical().setFromVector3(v).toVector3();
        expect(out.x).toSubequal(v.x, 1e-9); expect(out.y).toSubequal(v.y, 1e-9); expect(out.z).toSubequal(v.z, 1e-9);
    }
    const k = new Cylindrical(2, 1, 5).clone();
    expect(new Cylindrical().copy(k).y).tobe(5);
})

setTimeout(end, 500)
