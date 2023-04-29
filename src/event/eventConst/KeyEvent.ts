import { CEvent } from '../CEvent';

/**
 * enum keyboard event{@link InputSystem}
 * @group Events
 */
export class KeyEvent extends CEvent {
    /**
     *
     * Constant Definition Key Press Event Identification
     * Event response status: Responds every time the keyboard is pressed.
     * Response event parameters: keyboard key
     * @platform Web,Native
     */
    public static KEY_DOWN: string = 'onKeyDown';

    /**
     *
     * Constant Definition Key up Event Identification
     * Event response status: Responds every time the keyboard is released.
     * Response event parameters: keyboard key
     * @platform Web,Native
     */
    public static KEY_UP: string = 'onKeyUp';

    /**
     *
     * Key code value, enumeration type see KeyCode {@link KeyCode}
     * @default 0
     * @platform Web,Native
     */
    public keyCode: number = 0;
}
