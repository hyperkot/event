/// <reference path="../typings/index.d.ts" />
export declare namespace EventProperty {
    /**
     * The callback format used for adding listeners to event-properties.
     */
    interface Handler<T> {
        (eventArg: T): void | Promise<any>;
    }
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
        matchValue?: T;
    }
    /**
     * This is the object which represents an existing handler internally in Event object.
     */
    interface HandlerDescriptor<T> extends HandlerOptions<T> {
        id: number;
    }
    /**
     * An event-property interface without the 'trigger' method.
     */
    interface Emitter<T> {
        /**
         * Add event handler to this event. Optionally pass a context in second argument -
         * then when triggered this  event will call the 'h' handler with the given context.
         */
        on(h: EventProperty.Handler<T>, context?: Object): number;
        once(h: EventProperty.Handler<T>, context?: Object): number;
        /**
         * Add event handler to this event, which will be called only when event is triggered
         * with value, which is exactly(===) the same as the one you pass to the match
         * method as first argument
         */
        match(value: T, h: EventProperty.Handler<T>, context?: Object): number;
        /**
         * Adds an event handler.
         * Combines the 'once' and the 'match' behaviours.
         */
        matchOnce(value: T, handler: EventProperty.Handler<T>, context?: Object): number;
        /**
         * An alias for unlisten
         */
        off(handler: EventProperty.Handler<T>, context?: Object): void;
        off(context: Object): void;
        off(id: number): void;
        off(): void;
        /**
         * Piping the event to another one means that whenever the first one is triggered - the
         * second one is triggered automatically with exactly the same argument
         */
        pipe(other: EventProperty.Emitter<T>): void;
        unpipe(other: EventProperty.Emitter<T>): void;
        first(): Promise<T>;
        next(): Promise<T>;
    }
}
/**
 * Represents an event and provides methods to observe it and to trigger it.
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
     * Triggers the event with given argument, invoking all of its handlers, and if
     * the event is triggered for the first time - removing the once event handlers and
     * saving given argument inertnally as first trigger argument.
     *
     * The argument is optional, since event can be of void type (`x= new Event<void>()`),
     * but if the event is not of a void type - you should allways pass an argument to
     * the trigger method.
     *
     * Trigger method returns a promise, which is resolved() whe all results of calling
     * callbacks are resolved.
     */
    trigger(eventArg?: T): Promise<void>;
    /**
     * Adds a listener. If once=true then adds once listener which means that listener will be removed,
     * when event triggers for the first time. Also if event already was triggered for the first time
     * when you call 'add()' then once listener will not be added but instead invoked immidiately,
     * with argument, that event was triggered with the first time.
     */
    on(handler: EventProperty.Handler<T>, context?: Object): number;
    /**
     * Adds a listener to the event
     */
    once(handler: EventProperty.Handler<T>, context?: Object): number;
    /**
     * Adds a listener, which will be invoked only if the event-argument is deeply-equal to
     * the given value.
     */
    match(value: T, handler: EventProperty.Handler<T>, context?: Object): number;
    /**
     * Combines 'match' and 'once' features.
     */
    matchOnce(value: T, handler: EventProperty.Handler<T>, context?: Object): number;
    /**
     * Remove a listener(s). When no context given removes all listeners that were attached
     * without a context. When a context is given removes only listeners that were attached with
     * that context and doesn't remove any listeners that were attached without a context.
     */
    off(handler: EventProperty.Handler<T>, context?: Object): void;
    off(context: Object): void;
    off(id: number): void;
    off(): void;
    next(): Promise<T | void>;
    first(): Promise<T | void>;
    /**
     * Piping the events means that the other event must be triggered(happen) any time
     * this event happens and with exactly the same argument.
     */
    pipe(other: EventProperty<T>): void;
    unpipe(other: EventProperty<T>): void;
    private removeListener(listener);
    private addListener(options);
}
export default EventProperty;
