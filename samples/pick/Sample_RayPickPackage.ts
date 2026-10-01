import { GUIHelp } from "@orillusion/debug/GUIHelp";
import { GUIUtil } from "@samples/utils/GUIUtil";
import { createExampleScene } from "@samples/utils/ExampleScene";
import { MaterialStateComponent } from "@samples/pick/MaterialStateComponent";
import {
    Scene3D,
    Engine3D,
    Camera3D,
    RenderNode,
    MeshRenderer,
    ColliderComponent,
    PointerEvent3D,
    SphereGeometry,
    BoxGeometry,
    CylinderGeometry,
    TorusGeometry,
    PlaneGeometry,
    StripeGeometry,
    GeometryBase,
    InstancedMesh,
    Object3D,
    Object3DUtil,
    LitMaterial,
    UnLitMaterial,
    AnimationCurve,
    Keyframe,
    MathUtil,
    SpriteRenderer,
    BillboardComponent,
    BillboardType,
    BitmapTexture2D,
    BitmapTexture2DArray,
    VertexAttributeName,
    Color,
    Vector2,
    Vector3,
    Matrix4,
} from "@orillusion/core";
import { Graphic3D, Graphic3DMesh, Graphic3DMeshRenderer } from "@orillusion/graphic";
import { installGraphicRayPick, installRayPick, Raycaster, SceneRayPick } from "@orillusion/ray-pick";

/**
 * A unified view of a hit, fed either by the three.js style `Raycaster`
 * (RaycastHit, field `point`) or by PickFire events (pickResult, field
 * `worldPos`).
 */
interface HitDisplay {
    object: Object3D;
    distance: number;
    faceIndex: number;
    point: Vector3;
    uv?: Vector2;
    /** Normal in world space, suitable for debug drawing. */
    normal?: Vector3;
    barycoord?: Vector3;
}

/**
 * CPU ray picking demo (`setting.pick.mode = 'ray'`).
 *
 * Shows three.js style `Raycaster` picking over different primitive forms:
 * indexed geometry (sphere/box/cylinder/torus/plane), a raw non-indexed
 * triangle (no uv/normal attributes), an InstancedMesh, a double-sided box
 * (`cullMode = 'none'`), a StripeGeometry ribbon, a sprite, a GPU-instanced
 * Graphic3D mesh, and a gltf model. Only the first four primitives carry a
 * ColliderComponent, so switching the GUI to `bound` mode will stop
 * reporting the rest — `ray` mode needs no collider at all.
 *
 * Event data is three.js Intersection compatible: distance / worldPos /
 * faceIndex / uv / normal / barycoord / object (see RaycastHit).
 */
export class Sample_RayPickPackage {
    engine: Engine3D;
    scene: Scene3D;
    camera: Camera3D;
    g: Graphic3D;

    boxObj: Object3D;
    boxMaterial: LitMaterial;
    spriteObj: Object3D;
    spriteBillboard: BillboardComponent;
    pickRenderers: RenderNode[] = [];
    lastHit: HitDisplay = null;

    async run() {
        // pick mode can be pre-selected by the GUI (persisted in sessionStorage)
        let mode: 'ray' | 'bound' | 'pixel' = 'ray';
        try {
            mode = (sessionStorage.getItem('rayPickMode') as any) || 'ray';
        } catch { }

        // install the external ray-pick package before renderers are created
        installRayPick();
        installGraphicRayPick(Graphic3DMeshRenderer);

        // init Engine3D
        const engine = this.engine = await Engine3D.init({
            setting: {
                pick: {
                    enable: true,
                    mode: mode as any,
                },
            },
        });

        let exampleScene = createExampleScene(engine);
        this.scene = exampleScene.scene;
        this.camera = exampleScene.camera;

        // debug draw (hit point / normal)
        this.g = new Graphic3D();
        this.scene.addChild(this.g);

        engine.startRenderView(exampleScene.view);
        // dev does not recognize the external ray mode, so initialize core picking
        // explicitly to preserve the original GUI switch to bound/pixel modes.
        exampleScene.view.enablePick = true;

        GUIHelp.init();
        GUIUtil.renderDirLight(exampleScene.light, false);

        await this.initPickObjects();
        this.initGUI();

        // register pick events
        // In ray mode the external package supplies the same PICK_* event surface.
        let pickFire = mode === 'ray'
            ? new SceneRayPick(this.scene.view).start()
            : this.scene.view.pickFire;
        pickFire.addEventListener(PointerEvent3D.PICK_OVER, this.onPickOver, this);
        pickFire.addEventListener(PointerEvent3D.PICK_OUT, this.onPickOut, this);
        pickFire.addEventListener(PointerEvent3D.PICK_CLICK, this.onPickClick, this);
    }

