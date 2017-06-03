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

            if (typeof subject !== "object") return false;
            if (!proto || !subject) return !subject && !proto;
            if (traversalStack.includes(subject)) {
                throw new Error("Recursion!");
            }
            for (let key in proto) {
                if (proto.hasOwnProperty(key)) {
                    traversalStack.push(subject);
                    isMatching = isMatching && _objectMatch(subject[key], proto[key], traversalStack);
                    traversalStack.pop();
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


export namespace EventProperty {

    /**
     * The callback format used for adding listeners to event-properties.
     */
    export interface Handler<T> {
        (eventArg: T): void|Promise<any>;
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
        matchValue?: T;
    }

    /**
     * This is the object which represents an existing handler internally in Event object.
     */
    export interface HandlerDescriptor<T> extends HandlerOptions<T> {
        id: number;
    }

    /**
     * An event-property interface without the 'trigger' method.
     */
    export interface Emitter<T> {
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
export class EventProperty<T> implements EventProperty.Emitter<T> {
    private listeners: EventProperty.HandlerDescriptor<T>[] = [];
    private isBeingTriggered: boolean = false;

    private firstTriggerPromise: Promise<T> = null;
    private resolveFirstTriggerPromise: (value: T) => any;
    private rejectFirstTriggerPromise: (value: any) => any;
    private isFirstTriggerDone: boolean = false;

    private idCounter: number = 0;


    constructor() {

        this.firstTriggerPromise = new Promise((resolve: (value: T) => void, reject: (e: any) => void) => {
            this.resolveFirstTriggerPromise = resolve;
            this.rejectFirstTriggerPromise = reject;
        });

        this.trigger = this.trigger.bind(this);
    }

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
    trigger(eventArg?: T): Promise<void> {
        if (this.isBeingTriggered) {
            throw new Error(`Event triggered during trigger handling - suspecting recursive event.`);
        }
        this.isBeingTriggered = true;
        if (!this.isFirstTriggerDone) {
            this.isFirstTriggerDone = true;
            this.resolveFirstTriggerPromise(eventArg);
        }
        return Promise.all(this.listeners.slice().map((listener: EventProperty.HandlerDescriptor<T>) => {
            let doCall = true;
            let cbReturn: Promise<any> | void;
            if (listener.onlyMatching) {
                doCall = objectMatch(eventArg, listener.matchValue);
            }
            if (doCall) {
                if (listener.context) {
                    cbReturn = listener.handler.call(listener.context, eventArg);
                } else {
                    cbReturn = listener.handler.call(null, eventArg);
                }
                if (listener.once) {
                    this.removeListener(listener);
                }
                if (!(cbReturn instanceof Promise)) cbReturn = Promise.resolve(cbReturn);
            } else {
                cbReturn = Promise.resolve();
            }
            return cbReturn;
        })).then(() => {
            this.isBeingTriggered = false;
        });
    }

    /**
     * Adds a listener. If once=true then adds once listener which means that listener will be removed,
     * when event triggers for the first time. Also if event already was triggered for the first time
     * when you call 'add()' then once listener will not be added but instead invoked immidiately,
     * with argument, that event was triggered with the first time.
     */
    on(handler: EventProperty.Handler<T>, context?: Object): number {
        return this.addListener({ handler, context });
    }

    /**
     * Adds a listener to the event
     */
    once(handler: EventProperty.Handler<T>, context: Object = null): number {
        return this.addListener({ context, handler, once: true });
    }

    /**
     * Adds a listener, which will be invoked only if the event-argument is deeply-equal to
     * the given value.
     */
    match(value: T, handler: EventProperty.Handler<T>, context?: Object): number {
        return this.addListener({ handler, context, onlyMatching: true, matchValue: value });
    }

    /**
     * Combines 'match' and 'once' features.
     */
    matchOnce(value: T, handler: EventProperty.Handler<T>, context: Object = null): number {
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
    off(id: number): void;
    off(): void;
    off(...args: any[]): void {
        let context: Object = null,
            handler: EventProperty.Handler<T> = null,
            idToRemove: number = null;
        switch (args.length) {
            case 0: // No arguments - clear all listeners 
                this.listeners = [];
                return;
            case 1:
                if (typeof args[0] === "number") {
                    idToRemove = args[0];
                } else if (typeof args[0] === "function") {
                    handler = args[0];
                    context = null;
                } else if (typeof args[0] === "object") {
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

    first(): Promise<T|void> {
        return this.firstTriggerPromise;
    }

    /**
     * Piping the events means that the other event must be triggered(happen) any time
     * this event happens and with exactly the same argument.
     */
    pipe(other: EventProperty<T>): void {
        this.on(other.trigger);
    }

    unpipe(other: EventProperty<T>): void {
        this.off(other.trigger);
    }

    private removeListener(listener: EventProperty.HandlerDescriptor<T>): void {
        let listenerIndex = this.listeners.indexOf(listener);
        if (listenerIndex !== -1) {
            this.listeners.splice(listenerIndex, 1);
        }
    }

    private addListener(options: EventProperty.HandlerOptions<T>): number {
        let {context, handler, once, onlyMatching, matchValue} = options;
        this.idCounter++;
        this.listeners.push({context, handler, once, id: this.idCounter, onlyMatching, matchValue});
        return this.idCounter;
    }
}

export default EventProperty;