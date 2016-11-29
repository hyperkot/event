/// <reference path="../typings/index.d.ts"/>
import {Event} from '../src/event';
describe('Core functionality: construction of event, triggering, listening', () => {
    it('Creates an Event instance, does nothing more, just dont fails', () => {
        let event = new Event<any>();
    });
    it('Adds a listener, triggers the event, listener is invoked', (done: MochaDone) => {
        let event = new Event<any>();
        event.listen(done);
        event.trigger();
    });
});