    /**
     * Build StripeGeometry segment pairs (cross-sections) from a polyline,
     * following the official StripeGeometry convention: every pair is a
     * short segment spanning the ribbon width, so consecutive pairs form
     * the quad strip. The normal is derived from the local tangent, so the
     * ribbon stays perpendicular to the curve direction (a fixed offset
     * would twist on steep sections).
     * @param points polyline control points
     * @param halfWidth half of the ribbon width in world units
     * @returns segment pairs for {@link StripeGeometry}
     */
    private _ribbonSegments(points: Vector3[], halfWidth: number): [Vector3, Vector3][] {
        let segments: [Vector3, Vector3][] = [];
        for (let i = 0; i < points.length; i++) {
            let prev = points[Math.max(0, i - 1)];
            let next = points[Math.min(points.length - 1, i + 1)];
            let tangent = Vector3.HELP_1.set(next.x - prev.x, next.y - prev.y, 0).normalize();
            // 2D normal: (-tangent.y, tangent.x)
            let nx = -tangent.y * halfWidth;
            let ny = tangent.x * halfWidth;
            let p = points[i];
            segments.push([
                new Vector3(p.x + nx, p.y + ny, p.z),
                new Vector3(p.x - nx, p.y - ny, p.z),
            ]);
        }
        return segments;
    }

