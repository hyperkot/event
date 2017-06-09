/// <reference path="../typings/index.d.ts"/>
/// <reference path="./interfaces.ts"/>
import Interfaces from "./interfaces";
import { Deferred } from 'ts-buns';

import Emitter =  Interfaces.Emitter;
import HandlerDescriptor =  Interfaces.HandlerDescriptor;
import ListenerId =  Interfaces.ListenerId;
import isListenerId =  Interfaces.isListenerId;
import HandlerOptions =  Interfaces.HandlerOptions;
import EmitMethod =  Interfaces.EmitMethod;
import VoidEmitMethod =  Interfaces.VoidEmitMethod;
import Handler =  Interfaces.Handler;
import PropertyModel =  Interfaces.PropertyModel;

/**
 * Represents a certain kind of events.
 * Provides methods to observe and to trigger(emit) that kind of events.
 */
export class EventProperty<T> implements Emitter<T> {
    private listeners: HandlerDescriptor<T>[] = [];

    private initArg: T;
    private initHandlers: [Handler<T>, Object][] = [];
    private initDeferred: Deferred<T> = new Deferred<T>();

    /**
     * A special property, indicating that the event was emitted at least once.
     * @returns {boolean}
     */
    get isInitialized(): boolean { return this.initHandlers === null; }

    private idCounter: ListenerId = 0;


    constructor() {

        this.emit = this.emit.bind(this);
    }

    /**
     * This typedef is used to describe type-parameter T for jsdoc parser.
     *
     * @typedef {any} T;
     * @private
     */

    /**
     * Emits event with given argument. This invokes all appropriate handlers.
     *
     * @param {T} eventArg - event argument, it's passed to each event handler.
     */
    emit(eventArg: T): void {
        let toInvoke: HandlerDescriptor<T>[];

        if (!this.isInitialized) {
            let initHandlers = this.initHandlers;
            this.initHandlers = null;
            this.initArg = eventArg;
            initHandlers.forEach(([handler, context]: [Handler<T>, Object]) => {
                handler.call(context || null, this.initArg);
            });
            this.initDeferred.resolve(eventArg);
        }

        toInvoke = this.listeners.slice().filter((listener: HandlerDescriptor<T>) => {
            let shouldInvoke = !listener.onlyMatching || objectMatch(eventArg, listener.matchValue);
            if (listener.once && shouldInvoke) {
                this.removeListener(listener);
            }
            return shouldInvoke;
        });

        toInvoke.forEach(({handler, context}: {handler: Handler<T>, context?: Object}) => {
            handler.call(context || null, eventArg);
        });
    }

    /**
     * Adds a listener.
     *
     * @param {Handler<T>} handler - callback to be called when an event is emitted
     * @param {Object} [context] - context to be used when calling handler. null by default.
     * @returns {ListenerId} - number, identifying new event listener.
     */
    on(handler: Handler<T>, context?: Object): ListenerId {
        return this.addListener({ handler, context });
    }

    /**
     * Adds a listener. This listener will be immediately removed after it's
     * invoked for the first time.
     *
     * @param {Handler<T>} handler - callback to be called when an event is emitted
     * @param {Object} [context] - context to be used when calling handler. null by default.
     * @returns {ListenerId} - number, identifying new event listener.
     */
    once(handler: Handler<T>, context: Object = null): ListenerId {
        return this.addListener({ context, handler, once: true });
    }

    /**
     * Adds a listener. This listener will be invoked only if event argument
     * matches given value.
     *
     * Note: what "matching" means is not documented well yet since it is subject to change.
     * For now you should assume that for plain types (boolean, number, string) it is
     * strict equality. For objects it is like deep strict equality except that actual
     * event argument may have more fields than match-value(proto). But all fields from
     * match-value must be present in event argument.
     *
     * @param {T|RegExp} value - handler is invoked only if event argument matches this value
     * @param {Handler<T>} handler - callback to be called when an event is emitted
     * @param {Object} [context] - context to be used when calling handler. null by default.
     * @returns {ListenerId} - number, identifying new event listener.
     *
     * @see objectMatch
     */
    match(value: T|RegExp, handler: Handler<T>, context?: Object): ListenerId {
        return this.addListener({ handler, context, onlyMatching: true, matchValue: value });
    }

    /**
     * Adds a listener for this event type. This listener will be invoked only if event argument
     * matches given value. This listener will be immediately removed after it's invoked
     * for the first time.
     *
     * Note: what "matching" means is not documented well yet since it is subject to change.
     * For now you should assume that for plain types (boolean, number, string) it is
     * strict equality. For objects it is like deep strict equality except that actual
     * event argument may have more fields than match-value(proto). But all fields from
     * match-value must be present in event argument.
     *
     * @param {T|RegExp} value - handler is invoked only if event argument matches this value
     * @param {Handler<T>} handler - callback to be called when an event is emitted
     * @param {Object} [context] - context to be used when calling handler. null by default.
     * @returns {ListenerId} - number, identifying new event listener.
     *
     * @see PropertyEvent.match, PropertyEvent.once
     */
    matchOnce(value: T|RegExp, handler: Handler<T>, context: Object = null): ListenerId {
         return this.addListener({
             context,
             handler,
             once: true,
             onlyMatching: true,
             matchValue: value
        });
    }

