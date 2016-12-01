/// <reference path="../typings/index.d.ts"/>

/**
 * A function, callback, which is called, when subject event occurs.
 * It is called with a single argument - it is the same argument that was passed to the
 * "trigger()" method call, which is the only way to make event "happen".
 */
export interface EventHandler<T> {
    (eventArg: T): void;
}

/**
 * The full configuration for a specific event-handler. It controls the way
 * the relevant event-handler function is invoked.
 */
export interface EventHandlerOptions<T> {
    /** The actual handler function to be called when the event occurs. */
    handler: EventHandler<T>;

    /** If this flag is set - the event handler will remove itself from the event
    after first invocation. */
    once?: boolean;

    /** If this field is specified, then handler will be called with that context. */
    context?: Object;

    /** The name of the event handler. Used for identification. You may create two
     * listeners, with same handler function, but different names - so that later,
     * you can 'off'/'unlisten' a specific listener by name, while unlistening by
     * handler function would've removed both listener.
     */
    name?: string;

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
export interface EventHandlerDescriptor<T> extends EventHandlerOptions<T> {
    id: number;
}

/**
 * The interface for the 'event.trigger()' method
 */
export interface EventTriggerer<T> {
    (arg: T): void;
}

/**
 * The interface for the 'event.listen()' method
 */
export interface EventListener<T> {
    (handler: EventHandler<T>, context?: Object): void;
    (name: string, h: EventHandler<T>, context?: Object): void;
}

/**
 * The interface for the 'event.unlisten()' method
 */
export interface EventUnlistener<T> {
    (handler: EventHandler<T>, context?: Object): void;
    (context: Object): void;
    (name: string): void;
    (): void;
}

/**
 * The interface for the 'event.once()' method
 */
export interface EventOncer<T> {
    (handler: EventHandler<T>, context?: Object): void;
}

/**
 * The interface for the 'event.match()' method
 */
export interface EventMatchListener<T> {
    (value: T, handler: EventHandler<T>, context?: Object): void;
    (value: T, name: string, h: EventHandler<T>, context?: Object): void;
}

/**
 * The interface for the 'event.matchOnce()' method
 */
export interface EventMatchOncer<T> {
    (value: T, handler: EventHandler<T>, context?: Object): void;
}

/**
 * The interface for the 'event.when()' method
 */
export interface EventWhener<T> {
    (): Promise<T>;
}

/**
 * The interface for the 'event.then()' method
 */
export interface EventThener<T> {
    (onOk: Function, onFail: Function): Promise<T>;
}

/**
 * The interface for the 'event.catch()' method
 */
export interface EventCatcher<T> {
    (onFail: (err: any) => T|any): Promise<T>;
}

/**
 * In context of this library, an 'event-emitter' means the same as 'event/event-object',
 * except there is not triggering methods in event-emitter. Event emitter is
 * definition of the interface of the event which should be accessible by external
 * entities. The trigger method is considered to be internal to the object, which this
 * event belongs to. So only the object itself should be able to trigger its own events,
 * not any external object.
 * 
 * The common pattern i use is this:
 * - define a private/protected event property, explicitly named 'eventBlabla'
 * - define a public getter, returning EventEmitter, and named without the event prefix:
 * 
 *      class SomeAwesomeClass {
 *          private eventBlabla: Event<any> = new Event<any>();
 *          public get blabla(): EventEmitter<any> { return this.eventBlabla; }
 *          public doSomething() {
 *              eventBlabla.trigger('yet another blabla'); // blabla happened!
 *          };
 *      } 
 * 
 *      let x = new SomeAwesomeClass();
 *      x.blabla.listen(() => console.log('blablabla!'));
 * 
 */
export interface EventEmitter<T> extends Thenable<T> {
    /**
     * Add event handler to this event. Optionally pass a context in second argument - 
     * then when triggered this  event will call the 'h' handler with the given context.
     */
    listen(h: EventHandler<T>, context?: Object): number;
    listen(name: string, h: EventHandler<T>, context?: Object): number;
    /**
     * Add event handler to this event, which will be called only when event is triggered
     * with value, which is exactly(===) the same as the one you pass to the match 
     * method as first argument
     */
    match(value: T, h: EventHandler<T>, context?: Object): number;
    match(value: T, name: string, h: EventHandler<T>, context?: Object): number;

    /**
     * Adds an event handler.
     * Combines the 'once' and the 'match' behaviours.
     */
    matchOnce(value: T, handler: EventHandler<T>, context?: Object): number;

    /**
     * An alias for the listen method.
     */
    on(h: EventHandler<T>, context?: Object): number;
    on(name: string, h: EventHandler<T>, context?: Object): number;

    /**
     * An event actually fully implements a promise interface. That promise interface
     * refers to the first time the event is triggered. So when you trigger any event
     * for the first time - as a promise it is resolved with the value you pass to
     * trigger method call.
     * 
     * The after method is a shortcut-helper - it just uses given handler on promise
     * as both a 'then' and a 'catch' handler.
     * 
     */
    after(onResolve: (result: T|any) => any): Thenable<T>;

    /**
     * Removes an event handler or several. Which handlers get removed depends on the arguments.
     */
    unlisten(handler: EventHandler<T>, context?: Object): void;
    unlisten(context: Object): void;
    unlisten(name: string): void;
    unlisten(id: number): void;
    unlisten(): void;

    /**
     * An alias for unlisten
     */
    off(handler: EventHandler<T>, context?: Object): void;
    off(context: Object): void;
    off(name: string): void;
    off(id: number): void;
    off(): void;

    /**
     * Piping the event to another one means that whenever the first one is triggered - the
     * second one is triggered automatically with exactly the same argument
     */
    pipe(other: EventEmitter<T>): void;

    once(h: EventHandler<T>, context?: Object): number;

    when(): Promise<T>;
}

/**
 * This interface describes any object, supporting event(i mean event from this lib) functionality.
 * It can be an Event, an instance of class which inherits Event, or an object that was augmented
 * with `Event.mixin` method.
 */
export interface EventTrait<T> extends EventEmitter<T> {
    trigger(arg: T): void;

    getTriggerer(): EventTriggerer<T>;
}

export interface Thenable<T> {
    then(onResolve: (result: T) => any, onReject?: (error: Error|any) => any): Thenable<T>;
    catch(onReject: (error: Error|any) => any): Thenable<T>;
}