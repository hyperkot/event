/// <reference path="../typings/index.d.ts" />
/// <reference path="interfaces.d.ts" />
import Interfaces from "./interfaces";
import Emitter = Interfaces.Emitter;
import ListenerId = Interfaces.ListenerId;
import Handler = Interfaces.Handler;
/**
 * Represents a certain kind of events.
 * Provides methods to observe and to trigger(emit) that kind of events.
 */
export declare class EventProperty<T> implements Emitter<T> {
    private listeners;
    private initArg;
    private initHandlers;
    private initDeferred;
    /**
     * A special property, indicating that the event was emitted at least once.
     * @returns {boolean}
     */
    readonly isInitialized: boolean;
    private idCounter;
    constructor();
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
    emit(eventArg: T): void;
    /**
     * Adds a listener.
     *
     * @param {Handler<T>} handler - callback to be called when an event is emitted
     * @param {Object} [context] - context to be used when calling handler. null by default.
     * @returns {ListenerId} - number, identifying new event listener.
     */
    on(handler: Handler<T>, context?: Object): ListenerId;
    /**
     * Adds a listener. This listener will be immediately removed after it's
     * invoked for the first time.
     *
     * @param {Handler<T>} handler - callback to be called when an event is emitted
     * @param {Object} [context] - context to be used when calling handler. null by default.
     * @returns {ListenerId} - number, identifying new event listener.
     */
    once(handler: Handler<T>, context?: Object): ListenerId;
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
    match(value: T | RegExp, handler: Handler<T>, context?: Object): ListenerId;
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
    matchOnce(value: T | RegExp, handler: Handler<T>, context?: Object): ListenerId;
    /**
     * "Pipes" EventProperty to other  This means that whenever this event
     * is emitted it is passed to that other EventProperty which emits it too.
     *
     * @param {EventProperty<T>} other
     * @returns {ListenerId}
     */
    pipe(other: EventProperty<T>): ListenerId;
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
    route(matchValue: T | RegExp, destination: EventProperty<T>): ListenerId;
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
    init(handler?: Handler<T>, context?: Object): Promise<T>;
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
    private removeListener(listener);
    private addListener(options);
}
export declare namespace EventProperty {
    type Emitter<T> = Interfaces.Emitter<T>;
    type HandlerDescriptor<T> = Interfaces.HandlerDescriptor<T>;
    type ListenerId = Interfaces.ListenerId;
    function isListenerId(id: any): boolean;
    type HandlerOptions<T> = Interfaces.HandlerOptions<T>;
    type EmitMethod<T> = Interfaces.EmitMethod<T>;
    type VoidEmitMethod = Interfaces.VoidEmitMethod;
    type Handler<T> = Interfaces.Handler<T>;
    type PropertyModel<T> = Interfaces.PropertyModel<T>;
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
    function make<T>(): [EventProperty<T>, Emitter<T>];
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
    function split<T>(): [EmitMethod<T>, Emitter<T>];
    /**
     * Creates an EventProperty object and splits it into emitter-function and
     * Emitter-interface. Special version for void-typed events.
     *
     * returns {[VoidEmitMethod,Emitter<T>]}
     *
     * @method EventProperty.splitVoid
     * @static
     */
    function splitVoid(): [VoidEmitMethod, Emitter<void>];
    /**
     * Special subclass of EventProperty for void type - allows calling emit without arguments.
     * Extends {@link EventProperty}
     *
     * @class Void
     * @static
     * @see {EventProperty}
     */
    class Void extends EventProperty<void> {
        constructor();
        /**
         * Emits an event invoking all listeners.
         *
         * @method Void#emit
         * @see {EventProperty#emit}
         */
        emit(): void;
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
    class Beacon<T> implements Interfaces.PropertyModel<T> {
        private emitChanged;
        changed: Interfaces.Emitter<T>;
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
    function Trigger<T>(object: Object, key: string): (arg: T) => void;
}
export default EventProperty;
