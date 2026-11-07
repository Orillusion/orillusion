import {
    CEventDispatcher,
    Object3D,
    PointerEvent3D,
    Vector3,
    View3D,
} from '@orillusion/core';
import { Raycaster } from './Raycaster';
import type { RaycastHit } from './RaycastHit';

/**
 * Pointer-event bridge for the injectable scene raycaster.
 *
 * It mirrors the core `PickFire` event surface without requiring changes to
 * `@orillusion/core`: PICK_OVER / OUT / MOVE / DOWN / UP / CLICK events are
 * dispatched both by this controller and by the intersected Object3D.
 */
export class SceneRayPick extends CEventDispatcher {
    private readonly raycaster = new Raycaster();
    private lastFocus: Object3D = null;
    private lastDownTarget: Object3D = null;
    private started = false;
    private destroyed = false;

    constructor(private readonly view: View3D) {
        super();
    }

    /** Begin listening to the owning engine's pointer events. */
    public start(): this {
        if (this.destroyed) throw new Error('SceneRayPick has been destroyed');
        if (this.started) return this;
        const input = this.view.engine3D?.inputSystem;
        if (!input) throw new Error('SceneRayPick requires a started View3D');
        input.addEventListener(PointerEvent3D.POINTER_DOWN, this.onPointerDown, this);
        input.addEventListener(PointerEvent3D.POINTER_UP, this.onPointerUp, this);
        input.addEventListener(PointerEvent3D.POINTER_CLICK, this.onPointerClick, this);
        input.addEventListener(PointerEvent3D.POINTER_RIGHT_CLICK, this.onPointerClick, this);
        input.addEventListener(PointerEvent3D.POINTER_MOVE, this.onPointerMove, this);
        this.started = true;
        return this;
    }

    /** Stop listening while preserving registered PICK_* listeners. */
    public stop(): this {
        if (!this.started) return this;
        const input = this.view.engine3D?.inputSystem;
        input?.removeEventListener(PointerEvent3D.POINTER_DOWN, this.onPointerDown, this);
        input?.removeEventListener(PointerEvent3D.POINTER_UP, this.onPointerUp, this);
        input?.removeEventListener(PointerEvent3D.POINTER_CLICK, this.onPointerClick, this);
        input?.removeEventListener(PointerEvent3D.POINTER_RIGHT_CLICK, this.onPointerClick, this);
        input?.removeEventListener(PointerEvent3D.POINTER_MOVE, this.onPointerMove, this);
        this.started = false;
        this.lastFocus = null;
        this.lastDownTarget = null;
        return this;
    }

    /** Stop input listeners and release every registered PICK_* listener. */
    public destroy(): void {
        if (this.destroyed) return;
        this.stop();
        super.destroy();
        this.destroyed = true;
    }

    /** Return all intersections under the current pointer, nearest first. */
    public pick(): RaycastHit[] {
        const input = this.view.engine3D.inputSystem;
        this.raycaster.setFromCamera(input.mouseX, input.mouseY, this.view.camera);
        return this.raycaster.intersectScene(this.view.scene);
    }

    private isRayMode(): boolean {
        return (this.view.engine3D.setting.pick.mode as string) === 'ray';
    }

    private hitData(hit: RaycastHit): any {
        if (!hit) return null;
        const worldNormal = hit.worldNormal
            || (hit.normal ? this.raycaster.transformNormalToWorld(hit.object, hit.normal, new Vector3()) : Vector3.ZERO);
        return {
            worldPos: hit.point,
            worldNormal,
            meshID: hit.object.transform.worldMatrix.index,
            distance: hit.distance,
            object: hit.object,
            faceIndex: hit.faceIndex,
            face: hit.face,
            uv: hit.uv,
            uv1: hit.uv1,
            barycoord: hit.barycoord,
            normal: hit.normal,
        };
    }

    private emit(type: string, source: PointerEvent3D, hit: RaycastHit): void {
        if (!hit?.object) return;
        const event = new PointerEvent3D(type);
        Object.assign(event, source);
        event.type = type;
        event.target = hit.object;
        event.data = this.hitData(hit);
        this.dispatchEvent(event);
        if (hit.object.containEventListener(type)) hit.object.dispatchEvent(event);
    }

    private onPointerDown(event: PointerEvent3D): void {
        if (!this.isRayMode()) return;
        const hit = this.pick()[0];
        this.lastDownTarget = hit?.object || null;
        this.emit(PointerEvent3D.PICK_DOWN, event, hit);
    }

    private onPointerUp(event: PointerEvent3D): void {
        if (!this.isRayMode()) return;
        this.emit(PointerEvent3D.PICK_UP, event, this.pick()[0]);
    }

    private onPointerClick(event: PointerEvent3D): void {
        if (!this.isRayMode()) return;
        const hit = this.pick()[0];
        if (hit?.object === this.lastDownTarget) this.emit(PointerEvent3D.PICK_CLICK, event, hit);
        this.lastDownTarget = null;
    }

    private onPointerMove(event: PointerEvent3D): void {
        if (!this.isRayMode()) return;
        const hit = this.pick()[0];
        const target = hit?.object || null;
        this.emit(PointerEvent3D.PICK_MOVE, event, hit);

        if (target !== this.lastFocus) {
            if (this.lastFocus) {
                this.emit(PointerEvent3D.PICK_OUT, event, {
                    ...hit,
                    object: this.lastFocus,
                } as RaycastHit);
            }
            this.emit(PointerEvent3D.PICK_OVER, event, hit);
            this.lastFocus = target;
        }
    }
}
