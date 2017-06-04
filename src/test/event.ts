/// <reference path="../../typings/index.d.ts"/>

import * as chai from "chai";
import {EventProperty} from "../event";
import {assert} from "~chai/lib/Chai";
let expect = chai.expect;

describe("EventProperty", () => {
    it("constructor", () => {
        new EventProperty<void>();
    });
    describe("on", () => {
        testTriggers("on");

        it("invokes all listeners", (done: MochaDone) => {
            let event = new EventProperty.Void();
            let resolve1: () => void = null;
            let resolve2: () => void = null;
            let promise1: Promise<any> = new Promise<any>((resolve) => { resolve1 = resolve; });
            let promise2: Promise<any> = new Promise<any>((resolve) => { resolve2 = resolve; });
            event.on(resolve1);
            event.on(resolve2);
            Promise.all([promise1, promise2]).then(function(){ done(); }).catch(done);
            event.emit();
        });
        it("invokes listeners on each emit", (done: MochaDone) => {
            let event = new EventProperty.Void();
            let nExpected = 5;
            let nRegistered = 0;
            event.on(() => {
                nRegistered++;
                if (nRegistered === nExpected) done();
            });
            for (let i = 0; i < nExpected; i++) event.emit();
        });
    });

    describe("off", () => {
        it("by handler", () => {
            let event = new EventProperty.Void();
            let handler = () => {
                throw new Error("Should not be invoked");
            };

            event.on(handler);
            event.off(handler);

            event.emit();
        });
        it("by id", () => {
            let event = new EventProperty.Void();
            let handler = () => {
                throw new Error("Should not be invoked");
            };

            let id = event.on(handler);
            event.off(id);

            event.emit();
        });
        it("by context", (done: MochaDone) => {
            let event = new EventProperty.Void();
            let context = {};
            let handler = function() {
                if (this === context)
                    throw new Error("Should not be invoked");
                else
                    done();
            };
            // Off by context should remove all handlers with the
            // context but should not affect the handlers passed without context

            event.on(handler, context);
            event.on(handler, context);
            event.on(handler);
            event.off(context);

            event.emit();
        });
        it("clears", (done: MochaDone) => {
            let event = new EventProperty.Void();
            let handler = function() {
                if (this === context)
                    throw new Error("Should not be invoked");
                else
                    done();
            };
            // Off by context should remove all handlers with the
            // context but should not affect the handlers passed without context
            event.on(handler);
            event.on(handler);
            event.off();
            setTimeout(done, 10);

            event.emit();
        });
    });

    describe("once", () => {
        testTriggers("once");

        it("triggers once", () => {
            let event = new EventProperty.Void();
            let isFirst = true;
            event.once(function () {
                chai.assert(isFirst);
                isFirst = false;
            });
            event.emit();
            event.emit();
        });
    });
    describe("match", () => {
        testMatchTriggers("match");

        it("matches object part", (done: MochaDone) => {
            let event = new EventProperty<any>();
            event.match({ a: 1, b: 2 }, function () { done(); });
            event.emit({ a: 1, b: 2, c: 3, d: "x"});
        });
        it("matches deeper", (done: MochaDone) => {
            let event = new EventProperty<any>();
            event.match({ a: {x : "y"}, c: [1, 2] }, function () { done(); });
            event.emit({ a: {x : "y", z: {r: 1}}, c: [1, 2, { x: "?"}, null] });
        });
        it("matches regexp", (done: MochaDone) => {
            let event = new EventProperty<any>();
            event.match(/test[123]+x/, function () { done(); });
            event.emit("test-test2xs");
        });
    });
    describe("matchOnce", () => {
        testMatchTriggers("matchOnce");

        it("matches once", () => {
            let event = new EventProperty<string>();
            let isFirst = true;
            event.matchOnce("match", function () {
                chai.assert(isFirst);
                isFirst = false;
            });
            event.emit("match");
            event.emit("match");
            event.emit("unmatch");
        });
    });
    describe("pipe", () => {
        it("passes argument, get listenerId", (done: MochaDone) => {
            let eventFrom = new EventProperty<string>();
            let eventTo = new EventProperty<string>();
            let testArg = "test";
            eventTo.on(function (arg: string) {
                expect(arg).to.equal(testArg);
                done();
            });
            let id = eventFrom.pipe(eventTo);
            expect(typeof id).to.equal("number");
            eventFrom.emit(testArg);
        });
        it("offs with id", () => {
            let eventFrom = new EventProperty.Void();
            let eventTo = new EventProperty.Void();

            eventTo.on(function () { throw new Error("Should not happen"); });
            let id = eventFrom.pipe(eventTo);
            eventFrom.off(id);
            eventFrom.emit();
        });
        it("offs with event", () => {
            let eventFrom = new EventProperty.Void();
            let eventTo = new EventProperty.Void();

            eventTo.on(function () { throw new Error("Should not happen"); });
            eventFrom.pipe(eventTo);
            eventFrom.off(eventTo);
            eventFrom.emit();
        });
    });
    describe("route", () => {
        it("string", () => {
            let eventFrom = new EventProperty<string>();
            let eventTo = new EventProperty<string>();

            eventTo.on(function (arg: string) {
                expect(arg).to.equal("test");
            });
            let id = eventFrom.route("test", eventTo);
            expect(typeof id).to.equal("number");
            eventFrom.emit("test");
            eventFrom.emit("random");
            eventFrom.emit("any");
        });
        it("regexp", () => {
            let eventFrom = new EventProperty<string>();
            let eventTo = new EventProperty<string>();
            let pass = 1;

            eventTo.on(function (arg: string) {
                chai.assert(/^\/[a-zA-Z]*/.test(arg));
                chai.assert(!--pass);
            });
            let id = eventFrom.route(/^\/[a-zA-Z]+/, eventTo);
            expect(typeof id).to.equal("number");
            eventFrom.emit("/root");
            eventFrom.emit("random");
            eventFrom.emit("/34/");
        });
    });
    describe("first", () => {
        it("resolves with value", (done: MochaDone) => {
            let event = new EventProperty<string>();
            let testArg: string = "test";
            event.first.then((arg: string) => {
                expect(arg).to.equal(testArg);
                done();
            });
            event.emit(testArg);
        });

        it("can be caught after emit", (done: MochaDone) => {
            let event = new EventProperty.Void();
            event.emit();
            event.first.then(() => {
                done();
            });
        });
    });
    describe("next", () => {
        it("resolves with value", (done: MochaDone) => {
            let event = new EventProperty<string>();
            let testArg: string = "test";
            event.next().then((arg: string) => {
                expect(arg).to.equal(testArg);
                done();
            });
            event.emit(testArg);
        });
        it("creates new promises", (done: MochaDone) => {
            let event = new EventProperty<string>();
            let testArg1: string = "test1";
            let testArg2: string = "test2";
            event.next().then((arg: string) => {
                expect(arg).to.equal(testArg1);
                event.next().then((arg: string) => {
                    expect(arg).to.equal(testArg2);
                    event.next().then((arg: string) => {
                        expect(arg).to.equal(testArg1);
                        done();
                    });
                    event.emit(testArg1);
                });
                event.emit(testArg2);
            });
            event.emit(testArg1);
        });
    });
    it("EventProperty.make", (done: MochaDone) => {
        class Test {
            private event: EventProperty<string>;
            public emitter: EventProperty.Emitter<string>;
            constructor() {
                [this.event, this.emitter] = EventProperty.make<string>();
            }
            test() {
                this.event.emit("test");
            }
        }
        let instance = new Test();
        instance.emitter.on(() => done());
        instance.test();
    });
});


