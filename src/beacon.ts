/// <reference path="../typings/index.d.ts"/>

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
export class Beacon<T> {

    private emitChanged: EventProperty.EmitMethod<T>;
    public changed: EventProperty.Emitter<T>;

    private _priorValue: T;
    get priorValue(): T { return this._priorValue; };

    private _value: T;
    get value(): T { return this._value; }
    set value(value: T) {
        if (this._value !== value) {
            this._priorValue = this._value;
            this._value = value;
            this.emitChanged(this._value);
        }
    }

    constructor(value: T|Beacon<T>) {
        [this.emitChanged, this.changed] = EventProperty.split<T>();

        if (value instanceof Beacon) {
            this.syncTo(value);
            this._priorValue = value._priorValue;
        } else {
            this._value = value;
            this._priorValue = value;
        }
    }

    syncTo(other: Beacon<T>) {
        other.changed.on(() => {
            if (this.value !== other.value) {
                this.value = other.value;
            }
        });
        this.changed.on(() => {
            if (other.value !== this.value) {
                other.value = this.value;
            }
        });
        this.value = other.value;
    }

    toJSON(): string {
        return JSON.stringify(this.value, null, "\t");
    }

    fromJSON(json: string): void {
        this.value = JSON.parse(json);
    }

    toString(): string {
        return this.toJSON();
    }

    valueOf(): any {
        return this.value.valueOf();
    }
}

export default Beacon;