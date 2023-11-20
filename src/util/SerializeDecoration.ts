
export type SerializeTag = null | 'self' | 'non';

export function NonSerialize(cls, key): any {
    let dic = cls['__NonSerialize__'];
    if (!dic) {
        dic = cls['__NonSerialize__'] = {};
        dic['__NonSerialize__'] = true;
    }

    dic[key] = true;
}

export function IsNonSerialize<T extends object>(instance: T, key: string): boolean {
    let noSerializeDic;
    while (instance) {
        instance = instance['__proto__'];
        if (instance) noSerializeDic = instance['__NonSerialize__'];
        if (noSerializeDic) break;
    }
    return noSerializeDic && noSerializeDic[key];
}


export function EditorInspector(cls, key, p1?, p2?, p3?): any {
    let dic: Map<string, any> = cls['__EditorInspector__'];
    if (!dic) {
        dic = cls['__EditorInspector__'] = new Map<string, any>();
    }
    let property = dic.get(cls.constructor.name);
    if (!property) {
        property = new Map<string, any>();
        dic.set(cls.constructor.name, property);
    }
    property.set(key, { p1, p2, p3 });
}

export function IsEditorInspector<T extends object>(instance: T): Map<string, any> {
    let propertyDic: Map<string, any>;
    let ins = instance;
    let list = []
    while (ins) {
        if (list.indexOf(ins.constructor.name) != -1) {
            ins = ins['__proto__'];
            continue;
        }
        list.push(ins.constructor.name);
        ins = ins['__proto__'];
    }
    list = list.reverse();

    ins = instance
    while (ins) {
        ins = ins['__proto__'];
        if (ins) {
            propertyDic = ins['__EditorInspector__'];
        }
        if (propertyDic) break;
    }

    let final = new Map<string, any>();
    if (propertyDic) {
        for (let i = 0; i < list.length; i++) {
            const c_name = list[i];
            let dic = propertyDic.get(c_name);
            if (dic) {
                dic.forEach((v, k) => {
                    final.set(k, v);
                });
            }
        }
    }
    return final;
}







export function RegisterComponent(cls, key, p1?, p2?, p3?): any {
    let dic: { [name: string]: any } = window['__Component__'];
    if (!dic) {
        dic = window['__Component__'] = {};
    }
    dic[key] = cls;
}

export function GetComponentClass(name: string) {
    let coms = window['__Component__'];
    if (coms[name]) {
        return coms[name];
    }
    return null;
}

export function RegisterShader(cls, key, p1?, p2?, p3?): any {
    let dic: { [name: string]: any } = window['__shader__'];
    if (!dic) {
        dic = window['__shader__'] = {};
    }
    dic[key] = cls;
}

export function GetShader(name: string) {
    let coms = window['__shader__'];
    if (coms[name]) {
        return coms[name];
    }
    return null;
}