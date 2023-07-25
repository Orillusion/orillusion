export class PropertyAnimTag {
    transform?: boolean;
    quaternion?: boolean;
    materialColor?: boolean;
}

/**
 * @internal
 * @group Animation
 */
export class PropertyHelp {

    static Property: any = {
        'm_LocalPosition.x': 'localPosition.x',
        'm_LocalPosition.y': 'localPosition.y',
        'm_LocalPosition.z': 'localPosition.z',

        'm_LocalRotation.x': 'localQuaternion.x',
        'm_LocalRotation.y': 'localQuaternion.y',
        'm_LocalRotation.z': 'localQuaternion.z',
        'm_LocalRotation.w': 'localQuaternion.w',

        'localEulerAnglesRaw.x': 'localRotation.x',
        'localEulerAnglesRaw.y': 'localRotation.y',
        'localEulerAnglesRaw.z': 'localRotation.z',

        'm_LocalEulerAngles.x': 'localRotation.x',
        'm_LocalEulerAngles.y': 'localRotation.y',
        'm_LocalEulerAngles.z': 'localRotation.z',

        'm_LocalScale.x': 'localScale.x',
        'm_LocalScale.y': 'localScale.y',
        'm_LocalScale.z': 'localScale.z',

        'm_Color.r': 'materialColor.r',
        'm_Color.g': 'materialColor.g',
        'm_Color.b': 'materialColor.b',
        'm_Color.a': 'materialColor.a',

        'material._Color.r': 'materialColor.r',
        'material._Color.g': 'materialColor.g',
        'material._Color.b': 'materialColor.b',
        'material._Color.a': 'materialColor.a',
        'material._UnlitColor.r': 'materialColor.r',
        'material._UnlitColor.g': 'materialColor.g',
        'material._UnlitColor.b': 'materialColor.b',
        'material._UnlitColor.a': 'materialColor.a',

        'field of view': 'camera3D.fov',

        m_IsActive: 'active',
        m_Sprite: 'sprite',

        m_FlipX: 'flipX',
        m_FlipY: 'flipY',
    };

    static Scale: any = {
        'm_LocalPosition.x': 1,
        'm_LocalPosition.y': 1,
        'm_LocalPosition.z': -1,

        'localEulerAnglesRaw.x': -1, //Deg2Rad(1),
        'localEulerAnglesRaw.y': 1, //Deg2Rad(1),
        'localEulerAnglesRaw.z': 1, //Deg2Rad(1),

        'm_LocalEulerAngles.x': -1, //Deg2Rad(1),
        'm_LocalEulerAngles.y': 1, //Deg2Rad(1),
        'm_LocalEulerAngles.z': 1, //Deg2Rad(1),

        'm_LocalRotation.x': 1, //Rad2Deg(1),
        'm_LocalRotation.y': 1, //Rad2Deg(1),
        'm_LocalRotation.z': -1, //Rad2Deg(1),
        'm_LocalRotation.w': -1, //Rad2Deg(1),

        'field of view': 1,

        m_IsActive: 1,
        m_Sprite: 1,
    };

    public static updatePropertyTag(tag: PropertyAnimTag, attribute: string) {
        tag.quaternion ||= this.tag_quaternion[attribute];
        tag.transform ||= this.tag_transform[attribute];
        tag.materialColor ||= this.tag_materialColor[attribute];
    }

    private static tag_quaternion: any = {
        'm_LocalRotation.x': true,
        'm_LocalRotation.y': true,
        'm_LocalRotation.z': true,
        'm_LocalRotation.w': true,
    };

    private static tag_materialColor: any = {
        'material._Color.r': true,
        'material._Color.g': true,
        'material._Color.b': true,
        'material._Color.a': true,
        'material._UnlitColor.r': true,
        'material._UnlitColor.g': true,
        'material._UnlitColor.b': true,
        'material._UnlitColor.a': true,

    };

    private static tag_transform: any = {
        'm_LocalPosition.x': true,
        'm_LocalPosition.y': true,
        'm_LocalPosition.z': true,
        'm_LocalRotation.x': true,
        'm_LocalRotation.y': true,
        'm_LocalRotation.z': true,
        'm_LocalRotation.w': true,

        'localEulerAnglesRaw.x': true,
        'localEulerAnglesRaw.y': true,
        'localEulerAnglesRaw.z': true,

        'm_LocalEulerAngles.x': true,
        'm_LocalEulerAngles.y': true,
        'm_LocalEulerAngles.z': true,

        'm_LocalScale.x': true,
        'm_LocalScale.y': true,
        'm_LocalScale.z': true,
    }
}
