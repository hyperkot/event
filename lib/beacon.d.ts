/// <reference path="../typings/index.d.ts" />
import Event from "./event";
/**
 * Represents a model of a single property of type T.
 * - Property can be retrieved/changed by using the .value property of the beacon.
 * - Setting new value to the property will trigger the 'changed' event
 *
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
