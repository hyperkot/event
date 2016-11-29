/// <reference path="../typings/index.d.ts"/>

import * as _ from 'lodash';

/**
 * A function, callback, which is called, when subject event occurs.
 * It is called with a single argument - it is the same argument that was passed to the
 * "trigger()" method call, which is the only way to make event "happen".
 */
export interface EventHandler<T> {
    (eventArg: T): void
}

/**
 * The full configuration for a specific event-handler. It controls the way
 * the relevant event-handler function is invoked.
 */
interface EventHandlerOptions<T> {
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
interface EventHandlerDescriptor<T> extends EventHandlerOptions<T> {
    id: number;
}

/**
 * The interface for the 'event.trigger()' method
 */
export interface EventTriggerer<T> {
    (arg: T): void
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
    (handler: EventHandler<T>, context?: Object): void
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
    (onFail: (err:any) => T|any): Promise<T>;
}

/**
 * In context of this library, an 'event-emitter' means the same as 'event/event-object',
 * except there is not triggering methods in event-emitter. Event emitter is
 * definition of the interface of the event which should be accessible by external
 * entity. The trigger method is considered to be internal to the object, which this
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
    after(onResolve: (result: T|any)=>any): Thenable<T>;

    unlisten(handler: EventHandler<T>, context?: Object): void;
    unlisten(context: Object): void;
    unlisten(name: string): void;
    unlisten(id: number): void;
    unlisten(): void;
    off(handler: EventHandler<T>, context?: Object): void;
    off(context: Object): void;
    off(name: string): void;
    off(id: number): void;
    off(): void;

    pipe(other: EventEmitter<T>): void;

    once(h: EventHandler<T>, context?: Object): number;

    when(): Promise<T>;
}

export interface EventTrait<T> extends EventEmitter<T> {
    trigger(arg: T): void;

    getTriggerer(): EventTriggerer<T>;
}

export interface EventTraitTrigger<T> extends EventTrait<T> {
    (arg: T): void;
}

export interface EventTraitedMethod<MethodT extends ()=>void, EventArgsT> extends EventTrait<EventArgsT> {
}

export interface Thenable<T> {
    then(onResolve: (result: T)=>any, onReject?: (error: Error|any)=>any): Thenable<T>;
    catch(onReject: (error: Error|any)=>any): Thenable<T>;
} 

export class Event<T> implements EventTrait<T>, Thenable<T> {
    private listeners: EventHandlerDescriptor<T>[] = [];
    private isBeingTriggered: boolean = false;

    private triggerDelegate: EventTriggerer<T> = null;

    private listenDelegate: EventListener<T> = null;
    private matchDelegate: EventMatchListener<T> = null;
    private matchOnceDelegate: EventMatchOncer<T> = null;
    private unlistenDelegate: EventUnlistener<T> = null;

    private onceDelegate: EventOncer<T> = null;

    private whenDelegate: EventWhener<T> = null;

    private thenDelegate: EventThener<T> = null;
    private catchDelegate: EventCatcher<T> = null;

    private promise: Promise<T> = null; 
    private resolve: (value: T) => T;
    private isFirstTriggerDone: boolean = false;

    private idCounter: number = 0;


    constructor() {
        this.triggerDelegate = (eventArg: T) => this.trigger(eventArg);
        this.listenDelegate = (...args: any[]): void => {
            return this.listen.apply(this, args);
        };
        this.matchDelegate = (...args: any[]): void => {
            return this.match.apply(this, args);
        };
        this.matchOnceDelegate = (...args: any[]): void => {
            return this.matchOnce.apply(this, args);
        }; 
        this.unlistenDelegate = (...args: any[]): void => {
            return this.unlisten.apply(this, args);
        };
        this.onceDelegate = (handler: EventHandler<T>, context: Object = null) => {
            return this.once(handler, context);
        };
        this.whenDelegate = () => {
            return this.when();
        };
        this.thenDelegate = (onOk: EventHandler<T>, onFail: Function) => {
            return this.then(onOk, <any>onFail);
        };
        this.catchDelegate = (onFail: Function) => {
            return this.catch(<any>onFail);
        };
        this.promise = new Promise((resolve: any) => { this.resolve = resolve; });
    }
    
    mixin(target: any): EventTrait<T> {
        target.trigger = this.getTriggerer();
        target.getTriggerer = ()=>{
            return this.getTriggerer();
        }

        target.listen = this.getListener();
        target.match = this.getMatchListener();
        target.matchOnce = this.getMatchOncer();
        target.unlisten = this.getUnlistener();

        target.once = this.getOncer();

        target.when = this.getWhener();
        target.then = this.getThener();
        target.catch  =this.getCatcher();

        return target;
    }

    /** Returns a context-independent callback that triggers the event with given argument */
    getTriggerer(): EventTriggerer<T> { return this.triggerDelegate; }
    getListener(): EventListener<T> { return this.listenDelegate; }
    getMatchListener(): EventMatchListener<T> { return this.matchDelegate; }
    getMatchOncer(): EventMatchOncer<T> { return this.matchOnceDelegate; }
    getUnlistener(): EventUnlistener<T> { return this.unlistenDelegate; }
    getOncer(): EventOncer<T> { return this.onceDelegate; }
    getWhener(): EventWhener<T> { return this.whenDelegate; }
    getThener(): EventThener<T> { return this.thenDelegate; }
    getCatcher(): EventCatcher<T> { return this.catchDelegate; }

