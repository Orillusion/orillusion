import { CEventDispatcher } from '../event/CEventDispatcher';
import { ParserBase } from './parser/ParserBase';

/**
 * @internal
 * Load management classes
 * @group Loader
 */
export class LoaderManager extends CEventDispatcher {
    private static _instance: LoaderManager;
    private _maxRetry = 3;

    /**
     * Load multiple resources of the same type simultaneously
     * @param urls URL list
     * @param c Type of resource parser
     * @returns
     */
    public loadAll<T extends ParserBase>(urls: string[], c: { new(): T }): Promise<T[]> {
        return new Promise((succ, fail) => {
            let count = urls.length;
            let ret: T[] = [];
            urls.forEach((url, index) => {
                let parser = new c();
                this.load(url, c).then((data) => {
                    parser.parse(data);
                    ret.push(parser);
                    count--;
                    if (count === 0) {
                        succ(ret);
                    }
                });
            });
        });
    }

    public constructor() {
        super();
        if (LoaderManager._instance) {
            throw new Error('LoadManager is singleton class...');
        }
    }

    public static getInstance(): LoaderManager {
        return this._instance || (this._instance = new LoaderManager());
    }

    public loadUrls(urls: string[], c: { new(): ParserBase }): Promise<ParserBase[]> {
        return new Promise((succ, fail) => {
            let count = urls.length;
            let ret: ParserBase[] = [];
            urls.forEach((url, index) => {
                this.load(url, c).then((data) => {
                    ret.push(data);
                    count--;
                    if (count === 0) {
                        succ(ret);
                    }
                    if (count < 0) {
                        console.error(`loadUrls ${urls} error`);
                    }
                });
            });
        });
    }

    public get maxRetry(): number {
        return this._maxRetry;
    }

    public set maxRetry(value: number) {
        this._maxRetry = value;
    }

    // public set retry(value: number) {
    //   this._maxRetry = value;
    // }

    // public get retry():number {
    //   return this._maxRetry;
    // }

    public load<T extends ParserBase>(url: string, c: { new(): T }): Promise<T> {
        return new Promise((succ, fail) => {
            switch (c[`format`]) {
                case `bin`:
                    break;
                case `json`:
                    break;
                default:
                    break;
            }
        });
    }
}
