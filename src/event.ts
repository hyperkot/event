/// <reference path="../typings/index.d.ts"/>

/**
 * Represents a certain type of events.
 * Provides methods to observe and to trigger(emit) events of that type.
 */
export class EventProperty<T> implements EventProperty.Emitter<T> {
    private listeners: EventProperty.HandlerDescriptor<T>[] = [];

    private firstTriggerPromise: Promise<T> = null;
    private resolveFirstTriggerPromise: (value: T) => any;
    private rejectFirstTriggerPromise: (value: any) => any;
    private isFirstTriggerDone: boolean = false;

    private idCounter: EventProperty.ListenerId = 0;


    constructor() {

        this.firstTriggerPromise = new Promise((resolve: (value: T) => void, reject: (e: any) => void) => {
            this.resolveFirstTriggerPromise = resolve;
            this.rejectFirstTriggerPromise = reject;
        });

        this.emit = this.emit.bind(this);
    }

    /**
     * This typedef is used to describe type-parameter T for jsdoc parser.
     *
     * @typedef {any} T;
     */

    /**
     * Emits event with given argument. This invokes all appropriate handlers.
     *
     * @param {T} eventArg
     */
    emit(eventArg: T): void {
        let resolveFirstTimeTrigger: boolean = false;
        let toInvoke: EventProperty.HandlerDescriptor<T>[];

        if (!this.isFirstTriggerDone) {
            this.isFirstTriggerDone = true;
            resolveFirstTimeTrigger = true;
        }

        toInvoke = this.listeners.slice().filter((listener: EventProperty.HandlerDescriptor<T>) => {
            let shouldInvoke = !listener.onlyMatching || objectMatch(eventArg, listener.matchValue);
            if (listener.once) {
                this.removeListener(listener);
            }
            return shouldInvoke;
        });

        toInvoke.forEach((listener: EventProperty.HandlerDescriptor<T>) => {
            if (listener.context) {
                listener.handler.call(listener.context, eventArg);
            } else {
                listener.handler.call(null, eventArg);
            }
        });

        if (resolveFirstTimeTrigger) {
            this.resolveFirstTriggerPromise(eventArg);
        }
    }

    /**
     * Adds a listener for this event type.
     *
     * @param {EventProperty.Handler<T>} handler - callback to be called when an event is emitted
     * @param {Object} [context] - context to be used when calling handler. null by default.
     * @returns {EventProperty.ListenerId} - number, identifying new event listener.
     */
    on(handler: EventProperty.Handler<T>, context?: Object): EventProperty.ListenerId {
        return this.addListener({ handler, context });
    }