    /**
     * Procedural checkerboard texture (no asset files needed in a local
     * checkout): red/blue 8x8 cells plus a white center cross, so the
     * sprite / Graphic3D mesh texture mapping and picked UVs are visible.
     * Swap in `engine.res.loadTexture(...)` for a real asset when available.
     */
    private makePatternTexture(size: number = 64): BitmapTexture2D {
        let canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        let ctx = canvas.getContext('2d');
        let cell = size / 8;
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                ctx.fillStyle = (x + y) % 2 ? '#ff3333' : '#3333ff';
                ctx.fillRect(x * cell, y * cell, cell, cell);
            }
        }
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(2, size / 32);
        ctx.beginPath();
        ctx.moveTo(size / 2, 0);
        ctx.lineTo(size / 2, size);
        ctx.moveTo(0, size / 2);
        ctx.lineTo(size, size / 2);
        ctx.stroke();

        let tex = new BitmapTexture2D(true, this.engine.context3D);
        tex.source = canvas;
        tex.name = 'pattern';
        return tex;
    }

    private async initPickObjects() {
        let scene = this.scene;

        // a ground plane so every primitive stands on a visible surface
        let floor = Object3DUtil.GetSingleCube(150, 0.1, 150, 0.2, 0.2, 0.2);
        floor.name = 'Ground';
        floor.y = -4.5;
        scene.addChild(floor);

        // ---- front row (z = 14): indexed primitives, with ColliderComponent
        // for `bound` mode ----
        let x = -52.5;

        // sphere (indexed)
        {
            let sphere = new Object3D();
            sphere.name = 'Sphere';
            sphere.x = x;
            sphere.y = 4.5;
            sphere.z = 14;
            scene.addChild(sphere);

            let renderer = sphere.addComponent(MeshRenderer);
            renderer.geometry = new SphereGeometry(4.5, 20, 20);
            renderer.material = new LitMaterial();
            sphere.addComponent(ColliderComponent);
            sphere.addComponent(MaterialStateComponent);
            this.pickRenderers.push(renderer);
        }

        // box with double-sided material: `ray` mode follows material.cullMode
        x += 21;
        {
            this.boxObj = new Object3D();
            this.boxObj.name = 'Box';
            this.boxObj.x = x;
            this.boxObj.y = 4.5;
            this.boxObj.z = 14;
            scene.addChild(this.boxObj);

            let renderer = this.boxObj.addComponent(MeshRenderer);
            renderer.geometry = new BoxGeometry(9, 9, 9);
            renderer.material = new LitMaterial();
            this.boxMaterial = renderer.material as LitMaterial;
            this.boxMaterial.cullMode = 'none';
            this.boxObj.addComponent(ColliderComponent);
            this.boxObj.addComponent(MaterialStateComponent);
            this.pickRenderers.push(renderer);
        }

        // cylinder (indexed)
        x += 21;
        {
            let cylinder = new Object3D();
            cylinder.name = 'Cylinder';
            cylinder.x = x;
            cylinder.y = 4.5;
            cylinder.z = 14;
            scene.addChild(cylinder);

            let renderer = cylinder.addComponent(MeshRenderer);
            renderer.geometry = new CylinderGeometry(4, 4, 9, 16, 8);
            renderer.material = new LitMaterial();
            cylinder.addComponent(ColliderComponent);
            cylinder.addComponent(MaterialStateComponent);
            this.pickRenderers.push(renderer);
        }

        // torus (indexed)
        x += 21;
        {
            let torus = new Object3D();
            torus.name = 'Torus';
            torus.x = x;
            torus.y = 4.5;
            torus.z = 14;
            scene.addChild(torus);

            let renderer = torus.addComponent(MeshRenderer);
            renderer.geometry = new TorusGeometry(4, 1.5, 16, 32);
            renderer.material = new LitMaterial();
            torus.addComponent(ColliderComponent);
            torus.addComponent(MaterialStateComponent);
            this.pickRenderers.push(renderer);
        }

        // vertical plane (indexed, no collider)
        x += 21;
        {
            let plane = new Object3D();
            plane.name = 'Plane';
            plane.x = x;
            plane.y = 4.5;
            plane.z = 14;
            scene.addChild(plane);

            let renderer = plane.addComponent(MeshRenderer);
            let geometry = new PlaneGeometry(9, 9, 1, 1, Vector3.Z_AXIS);
            // Split the two triangles into separate material slots. Their
            // colors and cull modes make material-aware picking visible.
            geometry.subGeometries.length = 0;
            geometry.addSubGeometry({
                indexStart: 0, indexCount: 3, vertexStart: 0, vertexCount: 0,
                firstStart: 0, index: 0, topology: 0,
            });
            geometry.addSubGeometry({
                indexStart: 3, indexCount: 3, vertexStart: 0, vertexCount: 0,
                firstStart: 0, index: 0, topology: 0,
            });
            renderer.geometry = geometry;
            let leftMaterial = new LitMaterial();
            leftMaterial.baseColor = new Color(0.15, 0.55, 1, 1);
            leftMaterial.cullMode = 'back';
            let rightMaterial = new LitMaterial();
            rightMaterial.baseColor = new Color(1, 0.45, 0.15, 1);
            rightMaterial.cullMode = 'none';
            renderer.materials = [leftMaterial, rightMaterial];
            plane.addComponent(MaterialStateComponent);
            this.pickRenderers.push(renderer);
        }

        // ---- back row (z = -14): ray-mode only forms ----

        // raw non-indexed triangle (split attributes, no uv): raycaster
        // still reports the face with faceIndex/face.normal. rotationX = 90
        // tilts it so its +Y normal faces the (overhead) camera; the normal
        // attribute is required for LitMaterial to shade it.
        x = -42;
        {
            let triangle = new Object3D();
            triangle.name = 'RawTriangle';
            triangle.x = x;
            triangle.y = 0.5;
            triangle.z = -14;
            triangle.rotationX = 90;
            scene.addChild(triangle);

            let renderer = triangle.addComponent(MeshRenderer);
            let geometry = new GeometryBase();
            geometry.setVertexs(new Float32Array([
                -6, 0, 6,
                6, 0, 6,
                -6, 0, -6,
            ]));
            geometry.setAttribute(VertexAttributeName.normal, new Float32Array([
                0, 1, 0,
                0, 1, 0,
                0, 1, 0,
            ]));
            // non-indexed triangle: still provide the indices attribute
            // and a subGeometry (engine convention, see TriGeometry) so the
            // GPU upload/render paths have valid buffers to fill
            geometry.setIndices(new Uint32Array([0, 1, 2]));
            geometry.addSubGeometry({
                indexStart: 0,
                indexCount: 3,
                vertexStart: 0,
                vertexCount: 0,
                firstStart: 0,
                index: 0,
                topology: 0
            });
            renderer.geometry = geometry;
            renderer.material = new LitMaterial();
            triangle.addComponent(MaterialStateComponent);
            this.pickRenderers.push(renderer);
        }

        // InstancedMesh: three instances of one box, each pickable by name
        x += 21;
        {
            let inst = new InstancedMesh(new BoxGeometry(3, 3, 3), new LitMaterial(), 3);
            inst.name = 'InstancedMesh';
            inst.x = x;
            inst.y = 1.5;
            inst.z = -14;
            scene.addChild(inst);

            let matrix = new Matrix4();
            for (let i = 0; i < 3; i++) {
                matrix.identity().translate(new Vector3((i - 1) * 6, 0, 0));
                inst.setMatrixAt(i, matrix);
            }
            for (let i = 0; i < inst.entityChildren.length; i++) {
                let child = inst.entityChildren[i] as Object3D;
                child.name = `Instance-${i}`;
                // each instance gets its own material clone: the hover
                // highlight animates material.emissiveIntensity, and a shared
                // material would make the instances' animations fight each
                // other (flicker when moving between instances)
                let renderer = child.getComponent(MeshRenderer);
                renderer.material = (renderer.material as LitMaterial).clone();
                child.addComponent(MaterialStateComponent);
                this.pickRenderers.push(renderer);
            }
        }

        // ribbon (line-like) geometry — StripeGeometry is a MeshRenderer
        // mesh, so `ray` mode picks it like any other triangle geometry
        // (the engine has no dedicated Line renderer)
        x += 21;
        {
            let stripe = new Object3D();
            stripe.name = 'Stripe';
            stripe.x = x;
            stripe.y = 3;
            stripe.z = -14;
            scene.addChild(stripe);

            let segments: [Vector3, Vector3][] = [];
            for (let i = 0; i < 9; i++) {
                let t = i / 8;
                let cx = -8 + t * 16;
                let cy = Math.sin(t * Math.PI * 2) * 3;
                segments.push([new Vector3(cx, cy, 0), new Vector3(cx, cy + 0.8, 0)]);
            }
            let renderer = stripe.addComponent(MeshRenderer);
            renderer.geometry = new StripeGeometry(segments);
            renderer.material = new LitMaterial();
            stripe.addComponent(MaterialStateComponent);
            this.pickRenderers.push(renderer);
        }

        // sprite (billboard quad): SpriteRenderer.raycast intersects the
        // world quad (size/pivot applied in the vertex shader, orientation
        // from the BillboardComponent). Built like Sample_Basic: a
        // BitmapTexture2D + SpriteRenderer + BillboardComponent.
        x += 21;
        {
            this.spriteObj = new Object3D();
            this.spriteObj.name = 'Sprite';
            this.spriteObj.x = x;
            this.spriteObj.y = 6;
            this.spriteObj.z = -14;
            scene.addChild(this.spriteObj);

            this.spriteBillboard = this.spriteObj.addComponent(BillboardComponent);
            this.spriteBillboard.type = BillboardType.BillboardY;
            let sprite = this.spriteObj.addComponent(SpriteRenderer);
            sprite.setTexture(this.makePatternTexture());
            sprite.size = new Vector2(6, 4);
            this.pickRenderers.push(sprite);
        }

        // Graphic3D mesh (GPU-instanced): Graphic3DMeshRenderer.raycast
        // intersects the source geometry per instance, so hit points land on
        // the instances' real world positions and the event target is the
        // instance object
        x += 21;
        {
            let tex = this.makePatternTexture();
            let texArray = new BitmapTexture2DArray(tex.width, tex.height, 1, this.engine.context3D);
            texArray.setTextures([tex]);
            let mr = Graphic3DMesh.draw(this.scene, new PlaneGeometry(3, 3, 1, 1, Vector3.Z_AXIS), texArray, 1);
            mr.material.cullMode = 'none';
            let inst = mr.object3Ds[0];
            inst.name = 'GraphicMesh';
            inst.x = x;
            inst.y = 5;
            inst.z = -14;
            this.pickRenderers.push(mr);
        }

        // ---- third row (z = -38): line forms ported from the official
        // Graphic examples. `Graphic3D.drawLines` runs on GPU compute and
        // cannot be CPU ray-picked, so each shape is rebuilt as a pickable
        // MeshRenderer form using the same control points / sampled curve.
        // The row sits on the left half of the ground plane (x restarts at
        // -52.5), clear of the front/back primitive rows.
        x = -52.5;

        // DrawMeshLine style (Sample_MeshLines): polyline from sphere
        // endpoints + cylinder segments, exactly the official setup
        {
            let obj = new Object3D();
            obj.name = 'MeshLine';
            obj.x = x;
            obj.y = 0.5;
            obj.z = -38;
            // lay the line flat on the ground, like the official Shape3D
            // examples spread their 2D paths over the floor plane
            obj.rotationX = 90;
            scene.addChild(obj);

            let lineWidth = 0.3;
            let pointGeom = new SphereGeometry(0.5, 16, 16);
            let segGeom = new CylinderGeometry(0.5, 0.5, 1, 16, 16);
            let mat = new UnLitMaterial();
            mat.baseColor = new Color(1, 0.2, 0.2, 1);
            let points = [
                new Vector3(-8, 0, 0),
                new Vector3(-3, 5, 0),
                new Vector3(3, 2, 0),
                new Vector3(8, 6, 0),
            ];
            for (let i = 0; i < points.length; i++) {
                // sphere endpoint (MeshLines.drawPoint)
                let point = new Object3D();
                point.name = `MeshLine-point-${i}`;
                let pr = point.addComponent(MeshRenderer);
                pr.geometry = pointGeom;
                pr.material = mat;
                point.scaleX = point.scaleY = point.scaleZ = lineWidth;
                point.localPosition = points[i];
                obj.addChild(point);
                this.pickRenderers.push(pr);
                if (i === 0) continue;
                // cylinder segment between the previous and this point
                // (MeshLines.drawLine)
                let prev = points[i - 1];
                let cur = points[i];
                let line = new Object3D();
                line.name = `MeshLine-seg-${i}`;
                let lr = line.addComponent(MeshRenderer);
                lr.geometry = segGeom;
                lr.material = mat;
                let dist = Vector3.distance(prev, cur);
                line.scaleX = line.scaleZ = lineWidth;
                line.scaleY = dist;
                line.localPosition = prev.clone().add(cur).multiplyScalar(0.5);
                let dir = Vector3.HELP_1.set(cur.x - prev.x, cur.y - prev.y, cur.z - prev.z).normalize();
                let rot = MathUtil.fromToRotation(Vector3.Y_AXIS, dir);
                if (!Number.isNaN(rot.x) && !Number.isNaN(rot.y) && !Number.isNaN(rot.z)) {
                    line.transform.localRotQuat = rot;
                }
                obj.addChild(line);
                this.pickRenderers.push(lr);
            }
        }

        // GraphicLine style (Sample_GraphicLine): AnimationCurve sampled to
        // a ribbon, same keyframes as the official example
        x += 21;
        {
            let obj = new Object3D();
            obj.name = 'GraphicLine';
            obj.x = x;
            obj.y = 0.5;
            obj.z = -38;
            // lay the curve flat on the ground (official Shape3D spreads its
            // 2D paths over the floor plane)
            obj.rotationX = 90;
            scene.addChild(obj);

            let animCurve = new AnimationCurve();
            animCurve.addKeyFrame(new Keyframe(0, 0.5));
            animCurve.addKeyFrame(new Keyframe(0.15, -0.2));
            animCurve.addKeyFrame(new Keyframe(0.22, 0.4));
            animCurve.addKeyFrame(new Keyframe(0.34, 0.2));
            animCurve.addKeyFrame(new Keyframe(0.65, -0.2));
            animCurve.addKeyFrame(new Keyframe(1, 0.9));
            let points: Vector3[] = [];
            for (let i = 0; i < 60; i++) {
                let t = i / (60 - 1);
                points.push(new Vector3(t * 16 - 8, animCurve.getValue(t) * 8, 0));
            }
            let renderer = obj.addComponent(MeshRenderer);
            renderer.geometry = new StripeGeometry(this._ribbonSegments(points, 0.25));
            renderer.material = new LitMaterial();
            obj.addComponent(MaterialStateComponent);
            this.pickRenderers.push(renderer);
        }

        // Shape3D / Shape3DPath style (Sample_Shape3DPath2D): the official
        // path2D outline (polyline + quadratic curve + ellipse + roundRect)
        // rebuilt as pickable ribbons — one renderer per sub-path, like the
        // official moveTo breaks (a single ribbon would add stray cross
        // segments between the disconnected sub-paths)
        x += 21;
        {
            let obj = new Object3D();
            obj.name = 'Shape3D';
            obj.x = x;
            obj.y = 0.5;
            obj.z = -38;
            // lay the 2D path outline flat on the ground, matching the
            // official Shape3D floor layout
            obj.rotationX = 90;
            scene.addChild(obj);

            let addSubPath = (name: string, pts: Vector3[]) => {
                let sub = new Object3D();
                sub.name = `${obj.name}-${name}`;
                obj.addChild(sub);
                let renderer = sub.addComponent(MeshRenderer);
                renderer.geometry = new StripeGeometry(this._ribbonSegments(pts, 0.25));
                renderer.material = new LitMaterial();
                sub.addComponent(MaterialStateComponent);
                this.pickRenderers.push(renderer);
            };
            // polyline (moveTo/lineTo)
            addSubPath('poly', [
                new Vector3(-10, -4, 0),
                new Vector3(-4, 2, 0),
                new Vector3(2, -2, 0),
                new Vector3(8, 4, 0),
            ]);
            // quadraticCurveTo sampled
            let qpts: Vector3[] = [];
            for (let i = 0; i <= 20; i++) {
                let t = i / 20;
                let mt = 1 - t;
                qpts.push(new Vector3(
                    mt * mt * -10 + 2 * mt * t * -2 + t * t * 12,
                    mt * mt * 6 + 2 * mt * t * 12 + t * t * -2,
                    0,
                ));
            }
            addSubPath('quad', qpts);
            // ellipse sampled
            let epts: Vector3[] = [];
            for (let i = 0; i <= 40; i++) {
                let a = (i / 40) * Math.PI * 2;
                epts.push(new Vector3(Math.cos(a) * 6, Math.sin(a) * 3, 0));
            }
            addSubPath('ellipse', epts);
            // roundRect outline
            addSubPath('roundRect', [
                new Vector3(8, -6, 0),
                new Vector3(16, -6, 0),
                new Vector3(16, 6, 0),
                new Vector3(8, 6, 0),
                new Vector3(8, -6, 0),
            ]);
        }

        // GraphicMesh / GraphicMesh2 style (Sample_GraphicMesh_0/1):
        // GPU-instanced quads — Graphic3DMeshRenderer.raycast already
        // intersects the source geometry per instance
        x += 21;
        {
            let tex = this.makePatternTexture();
            let texArray = new BitmapTexture2DArray(tex.width, tex.height, 1, this.engine.context3D);
            texArray.setTextures([tex]);
            let mr = Graphic3DMesh.draw(this.scene, new PlaneGeometry(2, 2, 1, 1, Vector3.Z_AXIS), texArray, 4);
            mr.material.cullMode = 'none';
            for (let i = 0; i < mr.object3Ds.length; i++) {
                let inst = mr.object3Ds[i];
                inst.name = `GraphicMesh-${i}`;
                inst.x = x + (i - 1.5) * 5;
                inst.y = 5;
                inst.z = -38;
            }
            this.pickRenderers.push(mr);
        }

        // gltf models (assets may be absent / remote in a local checkout —
        // tolerate load failures)
        try {
            let model = await this.engine.res.loadGltf('gltfs/wukong/wukong.gltf');
            model.name = 'wukong';
            model.x = -63;
            model.y = 4;
            model.z = 55;
            model.scaleX = model.scaleY = model.scaleZ = 6;
            scene.addChild(model);
            model.forChild((node) => {
                if (node.hasComponent(MeshRenderer)) {
                    node.addComponent(MaterialStateComponent);
                }
            });
        } catch (e) {
            console.warn('Sample_RayPickPackage: wukong gltf unavailable, skipping:', e);
        }

        // a large CDN scene (buildings + characters) — good stress test for
        // `ray` picking over many meshes; the raw model spans ~900 units, so
        // it is scaled down (0.04 → ~36 units) and tucked into the left rear
        // corner of the ground plane, clear of the third-row lines (z=-38)
        try {
            let model = await this.engine.res.loadGltf('https://cdn.orillusion.com/gltfs/glb/BuildingWithCharacters/scene.glb');
            model.name = 'Building';
            model.x = -57;
            model.y = 0;
            model.z = -58;
            model.scaleX = model.scaleY = model.scaleZ = 0.04;
            scene.addChild(model);
            model.forChild((node) => {
                if (node.hasComponent(MeshRenderer)) {
                    node.addComponent(MaterialStateComponent);
                }
            });
        } catch (e) {
            console.warn('Sample_RayPickPackage: building gltf unavailable, skipping:', e);
        }
    }

    // ------------------------------------------------------------------
    // GUI
    // ------------------------------------------------------------------

    private initGUI() {
        // live hit info: getters bound to this.lastHit, shown read-only by
        // dat.gui (getter-only properties) and polled via .listen()
        let guiInfo: any = {};
        let keys = ['mode', 'object', 'distance', 'faceIndex', 'uv', 'worldPos', 'normal', 'barycoord'];
        Object.defineProperty(guiInfo, 'mode', {
            enumerable: true,
            get: () => this.engine.setting.pick.mode,
        });
        Object.defineProperty(guiInfo, 'object', {
            enumerable: true,
            get: () => this.lastHit ? this.lastHit.object.name : '-',
        });
        Object.defineProperty(guiInfo, 'distance', {
            enumerable: true,
            get: () => this.lastHit ? this.lastHit.distance.toFixed(3) : '-',
        });
        Object.defineProperty(guiInfo, 'faceIndex', {
            enumerable: true,
            get: () => this.lastHit ? this.lastHit.faceIndex : '-',
        });
        Object.defineProperty(guiInfo, 'uv', {
            enumerable: true,
            get: () => {
                if (!this.lastHit || !this.lastHit.uv) return 'none';
                return `(${this.lastHit.uv.x.toFixed(3)}, ${this.lastHit.uv.y.toFixed(3)})`;
            },
        });
        Object.defineProperty(guiInfo, 'worldPos', {
            enumerable: true,
            get: () => {
                if (!this.lastHit) return '-';
                let p = this.lastHit.point;
                return `(${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)})`;
            },
        });
        Object.defineProperty(guiInfo, 'normal', {
            enumerable: true,
            get: () => {
                if (!this.lastHit || !this.lastHit.normal) return 'none';
                let n = this.lastHit.normal;
                return `(${n.x.toFixed(2)}, ${n.y.toFixed(2)}, ${n.z.toFixed(2)})`;
            },
        });
        Object.defineProperty(guiInfo, 'barycoord', {
            enumerable: true,
            get: () => {
                if (!this.lastHit || !this.lastHit.barycoord) return '-';
                let b = this.lastHit.barycoord;
                return `(${b.x.toFixed(3)}, ${b.y.toFixed(3)}, ${b.z.toFixed(3)})`;
            },
        });

        let refreshInfo = () => {
            for (let key of keys) {
                let ctrl = (this as any)[`_${key}Ctrl`];
                if (ctrl) ctrl.updateDisplay();
            }
        };
        this._refreshInfo = refreshInfo;

        GUIHelp.addFolder('Pick');
        let modeState = {
            mode: this.engine.setting.pick.mode,
        };
        GUIHelp.add(modeState, 'mode', ['ray', 'bound', 'pixel']).onChange((v: string) => {
            if (v === 'pixel') {
                // pixel picking needs a GPU pick pass created at startup —
                // switch by reloading with the mode persisted
                try { sessionStorage.setItem('rayPickMode', v); } catch { }
                location.reload();
                return;
            }
            (this.engine.setting.pick.mode as any) = v;
            refreshInfo();
        });
        GUIHelp.addButton('Raycast at screen center', () => {
            this.raycastAtCenter();
        });
        GUIHelp.addButton('Clear debug draw', () => {
            this.g.Clear('hitPoint');
            this.g.Clear('hitNormal');
        });
        GUIHelp.endFolder();

        GUIHelp.addFolder('Pick Info');
        for (let key of keys) {
            (this as any)[`_${key}Ctrl`] = GUIHelp.add(guiInfo, key).listen();
        }
        GUIHelp.endFolder();

        GUIHelp.addFolder('Primitives');
        for (let renderer of this.pickRenderers) {
            GUIHelp.add(renderer, 'enable');
        }
        GUIHelp.addButton('Re-enable all', () => {
            for (let renderer of this.pickRenderers) {
                renderer.enable = true;
            }
        });
        GUIHelp.endFolder();

        GUIHelp.addFolder('Box cullMode');
        GUIHelp.add({ cullMode: this.boxMaterial.cullMode }, 'cullMode', ['back', 'none', 'front']).onChange((v: string) => {
            this.boxMaterial.cullMode = v as GPUCullMode;
        });
        GUIHelp.endFolder();

        // sprite label-style controls, following the official Label example
        // (state object + explicit `size` updates in onChange): billboard
        // orientation, world-unit width/height, cornerRadius and the
        // distance-invariant flag. The picked shape follows the billboard
        // since SpriteRenderer.raycast uses the world matrix.
        GUIHelp.addFolder('Sprite');
        let sprite = this.spriteObj.getComponent(SpriteRenderer);
        let spriteState = {
            width: sprite.size.x,
            height: sprite.size.y,
            cornerRadius: sprite.cornerRadius,
            distanceInvariant: sprite.distanceInvariantSize,
            billboard: this.spriteBillboard.type,
        };
        GUIHelp.add(spriteState, 'width', 0.5, 12, 0.1).onChange((v: number) => {
            sprite.size = new Vector2(v, spriteState.height);
        });
        GUIHelp.add(spriteState, 'height', 0.5, 12, 0.1).onChange((v: number) => {
            sprite.size = new Vector2(spriteState.width, v);
        });
        GUIHelp.add(spriteState, 'cornerRadius', 0, 2, 0.05).onChange((v: number) => {
            sprite.cornerRadius = v;
        });
        GUIHelp.add(spriteState, 'distanceInvariant').onChange((v: boolean) => {
            sprite.distanceInvariantSize = v;
        });
        GUIHelp.add(spriteState, 'billboard', {
            None: BillboardType.None,
            'Billboard Y': BillboardType.BillboardY,
            'Billboard XYZ': BillboardType.BillboardXYZ,
        }).onChange((v: any) => {
            this.spriteBillboard.type = Number(v) as BillboardType;
        });
        GUIHelp.endFolder();

        GUIUtil.renderTransform(this.boxObj.transform, false, 'Box Transform', 50);
    }

    private _refreshInfo: () => void;

    /**
     * Manual three.js style Raycaster usage: cast from the camera through the
     * screen center and report the nearest hit (hits are sorted by distance).
     */
    private raycastAtCenter() {
        let canvas = this.engine.inputSystem.canvas;
        let raycaster = new Raycaster();
        raycaster.setFromCamera(canvas.clientWidth / 2, canvas.clientHeight / 2, this.camera);
        let hits = raycaster.intersectObject(this.scene, true);
        let hit = hits[0];
        this.setLastHit(hit ? { ...hit, normal: hit.worldNormal || hit.normal } : null);
    }

    // ------------------------------------------------------------------
    // pick events
    // ------------------------------------------------------------------

    private onPickOver(e: PointerEvent3D) {
        let obj = e.target;
        if (obj) {
            let msc = obj.getComponent(MaterialStateComponent);
            msc?.changeColor(new Color(1, 0.64, 0.8, 1.5), 100);
        }
    }

    private onPickOut(e: PointerEvent3D) {
        let obj = e.target;
        if (obj) {
            let msc = obj.getComponent(MaterialStateComponent);
            msc?.changeColor(new Color(0, 0, 0, 0), 120);
        }
    }

    private onPickClick(e: PointerEvent3D) {
        let obj = e.target;
        if (obj) {
            let msc = obj.getComponent(MaterialStateComponent);
            msc?.changeColor(new Color(1.2, 0, 0.5, 1), 120);
        }
        this.setLastHit(this.toHit(e.data));
    }

    /** pickResult (event data) → HitDisplay */
    private toHit(data: any): HitDisplay {
        if (!data || !data.object) return null;
        return {
            object: data.object,
            distance: data.distance,
            faceIndex: data.faceIndex,
            point: data.worldPos,
            uv: data.uv,
            normal: data.worldNormal || data.normal,
            barycoord: data.barycoord,
        };
    }

    private setLastHit(hit: HitDisplay) {
        this.lastHit = hit;
        if (!hit) {
            this._refreshInfo();
            return;
        }
        // draw the hit point and the interpolated normal
        let p = hit.point;
        let s = 0.8;
        this.g.drawLines('hitPoint', [
            p.clone().addScaledVector(new Vector3(1, 0, 0), s),
            p.clone().addScaledVector(new Vector3(-1, 0, 0), s),
            p.clone().addScaledVector(new Vector3(0, 1, 0), s),
            p.clone().addScaledVector(new Vector3(0, -1, 0), s),
            p.clone().addScaledVector(new Vector3(0, 0, 1), s),
            p.clone().addScaledVector(new Vector3(0, 0, -1), s),
        ], new Color(1, 1, 0));
        if (hit.normal) {
            this.g.drawLines('hitNormal', [p.clone(), p.clone().addScaledVector(hit.normal, 3)], Color.COLOR_RED);
        }
        this._refreshInfo();
    }
}