    /**
     * "Pipes" EventProperty to other  This means that whenever this event
     * is emitted it is passed to that other EventProperty which emits it too.
     *
     * @param {EventProperty<T>} other
     * @returns {ListenerId}
     */
    pipe(other: EventProperty<T>): ListenerId {
        return this.on(other.emit);
    }

    /**
     * Pipe only events with matching argument to destination 
     *
     * Note: what "matching" means is not documented well yet since it is subject to change.
     * For now you should assume that for plain types (boolean, number, string) it is
     * strict equality. For objects it is like deep strict equality except that actual
     * event argument may have more fields than match-value(proto). But all fields from
     * match-value must be present in event argument.
     *
     * @param {T|RegExp} matchValue - value to match
     * @param {EventProperty<T>} destination - target EventProperty
     * @returns {ListenerId}
     *
     * @see pipe, match
     */
    route(matchValue: T|RegExp, destination: EventProperty<T>): ListenerId {
        return this.match(matchValue, destination.emit);
    }

    /**
     * Adds an initialization handler. Initialization handlers are invoked during the very first
     * emit of event in this  If first emit already occurred then the handler is
     * invoked immediately.
     * This method returns a promise which may be used instead of passing a callback. Note that promise
     * resolve and reject handler will be invoked only on the next event loop iteration while callback
     * which is passed directly will beb invoked immediately and before any event-listeners.
     *
     * @param {Handler<T>} handler - callback to be invoked when event is emitted first time
     * @param {Object} [context] - handler will be invoked in this context
     */
    init(handler?: Handler<T>, context?: Object): Promise<T> {
        if (handler) {
            if (this.isInitialized) {
                handler.call(context || null, this.initArg);
            } else {
                this.initHandlers.push([handler, context || null]);
            }
        }
        return this.initDeferred.promise;
    }

    /**
     * Removes all listeners that were attached with given handler and without a context.
     * Note: it will never remove any listener that was attached with a context.
     *
     * @param {Handler<T>} handler - remove listeners having this handler
     */
    off(handler: Handler<T>): void;

    /**
     * Removes listeners that were attached with given handler and context.
     * Note: it will never remove any listener that was attached without a context.
     *
     * @param {Handler<T>} handler - remove listeners having this handler
     * @param {Object} [context] - remove only listeners having this context
     */
    off(handler: Handler<T>, context: Object): void;

    /**
     * Removes all listeners having this context
     *
     * @param {Object} context
     */
    off(context: Object): void;

    /**
     * Removes listener with given id.
     *
     * @param {ListenerId} id
     */
    off(id: ListenerId): void;

    /**
     * Remove pipes created for other 
     *
     * @param {EventProperty} destination
     */
    off(destination: EventProperty<T>): void;

    /**
     * Remove all listeners.
     */
    off(): void;

    off(...args: any[]): void {
        let context: Object = null,
            handler: Handler<T> = null,
            idToRemove: ListenerId = null;
        switch (args.length) {
            case 0: // No arguments - clear all listeners
                this.listeners = [];
                return;
            case 1:
                if (isListenerId(args[0])) {
                    idToRemove = args[0];
                } else if (typeof args[0] === "function") {
                    handler = args[0];
                    context = null;
                } else if (typeof args[0] === "object") {
                    if (args[0] instanceof EventProperty) {
                        this.off(args[0].emit);
                        return;
                    }
                    handler = null;
                    context = args[0];
                } else {
                    throw new Error(`Invalid argument: ${typeof args[0]}`);
                }
                break;
            case 2:
                handler = args[0];
                context = args[1];
                break;
            default:
                throw new Error("Unsupported arguments format.");
        }

        this.listeners = this.listeners.filter((hConf: HandlerDescriptor<T>) => {
            let differentHandler: boolean = hConf.handler !== handler;
            let noHandlerGiven: boolean = !handler;
            let noContextGiven: boolean = !context;
            let confHasNoContext: boolean = !hConf.context;
            let differentContext: boolean = hConf.context !== context;
            let dontRemove: boolean;

            if (idToRemove !== null) {
                dontRemove = idToRemove !== hConf.id;
            } else {
                if (noHandlerGiven) {
                    if (noContextGiven) {
                        throw new Error("Unexpected circumstances.");
                    } else {
                        dontRemove = confHasNoContext || (context !== hConf.context);
                    }
                } else {
                    if (differentHandler) {
                        dontRemove = true;
                    } else {
                        if (noContextGiven) {
                            dontRemove = (!confHasNoContext) || (differentHandler);
                        } else {
                            dontRemove = differentContext || differentHandler;
                        }
                    }
                }
            }
            return dontRemove;
        });
    }


    private removeListener(listener: HandlerDescriptor<T>): void {
        let listenerIndex = this.listeners.indexOf(listener);
        if (listenerIndex !== -1) {
            this.listeners.splice(listenerIndex, 1);
        }
    }

