import { Engine3D } from "../../Engine3D";
import { PostBase } from "../../gfx/renderJob/post/PostBase";
import { Ctor } from "../../util/Global";
import { ComponentBase } from "../ComponentBase";

export class PostProcessingComponent extends ComponentBase {
    private _postList: Map<string, PostBase>;
    public init(param?: any): void {
        this._postList = new Map<string, PostBase>();
    }

    public start(): void {

    }

    public stop(): void {

    }

    public onEnable(): void {
        this.activePost();
    }

    public onDisable(): void {
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