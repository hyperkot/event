/// <reference path="../typings/index.d.ts" />
/**
 * Represents a certain type of events.
 * Provides methods to observe and to trigger(emit) events of that type.
 */
export declare class EventProperty<T> implements EventProperty.Emitter<T> {
    private listeners;
    private firstTriggerPromise;
    private resolveFirstTriggerPromise;
    private rejectFirstTriggerPromise;
    private isFirstTriggerDone;
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
     * @param {EventProperty.Handler<T>} handler - callback to be called when an event is emitted
     * @param {Object} [context] - context to be used when calling handler. null by default.
     * @returns {EventProperty.ListenerId} - number, identifying new event listener.
     */
    on(handler: EventProperty.Handler<T>, context?: Object): EventProperty.ListenerId;
    /**
     * Adds a listener. This listener will be immediately removed after it's
     * invoked for the first time.
     *
     * @param {EventProperty.Handler<T>} handler - callback to be called when an event is emitted
     * @param {Object} [context] - context to be used when calling handler. null by default.
     * @returns {EventProperty.ListenerId} - number, identifying new event listener.
     */
    once(handler: EventProperty.Handler<T>, context?: Object): EventProperty.ListenerId;
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
     * @param {EventProperty.Handler<T>} handler - callback to be called when an event is emitted
     * @param {Object} [context] - context to be used when calling handler. null by default.
     * @returns {EventProperty.ListenerId} - number, identifying new event listener.
     *
     * @see objectMatch
     */
    match(value: T | RegExp, handler: EventProperty.Handler<T>, context?: Object): EventProperty.ListenerId;
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
     * @param {EventProperty.Handler<T>} handler - callback to be called when an event is emitted
     * @param {Object} [context] - context to be used when calling handler. null by default.
     * @returns {EventProperty.ListenerId} - number, identifying new event listener.
     *
     * @see PropertyEvent.match, PropertyEvent.once
     */
    matchOnce(value: T | RegExp, handler: EventProperty.Handler<T>, context?: Object): EventProperty.ListenerId;
    /**
     * "Pipes" EventProperty to other EventProperty. This means that whenever this event
     * is emitted it is passed to that other EventProperty which emits it too.
     *
     * @param {EventProperty<T>} other
     * @returns {EventProperty.ListenerId}
     */
    pipe(other: EventProperty<T>): EventProperty.ListenerId;
    /**
     * Pipe only events with matching argument to destination EventProperty.
     *
     * Note: what "matching" means is not documented well yet since it is subject to change.
     * For now you should assume that for plain types (boolean, number, string) it is
     * strict equality. For objects it is like deep strict equality except that actual
     * event argument may have more fields than match-value(proto). But all fields from
     * match-value must be present in event argument.
     *
     * @param {T|RegExp} matchValue - value to match
     * @param {EventProperty<T>} destination - target EventProperty
     * @returns {EventProperty.ListenerId}
     *
     * @see EventProperty.pipe, EventProperty.match
     */
    route(matchValue: T | RegExp, destination: EventProperty<T>): EventProperty.ListenerId;
    /**
     * Returns a promise which is resolved next time this event is emitted.
     * Works as a promisified version of 'once'.
     *
     * @returns {Promise<T>}
     *
     * @see EventProperty.once
     */
    next(): Promise<T>;
    /**
     * Stores promise which is resolved when this event is emitted for the first time.
     *
     * @returns {Promise<T>}
     */
    readonly first: Promise<T>;
    /**
     * Removes all listeners that were attached with given handler and without a context.
     * Note: it will never remove any listener that was attached with a context.
     *
     * @param {EventProperty.Handler<T>} handler - remove listeners having this handler
     */
    off(handler: EventProperty.Handler<T>): void;
    /**
     * Removes listeners that were attached with given handler and context.
     * Note: it will never remove any listener that was attached without a context.
     *
     * @param {EventProperty.Handler<T>} handler - remove listeners having this handler
     * @param {Object} [context] - remove only listeners having this context
     */
    off(handler: EventProperty.Handler<T>, context: Object): void;
    /**
     * Removes all listeners having this context
     *
     * @param {Object} context
     */
    off(context: Object): void;
    /**
     * Removes listener with given id.
     *
     * @param {EventProperty.ListenerId} id
     */
    off(id: EventProperty.ListenerId): void;
    /**
     * Remove pipes created for other EventProperty.
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
    /**
     * The callback format used for adding listeners to EventProperty.
     */
    interface Handler<T> {
        (eventArg: T): void;
    }
    /**
     * The format of the EventProperty.emit method.
     */
    interface EmitMethod<T> {
        (eventArg: T): void;
    }
    /**
     * The format of the EventProperty:emit method for T=void.
     */
    interface VoidEmitMethod {
        (): void;
    }
    /**
     * This type is used just to emphasize the meaning of the value.
     * Otherwise listeners ids are regular numbers.
     */
    type ListenerId = number;
    /**
     * This method is used just to emphasize the meaning of the value.
     * Otherwise we could just use typeof id === "number" directly.
     */
    function isListenerId(id: any): boolean;
    /**
     * The full configuration for a specific listener. It controls the way
     * the relevant event-handler function is invoked.
     */
    interface HandlerOptions<T> {
        /**
         * The actual handler function to be called when the event occurs.
         */
        handler: EventProperty.Handler<T>;
        /**
         * If this flag is set - the event handler will remove itself from
         * the event after first invocation.
         */
        once?: boolean;
        /**
         * If this field is specified, then handler will be called with that context.
         */
        context?: Object;
        /**
         * Always used in combination with following parameter 'matchValue' and is a
         * flag, which means(if set) that only event invocations with argument matching
         * 'matchValue' should be passed to the handler function.
         *
         * What "matching" means is not documented well yet since it is subject to change.
         * For now you may assume that for plain types (boolean, number, string) it is
         * strict equality.
         */
        onlyMatching?: boolean;
        /**
         * The value, to be matched if the 'onlyMatching' flag is set.
         */
        matchValue?: T | RegExp;
    }
    /**
     * This is the object which represents an existing handler internally in EventProperty object.
     *
     * EventProperty stores listeners as HandlerOptions + listenerId.
     */
    interface HandlerDescriptor<T> extends HandlerOptions<T> {
        id: ListenerId;
    }
    /**
     * An EventProperty interface without the 'emit' method.
     *
     * It is a good practice to provide public access to EventProperties in this form
     * and not in the original EventProperty form.
     * EventProperty usually relates to some class and only that class should be able to
     * trigger/emit the event. On the other hand anyone should be able to listen to this
     * event. This library offers special interface for this purpose and a few utility
     * functions (make, split. splitVoid).
     *
     * The idea is to create a private EventProperty member and public
     * EventProperty.Emitter getter which return that private member.
     * You don't have to do it if you think it's too cumbersome though.
     */
    interface Emitter<T> {
        /**
         * Adds a listener for this event type.
         *
         * @param {EventProperty.Handler<T>} handler - callback to be called when an event is emitted
         * @param {Object} [context] - context to be used when calling handler. null by default.
         * @returns {EventProperty.ListenerId} - number, identifying new event listener.
         */
        on(handler: EventProperty.Handler<T>, context?: Object): ListenerId;
        /**
         * Adds a listener for this event type. This listener will be immediately removed after it's
         * invoked for the first time.
         *
         * @param {EventProperty.Handler<T>} handler - callback to be called when an event is emitted
         * @param {Object} [context] - context to be used when calling handler. null by default.
         * @returns {EventProperty.ListenerId} - number, identifying new event listener.
         */
        once(handler: EventProperty.Handler<T>, context?: Object): ListenerId;
        /**
         * Adds a listener for this event type. This listener will be called only if event argument
         * matches given value.
         *
         * Note: what "matching" means is not documented well yet since it is subject to change.
         * For now you should assume that for plain types (boolean, number, string) it is
         * strict equality. For objects it is like deep strict equality except that actual
         * event argument may have more fields than match-value(proto). But all fields from
         * match-value must be present in event argument.
         *
         * @param {T|RegExp} value - handler is invoked only if event argument matches this value
         * @param {EventProperty.Handler<T>} handler - callback to be called when an event is emitted
         * @param {Object} [context] - context to be used when calling handler. null by default.
         * @returns {EventProperty.ListenerId} - number, identifying new event listener.
         */
        match(value: T | RegExp, handler: EventProperty.Handler<T>, context?: Object): ListenerId;
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
         * @param {EventProperty.Handler<T>} handler - callback to be called when an event is emitted
         * @param {Object} [context] - context to be used when calling handler. null by default.
         * @returns {EventProperty.ListenerId} - number, identifying new event listener.
         */
        matchOnce(value: T | RegExp, handler: EventProperty.Handler<T>, context?: Object): ListenerId;
        /**
         * "Pipes" EventProperty to other EventProperty. This means that whenever this event
         * is emitted it is passed to that other EventProperty which emits it too.
         *
         * @param {EventProperty<T>} other
         * @returns {EventProperty.ListenerId}
         */
        pipe(other: EventProperty<T>): EventProperty.ListenerId;
        /**
         * Pipe only events with matching argument to destination EventProperty.
         *
         * Note: what "matching" means is not documented well yet since it is subject to change.
         * For now you should assume that for plain types (boolean, number, string) it is
         * strict equality. For objects it is like deep strict equality except that actual
         * event argument may have more fields than match-value(proto). But all fields from
         * match-value must be present in event argument.
         *
         * @param {T|RegExp} matchValue - value to match
         * @param {EventProperty<T>} destination - target EventProperty
         * @returns {EventProperty.ListenerId}
         */
        route(matchValue: T | RegExp, destination: EventProperty<T>): EventProperty.ListenerId;
        /**
         * Returns a promise which is resolved next time this event is emitted.
         *
         * @returns {Promise<T>}
         */
        next(): Promise<T>;
        /**
         * Stores promise which is resolved when this event is emitted for the first time.
         *
         * @type {Promise<T>}
         */
        first: Promise<T>;
        /**
         * Removes all listeners that were attached with given handler and without a context.
         * Note: it will never remove any listener that was attached with a context.
         *
         * @param {EventProperty.Handler<T>} handler - remove listeners having this handler
         */
        off(handler: EventProperty.Handler<T>): void;
        /**
         * Removes listeners that were attached with given handler and context.
         * Note: it will never remove any listener that was attached without a context.
         *
         * @param {EventProperty.Handler<T>} handler - remove listeners having this handler
         * @param {Object} [context] - remove only listeners having this context
         */
        off(handler: EventProperty.Handler<T>, context: Object): void;
        /**
         * Removes all listeners having this context
         *
         * @param {Object} context
         */
        off(context: Object): void;
        /**
         * Removes listener with given id.
         *
         * @param {EventProperty.ListenerId} id
         */
        off(id: EventProperty.ListenerId): void;
        /**
         * Remove pipes created for other EventProperty.
         *
         * @param {EventProperty} destination
         */
        off(destination: EventProperty<T>): void;
        /**
         * Remove all listeners.
         */
        off(): void;
    }
    /**
     * Creates a pair: an EventProperty instance to be used internally in a class
     * and an Emitter-interface to be used as public / accessible property.
     * They both actually represent the same EventProperty object.
     *
     * returns {[EventProperty,EventProperty.Emitter<T>]}
     */
    function make<T>(): [EventProperty<T>, EventProperty.Emitter<T>];
    /**
     * Creates an EventProperty object and splits it into emitter-function and
     * Emitter-interface. Use emitter function to emit the event and Emitter-interface
     * to add and remove listeners of that event.
     *
     * returns {[EventProperty.EmitMethod<T>,EventProperty.Emitter<T>]}
     */
    function split<T>(): [EventProperty.EmitMethod<T>, EventProperty.Emitter<T>];
    /**
     * Creates an EventProperty object and splits it into emitter-function and
     * Emitter-interface. Special version for void-typed events.
     *
     * returns {[EventProperty.VoidEmitMethod,EventProperty.Emitter<T>]}
     */
    function splitVoid(): [EventProperty.VoidEmitMethod, EventProperty.Emitter<void>];
    /**
     * Special subclass of EventProperty for void type - allows calling emit without arguments.
     *
     * @extends {EventProperty}
     */
    class Void extends EventProperty<void> {
        constructor();
        /**
         * Emits an event invoking all listeners.
         *
         * @see {EventProperty.emit}
         */
        emit(): void;
    }
}
export default EventProperty;
