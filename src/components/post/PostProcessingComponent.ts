import { PostBase } from "../../gfx/renderJob/post/PostBase";
import { Ctor } from "../../util/Global";
import { ComponentBase } from "../ComponentBase";

/**
 * Manages the post-processing effect stack for a {@link View3D}. Effects
 * are added by type and forwarded to the view's render job; enabling or
 * disabling the component activates or deactivates all registered effects.
 * @group Components
 */
export class PostProcessingComponent extends ComponentBase {
    private _postList: Map<any, PostBase>;


    /** Initialize the internal effect registry. */
    public init(param?: any): void {
        this._postList = new Map<any, PostBase>();
    }

    /** Lifecycle hook invoked when the component starts. */
    public start(): void {

    }

    /** Lifecycle hook invoked when the component stops. */
    public stop(): void {

    }

    /** Activate all registered post effects when the component is enabled. */
    public onEnable(): void {
        this.activePost();
    }

    /** Deactivate all registered post effects when the component is disabled. */
    public onDisable(): void {
        this.unActivePost();
    }

    /**
     * The render job of the view this component's scene is shown in, or null
     * while there is none yet (component added before `startRenderView`, or
     * the scene is not attached to a view).
     */
    private _renderJob() {
        const view = this.transform?.view3D;
        return view?.engine3D?.renderJobs?.get(view) ?? null;
    }

    private activePost() {
        const job = this._renderJob();
        // No job yet: keep the effects registered; `attachToRenderJob()` is
        // called by the engine when the view starts rendering.
        if (!job) return;
        this._postList.forEach((v) => {
            job.addPost(v);
        });
    }

    private unActivePost() {
        const job = this._renderJob();
        if (!job) return;
        this._postList.forEach((v) => {
            job.removePost(v);
        });
    }

    /**
     * @internal
     * Forward every registered effect to the view's render job. Invoked by
     * `Engine3D` right after the job is created, so effects added before
     * `startRenderView()` take effect instead of throwing.
     */
    public attachToRenderJob(): void {
        if (this._enable) this.activePost();
    }

    /**
     * Add a post-processing effect by its class. Returns the created
     * instance, or undefined if an effect of that type already exists.
     * @param c the post effect class to instantiate
     */
    public addPost<T extends PostBase>(c: Ctor<T>): T {
        if (this._postList.has(c)) return;
        let post = new c();
        this._postList.set(c, post);
        if (this._enable)
            this.activePost();
        return post;
    }

    /**
     * Remove a previously added post-processing effect by its class.
     * @param c the post effect class to remove
     */
    public removePost<T extends PostBase>(c: Ctor<T>) {
        if (!this._postList.has(c)) return;
        let post = this._postList.get(c);
        this._postList.delete(c);

        this._renderJob()?.removePost(post);
    }

    /**
     * Get a registered post-processing effect by its class.
     * @param c the post effect class to look up
     * @returns the effect instance, or null if not registered
     */
    public getPost<T extends PostBase>(c: Ctor<T>): T {
        if (!this._postList.has(c)) return null;
        return this._postList.get(c) as T;
    }
}