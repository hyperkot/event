/// <reference path="../typings/index.d.ts"/>

import * as _ from "lodash";
import * as deepEqual from "deep-strict-equal";
import {
    EventHandler,
    EventHandlerOptions,
    EventHandlerDescriptor,
    EventTriggerer,
    EventListener,
    EventUnlistener,
    EventOncer,
    EventMatchListener,
    EventMatchOncer,
    EventWhener,
    EventThener,
    EventCatcher,
    EventTrait,
    Thenable,
    EventEmitter,
    EventTraitTrigger
} from "./interfaces";

/**
 * Represents an event and proviedes various way to observe the event both
 * externally and internally. Internally provides also a way to trigger the event.
 */
export class Event<T> implements EventTrait<T>, Thenable<T> {
    private listeners: EventHandlerDescriptor<T>[] = [];
    private isBeingTriggered: boolean = false;

    /* 
    This whole thing with 'delegates' was designed first of all to provide
    a way to make mixin feature, which wouldn't create new closures all the time,
    and so that the user never has to use closures or 'bind' to use any of
    event object methods as callbacks passed somewhere, etc...

    This 'delegate' code definitely could be shorter, and it is not the best way
    to do it. Here is a good place to mention that this lib,
    is created not for production sites, but for my own academical purposes,
    so first of all it should be convinient for me, not taking into account other
    people. I totally don't care about performance in this lib. I have no goal to
    make the most fast or error-free thing right now. The goal of this library is
    to implement the 'event-object' approach to events concept, and experiment 
    with various possible API features, to find out which of them are usefull and
    which are not really needed, or make API too complex. After finding out what i believe
    is the most simple, laconic and clear API this lib could have - i'll cover it fully with
    tests, and only after that will i even consider taking any performance issues into account.
    */
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
    private resolveInternalPromise: (value: T) => any;
    private rejectInternalPromise: (value: any) => any;
    private isFirstTriggerDone: boolean = false;

    private idCounter: number = 0;


    constructor() {
        this.triggerDelegate = (eventArg: T) => this.trigger(eventArg);
        this.listenDelegate = (...args: any[]): void => this.listen.apply(this, args);
        this.matchDelegate = (...args: any[]): void => this.match.apply(this, args);
        this.matchOnceDelegate = (...args: any[]): void => this.matchOnce.apply(this, args);
        this.unlistenDelegate = (...args: any[]): void => this.unlisten.apply(this, args);
        this.onceDelegate = (handler: EventHandler<T>, context: Object = null) => {
            this.once(handler, context);
        };
        this.whenDelegate = () => this.when();
        this.thenDelegate = (onOk: EventHandler<T>, onFail: Function) => {
            return this.then(onOk, <any>onFail);
        };
        this.catchDelegate = (onFail: Function) => this.catch(<any>onFail);

        this.promise = new Promise((resolve: (value: T) => void, reject: (e: any) => void) => {
            this.resolveInternalPromise = resolve;
            this.rejectInternalPromise = reject;
        });
    }

    /**
     * Mix this event's methods into the target object.
     * This is a way to add the event functionality to some existing object,
     * without messing with it's inheritance chain.
     */
    mixin(target: any): EventTrait<T> {
        target.trigger = this.getTriggerer();
        target.getTriggerer = () => this.getTriggerer();

        target.listen = this.getListener();
        target.match = this.getMatchListener();
        target.matchOnce = this.getMatchOncer();
        target.unlisten = this.getUnlistener();

        target.once = this.getOncer();

        target.when = this.getWhener();
        target.then = this.getThener();
        target.catch = this.getCatcher();

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
     * 
     * The argument is optional, since event can be of void type (`x= new Event<void>()`),
     * but if the event is not of a void type - you should allways pass an argument to
     * the trigger method.
     */
    trigger(eventArg?: T): void {
        if (this.isBeingTriggered) {
            throw new Error(`Event triggered during trigger handling - suspecting recursive event.`);
        }
        this.isBeingTriggered = true;
        if (!this.isFirstTriggerDone) {
            this.isFirstTriggerDone = true;
            this.resolveInternalPromise(eventArg);
        }
        this.listeners.slice().forEach((listener: EventHandlerDescriptor<T>) => {
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
        if (typeof args[0] === "string") {
            let [name, handler, context] = args;
            id = this.addListener({ name, handler, context });
        } else {
            let [handler, context] = args;
            id = this.addListener({ handler, context });
        }
        return id;
    };

    /**
     * Adds a listener, which will be invoked only if the event-argument is deeply-equal to
     * the given value.
     */
    match(value: T, h: EventHandler<T>, context?: Object): number;
    match(value: T, name: string, h: EventHandler<T>, context?: Object): number;
    match(value: T, ...args: any[]): number {
        let id: number;
        if (typeof args[0] === "string") {
            let [name, handler, context] = args;
            id = this.addListener({ name, handler, context, onlyMatching: true, matchValue: value });
        } else {
            let [handler, context] = args;
            id = this.addListener({ handler, context, onlyMatching: true, matchValue: value });
        }
        return id;
    };

    /**
     * Combines 'match' and 'once' features.
     */
    matchOnce(value: T, handler: EventHandler<T>, context: Object = null): number {
         return this.addListener({ context, handler, once: true, onlyMatching: true, matchValue: value });
    }

    /**
     * Adds a listener to the event
     */
    once(handler: EventHandler<T>, context: Object = null): number {
         return this.addListener({ context, handler, once: true });
    }

    /**
     * Remove a listener(s). When no context given removes all listeners that were attached
     * without a context. When a context is given removes only listeners that were attached with
     * that context and doesn't remove any listeners that were attached without a context.
     */
    unlisten(handler: EventHandler<T>, context?: Object): void;
    unlisten(context: Object): void;
    unlisten(name: string): void;
    unlisten(id: number): void;
    unlisten(): void;
    unlisten(...args: any[]): void {
        let name: string = null,
            context: Object,
            handler: EventHandler<T>,
            idToRemove: number = null;
        switch (args.length) {
            case 0: this.listeners = []; return;
            case 1:
                if (typeof args[0] === "string") {
                    name = args[0];
                    handler = args[1];
                    context = args[2];
                } else if (typeof args[0] === "number") {
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
            default:
                throw new Error("Event@unlisten(): unsupported arguments format.");
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

    when(): Promise<T> {
        return this.promise;
    }

    then(onOk: (r: T) => T|any, onFail?: (e: any) => T|any): Promise<T> {
        return this.when().then(onOk, onFail);
    }

    after(onAny: (r: T|any) => T|any): Promise<T> {
        return this.then(onAny).catch(onAny);
    }

    catch(onFail: (e: any) => T|any): Promise<T> {
        return this.when().catch(onFail);
    }

    /**
     * Piping the events means that the other event must be triggered(happen) any time
     * this event happens and with exactly the same argument.
     */
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
}

export {
    EventHandler,
    EventHandlerOptions,
    EventHandlerDescriptor,
    EventTriggerer,
    EventListener,
    EventUnlistener,
    EventOncer,
    EventMatchListener,
    EventMatchOncer,
    EventWhener,
    EventThener,
    EventCatcher,
    EventTrait,
    Thenable,
    EventEmitter,
    EventTraitTrigger,
}

export default Event;