import { Physics, Ammo } from '../Physics';

type Callback = (contactPoint: Ammo.btManifoldPoint, bodyA: Ammo.btRigidBody, bodyB: Ammo.btRigidBody) => void;

/**
 * 碰撞处理工具
 */
export class ContactProcessedUtil {
    private static callbacks: Map<number, Callback> = new Map();
    private static ignoredPointers: Set<number> = new Set();
    private static contactProcessedCallbackPointer: number | null = null;

    /**
     * 注册碰撞事件
     * @param pointer 物理对象指针
     * @param callback 事件回调
     */
    public static registerCollisionCallback(pointer: number, callback: Callback): void {
        if (pointer == null) return;

        ContactProcessedUtil.callbacks.set(pointer, callback);
        if (ContactProcessedUtil.callbacks.size === 1) {
            // 第一个注册的回调，注册碰撞处理回调
            ContactProcessedUtil.registerContactProcessedCallback();
        }
    }

    /**
     * 注销碰撞事件
     * @param pointer 物理对象指针
     */
    public static unregisterCollisionCallback(pointer: number): void {
        ContactProcessedUtil.callbacks.delete(pointer);
        if (ContactProcessedUtil.callbacks.size === 0) {
            // 最后一个注销的回调，禁用碰撞处理回调
            ContactProcessedUtil.unregisterContactProcessedCallback();
        }
    }

    /**
     * 注册全局碰撞处理回调
     */
    private static registerContactProcessedCallback(): void {
        if (ContactProcessedUtil.contactProcessedCallbackPointer === null) {
            ContactProcessedUtil.contactProcessedCallbackPointer = Ammo.addFunction(ContactProcessedUtil.contactProcessedCallback);
            Physics.world.setContactProcessedCallback(ContactProcessedUtil.contactProcessedCallbackPointer);
        }
    }

    /**
     * 注销全局碰撞处理回调
     */
    private static unregisterContactProcessedCallback(): void {
        if (ContactProcessedUtil.contactProcessedCallbackPointer !== null) {
            Physics.world.setContactProcessedCallback(null); // 禁用回调
            ContactProcessedUtil.contactProcessedCallbackPointer = null;
        }
    }

    /**
     * 将指针添加到忽略集合中，添加后，任何物体与该指针对象碰撞时都无法触发碰撞事件
     * @param pointer 物理对象指针
     */
    public static addIgnoredPointer(pointer: number): void {
        if (pointer != null) {
            ContactProcessedUtil.ignoredPointers.add(pointer);
        }
    }

    /**
     * 从忽略集合中移除指针
     * @param pointer 物理对象指针
     */
    public static removeIgnoredPointer(pointer: number): void {
        ContactProcessedUtil.ignoredPointers.delete(pointer);
    }

    /**
     * 检查指针是否在忽略集合中
     * @param pointer 物理对象指针
     */
    public static isIgnored(pointer: number): boolean {
        return ContactProcessedUtil.ignoredPointers.has(pointer);
    }

    /**
     * 检查指针是否注册了碰撞事件
     * @param pointer 物理对象指针
     */
    public static isCollision(pointer: number): boolean {
        return ContactProcessedUtil.callbacks.has(pointer);
    }

    /**
     * 全局接触（碰撞）事件回调函数
     */
    private static contactProcessedCallback(cpPtr: number, colObj0WrapPtr: number, colObj1WrapPtr: number): number {
        // 检查是否需要忽略
        if (ContactProcessedUtil.ignoredPointers.has(colObj0WrapPtr) || ContactProcessedUtil.ignoredPointers.has(colObj1WrapPtr)) {
            return 0;
        }

        // 通过碰撞对象包装器指针获取其注册的事件
        const callbackA = ContactProcessedUtil.callbacks.get(colObj0WrapPtr);
        const callbackB = ContactProcessedUtil.callbacks.get(colObj1WrapPtr);

        // 排除均未注册碰撞事件的碰撞对
        if (callbackA || callbackB) {
            // 指针转换
            const cp = Ammo.wrapPointer(cpPtr, Ammo.btManifoldPoint);
            const bodyA = Ammo.wrapPointer(colObj0WrapPtr, Ammo.btRigidBody);
            const bodyB = Ammo.wrapPointer(colObj1WrapPtr, Ammo.btRigidBody);

            callbackA?.(cp, bodyA, bodyB);
            callbackB?.(cp, bodyB, bodyA);
        }

        return 0; // 返回0表示已处理本次碰撞
    }

    /**
     * 执行一次性的碰撞测试。
     * 如果提供了 bodyB，则检测 bodyA 与 bodyB 是否碰撞。
     * 否则，检测 bodyA 是否与其他所有刚体碰撞。
     * @param bodyA - 第一个刚体。
     * @param bodyB - （可选）第二个刚体。
     * @returns 如果发生碰撞，返回包含碰撞信息的对象；否则返回 null。
     */
    public static performCollisionTest(bodyA: Ammo.btRigidBody, bodyB?: Ammo.btRigidBody) {
        const callback = new Ammo.ConcreteContactResultCallback();
        let collisionDetected: {
            cpPtr: number,
            colObj0Wrap: Ammo.btCollisionObjectWrapper,
            colObj1Wrap: Ammo.btCollisionObjectWrapper,
            partId0: number,
            index0: number,
            partId1: number,
            index1: number
        } | null = null;

        callback.addSingleResult = (cp, colObj0Wrap, partId0, index0, colObj1Wrap, partId1, index1) => {
            let collisionObjectWrapperA = Ammo.wrapPointer(colObj0Wrap as unknown as number, Ammo.btCollisionObjectWrapper)
            let collisionObjectWrapperB = Ammo.wrapPointer(colObj1Wrap as unknown as number, Ammo.btCollisionObjectWrapper)
            collisionDetected = {
                cpPtr: cp as unknown as number,
                colObj0Wrap: collisionObjectWrapperA,
                colObj1Wrap: collisionObjectWrapperB,
                partId0,
                index0,
                partId1,
                index1
            };

            return 0;
        };

        if (bodyB) {
            Physics.world.contactPairTest(bodyA, bodyB, callback);
        } else {
            Physics.world.contactTest(bodyA, callback);
        }

        Ammo.destroy(callback);

        return collisionDetected;
    }

    /**
     * 碰撞检测，判断两个刚体是否正在发生碰撞
     * @param bodyA
     * @param bodyB
     * @returns boolean
     */
    public static checkCollision(bodyA: Ammo.btRigidBody, bodyB: Ammo.btRigidBody): boolean {
        const dispatcher = Physics.world.getDispatcher();
        const manifoldCount = dispatcher.getNumManifolds();
        for (let i = 0; i < manifoldCount; i++) {
            const manifold = dispatcher.getManifoldByIndexInternal(i);
            const rbA = Ammo.castObject(manifold.getBody0(), Ammo.btRigidBody);
            const rbB = Ammo.castObject(manifold.getBody1(), Ammo.btRigidBody);
            if ((rbA === bodyA && rbB === bodyB) || (rbA === bodyB && rbB === bodyA)) {
                return true;
            }
        }
        return false;
    }

}