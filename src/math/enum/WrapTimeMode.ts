/**
 * Time Warp Mode
 * @PingPong value min -> max -> min
 * @Repeat value = value % repeatSpace
 * @Clamp value = max(min( value ,  1 ) , 0 )
 */
export enum WrapTimeMode {
    PingPong = 0,
    Repeat = 1,
    Clamp = 2,
}