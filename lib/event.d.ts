/// <reference path="../typings/index.d.ts" />
/**
 * Represents an event and provides methods to observe it and to trigger(emit) it.
 */
export declare class EventProperty<T> implements EventProperty.Emitter<T> {
    private listeners;
    private isBeingTriggered;
    private firstTriggerPromise;
    private resolveFirstTriggerPromise;
    private rejectFirstTriggerPromise;
    private isFirstTriggerDone;
    private idCounter;
    constructor();
    /**
     * Emits the event with given argument, invoking all of its handlers, and if
     * the event is triggered for the first time - removing the once event handlers and
     * saving given argument internally as first emit argument.
     *
     * The argument is optional, since event can be of void type (`x= new Event<void>()`),
     * but if the event is not of a void type - you should always pass an argument to
     * the emit method.
     */
    emit(eventArg: T): void;
    /**
     * Adds a listener. If once=true then adds once listener which means that listener will be removed,
     * when event triggers for the first time. Also if event already was triggered for the first time
     * when you call 'add()' then once listener will not be added but instead invoked immediately,
     * with argument, that event was triggered with the first time.
     */
    on(handler: EventProperty.Handler<T>, context?: Object): EventProperty.ListenerId;
    /**
     * Adds a listener to the event
     */
    once(handler: EventProperty.Handler<T>, context?: Object): EventProperty.ListenerId;
    /**
     * Adds a listener, which will be invoked only if the event-argument is deeply-equal to
     * the given value.
     */
    match(value: T | RegExp, handler: EventProperty.Handler<T>, context?: Object): EventProperty.ListenerId;
    /**
     * Combines 'match' and 'once' features.
     */
    matchOnce(value: T, handler: EventProperty.Handler<T>, context?: Object): EventProperty.ListenerId;
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
    next(): Promise<T | void>;
    first(): Promise<T | void>;
    /**
     * Piping the events means that the other event must be triggered(happen) any time
     * this event happens and with exactly the same argument.
     */
    pipe(other: EventProperty<T>): EventProperty.ListenerId;
    /**
     * Pipe only events with matching argument to destination event-property.
     * @param value
     * @param destination
     * @returns {EventProperty.ListenerId}
     */
    route(value: T | RegExp, destination: EventProperty<T>): EventProperty.ListenerId;
    private removeListener(listener);
    private addListener(options);
}
export declare namespace EventProperty {
    /**
     * The callback format used for adding listeners to event-properties.
     */
    interface Handler<T> {
        (eventArg: T): void;
    }
    type ListenerId = number;
    function isListenerId(id: any): boolean;
    /**
     * The full configuration for a specific event-handler. It controls the way
     * the relevant event-handler function is invoked.
     */
    interface HandlerOptions<T> {
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
        matchValue?: T | RegExp;
    }
    /**
     * This is the object which represents an existing handler internally in Event object.
     */
    interface HandlerDescriptor<T> extends HandlerOptions<T> {
        id: ListenerId;
    }
    /**
     * An event-property interface without the 'emit' method.
     */
    interface Emitter<T> {
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
        match(value: T, h: EventProperty.Handler<T>, context?: Object): ListenerId;
        /**
         * Adds an event handler.
         * Combines the 'once' and the 'match' behaviours.
         */
        matchOnce(value: T, handler: EventProperty.Handler<T>, context?: Object): ListenerId;
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
        first(): Promise<T>;
        next(): Promise<T>;
    }
    function make<T>(): [EventProperty<T>, EventProperty.Emitter<T>];
    function split<T>(): [(arg: T) => void, EventProperty.Emitter<T>];
    function splitVoid(): [() => void, EventProperty.Emitter<void>];
    class Void extends EventProperty<void> {
        constructor();
        emit(): void;
    }
}
export default EventProperty;
