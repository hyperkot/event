/// <reference path="../typings/index.d.ts"/>

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
function objectMatch(subject: any, proto: any): boolean {
    return _objectMatch(subject, proto);
}

/**
 * Represents an event and provides methods to observe it and to trigger(emit) it.
 */
export class EventProperty<T> implements EventProperty.Emitter<T> {
    private listeners: EventProperty.HandlerDescriptor<T>[] = [];
    private isBeingTriggered: boolean = false;

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
     * Emits the event with given argument, invoking all of its handlers, and if
     * the event is triggered for the first time - removing the once event handlers and
     * saving given argument internally as first emit argument.
     * 
     * The argument is optional, since event can be of void type (`x= new Event<void>()`),
     * but if the event is not of a void type - you should always pass an argument to
     * the emit method.
     */
    emit(eventArg: T): void {
        let resolveFirstTimeTrigger: boolean = false;
        let toInvoke: EventProperty.HandlerDescriptor<T>[];

        if (this.isBeingTriggered) {
            throw new Error(`Event triggered during trigger handling - suspecting recursive event.`);
        }

        this.isBeingTriggered = true;
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
        this.isBeingTriggered = false;
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
     * Adds a listener. If once=true then adds once listener which means that listener will be removed,
     * when event triggers for the first time. Also if event already was triggered for the first time
     * when you call 'add()' then once listener will not be added but instead invoked immediately,
     * with argument, that event was triggered with the first time.
     */
    on(handler: EventProperty.Handler<T>, context?: Object): EventProperty.ListenerId {
        return this.addListener({ handler, context });
    }

    /**
     * Adds a listener to the event
     */
    once(handler: EventProperty.Handler<T>, context: Object = null): EventProperty.ListenerId {
        return this.addListener({ context, handler, once: true });
    }

    /**
     * Adds a listener, which will be invoked only if the event-argument is deeply-equal to
     * the given value.
     */
    match(value: T|RegExp, handler: EventProperty.Handler<T>, context?: Object): EventProperty.ListenerId {
        return this.addListener({ handler, context, onlyMatching: true, matchValue: value });
    }

    /**
     * Combines 'match' and 'once' features.
     */
    matchOnce(value: T, handler: EventProperty.Handler<T>, context: Object = null): EventProperty.ListenerId {
         return this.addListener({
             context,
             handler,
             once: true,
             onlyMatching: true,
             matchValue: value
        });
    }
    /**
     * Remove a listener(s). When no context given removes all listeners that were attached
     * without a context. When a context is given removes only listeners that were attached with
     * that context and doesn't remove any listeners that were attached without a context.
     */
    off(handler: EventProperty.Handler<T>, context?: Object): void;
    off(context: Object): void;
    off(id: EventProperty.ListenerId): void;
    off(destination: EventProperty<T>): void;
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

    next(): Promise<T|void> {
        return new Promise((resolve: (a: T) => void, reject: (e: any) => void) => {
            try {
                this.once(resolve);
            } catch (e) {
                reject(e);
            }
        });
    }

    get first(): Promise<T|void> {
        return this.firstTriggerPromise;
    }

    /**
     * Piping the events means that the other event must be triggered(happen) any time
     * this event happens and with exactly the same argument.
     */
    pipe(other: EventProperty<T>): EventProperty.ListenerId {
        return this.on(other.emit);
    }

    /**
     * Pipe only events with matching argument to destination event-property.
     * @param value
     * @param destination
     * @returns {EventProperty.ListenerId}
     */
    route(value: T|RegExp, destination: EventProperty<T>): EventProperty.ListenerId {
        return this.match(value, destination.emit);
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
     * The callback format used for adding listeners to event-properties.
     */
    export interface Handler<T> {
        (eventArg: T): void;
    }

    export type ListenerId = number;

    export function isListenerId(id: any) {
        return typeof id === "number";
    }

    /**
     * The full configuration for a specific event-handler. It controls the way
     * the relevant event-handler function is invoked.
     */
    export interface HandlerOptions<T> {
        /** The actual handler function to be called when the event occurs. */
        handler: EventProperty.Handler<T>;

        /** If this flag is set - the event handler will remove itself from the event
         after first invocation. */
        once?: boolean;

        /** If this field is specified, then handler will be called with that context. */
        context?: Object;

        /**
         * Always used in combination with following parameter 'matchValue' and is a
         * flag, which means(if set) that only event invocations with argument equal
         * to that predefined 'matchValue' should be passed to the handler function.
         * Basically this is a shorthand for the code like this:
         *
         *  event.listen((arg) => {
         *      if(arg === matchValue)) event.callHandler();
         * });
         *
         * @type {[type]}
         */
        onlyMatching?: boolean;

        /**
         * The value, to be matched if the 'onlyMatching' flag is set.
         * @type {[type]}
         */
        matchValue?: T|RegExp;
    }

    /**
     * This is the object which represents an existing handler internally in Event object.
     */
    export interface HandlerDescriptor<T> extends HandlerOptions<T> {
        id: ListenerId;
    }

    /**
     * An event-property interface without the 'emit' method.
     */
    export interface Emitter<T> {
        /**
         * Add event handler to this event. Optionally pass a context in second argument -
         * then when triggered this  event will call the 'h' handler with the given context.
         */
        on(handler: EventProperty.Handler<T>, context?: Object): ListenerId;

        once(handler: EventProperty.Handler<T>, context?: Object): ListenerId;

        /**
         * Add event handler to this event, which will be called only when event is triggered
         * with value, which is exactly(===) the same as the one you pass to the match
         * method as first argument
         */
        match(value: T|RegExp, h: EventProperty.Handler<T>, context?: Object): ListenerId;

        /**
         * Adds an event handler.
         * Combines the 'once' and the 'match' behaviours.
         */
        matchOnce(value: T|RegExp, handler: EventProperty.Handler<T>, context?: Object): ListenerId;

        /**
         * An alias for unlisten
         */
        off(handler: EventProperty.Handler<T>, context?: Object): void;
        off(context: Object): void;
        off(id: ListenerId): void;
        off(destination: EventProperty.Emitter<T>): void;
        off(): void;

        /**
         * Piping the event to another one means that whenever the first one is triggered - the
         * second one is triggered automatically with exactly the same argument
         */
        pipe(destination: EventProperty.Emitter<T>): ListenerId;
        route(value: T|RegExp, destination: EventProperty.Emitter<T>): ListenerId;

        first: Promise<T>;
        next(): Promise<T>;
    }

    export function make<T>(): [EventProperty<T>, EventProperty.Emitter<T>] {
        let eventProp = new EventProperty<T>();
        let emitter = <EventProperty.Emitter<T>>eventProp;
        return [eventProp, emitter];
    }

    export function split<T>(): [(arg: T) => void, EventProperty.Emitter<T>] {
        let eventProp = new EventProperty<T>();
        let emitter = <EventProperty.Emitter<T>>eventProp;
        return [eventProp.emit, emitter];
    }

    export function splitVoid(): [() => void, EventProperty.Emitter<void>] {
        let eventProp = new EventProperty.Void();
        let emitter = <EventProperty.Emitter<void>>eventProp;
        return [eventProp.emit, emitter];
    }

    export class Void extends EventProperty<void> {
        constructor() {
            super();
        }
        emit() { return super.emit(void 0); }
    };
}

export default EventProperty;