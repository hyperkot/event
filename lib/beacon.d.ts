/// <reference path="../typings/index.d.ts" />
import Event from "./event";
/**
 * Represents a model of a single property of type T. A basic element for constructing models.
 * - Property can be retrieved/changed by using the .value property of the beacon.
 * - Setting new value will trigger the 'changed' event.
 * - Setting the same value will be ignored and won't trigger the 'changed' event.
 * - Can sync to another beacon. Whenever the value of one of the synced beacons changes
 *      the value of the other is changed accordingly.
 */
export declare class Beacon<T> {
    private _changed;
    readonly changed: Event.Emitter<T>;
    private _priorValue;
    readonly priorValue: T;
    private _value;
    value: T;
    private _isAssigned;
    readonly isAssigned: boolean;
    constructor(value?: T);
    syncTo(other: Beacon<T>): void;
    toString(): string;
    valueOf(): any;
    fromString(str: string): void;
}
export default Beacon;
