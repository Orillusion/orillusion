

/**
 * Pick setting
 * @group Setting
 */
export type PickSetting = {
    /**
     * enable
     */
    enable: boolean;
    /**
     * pick mode: use pixel mode, or bound mode
     */
    mode: `pixel` | `bound`;
    /**
     * @internal
     */
    detail: `mesh` | `mesh|pos` | `mesh|normal` | `mesh|pos|normal`;
};