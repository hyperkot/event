/// <reference path="../typings/index.d.ts" />
import EventProperty from "./event";
/**
 * Represents a model of a single property of type T. A basic element for constructing models.
 * - Property can be retrieved/changed by using the .value property of the beacon.
 * - Setting new value will trigger the 'changed' event.
 * - Setting the same value will be ignored and won't trigger the 'changed' event.
 * - Can sync to another beacon. Whenever the value of one of the synced beacons changes
 *      the value of the other is changed accordingly.
 * - Attempt to get a value before it was assigned results in exception. It is better to
 *      pass initial value to the constructor
 */
export declare class Beacon<T> {
    private emitChanged;
    changed: EventProperty.Emitter<T>;
    private _priorValue;
    readonly priorValue: T;
    private _value;
    value: T;
    constructor(value: T | Beacon<T>);
    syncTo(other: Beacon<T>): void;
    toJSON(): string;
    fromJSON(json: string): void;
    toString(): string;
    valueOf(): any;
}
export default Beacon;
