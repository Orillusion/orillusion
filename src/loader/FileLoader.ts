import { LoaderBase } from './LoaderBase';
import { LoaderFunctions } from './LoaderFunctions';
import { ParserBase } from './parser/ParserBase';
import { Ctor } from "../util/Global";

/**
 * @internal
 * @group Loader
 */
export class FileLoader extends LoaderBase {
    /**
     * Load the file from the URL
     * @param url file URL
     * @param c File parser
     * @param loaderFunctions loader callback
     * @see LoaderFunctions
     * @returns
     */
    public async load<T extends ParserBase>(url: string, c: Ctor<T>, loaderFunctions?: LoaderFunctions, userData?: any): Promise<T> {
        switch (c[`format`]) {
            case `bin`:
                {
                    return new Promise(async (succ, fail) => {
                        this.loadBinData(url, loaderFunctions).then(async (data) => {
                            let parser = new c();
                            parser.userData = userData;
                            parser.baseUrl = this.baseUrl;
                            parser.initUrl = url;
                            await parser.parseBuffer(data);
                            if (parser.verification()) {
                                succ(parser);
                            } else {
                                throw new Error('parser error');
                            }
                        }).catch((e) => {
                            fail(e);
                        })
                    });
                }
                break;
            case `json`:
                {
                    return new Promise((succ, fail) => {
                        this.loadJson(url, loaderFunctions)
                            .then(async (ret) => {
                                let parser = new c();
                                parser.userData = userData;
                                parser.baseUrl = this.baseUrl;
                                parser.initUrl = url;
                                parser.loaderFunctions = loaderFunctions;
                                await parser.parseJson(ret);
                                succ(parser);
                            })
                            .catch((e) => {
                                fail(e);
                            });
                    });
                }
                break;
            case `text`:
                {
                    return new Promise((succ, fail) => {
                        this.loadTxt(url, loaderFunctions)
                            .then(async (ret) => {
                                let parser = new c();
                                parser.userData = userData;
                                parser.baseUrl = this.baseUrl;
                                parser.initUrl = url;
                                parser.loaderFunctions = loaderFunctions;
                                if (!ret[`data`]) {
                                    fail(`text load is empty!`);
                                } else {
                                    await parser.parseString(ret[`data`]);
                                    succ(parser);
                                }
                            })
                            .catch((e) => {
                                fail(e);
                            });
                    });
                }
                break;
            default:
                break;
        }
    }
}
