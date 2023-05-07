import { CEvent } from './CEvent';
/**
 * size change event when canvas resized
 * @internal
 * @group Events
 */
export class CResizeEvent extends CEvent {
    /**
     *
     * RESIZE:enum event type
     */
    static RESIZE: string = 'resize';
}
