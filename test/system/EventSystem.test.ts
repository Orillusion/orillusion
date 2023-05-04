import { test, expect, end } from '../util'
import { CEventDispatcher, UIEvent } from '@orillusion/core';

await test('EventSystem register event', async () => {
    let dispatcher = new CEventDispatcher();
    let callbackAction = () => {
        console.log('show UI');
    }
    let that = {};
    let id = dispatcher.addEventListener(UIEvent.SHOW, callbackAction, that);

    let containEvent: boolean = dispatcher.containEventListener(UIEvent.SHOW);
    let hasEvent: boolean = dispatcher.hasEventListener(UIEvent.SHOW, callbackAction, that);

    dispatcher.removeEventListenerAt(id);
    let removedEvent = dispatcher.containEventListener(UIEvent.SHOW);

    expect(id > 0).toEqual(true);
    expect(containEvent).toEqual(true);
    expect(hasEvent).toEqual(true);
    expect(removedEvent).toEqual(false);
})

setTimeout(end, 500)




