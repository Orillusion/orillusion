import { CEvent } from '../CEvent';
/**
 * enum event type of user interface
 * @internal
 * @group Events
 */
export class UIEvent extends CEvent {
    public static SHOW: string = 'show';
    public static HIDE: string = 'hide';
    public static UPDATE: string = 'update';
}
