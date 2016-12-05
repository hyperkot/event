import * as chai from 'chai';
/// <reference path="../typings/index.d.ts"/>
import {Event} from "../src/event";

describe("Method bindings and mixin functionality:", () => {
    it("triggerer works fine", (done: MochaDone) => {
        let event = new Event<any>();
        const testArg = {};
        event.listen((arg: any) => {
            chai.expect(arg).to.be.equal(testArg);
            done();
        });
        let triggerer = event.getTriggerer();
        triggerer(testArg);
    });
    it("listener works fine", (done: MochaDone) => {
        let event = new Event<any>();
        const testArg = {};
        let listener = event.getListener();
        listener((arg: any) => {
            chai.expect(arg).to.be.equal(testArg);
            done();
        });
        event.trigger(testArg);
    });
});