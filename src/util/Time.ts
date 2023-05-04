/**
 * Tool of time
 * @group Util
 */
export class Time {
    /**
     * The time the engine has been running
     */
    public static time: number = 0;
    /**
     * the frame count engine is running
     */
    public static frame: number = 0;
    /**
     * Time from previous frame to present
     */
    public static delta: number = 0;

    private static _startTime: number = 0;
    private static _timeLabel: string = ``;
    /**
     * @internal
     * @param label
     */
    public static start(label: string) {
        this._startTime = performance.now();
        this._timeLabel = label;
    }

    /**
     * @internal
     */
    public static end() {
        console.log(this._timeLabel, performance.now() - this._startTime);
    }
}
