import { test, expect, end } from '../util'
import { Box2, Vector2 } from '@orillusion/core';

const v = (x: number, y: number) => new Vector2(x, y);

await test('Box2: empty by default, grows from points', async () => {
    const b = new Box2();
    expect(b.isEmpty()).tobe(true);
    expect(b.getSize().x).tobe(0);
    b.setFromPoints([v(1, 5), v(-2, 3), v(4, -1)]);
    expect(b.isEmpty()).tobe(false);
    expect([b.min.x, b.min.y, b.max.x, b.max.y]).toEqual([-2, -1, 4, 5]);
    expect(b.getCenter().x).tobe(1); expect(b.getCenter().y).tobe(2);
    expect(b.getSize().x).tobe(6); expect(b.getSize().y).tobe(6);
    expect(new Box2(v(2, 2), v(2, 2)).isEmpty()).tobe(false);           // a single point is not empty
})

await test('Box2: contains / intersects / distance / clamp / parameter', async () => {
    const b = new Box2(v(0, 0), v(10, 4));
    expect(b.containsPoint(v(10, 4))).tobe(true);                      // inclusive edges
    expect(b.containsPoint(v(10.01, 4))).tobe(false);
    expect(b.containsBox(new Box2(v(1, 1), v(9, 3)))).tobe(true);
    expect(b.containsBox(new Box2(v(1, 1), v(11, 3)))).tobe(false);
    expect(b.intersectsBox(new Box2(v(10, 4), v(12, 6)))).tobe(true);   // touching counts
    expect(b.intersectsBox(new Box2(v(10.1, 0), v(12, 6)))).tobe(false);
    expect(b.distanceToPoint(v(5, 2))).tobe(0);
    expect(b.distanceToPoint(v(13, 8))).toSubequal(5, 1e-12);           // 3-4-5
    const c = b.clampPoint(v(-3, 9));
    expect(c.x).tobe(0); expect(c.y).tobe(4);
    const p = b.getParameter(v(2.5, 1));
    expect(p.x).tobe(0.25); expect(p.y).tobe(0.25);
})

await test('Box2: set operations and transforms', async () => {
    const a = new Box2(v(0, 0), v(4, 4)), b = new Box2(v(2, 1), v(6, 3));
    const i = a.clone().intersect(b);
    expect([i.min.x, i.min.y, i.max.x, i.max.y]).toEqual([2, 1, 4, 3]);
    const u = a.clone().union(b);
    expect([u.min.x, u.min.y, u.max.x, u.max.y]).toEqual([0, 0, 6, 4]);
    expect(a.clone().intersect(new Box2(v(10, 10), v(11, 11))).isEmpty()).tobe(true);
    const t = a.clone().translate(v(1, -1)).expandByScalar(1);
    expect([t.min.x, t.min.y, t.max.x, t.max.y]).toEqual([0, -2, 6, 4]);
    expect(a.clone().expandByVector(v(1, 2)).max.y).tobe(6);
    const c = new Box2().setFromCenterAndSize(v(5, 5), v(2, 4));
    expect([c.min.x, c.min.y, c.max.x, c.max.y]).toEqual([4, 3, 6, 7]);
    expect(new Box2().copy(c).equals(c)).tobe(true);
    expect(c.clone().min !== c.min).tobe(true);                          // deep clone
})

setTimeout(end, 500)
