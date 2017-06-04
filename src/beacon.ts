/// <reference path="../typings/index.d.ts"/>

import Event from "./event";

/**
 * Represents a model of a single property of type T.
 * - Property can be retrieved/changed by using the .value property of the beacon.
 * - Setting new value to the property will trigger the 'changed' event
 *
 */
export class Beacon<T> {

    private _changed: Event<T> = new Event<T>();
    public get changed(): Event.Emitter<T> { return this._changed; };

    private _priorValue: T;
    get priorValue(): T { return this._priorValue; }

    private _value: T;
    get value(): T { return this._value; }
    set value(value: T) {
        if (this.value !== value) {
            this._priorValue = this.value;
            this.value = value;
            this._changed.emit(this._value);
        }
    }

    private _isAssigned: boolean = false;
    get isAssigned(): boolean { return this._isAssigned; }

    constructor(value?: T) {
        this.changed.first.then(() => {this._isAssigned = true;});
        if (arguments.length === 1) this.value = value;
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

    toString(): string {
        return JSON.stringify(this.value, null, "\t");
    }

    valueOf(): any {
        return this.value.valueOf();
    }

    fromString(str: string) {
        this.value = JSON.parse(str);
    }
}

export default Beacon;let λ = 1;