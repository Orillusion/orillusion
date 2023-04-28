/**
 * @internal
 * @group Animation
 */
export class PropertyHelp {
    static property: any = {
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

        'm_Color.r': 'r',
        'm_Color.g': 'g',
        'm_Color.b': 'b',
        'm_Color.a': 'alpha',

        'field of view': 'camera3D.fov',

        m_IsActive: 'visible',
        m_Sprite: 'texture',

        m_FlipX: 'flipX',
        m_FlipY: 'flipY',
    };

    static property_quaternion: any = {
        'm_LocalRotation.x': true,
        'm_LocalRotation.y': true,
        'm_LocalRotation.z': true,
        'm_LocalRotation.w': true,
    };

    static property_scale: any = {
        'm_LocalPosition.x': -1,
        'm_LocalPosition.y': 1,
        'm_LocalPosition.z': 1,

        'localEulerAnglesRaw.x': -1, //Deg2Rad(1),
        'localEulerAnglesRaw.y': 1, //Deg2Rad(1),
        'localEulerAnglesRaw.z': 1, //Deg2Rad(1),

        'm_LocalEulerAngles.x': -1, //Deg2Rad(1),
        'm_LocalEulerAngles.y': 1, //Deg2Rad(1),
        'm_LocalEulerAngles.z': 1, //Deg2Rad(1),

        'm_LocalRotation.x': -1, //Rad2Deg(1),
        'm_LocalRotation.y': 1, //Rad2Deg(1),
        'm_LocalRotation.z': 1, //Rad2Deg(1),
        'm_LocalRotation.w': -1, //Rad2Deg(1),

        'm_LocalScale.x': 1,
        'm_LocalScale.y': 1,
        'm_LocalScale.z': 1,

        'm_Color.r': 1,
        'm_Color.g': 1,
        'm_Color.b': 1,
        'm_Color.a': 1,

        'field of view': 1,

        m_IsActive: 1,
        m_Sprite: 1,
    };

    static property_offset: any = {
        'm_LocalPosition.x': 0,
        'm_LocalPosition.y': 0,
        'm_LocalPosition.z': 0,

        'localEulerAnglesRaw.x': 0, //Deg2Rad(0),
        'localEulerAnglesRaw.y': 0, //Deg2Rad(0),
        'localEulerAnglesRaw.z': 0, //Deg2Rad(0),

        'm_LocalEulerAngles.x': 0, //Deg2Rad(0),
        'm_LocalEulerAngles.y': 0, //Deg2Rad(0),
        'm_LocalEulerAngles.z': 0, //Deg2Rad(0),

        'm_LocalRotation.x': 0,
        'm_LocalRotation.y': 0,
        'm_LocalRotation.z': 0,
        'm_LocalRotation.w': 0,

        'm_LocalScale.x': 0,
        'm_LocalScale.y': 0,
        'm_LocalScale.z': 0,

        'field of view': 0,

        'm_Color.r': 0,
        'm_Color.g': 0,
        'm_Color.b': 0,
        'm_Color.a': 0,

        m_IsActive: 0,
        m_Sprite: 0,
    };
}
