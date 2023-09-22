/**
 * @internal
 * @group Math
 */
export class FrameCache {
    public index: number; //= lhsIndex;
    public time: number; // = lhs.time + timeOffset;
    public timeEnd: number; // = rhs.time + timeOffset;
    public coeff: number[] = []; //= lhsIndex;
} 