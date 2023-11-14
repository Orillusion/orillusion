import { FXAAPost, webGPUContext } from "../..";
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
        if (this._postList.has(c.name)) return;
        if (!this._postList.has(FXAAPost.name)) {
            let post = new FXAAPost();
            this._postList.set(post.constructor.name, post);
            if (this._enable)
                this.activePost();
            if (c.name === FXAAPost.name) {
                return post as T;
            }
        }
        let post = new c();
        this._postList.set(c.name, post);
        if (this._enable)
            this.activePost();
        return post;
    }

    public removePost<T extends PostBase>(c: Ctor<T>) {
        if (!this._postList.has(c.name)) return;
        let post = this._postList.get(c.name);
        this._postList.delete(c.name);

        let view = this.transform.view3D;
        let job = Engine3D.getRenderJob(view);
        job.removePost(post);
    }

    public getPost<T extends PostBase>(c: Ctor<T>): T {
        if (!this._postList.has(c.name)) return null;
        return this._postList.get(c.name) as T;
    }
}