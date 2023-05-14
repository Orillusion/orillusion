import { GUI } from './dat.gui.module.js'

/**
 * @internal
 */
class _GUIHelp {
    public debug: boolean = false;
    public data: any;
    public gui: GUI;
    public bind: { [property: string]: any };

    private _current: GUI;
    private _nullBind: any = {};

    constructor() {
        this.data = {};
        this.bind = {};
        this._nullBind = {};
        this._nullBind.onChange = () => { };
    }

    init(zIndex: number = 10) {
        this.debug = true;
        this.gui = new GUI();
        this.gui.domElement.style.zIndex = `${zIndex}`;
        this.gui.domElement.parentElement.style.zIndex = `${zIndex}`;
        this.addFolder('Orillusion');
    }

    addCustom(label: string, obj, property: string, c?: number, d?: number, e?: number) {
        if (!this.debug)
            return this._nullBind;
        let dgui = this._current ? this._current : this.gui;

        let tobj = {
            [label] : obj[property]
        }
        dgui.add(tobj, label, c, d, e).onChange((v) => {
            obj[property] = v;
        })
    }

    add(a, b?, c?, d?, e?) {
        if (!this.debug)
            return this._nullBind;
        let dgui = this._current ? this._current : this.gui;
        return dgui.add(a, b, c, d, e);
    }

    addLabel(label: string) {
        if (!this.debug)
            return this._nullBind;
        GUIHelp.add({ label: label }, 'label');
    }

    addColor(target: any, key: string) {
        if (!this.debug)
            return this._nullBind;
        let dgui = this._current ? this._current : this.gui;
        // dgui.addFolder(key);
        let controller = dgui.addColor(target[key], 'rgba').name(key);
        controller.onChange((val) => {
            console.log(val);
            let node = target[key];
            node['rgba'] = val;
            target[key] = node;
        });
        return controller;
    }
    addButton(label: string, fun: Function) {
        if (!this.debug)
            return this._nullBind;
        var controls = new (function () {
            this[label] = fun;
        })();
        let dgui = this._current ? this._current : this.gui;
        dgui.add(controls, label);
    }

    open() {
        if (!this.debug)
            return this._nullBind;
        let dgui = this._current ? this._current : this.gui;
        dgui.open();
    }

    close() {
        if (!this.debug)
            return this._nullBind;
        let dgui = this._current ? this._current : this.gui;
        dgui.close();
    }

    public folders: { [key: string]: GUI } = {};
    addFolder(label: string) {
        if (!this.debug)
            return this._nullBind;
        let folder = this.folders[label];
        if (!folder) {
            this._current = this.gui.addFolder(label);
            this.folders[label] = this._current;
        } else {
            this._current = this.folders[label];
        }
        return this._current;
    }

    removeFolder(label: string) {
        if (!this.debug)
            return this._nullBind;
        let folder = this.folders[label];
        if (folder) {
            this.gui.removeFolder(folder);
            this._current = null;
            delete this.folders[label];
        }
    }

    endFolder() {
        if (!this.debug)
            return this._nullBind;
        this._current = null;
    }

    _creatPanel() {
        let gui = new GUI();
        gui.domElement.style.zIndex = `${10}`;
        gui.domElement.parentElement.style.zIndex = `${10}`;
        return gui;
    }

    _add(gui: GUI, a, b?, c?, d?, e?) {
        return gui.add(a, b, c, d, e);
    }

    _addLabel(gui: GUI, label: string) {
        GUIHelp._add(gui, { label: label }, 'label');
    }

    _addButton(gui: GUI, label: string, fun: Function) {
        var controls = new (function () {
            this[label] = fun;
        })();
        gui.add(controls, label);
    }

    _addColor(gui: GUI, target: any, label: string) {
        return gui.addColor(target[label], "rgb").name(label);
    }

    _addFolder(gui: GUI, label: string) {
        if (gui['Folder'] == null) {
            gui['Folder'] = {};
        }
        let folder = gui.addFolder(label);
        gui['Folder'][label] = folder;
        return folder;
    }

    _removeFolder(gui: GUI, label: string) {
        if (gui['Folder'] && gui['Folder'][label]) {
            gui.removeFolder(gui['Folder'][label]);
        }
    }
}
/**
 * @internal
 */
export let GUIHelp = new _GUIHelp();
