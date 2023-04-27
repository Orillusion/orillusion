import { Ctor, Engine3D } from "../../..";
import { PostBase } from "../../gfx/renderJob/post/PostBase";
import { ComponentBase } from "../ComponentBase";

export class PostProcessingComponent extends ComponentBase {
    private _postList: Map<string, PostBase>;
    protected init(param?: any): void {
        this._postList = new Map<string, PostBase>();
    }

    protected start(): void {

    }

    protected stop(): void {

    }

    protected onEnable(): void {
        this.activePost();
    }

    protected onDisable(): void {
        this.unActivePost();
    }

    private activePost() {
        let view = this.transform.view3D;
        let job = Engine3D.getRenderJob(view);
        this._postList.forEach((v) => {
            job.addPost(v);
        });
    }

    private unActivePost() {
        let view = this.transform.view3D;
        let job = Engine3D.getRenderJob(view);
        this._postList.forEach((v) => {
            job.removePost(v);
        });
    }

    public addPost<T extends PostBase>(c: Ctor<T>): T {
        if (this._postList.has(c.prototype)) return;
        let post = new c();
        this._postList.set(c.prototype, post);
        if (this._enable)
            this.activePost();
        // post.onAttach(this.transform.view3D);
        // Engine3D.getRenderJob(this.transform.view3D).addPost(post);
        return post;
    }

    public removePost<T extends PostBase>(c: Ctor<T>) {
        if (!this._postList.has(c.prototype)) return;
        let post = this._postList.get(c.prototype);
        this._postList.delete(c.prototype);

        let view = this.transform.view3D;
        let job = Engine3D.getRenderJob(view);
        job.removePost(post);
    }

    public getPost<T extends PostBase>(c: Ctor<T>): T {
        if (!this._postList.has(c.prototype)) return null;
        return this._postList.get(c.prototype) as T;
    }
}