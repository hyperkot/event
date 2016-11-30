/// <reference path="../typings/index.d.ts"/>
import {Event} from '../src/event';
import * as deepStrictEqual from 'deep-strict-equal';
describe('Core functionality: construction of event, triggering, listening', () => {
    it('Creates an Event instance, does nothing more, just doesn\'t fail', () => {
        let event = new Event<void>();
    });
    it('Adds a listener, triggers the event, listener is invoked', (done: MochaDone) => {
        let event = new Event<void>();
        event.listen(done);
        event.trigger();
    });
    it('invokes listener 2 times when triggered 2 times', (done: MochaDone) => {
        let event = new Event<void>();
        let nExpected = 2;
        let nRegistered = 0;
        event.listen(() => {
            nRegistered++;
            if (nRegistered === nExpected) done();
        });
        for(let i = 0;i < nExpected; i++) event.trigger();
    });
    it('first trigger works as the event-promise resolution', (done: MochaDone) => {
        let event = new Event<any>();
        event.then(done);
        event.trigger();
    });
    it('may be returned as the promise for mocha', () => {
        let event = new Event<void>();
        event.trigger();
        return event;
    })
});