    /**
     * Triggers the event with given argument, invoking all of its handlers, and if
     * the event is triggered for the first time - removing the once event handlers and
     * saving given argument inetrnally as first trigger argument.
     */
    trigger(eventArg?: T): void {
        if (this.isBeingTriggered) {
            throw new Error(`Event triggered during trigger handling - suspecting recursive event.`);
        }
        this.isBeingTriggered = true;
        if (!this.isFirstTriggerDone) {
            this.isFirstTriggerDone = true;
            this.resolve(eventArg);
        }
        this.listeners.slice().forEach((listener) => {
            let doCall = true;
            if (listener.onlyMatching) {
                doCall = listener.matchValue === eventArg;
            }
            
            if (doCall) {
                if (listener.context) {
                    listener.handler.call(listener.context, eventArg); 
                } else {
                    listener.handler.call(null, eventArg);
                }
                if (listener.once) {
                    this.removeListener(listener);
                }
            }
        });
        this.isBeingTriggered = false;
    }  

    /**
     * Adds a listener. If once=true then adds once listener which means that listener will be removed,
     * when event triggers for the first time. Also if event allready was triggered for the first time
     * when you call 'add()' then once listener will not be added but instead invoked immidiately,
     * with argument, that event was triggered with the first time.
     */
    listen(handler: EventHandler<T>, context?: Object): number;
    listen(name: string, h: EventHandler<T>, context?: Object): number;
    listen(...args: any[]): number {
        let id: number;
        if (typeof args[0] === 'string') {
            let [name, handler, context] = args;
            id = this.addListener({ name, handler, context });
        } else {
            let [handler, context] = args;
            id = this.addListener({ handler, context });
        }
        return id;
    };

    match(value: T, h: EventHandler<T>, context?: Object): number;
    match(value: T, name: string, h: EventHandler<T>, context?: Object): number;
    match(value: T, ...args: any[]): number {
        let id: number;
        if (typeof args[0] === 'string') {
            let [name, handler, context] = args;
            id = this.addListener({ name, handler, context, onlyMatching: true, matchValue: value });
        } else {
            let [handler, context] = args;
            id = this.addListener({ handler, context, onlyMatching: true, matchValue: value });
        }
        return id;
    };

    matchOnce(value: T, handler: EventHandler<T>, context: Object = null): number {
         return this.addListener({ context, handler, once: true, onlyMatching: true, matchValue: value });
    }

    once(handler: EventHandler<T>, context: Object = null): number {
         return this.addListener({ context, handler, once: true });
    }

