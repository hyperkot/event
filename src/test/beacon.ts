/// <reference path="../../typings/index.d.ts"/>

import {expect} from "chai";
import {Beacon} from "..";

describe("Beacon", () => {
    it("initiall value", () => {
        const TestValue = 1;
        let b = new Beacon<number>(TestValue);
        expect(b.value).to.equal(TestValue);
    });

    it("emits change event", (done: MochaDone) => {
        const TestValue = 1;
        let a = new Beacon<number>(null);
        a.changed.on((newValue: number) => {
            expect(newValue).to.equal(TestValue);
            done();
        });
        a.value = TestValue;
    });

    it("doesn't emit change event for same value", (done: MochaDone) => {
        const TestValue = 1;
        let a = new Beacon<number>(TestValue);
        a.changed.on((newValue: number) => {
            throw new Error("Value changed");
        });
        a.value = TestValue;
        setTimeout(done, 0);
    });
});