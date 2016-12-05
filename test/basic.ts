import * as chai from 'chai';
/// <reference path="../typings/index.d.ts"/>
import {Event} from "../src/event";
import * as deepStrictEqual from "deep-strict-equal";
describe("Core functionality: construction of event, triggering, listening", () => {
    it("creates an Event instance, does nothing more, just doesn\"t fail", () => {
        let event = new Event<void>();
    });
    it("adds a listener, triggers the event, listener is invoked", (done: MochaDone) => {
        let event = new Event<void>();
        event.listen(done);
        event.trigger();
    });
    it("invokes listener 2 times when triggered 2 times", (done: MochaDone) => {
        let event = new Event<void>();
        let nExpected = 2;
        let nRegistered = 0;
        event.listen(() => {
            nRegistered++;
            if (nRegistered === nExpected) done();
        });
        for (let i = 0; i < nExpected; i++) event.trigger();
    });
    it("first trigger works as the event-promise resolution", (done: MochaDone) => {
        let event = new Event<any>();
        event.then(done);
        event.trigger();
    });
    it("may be returned as the promise for mocha", () => {
        let event = new Event<void>();
        event.trigger();
        return event;
    });
    it("correctly passes the agrgument to the event-handler", () => { 
        let event = new Event<number>();
        const testArg = 4;
        event.on((n: number) => {
            chai.expect(n).to.be.equal(testArg);
        });
        event.trigger(4);
    });
    it("exactly passes the object argument to the event-handler", () => {
        const testArg = {a: 1, b: {}};
        let event = new Event<Object>();
        event.on((o: Object) => {
            chai.expect(o).to.be.equal(testArg);
        });
        event.trigger(testArg);
    });
    it("doesn't trigger an unsubscribed handler", () => {
        let event = new Event<void>();
        let handler = () => {
            throw new Error('Should not be invoked');
        };

        event.on(handler);
        event.off(handler);

        event.trigger();
    });
    it("correctly unsubscribes by subscription-id", () => {
        let event = new Event<void>();
        let handler = () => {
            throw new Error('Should not be invoked');
        };

        let id = event.on(handler);
        event.off(id);

        event.trigger();
    });
    it("correctly applies given handler context", (done: MochaDone) => {
        let event = new Event<void>();
        let listener: {
            itIsListener: boolean;
            fn: () => void;
        };
        listener  = {
            itIsListener: true,
            fn() {
                chai.expect(this).to.be.equal(listener);
                done();
            }
        }
        event.listen(listener.fn, listener);
        event.trigger();
    });
});