    /**
     * Remove a listener(s). When no context given removes all listeners, that were attached
     * without a context. When a context is given removes only listeners that were attached with
     * that context and doesn't remove any listeners that were attached without a context.
     */
    unlisten(handler: EventHandler<T>, context?: Object): void;
    unlisten(context: Object): void;
    unlisten(name: string): void;
    unlisten(id: number): void;
    unlisten(): void;
    unlisten(...args: any[]): void {
        let name: string = null, context: Object, handler: EventHandler<T>, idToRemove: number = null; 
        switch (args.length) {
            case 0: this.listeners = []; return;
            case 1:
                if (typeof args[0] === 'string') {
                    name = args[0];
                    handler = args[1];
                    context = args[2];
                } else if (typeof args[0] === 'number') {
                    idToRemove = args[0];
                } else {
                    handler = args[0];
                    context = args[1];
                };
                break;
            case 2:
                handler = args[0];
                context = args[1];
                break;
            
        }
        this.listeners = _.filter(this.listeners, (hConf: EventHandlerDescriptor<T>) => {
            let differentHandler: boolean = hConf.handler !== handler;
            let noContextGiven: boolean = context === null;
            let confHasNoContext: boolean = !!hConf.context;
            let differentContext: boolean = hConf.context !== context;
            let sameName = name && hConf.name && (name === hConf.name);
            let dontRemove: boolean;
            if (idToRemove !== null) {
                dontRemove = idToRemove !== hConf.id;
            } else {
                if (name) {
                    dontRemove = !sameName;
                } else {
                    if (differentHandler) {
                        dontRemove = true;
                    } else {
                        dontRemove = noContextGiven ? (!confHasNoContext) : (confHasNoContext || differentContext);
                    }
                }
            }
            
            return dontRemove;
        });
    }

    on(name: string, h: EventHandler<T>): number;
    on(handler: EventHandler<T>): number;
    on(nameOrHandler: EventHandler<T>|string, handlerOrNothing?: EventHandler<T>): number {
        return this.listen.apply(this, arguments);
    }

    off(handler: EventHandler<T>, context?: Object): void;
    off(context: Object): void;
    off(name: string): void;
    off(id: number): void;
    off(): void;
    off(bullshitWTF?: EventHandler<T>|string|number, context?: Object): void {
        return this.unlisten.apply(this, arguments);
    }

    when(): Promise<T> { return this.promise; }
    then(onOk: (r: T)=> T|any, onFail?: (e: any)=>T|any): Promise<T> { return this.when().then(onOk, onFail); }
    after(onAny: (r: T|any)=>T|any): Promise<T> { return this.then(onAny).catch(onAny);}
    catch(onFail: (e: any)=>T|any): Promise<T> { return this.when().catch(onFail); }

    pipe(other: Event<T>): void {
        this.on(other.getTriggerer());
    }
    unpipe(other: Event<T>): void {
        this.off(other.getTriggerer());
    }

    private removeListener(listener: EventHandlerDescriptor<T>): void {
        let listenerIndex = this.listeners.indexOf(listener);
        if (listenerIndex !== -1) {
            this.listeners.splice(listenerIndex, 1);
        }
    }

    private addListener(options: EventHandlerOptions<T>): number {
        let {context, handler, once, onlyMatching, matchValue} = options;
        this.idCounter++;
        this.listeners.push({context, handler, once, id: this.idCounter, onlyMatching, matchValue});
        return this.idCounter;
    }

    static event<EventT>(): PropertyDecorator {
        return function (prototype: Object, eventName: string): PropertyDescriptor {
            return {
                configurable: true,
                enumerable: false,
                get() {
                    let event = new Event<EventT>();
                    Reflect.defineProperty(this, eventName, {
                        configurable: false,
                        enumerable: false,
                        writable: false,
                        value: event
                    });
                    return event;
                }
            }
        }
    }
    static emits<EventT>(eventName: string) {

        return function (prototype: Object, methodName: string, original: PropertyDescriptor): PropertyDescriptor {
            let originalMethod: Function = original.value;
            
            let descriptor = {
                configurable: false,
                enumerable: false,
                writeable: false,
                value(...args: any[]) {
                    let result = originalMethod.apply(this, args);
                    this[eventName].trigger(result);
                    return result;
                }
            };
            return descriptor;
        }
    }
}

export function emits(name: string): MethodDecorator {
    return Event.emits(name);
}

export function event(name: string): MethodDecorator {
    return Event.emits(name);
}

export default Event;