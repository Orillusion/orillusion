import { FXAAPost, webGPUContext } from "../..";
import { Engine3D } from "../../Engine3D";
import { PostBase } from "../../gfx/renderJob/post/PostBase";
import { Ctor } from "../../util/Global";
import { ComponentBase } from "../ComponentBase";

export class PostProcessingComponent extends ComponentBase {
    private _postList: Map<any, PostBase>;


    public init(param?: any): void {
        this._postList = new Map<any, PostBase>();
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
        if (this._postList.has(c)) return;
        let post = new c();
        this._postList.set(c, post);
        if (this._enable)
            this.activePost();
        return post;
    }

    public removePost<T extends PostBase>(c: Ctor<T>) {
        if (!this._postList.has(c)) return;
        let post = this._postList.get(c);
        this._postList.delete(c);

        let view = this.transform.view3D;
        let job = Engine3D.getRenderJob(view);
        job.removePost(post);
    }

    public getPost<T extends PostBase>(c: Ctor<T>): T {
        if (!this._postList.has(c)) return null;
        return this._postList.get(c) as T;
    }
}