    /**
     * Adds a listener for this event type. This listener will be immediately removed after it's
     * invoked for the first time.
     *
     * @param {EventProperty.Handler<T>} handler - callback to be called when an event is emitted
     * @param {Object} [context] - context to be used when calling handler. null by default.
     * @returns {EventProperty.ListenerId} - number, identifying new event listener.
     */
    once(handler: EventProperty.Handler<T>, context: Object = null): EventProperty.ListenerId {
        return this.addListener({ context, handler, once: true });
    }

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
    match(value: T|RegExp, handler: EventProperty.Handler<T>, context?: Object): EventProperty.ListenerId {
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
     * @param {EventProperty.Handler<T>} handler - callback to be called when an event is emitted
     * @param {Object} [context] - context to be used when calling handler. null by default.
     * @returns {EventProperty.ListenerId} - number, identifying new event listener.
     */
    matchOnce(value: T|RegExp, handler: EventProperty.Handler<T>, context: Object = null): EventProperty.ListenerId {
         return this.addListener({
             context,
             handler,
             once: true,
             onlyMatching: true,
             matchValue: value
        });
    }

    /**
     * "Pipes" EventProperty to other EventProperty. This means that whenever this event
     * is emitted it is passed to that other EventProperty which emits it too.
     *
     * @param {EventProperty<T>} other
     * @returns {EventProperty.ListenerId}
     */
    pipe(other: EventProperty<T>): EventProperty.ListenerId {
        return this.on(other.emit);
    }

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
    route(matchValue: T|RegExp, destination: EventProperty<T>): EventProperty.ListenerId {
        return this.match(matchValue, destination.emit);
    }

    /**
     * Returns a promise which is resolved next time this event is emitted.
     *
     * @returns {Promise<T>}
     */
    next(): Promise<T> {
        return new Promise((resolve: (a: T) => void, reject: (e: any) => void) => {
            try {
                this.once(resolve);
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Stores promise which is resolved when this event is emitted for the first time.
     *
     * @returns {Promise<T>}
     */
    get first(): Promise<T> {
        return this.firstTriggerPromise;
    }

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

    off(...args: any[]): void {
        let context: Object = null,
            handler: EventProperty.Handler<T> = null,
            idToRemove: EventProperty.ListenerId = null;
        switch (args.length) {
            case 0: // No arguments - clear all listeners
                this.listeners = [];
                return;
            case 1:
                if (EventProperty.isListenerId(args[0])) {
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

        this.listeners = this.listeners.filter((hConf: EventProperty.HandlerDescriptor<T>) => {
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


    private removeListener(listener: EventProperty.HandlerDescriptor<T>): void {
        let listenerIndex = this.listeners.indexOf(listener);
        if (listenerIndex !== -1) {
            this.listeners.splice(listenerIndex, 1);
        }
    }

    private addListener(options: EventProperty.HandlerOptions<T>): EventProperty.ListenerId {
        let {context, handler, once, onlyMatching, matchValue} = options;
        this.idCounter++;
        this.listeners.push({context, handler, once, id: this.idCounter, onlyMatching, matchValue});
        return this.idCounter;
    }
}

export namespace EventProperty {

    /**
     * The callback format used for adding listeners to EventProperty.
     */
    export interface Handler<T> {
        (eventArg: T): void;
    }

    /**
     * The format of the EventProperty:emit method.
     */
    export interface EmitMethod<T> {
        (eventArg: T): void;
    }

    /**
     * The format of the EventProperty:emit method for T=void.
     */
    export interface VoidEmitMethod {
        (): void;
    }

    /**
     * This type is used just to emphasize the meaning of the value.
     * Otherwise listeners ids are regular numbers.
     */
    export type ListenerId = number;

    /**
     * This method is used just to emphasize the meaning of the value.
     * Otherwise we could just use typeof id === "number" directly.
     */
    export function isListenerId(id: any) {
        return typeof id === "number";
    }

    /**
     * The full configuration for a specific listener. It controls the way
     * the relevant event-handler function is invoked.
     */
    export interface HandlerOptions<T> {
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
        matchValue?: T|RegExp;
    }

    /**
     * This is the object which represents an existing handler internally in EventProperty object.
     *
     * EventProperty stores listeners as HandlerOptions + listenerId.
     */
    export interface HandlerDescriptor<T> extends HandlerOptions<T> {
        id: ListenerId;
    }

    /**
     * An EventProperty interface without the 'emit' method.
     *
     * It is a good practice to provide public access to EventProperties in this form
     * and not in the original EventProperty form.
     * EventProperty usual relates to some class and only that class should be able to
     * trigger/emit the event. On the other hand anyone should be able to listen to this
     * event. This library offers special interface for this purpose and a few utility
     * functions (make, split. splitVoid).
     *
     * The idea is to create a private EventProperty member and public
     * EventProperty.Emitter getter which return that private member.
     * You don't have to do it if you think it's too cumbersome though.
     */
    export interface Emitter<T> {
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
        match(value: T|RegExp, handler: EventProperty.Handler<T>, context?: Object): ListenerId;

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
        matchOnce(value: T|RegExp, handler: EventProperty.Handler<T>, context?: Object): ListenerId;

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
        route(matchValue: T|RegExp, destination: EventProperty<T>): EventProperty.ListenerId;

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
     * @returns {[EventProperty,EventProperty.Emitter<T>]}
     */
    export function make<T>(): [EventProperty<T>, EventProperty.Emitter<T>] {
        let eventProp = new EventProperty<T>();
        return [eventProp, <EventProperty.Emitter<T>>eventProp];
    }

    /**
     * Creates an EventProperty object and splits it into emitter-function and
     * Emitter-interface. Use emitter function to emit the event and Emitter-interface
     * to add and remove listeners of that event.
     *
     * @returns {[EventProperty.EmitMethod<T>,EventProperty.Emitter<T>]}
     */
    export function split<T>(): [EventProperty.EmitMethod<T>, EventProperty.Emitter<T>] {
        let eventProp = new EventProperty<T>();
        return [eventProp.emit, <EventProperty.Emitter<T>>eventProp];
    }

    /**
     * Creates an EventProperty object and splits it into emitter-function and
     * Emitter-interface. Special version for void-typed events.
     */
    export function splitVoid(): [EventProperty.VoidEmitMethod, EventProperty.Emitter<void>] {
        let eventProp = new EventProperty.Void();
        let emitter = <EventProperty.Emitter<void>>eventProp;
        return [eventProp.emit, emitter];
    }

    /**
     * Special subclass of EventProperty for void type - allows calling emit without arguments.
     */
    export class Void extends EventProperty<void> {
        constructor() {
            super();
        }

        /**
         * Emits an event invoking all listeners.
         */
        emit() { return super.emit(void 0); }
    }
}


/**
 * Used in EventProperty.match/matchOnce/route methods to compare event argument with given value.
 * Note: subject to change.
 *
 * @param {any} subject - actual event argument
 * @param {any} proto - value to match
 * @returns {boolean}
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