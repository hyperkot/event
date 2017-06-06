/// <reference path="../typings/index.d.ts"/>
Object.defineProperty(exports, "__esModule", { value: true });
const ts_buns_1 = require("ts-buns");
/**
 * Represents a certain kind of events.
 * Provides methods to observe and to trigger(emit) that kind of events.
 */
class EventProperty {
    constructor() {
        this.listeners = [];
        this.initHandlers = [];
        this.initDeferred = new ts_buns_1.Deferred();
        this.idCounter = 0;
        this.emit = this.emit.bind(this);
    }
    /**
     * A special property, indicating that the event was emitted at least once.
     * @returns {boolean}
     */
    get isInitialized() { return this.initHandlers === null; }
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
    emit(eventArg) {
        let toInvoke;
        if (!this.isInitialized) {
            let initHandlers = this.initHandlers;
            this.initHandlers = null;
            this.initArg = eventArg;
            initHandlers.forEach(([handler, context]) => {
                handler.call(context || null, this.initArg);
            });
            this.initDeferred.resolve(eventArg);
        }
        toInvoke = this.listeners.slice().filter((listener) => {
            let shouldInvoke = !listener.onlyMatching || objectMatch(eventArg, listener.matchValue);
            if (listener.once && shouldInvoke) {
                this.removeListener(listener);
            }
            return shouldInvoke;
        });
        toInvoke.forEach(({ handler, context }) => {
            handler.call(context || null, eventArg);
        });
    }
    /**
     * Adds a listener.
     *
     * @param {EventProperty.Handler<T>} handler - callback to be called when an event is emitted
     * @param {Object} [context] - context to be used when calling handler. null by default.
     * @returns {EventProperty.ListenerId} - number, identifying new event listener.
     */
    on(handler, context) {
        return this.addListener({ handler, context });
    }
    /**
     * Adds a listener. This listener will be immediately removed after it's
     * invoked for the first time.
     *
     * @param {EventProperty.Handler<T>} handler - callback to be called when an event is emitted
     * @param {Object} [context] - context to be used when calling handler. null by default.
     * @returns {EventProperty.ListenerId} - number, identifying new event listener.
     */
    once(handler, context = null) {
        return this.addListener({ context, handler, once: true });
    }
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
    match(value, handler, context) {
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
     *
     * @see PropertyEvent.match, PropertyEvent.once
     */
    matchOnce(value, handler, context = null) {
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
    pipe(other) {
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
     *
     * @see EventProperty.pipe, EventProperty.match
     */
    route(matchValue, destination) {
        return this.match(matchValue, destination.emit);
    }
    /**
     * Adds an initialization handler. Initialization handlers are invoked during the very first
     * emit of event in this EventProperty. If first emit already occurred then the handler is
     * invoked immediately.
     * This method returns a promise which may be used instead of passing a callback. Note that promise
     * resolve and reject handler will be invoked only on the next event loop iteration while callback
     * which is passed directly will beb invoked immediately and before any event-listeners.
     *
     * @param {EventProperty.Handler<T>} handler - callback to be invoked when event is emitted first time
     * @param {Object} [context] - handler will be invoked in this context
     */
    init(handler, context) {
        if (handler) {
            if (this.isInitialized) {
                handler.call(context || null, this.initArg);
            }
            else {
                this.initHandlers.push([handler, context || null]);
            }
        }
        return this.initDeferred.promise;
    }
    off(...args) {
        let context = null, handler = null, idToRemove = null;
        switch (args.length) {
            case 0:
                this.listeners = [];
                return;
            case 1:
                if (EventProperty.isListenerId(args[0])) {
                    idToRemove = args[0];
                }
                else if (typeof args[0] === "function") {
                    handler = args[0];
                    context = null;
                }
                else if (typeof args[0] === "object") {
                    if (args[0] instanceof EventProperty) {
                        this.off(args[0].emit);
                        return;
                    }
                    handler = null;
                    context = args[0];
                }
                else {
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
        this.listeners = this.listeners.filter((hConf) => {
            let differentHandler = hConf.handler !== handler;
            let noHandlerGiven = !handler;
            let noContextGiven = !context;
            let confHasNoContext = !hConf.context;
            let differentContext = hConf.context !== context;
            let dontRemove;
            if (idToRemove !== null) {
                dontRemove = idToRemove !== hConf.id;
            }
            else {
                if (noHandlerGiven) {
                    if (noContextGiven) {
                        throw new Error("Unexpected circumstances.");
                    }
                    else {
                        dontRemove = confHasNoContext || (context !== hConf.context);
                    }
                }
                else {
                    if (differentHandler) {
                        dontRemove = true;
                    }
                    else {
                        if (noContextGiven) {
                            dontRemove = (!confHasNoContext) || (differentHandler);
                        }
                        else {
                            dontRemove = differentContext || differentHandler;
                        }
                    }
                }
            }
            return dontRemove;
        });
    }
    removeListener(listener) {
        let listenerIndex = this.listeners.indexOf(listener);
        if (listenerIndex !== -1) {
            this.listeners.splice(listenerIndex, 1);
        }
    }
    addListener(options) {
        let { context, handler, once, onlyMatching, matchValue } = options;
        this.idCounter++;
        this.listeners.push({ context, handler, once, id: this.idCounter, onlyMatching, matchValue });
        return this.idCounter;
    }
}
exports.EventProperty = EventProperty;
(function (EventProperty) {
    /**
     * This method is used just to emphasize the meaning of the value.
     * Otherwise we could just use typeof id === "number" directly.
     */
    function isListenerId(id) {
        return typeof id === "number";
    }
    EventProperty.isListenerId = isListenerId;
    /**
     * Creates a pair: an EventProperty instance to be used internally in a class
     * and an Emitter-interface to be used as public / accessible property.
     * They both actually represent the same EventProperty object.
     *
     * returns {[EventProperty,EventProperty.Emitter<T>]}
     *
     * @method EventProperty.make
     * @static
     */
    function make() {
        let eventProp = new EventProperty();
        return [eventProp, eventProp];
    }
    EventProperty.make = make;
    /**
     * Creates an EventProperty object and splits it into emitter-function and
     * Emitter-interface. Use emitter function to emit the event and Emitter-interface
     * to add and remove listeners of that event.
     *
     * returns {[EventProperty.EmitMethod<T>,EventProperty.Emitter<T>]}
     *
     * @method EventProperty.split
     * @static
     */
    function split() {
        let eventProp = new EventProperty();
        return [eventProp.emit, eventProp];
    }
    EventProperty.split = split;
    /**
     * Creates an EventProperty object and splits it into emitter-function and
     * Emitter-interface. Special version for void-typed events.
     *
     * returns {[EventProperty.VoidEmitMethod,EventProperty.Emitter<T>]}
     *
     * @method EventProperty.splitVoid
     * @static
     */
    function splitVoid() {
        let eventProp = new EventProperty.Void();
        let emitter = eventProp;
        return [eventProp.emit, emitter];
    }
    EventProperty.splitVoid = splitVoid;
    /**
     * Special subclass of EventProperty for void type - allows calling emit without arguments.
     * Extends {@link EventProperty}
     *
     * @class EventProperty.Void
     * @static
     * @see {EventProperty}
     */
    class Void extends EventProperty {
        constructor() { super(); }
        /**
         * Emits an event invoking all listeners.
         *
         * @method EventProperty.Void#emit
         * @see {EventProperty#emit}
         */
        emit() { return super.emit(void 0); }
    }
    EventProperty.Void = Void;
})(EventProperty = exports.EventProperty || (exports.EventProperty = {}));
/**
 * Used in EventProperty.match/matchOnce/route methods to compare event argument with given value.
 * Note: subject to change.
 *
 * @param {any} subject - actual event argument
 * @param {any} proto - value to match
 * @returns {boolean}
 *
 * @private
 */
function objectMatch(subject, proto) {
    return _objectMatch(subject, proto);
}
function _objectMatch(subject, proto, traversalStack = []) {
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
            }
            else {
                if (typeof subject !== "object") {
                    isMatching = false;
                }
                else {
                    if (!proto || !subject)
                        isMatching = !subject && !proto;
                    else if (traversalStack.includes(subject)) {
                        throw new Error("Recursion!");
                    }
                    else {
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
exports.default = EventProperty;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvZXZlbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsNkNBQTZDOztBQUU3QyxxQ0FBbUM7QUFFbkM7OztHQUdHO0FBQ0g7SUFnQkk7UUFmUSxjQUFTLEdBQXlDLEVBQUUsQ0FBQztRQUdyRCxpQkFBWSxHQUF5QyxFQUFFLENBQUM7UUFDeEQsaUJBQVksR0FBZ0IsSUFBSSxrQkFBUSxFQUFLLENBQUM7UUFROUMsY0FBUyxHQUE2QixDQUFDLENBQUM7UUFLNUMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNyQyxDQUFDO0lBWkQ7OztPQUdHO0lBQ0gsSUFBSSxhQUFhLEtBQWMsTUFBTSxDQUFDLElBQUksQ0FBQyxZQUFZLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQztJQVVuRTs7Ozs7T0FLRztJQUVIOzs7O09BSUc7SUFDSCxJQUFJLENBQUMsUUFBVztRQUNaLElBQUksUUFBOEMsQ0FBQztRQUVuRCxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO1lBQ3RCLElBQUksWUFBWSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUM7WUFDckMsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7WUFDekIsSUFBSSxDQUFDLE9BQU8sR0FBRyxRQUFRLENBQUM7WUFDeEIsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBcUM7Z0JBQ3hFLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxJQUFJLElBQUksRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDaEQsQ0FBQyxDQUFDLENBQUM7WUFDSCxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN4QyxDQUFDO1FBRUQsUUFBUSxHQUFHLElB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TyxJQUFJLENBQUMsS0FBSyxDQUFDO29CQUNwQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQ3hDLE1BQU0sSUFBSSxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7b0JBQ2xDLENBQUM7b0JBQUMsSUFBSSxDQUFDLENBQUM7d0JBQ0osR0FBRyxDQUFDLENBQUMsSUFBSSxHQUFHLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQzs0QkFDcEIsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0NBQzVCLGNBQWMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7Z0NBQzdCLFVBQVUsR0FBRyxVQUFVLElBQUksWUFBWSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsY0FBYyxDQUFDLENBQUM7Z0NBQ2xGLGNBQWMsQ0FBQyxHQUFHLEVBQUUsQ0FBQzs0QkFDekIsQ0FBQzt3QkFDTCxDQUFDO29CQUNMLENBQUM7Z0JBQ0wsQ0FBQztZQUNMLENBQUM7WUFDRCxNQUFNLENBQUMsVUFBVSxDQUFDO1FBQ3RCO1lBQ0ksTUFBTSxJQUFJLEtBQUssQ0FBQyxzQkFBc0IsT0FBTyxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBQzlELENBQUM7QUFDTCxDQUFDO0FBRUQsa0JBQWUsYUFBYSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL3R5cGluZ3MvaW5kZXguZC50c1wiLz5cblxuaW1wb3J0IHsgRGVmZXJyZWQgfSBmcm9tICd0cy1idW5zJztcblxuLyoqXG4gKiBSZXByZXNlbnRzIGEgY2VydGFpbiBraW5kIG9mIGV2ZW50cy5cbiAqIFByb3ZpZGVzIG1ldGhvZHMgdG8gb2JzZXJ2ZSBhbmQgdG8gdHJpZ2dlcihlbWl0KSB0aGF0IGtpbmQgb2YgZXZlbnRzLlxuICovXG5leHBvcnQgY2xhc3MgRXZlbnRQcm9wZXJ0eTxUPiBpbXBsZW1lbnRzIEV2ZW50UHJvcGVydHkuRW1pdHRlcjxUPiB7XG4gICAgcHJpdmF0ZSBsaXN0ZW5lcnM6IEV2ZW50UHJvcGVydHkuSGFuZGxlckRlc2NyaXB0b3I8VD5bXSA9IFtdO1xuXG4gICAgcHJpdmF0ZSBpbml0QXJnOiBUO1xuICAgIHByaXZhdGUgaW5pdEhhbmRsZXJzOiBbRXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+LCBPYmplY3RdW10gPSBbXTtcbiAgICBwcml2YXRlIGluaXREZWZlcnJlZDogRGVmZXJyZWQ8VD4gPSBuZXcgRGVmZXJyZWQ8VD4oKTtcblxuICAgIC8qKlxuICAgICAqIEEgc3BlY2lhbCBwcm9wZXJ0eSwgaW5kaWNhdGluZyB0aGF0IHRoZSBldmVudCB3YXMgZW1pdHRlZCBhdCBsZWFzdCBvbmNlLlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgICAqL1xuICAgIGdldCBpc0luaXRpYWxpemVkKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5pbml0SGFuZGxlcnMgPT09IG51bGw7IH1cblxuICAgIHByaXZhdGUgaWRDb3VudGVyOiBFdmVudFByb3BlcnR5Lkxpc3RlbmVySWQgPSAwO1xuXG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcblxuICAgICAgICB0aGlzLmVtaXQgPSB0aGlzLmVtaXQuYmluZCh0aGlzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIHR5cGVkZWYgaXMgdXNlZCB0byBkZXNjcmliZSB0eXBlLXBhcmFtZXRlciBUIGZvciBqc2RvYyBwYXJzZXIuXG4gICAgICpcbiAgICAgKiBAdHlwZWRlZiB7YW55fSBUO1xuICAgICAqIEBwcml2YXRlXG4gICAgICovXG5cbiAgICAvKipcbiAgICAgKiBFbWl0cyBldmVudCB3aXRoIGdpdmVuIGFyZ3VtZW50LiBUaGlzIGludm9rZXMgYWxsIGFwcHJvcHJpYXRlIGhhbmRsZXJzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtUfSBldmVudEFyZyAtIGV2ZW50IGFyZ3VtZW50LCBpdCdzIHBhc3NlZCB0byBlYWNoIGV2ZW50IGhhbmRsZXIuXG4gICAgICovXG4gICAgZW1pdChldmVudEFyZzogVCk6IHZvaWQge1xuICAgICAgICBsZXQgdG9JbnZva2U6IEV2ZW50UHJvcGVydHkuSGFuZGxlckRlc2NyaXB0b3I8VD5bXTtcblxuICAgICAgICBpZiAoIXRoaXMuaXNJbml0aWFsaXplZCkge1xuICAgICAgICAgICAgbGV0IGluaXRIYW5kbGVycyA9IHRoaXMuaW5pdEhhbmRsZXJzO1xuICAgICAgICAgICAgdGhpcy5pbml0SGFuZGxlcnMgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5pbml0QXJnID0gZXZlbnRBcmc7XG4gICAgICAgICAgICBpbml0SGFuZGxlcnMuZm9yRWFjaCgoW2hhbmRsZXIsIGNvbnRleHRdOiBbRXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+LCBPYmplY3RdKSA9PiB7XG4gICAgICAgICAgICAgICAgaGFuZGxlci5jYWxsKGNvbnRleHQgfHwgbnVsbCwgdGhpcy5pbml0QXJnKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5pbml0RGVmZXJyZWQucmVzb2x2ZShldmVudEFyZyk7XG4gICAgICAgIH1cblxuICAgICAgICB0b0ludm9rZSA9IHRoaXMubGlzdGVuZXJzLnNsaWNlKCkuZmlsdGVyKChsaXN0ZW5lcjogRXZlbnRQcm9wZXJ0eS5IYW5kbGVyRGVzY3JpcHRvcjxUPikgPT4ge1xuICAgICAgICAgICAgbGV0IHNob3VsZEludm9rZSA9ICFsaXN0ZW5lci5vbmx5TWF0Y2hpbmcgfHwgb2JqZWN0TWF0Y2goZXZlbnRBcmcsIGxpc3RlbmVyLm1hdGNoVmFsdWUpO1xuICAgICAgICAgICAgaWYgKGxpc3RlbmVyLm9uY2UgJiYgc2hvdWxkSW52b2tlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gc2hvdWxkSW52b2tlO1xuICAgICAgICB9KTtcblxuICAgICAgICB0b0ludm9rZS5mb3JFYWNoKCh7aGFuZGxlciwgY29udGV4dH06IHtoYW5kbGVyOiBFdmVudFByb3BlcnR5LkhhbmRsZXI8VD4sIGNvbnRleHQ/OiBPYmplY3R9KSA9PiB7XG4gICAgICAgICAgICBoYW5kbGVyLmNhbGwoY29udGV4dCB8fCBudWxsLCBldmVudEFyZyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZHMgYSBsaXN0ZW5lci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+fSBoYW5kbGVyIC0gY2FsbGJhY2sgdG8gYmUgY2FsbGVkIHdoZW4gYW4gZXZlbnQgaXMgZW1pdHRlZFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbY29udGV4dF0gLSBjb250ZXh0IHRvIGJlIHVzZWQgd2hlbiBjYWxsaW5nIGhhbmRsZXIuIG51bGwgYnkgZGVmYXVsdC5cbiAgICAgKiBAcmV0dXJucyB7RXZlbnRQcm9wZXJ0eS5MaXN0ZW5lcklkfSAtIG51bWJlciwgaWRlbnRpZnlpbmcgbmV3IGV2ZW50IGxpc3RlbmVyLlxuICAgICAqL1xuICAgIG9uKGhhbmRsZXI6IEV2ZW50UHJvcGVydHkuSGFuZGxlcjxUPiwgY29udGV4dD86IE9iamVjdCk6IEV2ZW50UHJvcGVydHkuTGlzdGVuZXJJZCB7XG4gICAgICAgIHJldHVybiB0aGlzLmFkZExpc3RlbmVyKHsgaGFuZGxlciwgY29udGV4dCB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGRzIGEgbGlzdGVuZXIuIFRoaXMgbGlzdGVuZXIgd2lsbCBiZSBpbW1lZGlhdGVseSByZW1vdmVkIGFmdGVyIGl0J3NcbiAgICAgKiBpbnZva2VkIGZvciB0aGUgZmlyc3QgdGltZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+fSBoYW5kbGVyIC0gY2FsbGJhY2sgdG8gYmUgY2FsbGVkIHdoZW4gYW4gZXZlbnQgaXMgZW1pdHRlZFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbY29udGV4dF0gLSBjb250ZXh0IHRvIGJlIHVzZWQgd2hlbiBjYWxsaW5nIGhhbmRsZXIuIG51bGwgYnkgZGVmYXVsdC5cbiAgICAgKiBAcmV0dXJucyB7RXZlbnRQcm9wZXJ0eS5MaXN0ZW5lcklkfSAtIG51bWJlciwgaWRlbnRpZnlpbmcgbmV3IGV2ZW50IGxpc3RlbmVyLlxuICAgICAqL1xuICAgIG9uY2UoaGFuZGxlcjogRXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+LCBjb250ZXh0OiBPYmplY3QgPSBudWxsKTogRXZlbnRQcm9wZXJ0eS5MaXN0ZW5lcklkIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYWRkTGlzdGVuZXIoeyBjb250ZXh0LCBoYW5kbGVyLCBvbmNlOiB0cnVlIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZHMgYSBsaXN0ZW5lci4gVGhpcyBsaXN0ZW5lciB3aWxsIGJlIGludm9rZWQgb25seSBpZiBldmVudCBhcmd1bWVudFxuICAgICAqIG1hdGNoZXMgZ2l2ZW4gdmFsdWUuXG4gICAgICpcbiAgICAgKiBOb3RlOiB3aGF0IFwibWF0Y2hpbmdcIiBtZWFucyBpcyBub3QgZG9jdW1lbnRlZCB3ZWxsIHlldCBzaW5jZSBpdCBpcyBzdWJqZWN0IHRvIGNoYW5nZS5cbiAgICAgKiBGb3Igbm93IHlvdSBzaG91bGQgYXNzdW1lIHRoYXQgZm9yIHBsYWluIHR5cGVzIChib29sZWFuLCBudW1iZXIsIHN0cmluZykgaXQgaXNcbiAgICAgKiBzdHJpY3QgZXF1YWxpdHkuIEZvciBvYmplY3RzIGl0IGlzIGxpa2UgZGVlcCBzdHJpY3QgZXF1YWxpdHkgZXhjZXB0IHRoYXQgYWN0dWFsXG4gICAgICogZXZlbnQgYXJndW1lbnQgbWF5IGhhdmUgbW9yZSBmaWVsZHMgdGhhbiBtYXRjaC12YWx1ZShwcm90bykuIEJ1dCBhbGwgZmllbGRzIGZyb21cbiAgICAgKiBtYXRjaC12YWx1ZSBtdXN0IGJlIHByZXNlbnQgaW4gZXZlbnQgYXJndW1lbnQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1R8UmVnRXhwfSB2YWx1ZSAtIGhhbmRsZXIgaXMgaW52b2tlZCBvbmx5IGlmIGV2ZW50IGFyZ3VtZW50IG1hdGNoZXMgdGhpcyB2YWx1ZVxuICAgICAqIEBwYXJhbSB7RXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+fSBoYW5kbGVyIC0gY2FsbGJhY2sgdG8gYmUgY2FsbGVkIHdoZW4gYW4gZXZlbnQgaXMgZW1pdHRlZFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbY29udGV4dF0gLSBjb250ZXh0IHRvIGJlIHVzZWQgd2hlbiBjYWxsaW5nIGhhbmRsZXIuIG51bGwgYnkgZGVmYXVsdC5cbiAgICAgKiBAcmV0dXJucyB7RXZlbnRQcm9wZXJ0eS5MaXN0ZW5lcklkfSAtIG51bWJlciwgaWRlbnRpZnlpbmcgbmV3IGV2ZW50IGxpc3RlbmVyLlxuICAgICAqXG4gICAgICogQHNlZSBvYmplY3RNYXRjaFxuICAgICAqL1xuICAgIG1hdGNoKHZhbHVlOiBUfFJlZ0V4cCwgaGFuZGxlcjogRXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+LCBjb250ZXh0PzogT2JqZWN0KTogRXZlbnRQcm9wZXJ0eS5MaXN0ZW5lcklkIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYWRkTGlzdGVuZXIoeyBoYW5kbGVyLCBjb250ZXh0LCBvbmx5TWF0Y2hpbmc6IHRydWUsIG1hdGNoVmFsdWU6IHZhbHVlIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZHMgYSBsaXN0ZW5lciBmb3IgdGhpcyBldmVudCB0eXBlLiBUaGlzIGxpc3RlbmVyIHdpbGwgYmUgaW52b2tlZCBvbmx5IGlmIGV2ZW50IGFyZ3VtZW50XG4gICAgICogbWF0Y2hlcyBnaXZlbiB2YWx1ZS4gVGhpcyBsaXN0ZW5lciB3aWxsIGJlIGltbWVkaWF0ZWx5IHJlbW92ZWQgYWZ0ZXIgaXQncyBpbnZva2VkXG4gICAgICogZm9yIHRoZSBmaXJzdCB0aW1lLlxuICAgICAqXG4gICAgICogTm90ZTogd2hhdCBcIm1hdGNoaW5nXCIgbWVhbnMgaXMgbm90IGRvY3VtZW50ZWQgd2VsbCB5ZXQgc2luY2UgaXQgaXMgc3ViamVjdCB0byBjaGFuZ2UuXG4gICAgICogRm9yIG5vdyB5b3Ugc2hvdWxkIGFzc3VtZSB0aGF0IGZvciBwbGFpbiB0eXBlcyAoYm9vbGVhbiwgbnVtYmVyLCBzdHJpbmcpIGl0IGlzXG4gICAgICogc3RyaWN0IGVxdWFsaXR5LiBGb3Igb2JqZWN0cyBpdCBpcyBsaWtlIGRlZXAgc3RyaWN0IGVxdWFsaXR5IGV4Y2VwdCB0aGF0IGFjdHVhbFxuICAgICAqIGV2ZW50IGFyZ3VtZW50IG1heSBoYXZlIG1vcmUgZmllbGRzIHRoYW4gbWF0Y2gtdmFsdWUocHJvdG8pLiBCdXQgYWxsIGZpZWxkcyBmcm9tXG4gICAgICogbWF0Y2gtdmFsdWUgbXVzdCBiZSBwcmVzZW50IGluIGV2ZW50IGFyZ3VtZW50LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtUfFJlZ0V4cH0gdmFsdWUgLSBoYW5kbGVyIGlzIGludm9rZWQgb25seSBpZiBldmVudCBhcmd1bWVudCBtYXRjaGVzIHRoaXMgdmFsdWVcbiAgICAgKiBAcGFyYW0ge0V2ZW50UHJvcGVydHkuSGFuZGxlcjxUPn0gaGFuZGxlciAtIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCB3aGVuIGFuIGV2ZW50IGlzIGVtaXR0ZWRcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW2NvbnRleHRdIC0gY29udGV4dCB0byBiZSB1c2VkIHdoZW4gY2FsbGluZyBoYW5kbGVyLiBudWxsIGJ5IGRlZmF1bHQuXG4gICAgICogQHJldHVybnMge0V2ZW50UHJvcGVydHkuTGlzdGVuZXJJZH0gLSBudW1iZXIsIGlkZW50aWZ5aW5nIG5ldyBldmVudCBsaXN0ZW5lci5cbiAgICAgKlxuICAgICAqIEBzZWUgUHJvcGVydHlFdmVudC5tYXRjaCwgUHJvcGVydHlFdmVudC5vbmNlXG4gICAgICovXG4gICAgbWF0Y2hPbmNlKHZhbHVlOiBUfFJlZ0V4cCwgaGFuZGxlcjogRXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+LCBjb250ZXh0OiBPYmplY3QgPSBudWxsKTogRXZlbnRQcm9wZXJ0eS5MaXN0ZW5lcklkIHtcbiAgICAgICAgIHJldHVybiB0aGlzLmFkZExpc3RlbmVyKHtcbiAgICAgICAgICAgICBjb250ZXh0LFxuICAgICAgICAgICAgIGhhbmRsZXIsXG4gICAgICAgICAgICAgb25jZTogdHJ1ZSxcbiAgICAgICAgICAgICBvbmx5TWF0Y2hpbmc6IHRydWUsXG4gICAgICAgICAgICAgbWF0Y2hWYWx1ZTogdmFsdWVcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXCJQaXBlc1wiIEV2ZW50UHJvcGVydHkgdG8gb3RoZXIgRXZlbnRQcm9wZXJ0eS4gVGhpcyBtZWFucyB0aGF0IHdoZW5ldmVyIHRoaXMgZXZlbnRcbiAgICAgKiBpcyBlbWl0dGVkIGl0IGlzIHBhc3NlZCB0byB0aGF0IG90aGVyIEV2ZW50UHJvcGVydHkgd2hpY2ggZW1pdHMgaXQgdG9vLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtFdmVudFByb3BlcnR5PFQ+fSBvdGhlclxuICAgICAqIEByZXR1cm5zIHtFdmVudFByb3BlcnR5Lkxpc3RlbmVySWR9XG4gICAgICovXG4gICAgcGlwZShvdGhlcjogRXZlbnRQcm9wZXJ0eTxUPik6IEV2ZW50UHJvcGVydHkuTGlzdGVuZXJJZCB7XG4gICAgICAgIHJldHVybiB0aGlzLm9uKG90aGVyLmVtaXQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFBpcGUgb25seSBldmVudHMgd2l0aCBtYXRjaGluZyBhcmd1bWVudCB0byBkZXN0aW5hdGlvbiBFdmVudFByb3BlcnR5LlxuICAgICAqXG4gICAgICogTm90ZTogd2hhdCBcIm1hdGNoaW5nXCIgbWVhbnMgaXMgbm90IGRvY3VtZW50ZWQgd2VsbCB5ZXQgc2luY2UgaXQgaXMgc3ViamVjdCB0byBjaGFuZ2UuXG4gICAgICogRm9yIG5vdyB5b3Ugc2hvdWxkIGFzc3VtZSB0aGF0IGZvciBwbGFpbiB0eXBlcyAoYm9vbGVhbiwgbnVtYmVyLCBzdHJpbmcpIGl0IGlzXG4gICAgICogc3RyaWN0IGVxdWFsaXR5LiBGb3Igb2JqZWN0cyBpdCBpcyBsaWtlIGRlZXAgc3RyaWN0IGVxdWFsaXR5IGV4Y2VwdCB0aGF0IGFjdHVhbFxuICAgICAqIGV2ZW50IGFyZ3VtZW50IG1heSBoYXZlIG1vcmUgZmllbGRzIHRoYW4gbWF0Y2gtdmFsdWUocHJvdG8pLiBCdXQgYWxsIGZpZWxkcyBmcm9tXG4gICAgICogbWF0Y2gtdmFsdWUgbXVzdCBiZSBwcmVzZW50IGluIGV2ZW50IGFyZ3VtZW50LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtUfFJlZ0V4cH0gbWF0Y2hWYWx1ZSAtIHZhbHVlIHRvIG1hdGNoXG4gICAgICogQHBhcmFtIHtFdmVudFByb3BlcnR5PFQ+fSBkZXN0aW5hdGlvbiAtIHRhcmdldCBFdmVudFByb3BlcnR5XG4gICAgICogQHJldHVybnMge0V2ZW50UHJvcGVydHkuTGlzdGVuZXJJZH1cbiAgICAgKlxuICAgICAqIEBzZWUgRXZlbnRQcm9wZXJ0eS5waXBlLCBFdmVudFByb3BlcnR5Lm1hdGNoXG4gICAgICovXG4gICAgcm91dGUobWF0Y2hWYWx1ZTogVHxSZWdFeHAsIGRlc3RpbmF0aW9uOiBFdmVudFByb3BlcnR5PFQ+KTogRXZlbnRQcm9wZXJ0eS5MaXN0ZW5lcklkIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubWF0Y2gobWF0Y2hWYWx1ZSwgZGVzdGluYXRpb24uZW1pdCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkcyBhbiBpbml0aWFsaXphdGlvbiBoYW5kbGVyLiBJbml0aWFsaXphdGlvbiBoYW5kbGVycyBhcmUgaW52b2tlZCBkdXJpbmcgdGhlIHZlcnkgZmlyc3RcbiAgICAgKiBlbWl0IG9mIGV2ZW50IGluIHRoaXMgRXZlbnRQcm9wZXJ0eS4gSWYgZmlyc3QgZW1pdCBhbHJlYWR5IG9jY3VycmVkIHRoZW4gdGhlIGhhbmRsZXIgaXNcbiAgICAgKiBpbnZva2VkIGltbWVkaWF0ZWx5LlxuICAgICAqIFRoaXMgbWV0aG9kIHJldHVybnMgYSBwcm9taXNlIHdoaWNoIG1heSBiZSB1c2VkIGluc3RlYWQgb2YgcGFzc2luZyBhIGNhbGxiYWNrLiBOb3RlIHRoYXQgcHJvbWlzZVxuICAgICAqIHJlc29sdmUgYW5kIHJlamVjdCBoYW5kbGVyIHdpbGwgYmUgaW52b2tlZCBvbmx5IG9uIHRoZSBuZXh0IGV2ZW50IGxvb3AgaXRlcmF0aW9uIHdoaWxlIGNhbGxiYWNrXG4gICAgICogd2hpY2ggaXMgcGFzc2VkIGRpcmVjdGx5IHdpbGwgYmViIGludm9rZWQgaW1tZWRpYXRlbHkgYW5kIGJlZm9yZSBhbnkgZXZlbnQtbGlzdGVuZXJzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtFdmVudFByb3BlcnR5LkhhbmRsZXI8VD59IGhhbmRsZXIgLSBjYWxsYmFjayB0byBiZSBpbnZva2VkIHdoZW4gZXZlbnQgaXMgZW1pdHRlZCBmaXJzdCB0aW1lXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtjb250ZXh0XSAtIGhhbmRsZXIgd2lsbCBiZSBpbnZva2VkIGluIHRoaXMgY29udGV4dFxuICAgICAqL1xuICAgIGluaXQoaGFuZGxlcj86IEV2ZW50UHJvcGVydHkuSGFuZGxlcjxUPiwgY29udGV4dD86IE9iamVjdCk6IFByb21pc2U8VD4ge1xuICAgICAgICBpZiAoaGFuZGxlcikge1xuICAgICAgICAgICAgaWYgKHRoaXMuaXNJbml0aWFsaXplZCkge1xuICAgICAgICAgICAgICAgIGhhbmRsZXIuY2FsbChjb250ZXh0IHx8IG51bGwsIHRoaXMuaW5pdEFyZyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuaW5pdEhhbmRsZXJzLnB1c2goW2hhbmRsZXIsIGNvbnRleHQgfHwgbnVsbF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmluaXREZWZlcnJlZC5wcm9taXNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgYWxsIGxpc3RlbmVycyB0aGF0IHdlcmUgYXR0YWNoZWQgd2l0aCBnaXZlbiBoYW5kbGVyIGFuZCB3aXRob3V0IGEgY29udGV4dC5cbiAgICAgKiBOb3RlOiBpdCB3aWxsIG5ldmVyIHJlbW92ZSBhbnkgbGlzdGVuZXIgdGhhdCB3YXMgYXR0YWNoZWQgd2l0aCBhIGNvbnRleHQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0V2ZW50UHJvcGVydHkuSGFuZGxlcjxUPn0gaGFuZGxlciAtIHJlbW92ZSBsaXN0ZW5lcnMgaGF2aW5nIHRoaXMgaGFuZGxlclxuICAgICAqL1xuICAgIG9mZihoYW5kbGVyOiBFdmVudFByb3BlcnR5LkhhbmRsZXI8VD4pOiB2b2lkO1xuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyBsaXN0ZW5lcnMgdGhhdCB3ZXJlIGF0dGFjaGVkIHdpdGggZ2l2ZW4gaGFuZGxlciBhbmQgY29udGV4dC5cbiAgICAgKiBOb3RlOiBpdCB3aWxsIG5ldmVyIHJlbW92ZSBhbnkgbGlzdGVuZXIgdGhhdCB3YXMgYXR0YWNoZWQgd2l0aG91dCBhIGNvbnRleHQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0V2ZW50UHJvcGVydHkuSGFuZGxlcjxUPn0gaGFuZGxlciAtIHJlbW92ZSBsaXN0ZW5lcnMgaGF2aW5nIHRoaXMgaGFuZGxlclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbY29udGV4dF0gLSByZW1vdmUgb25seSBsaXN0ZW5lcnMgaGF2aW5nIHRoaXMgY29udGV4dFxuICAgICAqL1xuICAgIG9mZihoYW5kbGVyOiBFdmVudFByb3BlcnR5LkhhbmRsZXI8VD4sIGNvbnRleHQ6IE9iamVjdCk6IHZvaWQ7XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmVzIGFsbCBsaXN0ZW5lcnMgaGF2aW5nIHRoaXMgY29udGV4dFxuICAgICAqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGNvbnRleHRcbiAgICAgKi9cbiAgICBvZmYoY29udGV4dDogT2JqZWN0KTogdm9pZDtcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgbGlzdGVuZXIgd2l0aCBnaXZlbiBpZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RXZlbnRQcm9wZXJ0eS5MaXN0ZW5lcklkfSBpZFxuICAgICAqL1xuICAgIG9mZihpZDogRXZlbnRQcm9wZXJ0eS5MaXN0ZW5lcklkKTogdm9pZDtcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBwaXBlcyBjcmVhdGVkIGZvciBvdGhlciBFdmVudFByb3BlcnR5LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtFdmVudFByb3BlcnR5fSBkZXN0aW5hdGlvblxuICAgICAqL1xuICAgIG9mZihkZXN0aW5hdGlvbjogRXZlbnRQcm9wZXJ0eTxUPik6IHZvaWQ7XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgYWxsIGxpc3RlbmVycy5cbiAgICAgKi9cbiAgICBvZmYoKTogdm9pZDtcblxuICAgIG9mZiguLi5hcmdzOiBhbnlbXSk6IHZvaWQge1xuICAgICAgICBsZXQgY29udGV4dDogT2JqZWN0ID0gbnVsbCxcbiAgICAgICAgICAgIGhhbmRsZXI6IEV2ZW50UHJvcGVydHkuSGFuZGxlcjxUPiA9IG51bGwsXG4gICAgICAgICAgICBpZFRvUmVtb3ZlOiBFdmVudFByb3BlcnR5Lkxpc3RlbmVySWQgPSBudWxsO1xuICAgICAgICBzd2l0Y2ggKGFyZ3MubGVuZ3RoKSB7XG4gICAgICAgICAgICBjYXNlIDA6IC8vIE5vIGFyZ3VtZW50cyAtIGNsZWFyIGFsbCBsaXN0ZW5lcnNcbiAgICAgICAgICAgICAgICB0aGlzLmxpc3RlbmVycyA9IFtdO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICBpZiAoRXZlbnRQcm9wZXJ0eS5pc0xpc3RlbmVySWQoYXJnc1swXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWRUb1JlbW92ZSA9IGFyZ3NbMF07XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgYXJnc1swXSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZXIgPSBhcmdzWzBdO1xuICAgICAgICAgICAgICAgICAgICBjb250ZXh0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBhcmdzWzBdID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhcmdzWzBdIGluc3RhbmNlb2YgRXZlbnRQcm9wZXJ0eSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vZmYoYXJnc1swXS5lbWl0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBoYW5kbGVyID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dCA9IGFyZ3NbMF07XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGFyZ3VtZW50OiAke3R5cGVvZiBhcmdzWzBdfWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgICAgICBoYW5kbGVyID0gYXJnc1swXTtcbiAgICAgICAgICAgICAgICBjb250ZXh0ID0gYXJnc1sxXTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5zdXBwb3J0ZWQgYXJndW1lbnRzIGZvcm1hdC5cIik7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmxpc3RlbmVycyA9IHRoaXMubGlzdGVuZXJzLmZpbHRlcigoaENvbmY6IEV2ZW50UHJvcGVydHkuSGFuZGxlckRlc2NyaXB0b3I8VD4pID0+IHtcbiAgICAgICAgICAgIGxldCBkaWZmZXJlbnRIYW5kbGVyOiBib29sZWFuID0gaENvbmYuaGFuZGxlciAhPT0gaGFuZGxlcjtcbiAgICAgICAgICAgIGxldCBub0hhbmRsZXJHaXZlbjogYm9vbGVhbiA9ICFoYW5kbGVyO1xuICAgICAgICAgICAgbGV0IG5vQ29udGV4dEdpdmVuOiBib29sZWFuID0gIWNvbnRleHQ7XG4gICAgICAgICAgICBsZXQgY29uZkhhc05vQ29udGV4dDogYm9vbGVhbiA9ICFoQ29uZi5jb250ZXh0O1xuICAgICAgICAgICAgbGV0IGRpZmZlcmVudENvbnRleHQ6IGJvb2xlYW4gPSBoQ29uZi5jb250ZXh0ICE9PSBjb250ZXh0O1xuICAgICAgICAgICAgbGV0IGRvbnRSZW1vdmU6IGJvb2xlYW47XG5cbiAgICAgICAgICAgIGlmIChpZFRvUmVtb3ZlICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZG9udFJlbW92ZSA9IGlkVG9SZW1vdmUgIT09IGhDb25mLmlkO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAobm9IYW5kbGVyR2l2ZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vQ29udGV4dEdpdmVuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbmV4cGVjdGVkIGNpcmN1bXN0YW5jZXMuXCIpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgZG9udFJlbW92ZSA9IGNvbmZIYXNOb0NvbnRleHQgfHwgKGNvbnRleHQgIT09IGhDb25mLmNvbnRleHQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRpZmZlcmVudEhhbmRsZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvbnRSZW1vdmUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG5vQ29udGV4dEdpdmVuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9udFJlbW92ZSA9ICghY29uZkhhc05vQ29udGV4dCkgfHwgKGRpZmZlcmVudEhhbmRsZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb250UmVtb3ZlID0gZGlmZmVyZW50Q29udGV4dCB8fCBkaWZmZXJlbnRIYW5kbGVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGRvbnRSZW1vdmU7XG4gICAgICAgIH0pO1xuICAgIH1cblxuXG4gICAgcHJpdmF0ZSByZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcjogRXZlbnRQcm9wZXJ0eS5IYW5kbGVyRGVzY3JpcHRvcjxUPik6IHZvaWQge1xuICAgICAgICBsZXQgbGlzdGVuZXJJbmRleCA9IHRoaXMubGlzdGVuZXJzLmluZGV4T2YobGlzdGVuZXIpO1xuICAgICAgICBpZiAobGlzdGVuZXJJbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgIHRoaXMubGlzdGVuZXJzLnNwbGljZShsaXN0ZW5lckluZGV4LCAxKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgYWRkTGlzdGVuZXIob3B0aW9uczogRXZlbnRQcm9wZXJ0eS5IYW5kbGVyT3B0aW9uczxUPik6IEV2ZW50UHJvcGVydHkuTGlzdGVuZXJJZCB7XG4gICAgICAgIGxldCB7Y29udGV4dCwgaGFuZGxlciwgb25jZSwgb25seU1hdGNoaW5nLCBtYXRjaFZhbHVlfSA9IG9wdGlvbnM7XG4gICAgICAgIHRoaXMuaWRDb3VudGVyKys7XG4gICAgICAgIHRoaXMubGlzdGVuZXJzLnB1c2goe2NvbnRleHQsIGhhbmRsZXIsIG9uY2UsIGlkOiB0aGlzLmlkQ291bnRlciwgb25seU1hdGNoaW5nLCBtYXRjaFZhbHVlfSk7XG4gICAgICAgIHJldHVybiB0aGlzLmlkQ291bnRlcjtcbiAgICB9XG59XG5cbmV4cG9ydCBuYW1lc3BhY2UgRXZlbnRQcm9wZXJ0eSB7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgY2FsbGJhY2sgZm9ybWF0IHVzZWQgZm9yIGFkZGluZyBsaXN0ZW5lcnMgdG8gRXZlbnRQcm9wZXJ0eS5cbiAgICAgKi9cbiAgICBleHBvcnQgaW50ZXJmYWNlIEhhbmRsZXI8VD4ge1xuICAgICAgICAoZXZlbnRBcmc6IFQpOiB2b2lkO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBmb3JtYXQgb2YgdGhlIEV2ZW50UHJvcGVydHkuZW1pdCBtZXRob2QuXG4gICAgICovXG4gICAgZXhwb3J0IGludGVyZmFjZSBFbWl0TWV0aG9kPFQ+IHtcbiAgICAgICAgKGV2ZW50QXJnOiBUKTogdm9pZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgZm9ybWF0IG9mIHRoZSBFdmVudFByb3BlcnR5OmVtaXQgbWV0aG9kIGZvciBUPXZvaWQuXG4gICAgICovXG4gICAgZXhwb3J0IGludGVyZmFjZSBWb2lkRW1pdE1ldGhvZCB7XG4gICAgICAgICgpOiB2b2lkO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoaXMgdHlwZSBpcyB1c2VkIGp1c3QgdG8gZW1waGFzaXplIHRoZSBtZWFuaW5nIG9mIHRoZSB2YWx1ZS5cbiAgICAgKiBPdGhlcndpc2UgbGlzdGVuZXJzIGlkcyBhcmUgcmVndWxhciBudW1iZXJzLlxuICAgICAqL1xuICAgIGV4cG9ydCB0eXBlIExpc3RlbmVySWQgPSBudW1iZXI7XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIG1ldGhvZCBpcyB1c2VkIGp1c3QgdG8gZW1waGFzaXplIHRoZSBtZWFuaW5nIG9mIHRoZSB2YWx1ZS5cbiAgICAgKiBPdGhlcndpc2Ugd2UgY291bGQganVzdCB1c2UgdHlwZW9mIGlkID09PSBcIm51bWJlclwiIGRpcmVjdGx5LlxuICAgICAqL1xuICAgIGV4cG9ydCBmdW5jdGlvbiBpc0xpc3RlbmVySWQoaWQ6IGFueSkge1xuICAgICAgICByZXR1cm4gdHlwZW9mIGlkID09PSBcIm51bWJlclwiO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBmdWxsIGNvbmZpZ3VyYXRpb24gZm9yIGEgc3BlY2lmaWMgbGlzdGVuZXIuIEl0IGNvbnRyb2xzIHRoZSB3YXlcbiAgICAgKiB0aGUgcmVsZXZhbnQgZXZlbnQtaGFuZGxlciBmdW5jdGlvbiBpcyBpbnZva2VkLlxuICAgICAqL1xuICAgIGV4cG9ydCBpbnRlcmZhY2UgSGFuZGxlck9wdGlvbnM8VD4ge1xuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGFjdHVhbCBoYW5kbGVyIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aGVuIHRoZSBldmVudCBvY2N1cnMuXG4gICAgICAgICAqL1xuICAgICAgICBoYW5kbGVyOiBFdmVudFByb3BlcnR5LkhhbmRsZXI8VD47XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIElmIHRoaXMgZmxhZyBpcyBzZXQgLSB0aGUgZXZlbnQgaGFuZGxlciB3aWxsIHJlbW92ZSBpdHNlbGYgZnJvbVxuICAgICAgICAgKiB0aGUgZXZlbnQgYWZ0ZXIgZmlyc3QgaW52b2NhdGlvbi5cbiAgICAgICAgICovXG4gICAgICAgIG9uY2U/OiBib29sZWFuO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJZiB0aGlzIGZpZWxkIGlzIHNwZWNpZmllZCwgdGhlbiBoYW5kbGVyIHdpbGwgYmUgY2FsbGVkIHdpdGggdGhhdCBjb250ZXh0LlxuICAgICAgICAgKi9cbiAgICAgICAgY29udGV4dD86IE9iamVjdDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQWx3YXlzIHVzZWQgaW4gY29tYmluYXRpb24gd2l0aCBmb2xsb3dpbmcgcGFyYW1ldGVyICdtYXRjaFZhbHVlJyBhbmQgaXMgYVxuICAgICAgICAgKiBmbGFnLCB3aGljaCBtZWFucyhpZiBzZXQpIHRoYXQgb25seSBldmVudCBpbnZvY2F0aW9ucyB3aXRoIGFyZ3VtZW50IG1hdGNoaW5nXG4gICAgICAgICAqICdtYXRjaFZhbHVlJyBzaG91bGQgYmUgcGFzc2VkIHRvIHRoZSBoYW5kbGVyIGZ1bmN0aW9uLlxuICAgICAgICAgKlxuICAgICAgICAgKiBXaGF0IFwibWF0Y2hpbmdcIiBtZWFucyBpcyBub3QgZG9jdW1lbnRlZCB3ZWxsIHlldCBzaW5jZSBpdCBpcyBzdWJqZWN0IHRvIGNoYW5nZS5cbiAgICAgICAgICogRm9yIG5vdyB5b3UgbWF5IGFzc3VtZSB0aGF0IGZvciBwbGFpbiB0eXBlcyAoYm9vbGVhbiwgbnVtYmVyLCBzdHJpbmcpIGl0IGlzXG4gICAgICAgICAqIHN0cmljdCBlcXVhbGl0eS5cbiAgICAgICAgICovXG4gICAgICAgIG9ubHlNYXRjaGluZz86IGJvb2xlYW47XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSB2YWx1ZSwgdG8gYmUgbWF0Y2hlZCBpZiB0aGUgJ29ubHlNYXRjaGluZycgZmxhZyBpcyBzZXQuXG4gICAgICAgICAqL1xuICAgICAgICBtYXRjaFZhbHVlPzogVHxSZWdFeHA7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhpcyBpcyB0aGUgb2JqZWN0IHdoaWNoIHJlcHJlc2VudHMgYW4gZXhpc3RpbmcgaGFuZGxlciBpbnRlcm5hbGx5IGluIEV2ZW50UHJvcGVydHkgb2JqZWN0LlxuICAgICAqXG4gICAgICogRXZlbnRQcm9wZXJ0eSBzdG9yZXMgbGlzdGVuZXJzIGFzIEhhbmRsZXJPcHRpb25zICsgbGlzdGVuZXJJZC5cbiAgICAgKi9cbiAgICBleHBvcnQgaW50ZXJmYWNlIEhhbmRsZXJEZXNjcmlwdG9yPFQ+IGV4dGVuZHMgSGFuZGxlck9wdGlvbnM8VD4ge1xuICAgICAgICBpZDogTGlzdGVuZXJJZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBbiBFdmVudFByb3BlcnR5IGludGVyZmFjZSB3aXRob3V0IHRoZSAnZW1pdCcgbWV0aG9kLlxuICAgICAqXG4gICAgICogSXQgaXMgYSBnb29kIHByYWN0aWNlIHRvIHByb3ZpZGUgcHVibGljIGFjY2VzcyB0byBFdmVudFByb3BlcnRpZXMgaW4gdGhpcyBmb3JtXG4gICAgICogYW5kIG5vdCBpbiB0aGUgb3JpZ2luYWwgRXZlbnRQcm9wZXJ0eSBmb3JtLlxuICAgICAqIEV2ZW50UHJvcGVydHkgdXN1YWxseSByZWxhdGVzIHRvIHNvbWUgY2xhc3MgYW5kIG9ubHkgdGhhdCBjbGFzcyBzaG91bGQgYmUgYWJsZSB0b1xuICAgICAqIHRyaWdnZXIvZW1pdCB0aGUgZXZlbnQuIE9uIHRoZSBvdGhlciBoYW5kIGFueW9uZSBzaG91bGQgYmUgYWJsZSB0byBsaXN0ZW4gdG8gdGhpc1xuICAgICAqIGV2ZW50LiBUaGlzIGxpYnJhcnkgb2ZmZXJzIHNwZWNpYWwgaW50ZXJmYWNlIGZvciB0aGlzIHB1cnBvc2UgYW5kIGEgZmV3IHV0aWxpdHlcbiAgICAgKiBmdW5jdGlvbnMgKG1ha2UsIHNwbGl0LiBzcGxpdFZvaWQpLlxuICAgICAqXG4gICAgICogVGhlIGlkZWEgaXMgdG8gY3JlYXRlIGEgcHJpdmF0ZSBFdmVudFByb3BlcnR5IG1lbWJlciBhbmQgcHVibGljXG4gICAgICogRXZlbnRQcm9wZXJ0eS5FbWl0dGVyIGdldHRlciB3aGljaCByZXR1cm4gdGhhdCBwcml2YXRlIG1lbWJlci5cbiAgICAgKiBZb3UgZG9uJ3QgaGF2ZSB0byBkbyBpdCBpZiB5b3UgdGhpbmsgaXQncyB0b28gY3VtYmVyc29tZSB0aG91Z2guXG4gICAgICovXG4gICAgZXhwb3J0IGludGVyZmFjZSBFbWl0dGVyPFQ+IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEFkZHMgYSBsaXN0ZW5lciBmb3IgdGhpcyBldmVudCB0eXBlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge0V2ZW50UHJvcGVydHkuSGFuZGxlcjxUPn0gaGFuZGxlciAtIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCB3aGVuIGFuIGV2ZW50IGlzIGVtaXR0ZWRcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IFtjb250ZXh0XSAtIGNvbnRleHQgdG8gYmUgdXNlZCB3aGVuIGNhbGxpbmcgaGFuZGxlci4gbnVsbCBieSBkZWZhdWx0LlxuICAgICAgICAgKiBAcmV0dXJucyB7RXZlbnRQcm9wZXJ0eS5MaXN0ZW5lcklkfSAtIG51bWJlciwgaWRlbnRpZnlpbmcgbmV3IGV2ZW50IGxpc3RlbmVyLlxuICAgICAgICAgKi9cbiAgICAgICAgb24oaGFuZGxlcjogRXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+LCBjb250ZXh0PzogT2JqZWN0KTogTGlzdGVuZXJJZDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQWRkcyBhIGxpc3RlbmVyIGZvciB0aGlzIGV2ZW50IHR5cGUuIFRoaXMgbGlzdGVuZXIgd2lsbCBiZSBpbW1lZGlhdGVseSByZW1vdmVkIGFmdGVyIGl0J3NcbiAgICAgICAgICogaW52b2tlZCBmb3IgdGhlIGZpcnN0IHRpbWUuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7RXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+fSBoYW5kbGVyIC0gY2FsbGJhY2sgdG8gYmUgY2FsbGVkIHdoZW4gYW4gZXZlbnQgaXMgZW1pdHRlZFxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gW2NvbnRleHRdIC0gY29udGV4dCB0byBiZSB1c2VkIHdoZW4gY2FsbGluZyBoYW5kbGVyLiBudWxsIGJ5IGRlZmF1bHQuXG4gICAgICAgICAqIEByZXR1cm5zIHtFdmVudFByb3BlcnR5Lkxpc3RlbmVySWR9IC0gbnVtYmVyLCBpZGVudGlmeWluZyBuZXcgZXZlbnQgbGlzdGVuZXIuXG4gICAgICAgICAqL1xuICAgICAgICBvbmNlKGhhbmRsZXI6IEV2ZW50UHJvcGVydHkuSGFuZGxlcjxUPiwgY29udGV4dD86IE9iamVjdCk6IExpc3RlbmVySWQ7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEFkZHMgYSBsaXN0ZW5lciBmb3IgdGhpcyBldmVudCB0eXBlLiBUaGlzIGxpc3RlbmVyIHdpbGwgYmUgY2FsbGVkIG9ubHkgaWYgZXZlbnQgYXJndW1lbnRcbiAgICAgICAgICogbWF0Y2hlcyBnaXZlbiB2YWx1ZS5cbiAgICAgICAgICpcbiAgICAgICAgICogTm90ZTogd2hhdCBcIm1hdGNoaW5nXCIgbWVhbnMgaXMgbm90IGRvY3VtZW50ZWQgd2VsbCB5ZXQgc2luY2UgaXQgaXMgc3ViamVjdCB0byBjaGFuZ2UuXG4gICAgICAgICAqIEZvciBub3cgeW91IHNob3VsZCBhc3N1bWUgdGhhdCBmb3IgcGxhaW4gdHlwZXMgKGJvb2xlYW4sIG51bWJlciwgc3RyaW5nKSBpdCBpc1xuICAgICAgICAgKiBzdHJpY3QgZXF1YWxpdHkuIEZvciBvYmplY3RzIGl0IGlzIGxpa2UgZGVlcCBzdHJpY3QgZXF1YWxpdHkgZXhjZXB0IHRoYXQgYWN0dWFsXG4gICAgICAgICAqIGV2ZW50IGFyZ3VtZW50IG1heSBoYXZlIG1vcmUgZmllbGRzIHRoYW4gbWF0Y2gtdmFsdWUocHJvdG8pLiBCdXQgYWxsIGZpZWxkcyBmcm9tXG4gICAgICAgICAqIG1hdGNoLXZhbHVlIG11c3QgYmUgcHJlc2VudCBpbiBldmVudCBhcmd1bWVudC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtUfFJlZ0V4cH0gdmFsdWUgLSBoYW5kbGVyIGlzIGludm9rZWQgb25seSBpZiBldmVudCBhcmd1bWVudCBtYXRjaGVzIHRoaXMgdmFsdWVcbiAgICAgICAgICogQHBhcmFtIHtFdmVudFByb3BlcnR5LkhhbmRsZXI8VD59IGhhbmRsZXIgLSBjYWxsYmFjayB0byBiZSBjYWxsZWQgd2hlbiBhbiBldmVudCBpcyBlbWl0dGVkXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbY29udGV4dF0gLSBjb250ZXh0IHRvIGJlIHVzZWQgd2hlbiBjYWxsaW5nIGhhbmRsZXIuIG51bGwgYnkgZGVmYXVsdC5cbiAgICAgICAgICogQHJldHVybnMge0V2ZW50UHJvcGVydHkuTGlzdGVuZXJJZH0gLSBudW1iZXIsIGlkZW50aWZ5aW5nIG5ldyBldmVudCBsaXN0ZW5lci5cbiAgICAgICAgICovXG4gICAgICAgIG1hdGNoKHZhbHVlOiBUfFJlZ0V4cCwgaGFuZGxlcjogRXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+LCBjb250ZXh0PzogT2JqZWN0KTogTGlzdGVuZXJJZDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQWRkcyBhIGxpc3RlbmVyIGZvciB0aGlzIGV2ZW50IHR5cGUuIFRoaXMgbGlzdGVuZXIgd2lsbCBiZSBpbnZva2VkIG9ubHkgaWYgZXZlbnQgYXJndW1lbnRcbiAgICAgICAgICogbWF0Y2hlcyBnaXZlbiB2YWx1ZS4gVGhpcyBsaXN0ZW5lciB3aWxsIGJlIGltbWVkaWF0ZWx5IHJlbW92ZWQgYWZ0ZXIgaXQncyBpbnZva2VkXG4gICAgICAgICAqIGZvciB0aGUgZmlyc3QgdGltZS5cbiAgICAgICAgICpcbiAgICAgICAgICogTm90ZTogd2hhdCBcIm1hdGNoaW5nXCIgbWVhbnMgaXMgbm90IGRvY3VtZW50ZWQgd2VsbCB5ZXQgc2luY2UgaXQgaXMgc3ViamVjdCB0byBjaGFuZ2UuXG4gICAgICAgICAqIEZvciBub3cgeW91IHNob3VsZCBhc3N1bWUgdGhhdCBmb3IgcGxhaW4gdHlwZXMgKGJvb2xlYW4sIG51bWJlciwgc3RyaW5nKSBpdCBpc1xuICAgICAgICAgKiBzdHJpY3QgZXF1YWxpdHkuIEZvciBvYmplY3RzIGl0IGlzIGxpa2UgZGVlcCBzdHJpY3QgZXF1YWxpdHkgZXhjZXB0IHRoYXQgYWN0dWFsXG4gICAgICAgICAqIGV2ZW50IGFyZ3VtZW50IG1heSBoYXZlIG1vcmUgZmllbGRzIHRoYW4gbWF0Y2gtdmFsdWUocHJvdG8pLiBCdXQgYWxsIGZpZWxkcyBmcm9tXG4gICAgICAgICAqIG1hdGNoLXZhbHVlIG11c3QgYmUgcHJlc2VudCBpbiBldmVudCBhcmd1bWVudC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtUfFJlZ0V4cH0gdmFsdWUgLSBoYW5kbGVyIGlzIGludm9rZWQgb25seSBpZiBldmVudCBhcmd1bWVudCBtYXRjaGVzIHRoaXMgdmFsdWVcbiAgICAgICAgICogQHBhcmFtIHtFdmVudFByb3BlcnR5LkhhbmRsZXI8VD59IGhhbmRsZXIgLSBjYWxsYmFjayB0byBiZSBjYWxsZWQgd2hlbiBhbiBldmVudCBpcyBlbWl0dGVkXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbY29udGV4dF0gLSBjb250ZXh0IHRvIGJlIHVzZWQgd2hlbiBjYWxsaW5nIGhhbmRsZXIuIG51bGwgYnkgZGVmYXVsdC5cbiAgICAgICAgICogQHJldHVybnMge0V2ZW50UHJvcGVydHkuTGlzdGVuZXJJZH0gLSBudW1iZXIsIGlkZW50aWZ5aW5nIG5ldyBldmVudCBsaXN0ZW5lci5cbiAgICAgICAgICovXG4gICAgICAgIG1hdGNoT25jZSh2YWx1ZTogVHxSZWdFeHAsIGhhbmRsZXI6IEV2ZW50UHJvcGVydHkuSGFuZGxlcjxUPiwgY29udGV4dD86IE9iamVjdCk6IExpc3RlbmVySWQ7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFwiUGlwZXNcIiBFdmVudFByb3BlcnR5IHRvIG90aGVyIEV2ZW50UHJvcGVydHkuIFRoaXMgbWVhbnMgdGhhdCB3aGVuZXZlciB0aGlzIGV2ZW50XG4gICAgICAgICAqIGlzIGVtaXR0ZWQgaXQgaXMgcGFzc2VkIHRvIHRoYXQgb3RoZXIgRXZlbnRQcm9wZXJ0eSB3aGljaCBlbWl0cyBpdCB0b28uXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7RXZlbnRQcm9wZXJ0eTxUPn0gb3RoZXJcbiAgICAgICAgICogQHJldHVybnMge0V2ZW50UHJvcGVydHkuTGlzdGVuZXJJZH1cbiAgICAgICAgICovXG4gICAgICAgIHBpcGUob3RoZXI6IEV2ZW50UHJvcGVydHk8VD4pOiBFdmVudFByb3BlcnR5Lkxpc3RlbmVySWQ7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFBpcGUgb25seSBldmVudHMgd2l0aCBtYXRjaGluZyBhcmd1bWVudCB0byBkZXN0aW5hdGlvbiBFdmVudFByb3BlcnR5LlxuICAgICAgICAgKlxuICAgICAgICAgKiBOb3RlOiB3aGF0IFwibWF0Y2hpbmdcIiBtZWFucyBpcyBub3QgZG9jdW1lbnRlZCB3ZWxsIHlldCBzaW5jZSBpdCBpcyBzdWJqZWN0IHRvIGNoYW5nZS5cbiAgICAgICAgICogRm9yIG5vdyB5b3Ugc2hvdWxkIGFzc3VtZSB0aGF0IGZvciBwbGFpbiB0eXBlcyAoYm9vbGVhbiwgbnVtYmVyLCBzdHJpbmcpIGl0IGlzXG4gICAgICAgICAqIHN0cmljdCBlcXVhbGl0eS4gRm9yIG9iamVjdHMgaXQgaXMgbGlrZSBkZWVwIHN0cmljdCBlcXVhbGl0eSBleGNlcHQgdGhhdCBhY3R1YWxcbiAgICAgICAgICogZXZlbnQgYXJndW1lbnQgbWF5IGhhdmUgbW9yZSBmaWVsZHMgdGhhbiBtYXRjaC12YWx1ZShwcm90bykuIEJ1dCBhbGwgZmllbGRzIGZyb21cbiAgICAgICAgICogbWF0Y2gtdmFsdWUgbXVzdCBiZSBwcmVzZW50IGluIGV2ZW50IGFyZ3VtZW50LlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge1R8UmVnRXhwfSBtYXRjaFZhbHVlIC0gdmFsdWUgdG8gbWF0Y2hcbiAgICAgICAgICogQHBhcmFtIHtFdmVudFByb3BlcnR5PFQ+fSBkZXN0aW5hdGlvbiAtIHRhcmdldCBFdmVudFByb3BlcnR5XG4gICAgICAgICAqIEByZXR1cm5zIHtFdmVudFByb3BlcnR5Lkxpc3RlbmVySWR9XG4gICAgICAgICAqL1xuICAgICAgICByb3V0ZShtYXRjaFZhbHVlOiBUfFJlZ0V4cCwgZGVzdGluYXRpb246IEV2ZW50UHJvcGVydHk8VD4pOiBFdmVudFByb3BlcnR5Lkxpc3RlbmVySWQ7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEFkZHMgYW4gaW5pdGlhbGl6YXRpb24gaGFuZGxlci4gSW5pdGlhbGl6YXRpb24gaGFuZGxlcnMgYXJlIGludm9rZWQgZHVyaW5nIHRoZSB2ZXJ5IGZpcnN0XG4gICAgICAgICAqIGVtaXQgb2YgZXZlbnQgaW4gdGhpcyBFdmVudFByb3BlcnR5LiBJZiBmaXJzdCBlbWl0IGFscmVhZHkgb2NjdXJyZWQgdGhlbiB0aGUgaGFuZGxlciBpc1xuICAgICAgICAgKiBpbnZva2VkIGltbWVkaWF0ZWx5LlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge0V2ZW50UHJvcGVydHkuSGFuZGxlcjxUPn0gaGFuZGxlciAtIGNhbGxiYWNrIHRvIGJlIGludm9rZWQgd2hlbiBldmVudCBpcyBlbWl0dGVkIGZpcnN0IHRpbWVcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IFtjb250ZXh0XSAtIGhhbmRsZXIgd2lsbCBiZSBpbnZva2VkIGluIHRoaXMgY29udGV4dFxuICAgICAgICAgKiBAcmV0dXJucyB7XG4gICAgICAgICAqL1xuICAgICAgICBpbml0KGhhbmRsZXI6IEV2ZW50UHJvcGVydHkuSGFuZGxlcjxUPiwgY29udGV4dD86IE9iamVjdCk6IFByb21pc2U8VD47XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlbW92ZXMgYWxsIGxpc3RlbmVycyB0aGF0IHdlcmUgYXR0YWNoZWQgd2l0aCBnaXZlbiBoYW5kbGVyIGFuZCB3aXRob3V0IGEgY29udGV4dC5cbiAgICAgICAgICogTm90ZTogaXQgd2lsbCBuZXZlciByZW1vdmUgYW55IGxpc3RlbmVyIHRoYXQgd2FzIGF0dGFjaGVkIHdpdGggYSBjb250ZXh0LlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge0V2ZW50UHJvcGVydHkuSGFuZGxlcjxUPn0gaGFuZGxlciAtIHJlbW92ZSBsaXN0ZW5lcnMgaGF2aW5nIHRoaXMgaGFuZGxlclxuICAgICAgICAgKi9cbiAgICAgICAgb2ZmKGhhbmRsZXI6IEV2ZW50UHJvcGVydHkuSGFuZGxlcjxUPik6IHZvaWQ7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlbW92ZXMgbGlzdGVuZXJzIHRoYXQgd2VyZSBhdHRhY2hlZCB3aXRoIGdpdmVuIGhhbmRsZXIgYW5kIGNvbnRleHQuXG4gICAgICAgICAqIE5vdGU6IGl0IHdpbGwgbmV2ZXIgcmVtb3ZlIGFueSBsaXN0ZW5lciB0aGF0IHdhcyBhdHRhY2hlZCB3aXRob3V0IGEgY29udGV4dC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtFdmVudFByb3BlcnR5LkhhbmRsZXI8VD59IGhhbmRsZXIgLSByZW1vdmUgbGlzdGVuZXJzIGhhdmluZyB0aGlzIGhhbmRsZXJcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IFtjb250ZXh0XSAtIHJlbW92ZSBvbmx5IGxpc3RlbmVycyBoYXZpbmcgdGhpcyBjb250ZXh0XG4gICAgICAgICAqL1xuICAgICAgICBvZmYoaGFuZGxlcjogRXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+LCBjb250ZXh0OiBPYmplY3QpOiB2b2lkO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZW1vdmVzIGFsbCBsaXN0ZW5lcnMgaGF2aW5nIHRoaXMgY29udGV4dFxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gY29udGV4dFxuICAgICAgICAgKi9cbiAgICAgICAgb2ZmKGNvbnRleHQ6IE9iamVjdCk6IHZvaWQ7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlbW92ZXMgbGlzdGVuZXIgd2l0aCBnaXZlbiBpZC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtFdmVudFByb3BlcnR5Lkxpc3RlbmVySWR9IGlkXG4gICAgICAgICAqL1xuICAgICAgICBvZmYoaWQ6IEV2ZW50UHJvcGVydHkuTGlzdGVuZXJJZCk6IHZvaWQ7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlbW92ZSBwaXBlcyBjcmVhdGVkIGZvciBvdGhlciBFdmVudFByb3BlcnR5LlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge0V2ZW50UHJvcGVydHl9IGRlc3RpbmF0aW9uXG4gICAgICAgICAqL1xuICAgICAgICBvZmYoZGVzdGluYXRpb246IEV2ZW50UHJvcGVydHk8VD4pOiB2b2lkO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZW1vdmUgYWxsIGxpc3RlbmVycy5cbiAgICAgICAgICovXG4gICAgICAgIG9mZigpOiB2b2lkO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBwYWlyOiBhbiBFdmVudFByb3BlcnR5IGluc3RhbmNlIHRvIGJlIHVzZWQgaW50ZXJuYWxseSBpbiBhIGNsYXNzXG4gICAgICogYW5kIGFuIEVtaXR0ZXItaW50ZXJmYWNlIHRvIGJlIHVzZWQgYXMgcHVibGljIC8gYWNjZXNzaWJsZSBwcm9wZXJ0eS5cbiAgICAgKiBUaGV5IGJvdGggYWN0dWFsbHkgcmVwcmVzZW50IHRoZSBzYW1lIEV2ZW50UHJvcGVydHkgb2JqZWN0LlxuICAgICAqXG4gICAgICogcmV0dXJucyB7W0V2ZW50UHJvcGVydHksRXZlbnRQcm9wZXJ0eS5FbWl0dGVyPFQ+XX1cbiAgICAgKlxuICAgICAqIEBtZXRob2QgRXZlbnRQcm9wZXJ0eS5tYWtlXG4gICAgICogQHN0YXRpY1xuICAgICAqL1xuICAgIGV4cG9ydCBmdW5jdGlvbiBtYWtlPFQ+KCk6IFtFdmVudFByb3BlcnR5PFQ+LCBFdmVudFByb3BlcnR5LkVtaXR0ZXI8VD5dIHtcbiAgICAgICAgbGV0IGV2ZW50UHJvcCA9IG5ldyBFdmVudFByb3BlcnR5PFQ+KCk7XG4gICAgICAgIHJldHVybiBbZXZlbnRQcm9wLCA8RXZlbnRQcm9wZXJ0eS5FbWl0dGVyPFQ+PmV2ZW50UHJvcF07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbiBFdmVudFByb3BlcnR5IG9iamVjdCBhbmQgc3BsaXRzIGl0IGludG8gZW1pdHRlci1mdW5jdGlvbiBhbmRcbiAgICAgKiBFbWl0dGVyLWludGVyZmFjZS4gVXNlIGVtaXR0ZXIgZnVuY3Rpb24gdG8gZW1pdCB0aGUgZXZlbnQgYW5kIEVtaXR0ZXItaW50ZXJmYWNlXG4gICAgICogdG8gYWRkIGFuZCByZW1vdmUgbGlzdGVuZXJzIG9mIHRoYXQgZXZlbnQuXG4gICAgICpcbiAgICAgKiByZXR1cm5zIHtbRXZlbnRQcm9wZXJ0eS5FbWl0TWV0aG9kPFQ+LEV2ZW50UHJvcGVydHkuRW1pdHRlcjxUPl19XG4gICAgICpcbiAgICAgKiBAbWV0aG9kIEV2ZW50UHJvcGVydHkuc3BsaXRcbiAgICAgKiBAc3RhdGljXG4gICAgICovXG4gICAgZXhwb3J0IGZ1bmN0aW9uIHNwbGl0PFQ+KCk6IFtFdmVudFByb3BlcnR5LkVtaXRNZXRob2Q8VD4sIEV2ZW50UHJvcGVydHkuRW1pdHRlcjxUPl0ge1xuICAgICAgICBsZXQgZXZlbnRQcm9wID0gbmV3IEV2ZW50UHJvcGVydHk8VD4oKTtcbiAgICAgICAgcmV0dXJuIFtldmVudFByb3AuZW1pdCwgPEV2ZW50UHJvcGVydHkuRW1pdHRlcjxUPj5ldmVudFByb3BdO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW4gRXZlbnRQcm9wZXJ0eSBvYmplY3QgYW5kIHNwbGl0cyBpdCBpbnRvIGVtaXR0ZXItZnVuY3Rpb24gYW5kXG4gICAgICogRW1pdHRlci1pbnRlcmZhY2UuIFNwZWNpYWwgdmVyc2lvbiBmb3Igdm9pZC10eXBlZCBldmVudHMuXG4gICAgICpcbiAgICAgKiByZXR1cm5zIHtbRXZlbnRQcm9wZXJ0eS5Wb2lkRW1pdE1ldGhvZCxFdmVudFByb3BlcnR5LkVtaXR0ZXI8VD5dfVxuICAgICAqXG4gICAgICogQG1ldGhvZCBFdmVudFByb3BlcnR5LnNwbGl0Vm9pZFxuICAgICAqIEBzdGF0aWNcbiAgICAgKi9cbiAgICBleHBvcnQgZnVuY3Rpb24gc3BsaXRWb2lkKCk6IFtFdmVudFByb3BlcnR5LlZvaWRFbWl0TWV0aG9kLCBFdmVudFByb3BlcnR5LkVtaXR0ZXI8dm9pZD5dIHtcbiAgICAgICAgbGV0IGV2ZW50UHJvcCA9IG5ldyBFdmVudFByb3BlcnR5LlZvaWQoKTtcbiAgICAgICAgbGV0IGVtaXR0ZXIgPSA8RXZlbnRQcm9wZXJ0eS5FbWl0dGVyPHZvaWQ+PmV2ZW50UHJvcDtcbiAgICAgICAgcmV0dXJuIFtldmVudFByb3AuZW1pdCwgZW1pdHRlcl07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU3BlY2lhbCBzdWJjbGFzcyBvZiBFdmVudFByb3BlcnR5IGZvciB2b2lkIHR5cGUgLSBhbGxvd3MgY2FsbGluZyBlbWl0IHdpdGhvdXQgYXJndW1lbnRzLlxuICAgICAqIEV4dGVuZHMge0BsaW5rIEV2ZW50UHJvcGVydHl9XG4gICAgICpcbiAgICAgKiBAY2xhc3MgRXZlbnRQcm9wZXJ0eS5Wb2lkXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBzZWUge0V2ZW50UHJvcGVydHl9XG4gICAgICovXG4gICAgZXhwb3J0IGNsYXNzIFZvaWQgZXh0ZW5kcyBFdmVudFByb3BlcnR5PHZvaWQ+IHtcbiAgICAgICAgY29uc3RydWN0b3IoKSB7IHN1cGVyKCk7IH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogRW1pdHMgYW4gZXZlbnQgaW52b2tpbmcgYWxsIGxpc3RlbmVycy5cbiAgICAgICAgICpcbiAgICAgICAgICogQG1ldGhvZCBFdmVudFByb3BlcnR5LlZvaWQjZW1pdFxuICAgICAgICAgKiBAc2VlIHtFdmVudFByb3BlcnR5I2VtaXR9XG4gICAgICAgICAqL1xuICAgICAgICBlbWl0KCkgeyByZXR1cm4gc3VwZXIuZW1pdCh2b2lkIDApOyB9XG4gICAgfVxufVxuXG5cbi8qKlxuICogVXNlZCBpbiBFdmVudFByb3BlcnR5Lm1hdGNoL21hdGNoT25jZS9yb3V0ZSBtZXRob2RzIHRvIGNvbXBhcmUgZXZlbnQgYXJndW1lbnQgd2l0aCBnaXZlbiB2YWx1ZS5cbiAqIE5vdGU6IHN1YmplY3QgdG8gY2hhbmdlLlxuICpcbiAqIEBwYXJhbSB7YW55fSBzdWJqZWN0IC0gYWN0dWFsIGV2ZW50IGFyZ3VtZW50XG4gKiBAcGFyYW0ge2FueX0gcHJvdG8gLSB2YWx1ZSB0byBtYXRjaFxuICogQHJldHVybnMge2Jvb2xlYW59XG4gKlxuICogQHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gb2JqZWN0TWF0Y2goc3ViamVjdDogYW55LCBwcm90bzogYW55KTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIF9vYmplY3RNYXRjaChzdWJqZWN0LCBwcm90byk7XG59XG5cbmZ1bmN0aW9uIF9vYmplY3RNYXRjaChzdWJqZWN0OiBhbnksIHByb3RvOiBhbnksIHRyYXZlcnNhbFN0YWNrOiBhbnlbXSA9IFtdKTogYm9vbGVhbiB7XG4gICAgc3dpdGNoICh0eXBlb2YgcHJvdG8pIHtcbiAgICAgICAgY2FzZSBcInVuZGVmaW5lZFwiOiByZXR1cm4gc3ViamVjdCA9PT0gdW5kZWZpbmVkO1xuICAgICAgICBjYXNlIFwibnVtYmVyXCI6XG4gICAgICAgIGNhc2UgXCJib29sZWFuXCI6XG4gICAgICAgIGNhc2UgXCJzdHJpbmdcIjpcbiAgICAgICAgY2FzZSBcImZ1bmN0aW9uXCI6XG4gICAgICAgICAgICByZXR1cm4gc3ViamVjdCA9PT0gcHJvdG87XG4gICAgICAgIGNhc2UgXCJvYmplY3RcIjpcbiAgICAgICAgICAgIGxldCBpc01hdGNoaW5nID0gdHJ1ZTtcblxuICAgICAgICAgICAgaWYgKHRyYXZlcnNhbFN0YWNrLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGlmICgodHlwZW9mIHN1YmplY3QgPT09IFwic3RyaW5nXCIpICYmIChwcm90byBpbnN0YW5jZW9mIFJlZ0V4cCkpIHtcbiAgICAgICAgICAgICAgICAgICAgaXNNYXRjaGluZyA9IHByb3RvLnRlc3Qoc3ViamVjdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHN1YmplY3QgIT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgaXNNYXRjaGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghcHJvdG8gfHwgIXN1YmplY3QpXG4gICAgICAgICAgICAgICAgICAgICAgICBpc01hdGNoaW5nID0gIXN1YmplY3QgJiYgIXByb3RvO1xuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICh0cmF2ZXJzYWxTdGFjay5pbmNsdWRlcyhzdWJqZWN0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUmVjdXJzaW9uIVwiKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGtleSBpbiBwcm90bykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm90by5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYXZlcnNhbFN0YWNrLnB1c2goc3ViamVjdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzTWF0Y2hpbmcgPSBpc01hdGNoaW5nICYmIF9vYmplY3RNYXRjaChzdWJqZWN0W2tleV0sIHByb3RvW2tleV0sIHRyYXZlcnNhbFN0YWNrKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhdmVyc2FsU3RhY2sucG9wKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGlzTWF0Y2hpbmc7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVuZXhwZWN0ZWQgdHlwZW9mOiAke3R5cGVvZiBwcm90b31gKTtcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IEV2ZW50UHJvcGVydHk7Il19