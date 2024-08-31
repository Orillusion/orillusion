export type DebugDrawerOptions = Partial<{
    /**
     * 启用状态，默认 false
     */
    enable: boolean;
    /**
     * 设置 debug 模式，默认值为 1 （DrawWireframe: 绘制物理对象的线框）
     */
    debugDrawMode: DebugDrawMode;
    /**
     * 更新频率，默认每 1 帧更新一次
     */
    updateFreq: number;
    /**
     * 最多渲染的线条，默认 25,000 （超过 32,000 可能会导致错误 V0.8.2）
     */
    maxLineCount: number;
}>;


export enum DebugDrawMode {
    /**
     * 不显示调试信息
     */
    NoDebug = 0,
    /**
     * 绘制物理对象的线框
     */
    DrawWireframe = 1,
    /**
     * 绘制物理对象的包围盒（AABB）
     */
    DrawAabb = 2,
    /**
     * 绘制特征点文本
     */
    DrawFeaturesText = 4,
    /**
     * 绘制接触点
     */
    DrawContactPoints = 8,
    /**
     * 禁用去激活
     */
    NoDeactivation = 16,
    /**
     * 不显示帮助文本
     */
    NoHelpText = 32,
    /**
     * 绘制文本信息
     */
    DrawText = 64,
    /**
     * 显示性能计时信息
     */
    ProfileTimings = 128,
    /**
     * 启用 SAT 比较
     */
    EnableSatComparison = 256,
    /**
     * 禁用 Bullet 的 LCP 算法
     */
    DisableBulletLCP = 512,
    /**
     * 启用连续碰撞检测
     */
    EnableCCD = 1024,
    /**
     * 绘制约束
     */
    DrawConstraints = 2048,
    /**
     * 绘制约束限制
     */
    DrawConstraintLimits = 4096,
    /**
     * 绘制快速剔除代理的 AABB
     */
    FastWireframe = 8192,
    /**
     * 绘制动态 AABB 树
     */
    DrawAabbDynamic = 16384,
    /**
     * 绘制软体物理
     */
    DrawSoftBodies = 32768,
}