    private addListener(options: HandlerOptions<T>): ListenerId {
        let {context, handler, once, onlyMatching, matchValue} = options;
        this.idCounter++;
        this.listeners.push({context, handler, once, id: this.idCounter, onlyMatching, matchValue});
        return this.idCounter;
    }
}


export namespace EventProperty {
    export type Emitter<T> = Interfaces.Emitter<T>;
    export type  HandlerDescriptor<T> =  Interfaces.HandlerDescriptor<T>;
    export type ListenerId = Interfaces.ListenerId;
    export function isListenerId(id: any) {return  Interfaces.isListenerId(id); }
    export type  HandlerOptions<T> =  Interfaces.HandlerOptions<T>;
    export type  EmitMethod<T> =  Interfaces.EmitMethod<T>;
    export type  VoidEmitMethod =  Interfaces.VoidEmitMethod;
    export type  Handler<T> =  Interfaces.Handler<T>;
    export type  PropertyModel<T> =  Interfaces.PropertyModel<T>;
    /**
     * Creates a pair: an EventProperty instance to be used internally in a class
     * and an Emitter-interface to be used as public / accessible property.
     * They both actually represent the same EventProperty object.
     *
     * returns {[EventProperty,Emitter<T>]}
     *
     * @method EventProperty.make
     * @static
     */
    export function make<T>(): [EventProperty<T>, Emitter<T>] {
        let eventProp = new EventProperty<T>();
        return [eventProp, <Emitter<T>>eventProp];
    }

    /**
     * Creates an EventProperty object and splits it into emitter-function and
     * Emitter-interface. Use emitter function to emit the event and Emitter-interface
     * to add and remove listeners of that event.
     *
     * returns {[EmitMethod<T>,Emitter<T>]}
     *
     * @method EventProperty.split
     * @static
     */
    export function split<T>(): [EmitMethod<T>, Emitter<T>] {
        let eventProp = new EventProperty<T>();
        return [eventProp.emit, <Emitter<T>>eventProp];
    }

    /**
     * Creates an EventProperty object and splits it into emitter-function and
     * Emitter-interface. Special version for void-typed events.
     *
     * returns {[VoidEmitMethod,Emitter<T>]}
     *
     * @method EventProperty.splitVoid
     * @static
     */
    export function splitVoid(): [VoidEmitMethod, Emitter<void>] {
        let eventProp = new Void();
        let emitter = <Emitter<void>>eventProp;
        return [eventProp.emit, emitter];
    }

    /**
     * Special subclass of EventProperty for void type - allows calling emit without arguments.
     * Extends {@link EventProperty}
     *
     * @class Void
     * @static
     * @see {EventProperty}
     */
    export class Void extends EventProperty<void> {
        constructor() { super(); }

        /**
         * Emits an event invoking all listeners.
         *
         * @method Void#emit
         * @see {EventProperty#emit}
         */
        emit() { return super.emit(void 0); }
    }

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
    export class Beacon<T> implements Interfaces.PropertyModel<T> {

        private emitChanged: Interfaces.EmitMethod<T>;
        public changed: Interfaces.Emitter<T>;

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

    export function Trigger<T>(object: Object, key: string) {
        return function(arg: T) {
            switch (typeof object[key]) {
                case "function": object[key](arg); break;
                case "object":
                    if (object[key] instanceof EventProperty) {
                        object[key].emit(arg);
                    } else if (object[key] instanceof Beacon) {
                        object[key].value = arg;
                    } else {
                        console.warn(`Triggered on an unsupported type of field [${key}]: "${object[key]}".`);
                        object[key] = arg;
                    }
                    break;
                default:
                    console.warn(`Triggered on an unsupported type of field [${key}]: "${object[key]}".`);
                    object[key] = arg;
            }
        };
    }

}


/**
 * Used in match/matchOnce/route methods to compare event argument with given value.
 * Note: subject to change.
 *
 * @param {any} subject - actual event argument
 * @param {any} proto - value to match
 * @returns {boolean}
 *
 * @private
 */
function objectMatch(subject: any, proto: any): boolean {
    return _objectMatch(subject, proto);
}

function _objectMatch(subject: any, proto: any, traversalStack: any[] = []): boolean {
    switch (typeof proto) {
        case "undefined": return subject === undefined;
        case "number":
        case "boolean":
        case "string":
        case "function":
            return subject === proto;
        case "object":
            let isMatching = true;

            if (traversalStack.length === 0) {
                if ((typeof subject === "string") && (proto instanceof RegExp)) {
                    isMatching = proto.test(subject);
                }
            } else {
                if (typeof subject !== "object") {
                    isMatching = false;
                } else {
                    if (!proto || !subject)
                        isMatching = !subject && !proto;
                    else if (traversalStack.includes(subject)) {
                        throw new Error("Recursion!");
                    } else {
                        for (let key in proto) {
                            if (proto.hasOwnProperty(key)) {
                                traversalStack.push(subject);
                                isMatching = isMatching && _objectMatch(subject[key], proto[key], traversalStack);
                                traversalStack.pop();
                            }
                        }
                    }
                }
            }
            return isMatching;
        default:
            throw new Error(`Unexpected typeof: ${typeof proto}`);
    }
}

export default EventProperty;