function testTriggers(method: string) {
    it("returns listenerId", () => {
        let event = new EventProperty<void>();
        let id = event[method](() => {});
        expect(typeof id).to.equal("number");
    });
    it("triggers", (done: MochaDone) => {
        let event = new EventProperty.Void();
        event[method](done);
        event.emit();
    });
    it("passes argument", (done: MochaDone) => {
        let testArg = "test";
        let event = new EventProperty<string>();
        event[method]((arg: string) => {
            expect(arg).to.be.equal(testArg);
            done();
        });
        event.emit(testArg);
    });
    it("passes context", (done: MochaDone) => {
        let event = new EventProperty.Void();
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
        };
        event[method](listener.fn, listener);
        event.emit();
    });
}

function testMatchTriggers(method: string) {
    let match = "testMatchValue";
    it("returns listenerId", () => {
        let event = new EventProperty<string>();
        let id = event[method](match, () => {});
        expect(typeof id).to.equal("number");
    });
    it("triggers", (done: MochaDone) => {
        let event = new EventProperty<string>();
        event[method](match, function () { done(); });
        event.emit(match);
    });
    it("passes argument", (done: MochaDone) => {
        let testArg = "test";
        let event = new EventProperty<string>();
        event[method](testArg, (arg: string) => {
            expect(arg).to.be.equal(testArg);
            done();
        });
        event.emit(testArg);
    });
    it("passes context", (done: MochaDone) => {
        let event = new EventProperty<string>();
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
        };
        event[method](match, listener.fn, listener);
        event.emit(match);
    });
    it("ignores irrelevant emits", () => {
        let event = new EventProperty<string>();
        event[method](match, function () { throw new Error("Must not be invoked"); });
        event.emit("");
        event.emit("abc");
        event.emit(null);
    });
}