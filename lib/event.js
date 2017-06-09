Object.defineProperty(exports, "__esModule", { value: true });
/// <reference path="../typings/index.d.ts"/>
/// <reference path="./interfaces.ts"/>
const interfaces_1 = require("./interfaces");
const ts_buns_1 = require("ts-buns");
var isListenerId = interfaces_1.default.isListenerId;
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
     * @param {Handler<T>} handler - callback to be called when an event is emitted
     * @param {Object} [context] - context to be used when calling handler. null by default.
     * @returns {ListenerId} - number, identifying new event listener.
     */
    on(handler, context) {
        return this.addListener({ handler, context });
    }
    /**
     * Adds a listener. This listener will be immediately removed after it's
     * invoked for the first time.
     *
     * @param {Handler<T>} handler - callback to be called when an event is emitted
     * @param {Object} [context] - context to be used when calling handler. null by default.
     * @returns {ListenerId} - number, identifying new event listener.
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
     * @param {Handler<T>} handler - callback to be called when an event is emitted
     * @param {Object} [context] - context to be used when calling handler. null by default.
     * @returns {ListenerId} - number, identifying new event listener.
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
     * @param {Handler<T>} handler - callback to be called when an event is emitted
     * @param {Object} [context] - context to be used when calling handler. null by default.
     * @returns {ListenerId} - number, identifying new event listener.
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
     * "Pipes" EventProperty to other  This means that whenever this event
     * is emitted it is passed to that other EventProperty which emits it too.
     *
     * @param {EventProperty<T>} other
     * @returns {ListenerId}
     */
    pipe(other) {
        return this.on(other.emit);
    }
    /**
     * Pipe only events with matching argument to destination
     *
     * Note: what "matching" means is not documented well yet since it is subject to change.
     * For now you should assume that for plain types (boolean, number, string) it is
     * strict equality. For objects it is like deep strict equality except that actual
     * event argument may have more fields than match-value(proto). But all fields from
     * match-value must be present in event argument.
     *
     * @param {T|RegExp} matchValue - value to match
     * @param {EventProperty<T>} destination - target EventProperty
     * @returns {ListenerId}
     *
     * @see pipe, match
     */
    route(matchValue, destination) {
        return this.match(matchValue, destination.emit);
    }
    /**
     * Adds an initialization handler. Initialization handlers are invoked during the very first
     * emit of event in this  If first emit already occurred then the handler is
     * invoked immediately.
     * This method returns a promise which may be used instead of passing a callback. Note that promise
     * resolve and reject handler will be invoked only on the next event loop iteration while callback
     * which is passed directly will beb invoked immediately and before any event-listeners.
     *
     * @param {Handler<T>} handler - callback to be invoked when event is emitted first time
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
                if (isListenerId(args[0])) {
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
    function isListenerId(id) { return interfaces_1.default.isListenerId(id); }
    EventProperty.isListenerId = isListenerId;
    /**
     * Creates a pair: an EventProperty instance to be used internally in a class
     * and an Emitter-interface to be used as public / accessible property.
     * They both actually represent the same EventProperty object.
     *
     * returns {[EventProperty,Emitter<T>]}
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
     * returns {[EmitMethod<T>,Emitter<T>]}
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
     * returns {[VoidEmitMethod,Emitter<T>]}
     *
     * @method EventProperty.splitVoid
     * @static
     */
    function splitVoid() {
        let eventProp = new Void();
        let emitter = eventProp;
        return [eventProp.emit, emitter];
    }
    EventProperty.splitVoid = splitVoid;
    /**
     * Special subclass of EventProperty for void type - allows calling emit without arguments.
     * Extends {@link EventProperty}
     *
     * @class Void
     * @static
     * @see {EventProperty}
     */
    class Void extends EventProperty {
        constructor() { super(); }
        /**
         * Emits an event invoking all listeners.
         *
         * @method Void#emit
         * @see {EventProperty#emit}
         */
        emit() { return super.emit(void 0); }
    }
    EventProperty.Void = Void;
    /**
     * Represents a model of a single property of type T. A basic element for constructing models.
     * - Property can be retrieved/changed by using the .value property of the beacon.
     * - Setting new value will trigger the 'changed' event.
     * - Setting the same value will be ignored and won't trigger the 'changed' event.
     * - Can sync to another beacon. Whenever the value of one of the synced beacons changes
     *      the value of the other is changed accordingly.
     * - Attempt to get a value before it was assigned results in exception. It is better to
     *      pass initial value to the constructor
     */
    class Beacon {
        constructor(value) {
            [this.emitChanged, this.changed] = EventProperty.split();
            if (value instanceof Beacon) {
                this.syncTo(value);
                this._priorValue = value._priorValue;
            }
            else {
                this._value = value;
                this._priorValue = value;
            }
        }
        get priorValue() { return this._priorValue; }
        ;
        get value() { return this._value; }
        set value(value) {
            if (this._value !== value) {
                this._priorValue = this._value;
                this._value = value;
                this.emitChanged(this._value);
            }
        }
        syncTo(other) {
            other.changed.on(() => {
                if (this.value !== other.value) {
                    this.value = other.value;
                }
            });
            this.changed.on(() => {
                if (other.value !== this.value) {
                    other.value = this.value;
                }
            });
            this.value = other.value;
        }
        toJSON() {
            return JSON.stringify(this.value, null, "\t");
        }
        fromJSON(json) {
            this.value = JSON.parse(json);
        }
        toString() {
            return this.toJSON();
        }
        valueOf() {
            return this.value.valueOf();
        }
    }
    EventProperty.Beacon = Beacon;
    function Trigger(object, key) {
        return function (arg) {
            switch (typeof object[key]) {
                case "function":
                    object[key](arg);
                    break;
                case "object":
                    if (object[key] instanceof EventProperty) {
                        object[key].emit(arg);
                    }
                    else if (object[key] instanceof Beacon) {
                        object[key].value = arg;
                    }
                    else {
                        console.warn(`Triggered on an unsupported type of field [${key}]: "${object[key]}".`);
                        object[key] = arg;
                    }
                    break;
                default:
                    console.warn(`Triggered on an unsupported type of field [${key}]: "${object[key]}".`);
                    object[key] = arg;
            }
        };
    }
    EventProperty.Trigger = Trigger;
})(EventProperty = exports.EventProperty || (exports.EventProperty = {}));
/**
 * Used in match/matchOnce/route methods to compare event argument with given value.
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvZXZlbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLDZDQUE2QztBQUM3Qyx1Q0FBdUM7QUFDdkMsNkNBQXNDO0FBQ3RDLHFDQUFtQztBQUtuQyxJQUFPLFlBQVksR0FBSSxvQkFBVSxDQUFDLFlBQVksQ0FBQztBQU8vQzs7O0dBR0c7QUFDSDtJQWdCSTtRQWZRLGNBQVMsR0FBMkIsRUFBRSxDQUFDO1FBR3ZDLGlCQUFZLEdBQTJCLEVBQUUsQ0FBQztRQUMxQyxpQkFBWSxHQUFnQixJQUFJLGtCQUFRLEVBQUssQ0FBQztRQVE5QyxjQUFTLEdBQWUsQ0FBQyxDQUFDO1FBSzlCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDckMsQ0FBQztJQVpEOzs7T0FHRztJQUNILElBQUksYUFBYSxLQUFjLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUM7SUFVbkU7Ozs7O09BS0c7SUFFSDs7OztPQUlHO0lBQ0gsSUFBSSxDQUFDLFFBQVc7UUFDWixJQUFJLFFBQWdDLENBQUM7UUFFckMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztZQUN0QixJQUFJLFlBQVksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDO1lBQ3JDLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO1lBQ3pCLElBQUksQ0FBQyxPQUFPLEdBQUcsUUFBUSxDQUFDO1lBQ3hCLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQXVCO2dCQUMxRCxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sSUFBSSxJQUFJLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2hELENBQUMsQ0FBQyxDQUFDO1lBQ0gsSUFBSSxD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Q0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dDQUM1QixjQUFjLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dDQUM3QixVQUFVLEdBQUcsVUFBVSxJQUFJLFlBQVksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLGNBQWMsQ0FBQyxDQUFDO2dDQUNsRixjQUFjLENBQUMsR0FBRyxFQUFFLENBQUM7NEJBQ3pCLENBQUM7d0JBQ0wsQ0FBQztvQkFDTCxDQUFDO2dCQUNMLENBQUM7WUFDTCxDQUFDO1lBQ0QsTUFBTSxDQUFDLFVBQVUsQ0FBQztRQUN0QjtZQUNJLE1BQU0sSUFBSSxLQUFLLENBQUMsc0JBQXNCLE9BQU8sS0FBSyxFQUFFLENBQUMsQ0FBQztJQUM5RCxDQUFDO0FBQ0wsQ0FBQztBQUVELGtCQUFlLGFBQWEsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi90eXBpbmdzL2luZGV4LmQudHNcIi8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9pbnRlcmZhY2VzLnRzXCIvPlxuaW1wb3J0IEludGVyZmFjZXMgZnJvbSBcIi4vaW50ZXJmYWNlc1wiO1xuaW1wb3J0IHsgRGVmZXJyZWQgfSBmcm9tICd0cy1idW5zJztcblxuaW1wb3J0IEVtaXR0ZXIgPSAgSW50ZXJmYWNlcy5FbWl0dGVyO1xuaW1wb3J0IEhhbmRsZXJEZXNjcmlwdG9yID0gIEludGVyZmFjZXMuSGFuZGxlckRlc2NyaXB0b3I7XG5pbXBvcnQgTGlzdGVuZXJJZCA9ICBJbnRlcmZhY2VzLkxpc3RlbmVySWQ7XG5pbXBvcnQgaXNMaXN0ZW5lcklkID0gIEludGVyZmFjZXMuaXNMaXN0ZW5lcklkO1xuaW1wb3J0IEhhbmRsZXJPcHRpb25zID0gIEludGVyZmFjZXMuSGFuZGxlck9wdGlvbnM7XG5pbXBvcnQgRW1pdE1ldGhvZCA9ICBJbnRlcmZhY2VzLkVtaXRNZXRob2Q7XG5pbXBvcnQgVm9pZEVtaXRNZXRob2QgPSAgSW50ZXJmYWNlcy5Wb2lkRW1pdE1ldGhvZDtcbmltcG9ydCBIYW5kbGVyID0gIEludGVyZmFjZXMuSGFuZGxlcjtcbmltcG9ydCBQcm9wZXJ0eU1vZGVsID0gIEludGVyZmFjZXMuUHJvcGVydHlNb2RlbDtcblxuLyoqXG4gKiBSZXByZXNlbnRzIGEgY2VydGFpbiBraW5kIG9mIGV2ZW50cy5cbiAqIFByb3ZpZGVzIG1ldGhvZHMgdG8gb2JzZXJ2ZSBhbmQgdG8gdHJpZ2dlcihlbWl0KSB0aGF0IGtpbmQgb2YgZXZlbnRzLlxuICovXG5leHBvcnQgY2xhc3MgRXZlbnRQcm9wZXJ0eTxUPiBpbXBsZW1lbnRzIEVtaXR0ZXI8VD4ge1xuICAgIHByaXZhdGUgbGlzdGVuZXJzOiBIYW5kbGVyRGVzY3JpcHRvcjxUPltdID0gW107XG5cbiAgICBwcml2YXRlIGluaXRBcmc6IFQ7XG4gICAgcHJpdmF0ZSBpbml0SGFuZGxlcnM6IFtIYW5kbGVyPFQ+LCBPYmplY3RdW10gPSBbXTtcbiAgICBwcml2YXRlIGluaXREZWZlcnJlZDogRGVmZXJyZWQ8VD4gPSBuZXcgRGVmZXJyZWQ8VD4oKTtcblxuICAgIC8qKlxuICAgICAqIEEgc3BlY2lhbCBwcm9wZXJ0eSwgaW5kaWNhdGluZyB0aGF0IHRoZSBldmVudCB3YXMgZW1pdHRlZCBhdCBsZWFzdCBvbmNlLlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgICAqL1xuICAgIGdldCBpc0luaXRpYWxpemVkKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5pbml0SGFuZGxlcnMgPT09IG51bGw7IH1cblxuICAgIHByaXZhdGUgaWRDb3VudGVyOiBMaXN0ZW5lcklkID0gMDtcblxuXG4gICAgY29uc3RydWN0b3IoKSB7XG5cbiAgICAgICAgdGhpcy5lbWl0ID0gdGhpcy5lbWl0LmJpbmQodGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhpcyB0eXBlZGVmIGlzIHVzZWQgdG8gZGVzY3JpYmUgdHlwZS1wYXJhbWV0ZXIgVCBmb3IganNkb2MgcGFyc2VyLlxuICAgICAqXG4gICAgICogQHR5cGVkZWYge2FueX0gVDtcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuXG4gICAgLyoqXG4gICAgICogRW1pdHMgZXZlbnQgd2l0aCBnaXZlbiBhcmd1bWVudC4gVGhpcyBpbnZva2VzIGFsbCBhcHByb3ByaWF0ZSBoYW5kbGVycy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7VH0gZXZlbnRBcmcgLSBldmVudCBhcmd1bWVudCwgaXQncyBwYXNzZWQgdG8gZWFjaCBldmVudCBoYW5kbGVyLlxuICAgICAqL1xuICAgIGVtaXQoZXZlbnRBcmc6IFQpOiB2b2lkIHtcbiAgICAgICAgbGV0IHRvSW52b2tlOiBIYW5kbGVyRGVzY3JpcHRvcjxUPltdO1xuXG4gICAgICAgIGlmICghdGhpcy5pc0luaXRpYWxpemVkKSB7XG4gICAgICAgICAgICBsZXQgaW5pdEhhbmRsZXJzID0gdGhpcy5pbml0SGFuZGxlcnM7XG4gICAgICAgICAgICB0aGlzLmluaXRIYW5kbGVycyA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLmluaXRBcmcgPSBldmVudEFyZztcbiAgICAgICAgICAgIGluaXRIYW5kbGVycy5mb3JFYWNoKChbaGFuZGxlciwgY29udGV4dF06IFtIYW5kbGVyPFQ+LCBPYmplY3RdKSA9PiB7XG4gICAgICAgICAgICAgICAgaGFuZGxlci5jYWxsKGNvbnRleHQgfHwgbnVsbCwgdGhpcy5pbml0QXJnKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5pbml0RGVmZXJyZWQucmVzb2x2ZShldmVudEFyZyk7XG4gICAgICAgIH1cblxuICAgICAgICB0b0ludm9rZSA9IHRoaXMubGlzdGVuZXJzLnNsaWNlKCkuZmlsdGVyKChsaXN0ZW5lcjogSGFuZGxlckRlc2NyaXB0b3I8VD4pID0+IHtcbiAgICAgICAgICAgIGxldCBzaG91bGRJbnZva2UgPSAhbGlzdGVuZXIub25seU1hdGNoaW5nIHx8IG9iamVjdE1hdGNoKGV2ZW50QXJnLCBsaXN0ZW5lci5tYXRjaFZhbHVlKTtcbiAgICAgICAgICAgIGlmIChsaXN0ZW5lci5vbmNlICYmIHNob3VsZEludm9rZSkge1xuICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHNob3VsZEludm9rZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdG9JbnZva2UuZm9yRWFjaCgoe2hhbmRsZXIsIGNvbnRleHR9OiB7aGFuZGxlcjogSGFuZGxlcjxUPiwgY29udGV4dD86IE9iamVjdH0pID0+IHtcbiAgICAgICAgICAgIGhhbmRsZXIuY2FsbChjb250ZXh0IHx8IG51bGwsIGV2ZW50QXJnKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkcyBhIGxpc3RlbmVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtIYW5kbGVyPFQ+fSBoYW5kbGVyIC0gY2FsbGJhY2sgdG8gYmUgY2FsbGVkIHdoZW4gYW4gZXZlbnQgaXMgZW1pdHRlZFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbY29udGV4dF0gLSBjb250ZXh0IHRvIGJlIHVzZWQgd2hlbiBjYWxsaW5nIGhhbmRsZXIuIG51bGwgYnkgZGVmYXVsdC5cbiAgICAgKiBAcmV0dXJucyB7TGlzdGVuZXJJZH0gLSBudW1iZXIsIGlkZW50aWZ5aW5nIG5ldyBldmVudCBsaXN0ZW5lci5cbiAgICAgKi9cbiAgICBvbihoYW5kbGVyOiBIYW5kbGVyPFQ+LCBjb250ZXh0PzogT2JqZWN0KTogTGlzdGVuZXJJZCB7XG4gICAgICAgIHJldHVybiB0aGlzLmFkZExpc3RlbmVyKHsgaGFuZGxlciwgY29udGV4dCB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGRzIGEgbGlzdGVuZXIuIFRoaXMgbGlzdGVuZXIgd2lsbCBiZSBpbW1lZGlhdGVseSByZW1vdmVkIGFmdGVyIGl0J3NcbiAgICAgKiBpbnZva2VkIGZvciB0aGUgZmlyc3QgdGltZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7SGFuZGxlcjxUPn0gaGFuZGxlciAtIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCB3aGVuIGFuIGV2ZW50IGlzIGVtaXR0ZWRcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW2NvbnRleHRdIC0gY29udGV4dCB0byBiZSB1c2VkIHdoZW4gY2FsbGluZyBoYW5kbGVyLiBudWxsIGJ5IGRlZmF1bHQuXG4gICAgICogQHJldHVybnMge0xpc3RlbmVySWR9IC0gbnVtYmVyLCBpZGVudGlmeWluZyBuZXcgZXZlbnQgbGlzdGVuZXIuXG4gICAgICovXG4gICAgb25jZShoYW5kbGVyOiBIYW5kbGVyPFQ+LCBjb250ZXh0OiBPYmplY3QgPSBudWxsKTogTGlzdGVuZXJJZCB7XG4gICAgICAgIHJldHVybiB0aGlzLmFkZExpc3RlbmVyKHsgY29udGV4dCwgaGFuZGxlciwgb25jZTogdHJ1ZSB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGRzIGEgbGlzdGVuZXIuIFRoaXMgbGlzdGVuZXIgd2lsbCBiZSBpbnZva2VkIG9ubHkgaWYgZXZlbnQgYXJndW1lbnRcbiAgICAgKiBtYXRjaGVzIGdpdmVuIHZhbHVlLlxuICAgICAqXG4gICAgICogTm90ZTogd2hhdCBcIm1hdGNoaW5nXCIgbWVhbnMgaXMgbm90IGRvY3VtZW50ZWQgd2VsbCB5ZXQgc2luY2UgaXQgaXMgc3ViamVjdCB0byBjaGFuZ2UuXG4gICAgICogRm9yIG5vdyB5b3Ugc2hvdWxkIGFzc3VtZSB0aGF0IGZvciBwbGFpbiB0eXBlcyAoYm9vbGVhbiwgbnVtYmVyLCBzdHJpbmcpIGl0IGlzXG4gICAgICogc3RyaWN0IGVxdWFsaXR5LiBGb3Igb2JqZWN0cyBpdCBpcyBsaWtlIGRlZXAgc3RyaWN0IGVxdWFsaXR5IGV4Y2VwdCB0aGF0IGFjdHVhbFxuICAgICAqIGV2ZW50IGFyZ3VtZW50IG1heSBoYXZlIG1vcmUgZmllbGRzIHRoYW4gbWF0Y2gtdmFsdWUocHJvdG8pLiBCdXQgYWxsIGZpZWxkcyBmcm9tXG4gICAgICogbWF0Y2gtdmFsdWUgbXVzdCBiZSBwcmVzZW50IGluIGV2ZW50IGFyZ3VtZW50LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtUfFJlZ0V4cH0gdmFsdWUgLSBoYW5kbGVyIGlzIGludm9rZWQgb25seSBpZiBldmVudCBhcmd1bWVudCBtYXRjaGVzIHRoaXMgdmFsdWVcbiAgICAgKiBAcGFyYW0ge0hhbmRsZXI8VD59IGhhbmRsZXIgLSBjYWxsYmFjayB0byBiZSBjYWxsZWQgd2hlbiBhbiBldmVudCBpcyBlbWl0dGVkXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtjb250ZXh0XSAtIGNvbnRleHQgdG8gYmUgdXNlZCB3aGVuIGNhbGxpbmcgaGFuZGxlci4gbnVsbCBieSBkZWZhdWx0LlxuICAgICAqIEByZXR1cm5zIHtMaXN0ZW5lcklkfSAtIG51bWJlciwgaWRlbnRpZnlpbmcgbmV3IGV2ZW50IGxpc3RlbmVyLlxuICAgICAqXG4gICAgICogQHNlZSBvYmplY3RNYXRjaFxuICAgICAqL1xuICAgIG1hdGNoKHZhbHVlOiBUfFJlZ0V4cCwgaGFuZGxlcjogSGFuZGxlcjxUPiwgY29udGV4dD86IE9iamVjdCk6IExpc3RlbmVySWQge1xuICAgICAgICByZXR1cm4gdGhpcy5hZGRMaXN0ZW5lcih7IGhhbmRsZXIsIGNvbnRleHQsIG9ubHlNYXRjaGluZzogdHJ1ZSwgbWF0Y2hWYWx1ZTogdmFsdWUgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkcyBhIGxpc3RlbmVyIGZvciB0aGlzIGV2ZW50IHR5cGUuIFRoaXMgbGlzdGVuZXIgd2lsbCBiZSBpbnZva2VkIG9ubHkgaWYgZXZlbnQgYXJndW1lbnRcbiAgICAgKiBtYXRjaGVzIGdpdmVuIHZhbHVlLiBUaGlzIGxpc3RlbmVyIHdpbGwgYmUgaW1tZWRpYXRlbHkgcmVtb3ZlZCBhZnRlciBpdCdzIGludm9rZWRcbiAgICAgKiBmb3IgdGhlIGZpcnN0IHRpbWUuXG4gICAgICpcbiAgICAgKiBOb3RlOiB3aGF0IFwibWF0Y2hpbmdcIiBtZWFucyBpcyBub3QgZG9jdW1lbnRlZCB3ZWxsIHlldCBzaW5jZSBpdCBpcyBzdWJqZWN0IHRvIGNoYW5nZS5cbiAgICAgKiBGb3Igbm93IHlvdSBzaG91bGQgYXNzdW1lIHRoYXQgZm9yIHBsYWluIHR5cGVzIChib29sZWFuLCBudW1iZXIsIHN0cmluZykgaXQgaXNcbiAgICAgKiBzdHJpY3QgZXF1YWxpdHkuIEZvciBvYmplY3RzIGl0IGlzIGxpa2UgZGVlcCBzdHJpY3QgZXF1YWxpdHkgZXhjZXB0IHRoYXQgYWN0dWFsXG4gICAgICogZXZlbnQgYXJndW1lbnQgbWF5IGhhdmUgbW9yZSBmaWVsZHMgdGhhbiBtYXRjaC12YWx1ZShwcm90bykuIEJ1dCBhbGwgZmllbGRzIGZyb21cbiAgICAgKiBtYXRjaC12YWx1ZSBtdXN0IGJlIHByZXNlbnQgaW4gZXZlbnQgYXJndW1lbnQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1R8UmVnRXhwfSB2YWx1ZSAtIGhhbmRsZXIgaXMgaW52b2tlZCBvbmx5IGlmIGV2ZW50IGFyZ3VtZW50IG1hdGNoZXMgdGhpcyB2YWx1ZVxuICAgICAqIEBwYXJhbSB7SGFuZGxlcjxUPn0gaGFuZGxlciAtIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCB3aGVuIGFuIGV2ZW50IGlzIGVtaXR0ZWRcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW2NvbnRleHRdIC0gY29udGV4dCB0byBiZSB1c2VkIHdoZW4gY2FsbGluZyBoYW5kbGVyLiBudWxsIGJ5IGRlZmF1bHQuXG4gICAgICogQHJldHVybnMge0xpc3RlbmVySWR9IC0gbnVtYmVyLCBpZGVudGlmeWluZyBuZXcgZXZlbnQgbGlzdGVuZXIuXG4gICAgICpcbiAgICAgKiBAc2VlIFByb3BlcnR5RXZlbnQubWF0Y2gsIFByb3BlcnR5RXZlbnQub25jZVxuICAgICAqL1xuICAgIG1hdGNoT25jZSh2YWx1ZTogVHxSZWdFeHAsIGhhbmRsZXI6IEhhbmRsZXI8VD4sIGNvbnRleHQ6IE9iamVjdCA9IG51bGwpOiBMaXN0ZW5lcklkIHtcbiAgICAgICAgIHJldHVybiB0aGlzLmFkZExpc3RlbmVyKHtcbiAgICAgICAgICAgICBjb250ZXh0LFxuICAgICAgICAgICAgIGhhbmRsZXIsXG4gICAgICAgICAgICAgb25jZTogdHJ1ZSxcbiAgICAgICAgICAgICBvbmx5TWF0Y2hpbmc6IHRydWUsXG4gICAgICAgICAgICAgbWF0Y2hWYWx1ZTogdmFsdWVcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXCJQaXBlc1wiIEV2ZW50UHJvcGVydHkgdG8gb3RoZXIgIFRoaXMgbWVhbnMgdGhhdCB3aGVuZXZlciB0aGlzIGV2ZW50XG4gICAgICogaXMgZW1pdHRlZCBpdCBpcyBwYXNzZWQgdG8gdGhhdCBvdGhlciBFdmVudFByb3BlcnR5IHdoaWNoIGVtaXRzIGl0IHRvby5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RXZlbnRQcm9wZXJ0eTxUPn0gb3RoZXJcbiAgICAgKiBAcmV0dXJucyB7TGlzdGVuZXJJZH1cbiAgICAgKi9cbiAgICBwaXBlKG90aGVyOiBFdmVudFByb3BlcnR5PFQ+KTogTGlzdGVuZXJJZCB7XG4gICAgICAgIHJldHVybiB0aGlzLm9uKG90aGVyLmVtaXQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFBpcGUgb25seSBldmVudHMgd2l0aCBtYXRjaGluZyBhcmd1bWVudCB0byBkZXN0aW5hdGlvbiBcbiAgICAgKlxuICAgICAqIE5vdGU6IHdoYXQgXCJtYXRjaGluZ1wiIG1lYW5zIGlzIG5vdCBkb2N1bWVudGVkIHdlbGwgeWV0IHNpbmNlIGl0IGlzIHN1YmplY3QgdG8gY2hhbmdlLlxuICAgICAqIEZvciBub3cgeW91IHNob3VsZCBhc3N1bWUgdGhhdCBmb3IgcGxhaW4gdHlwZXMgKGJvb2xlYW4sIG51bWJlciwgc3RyaW5nKSBpdCBpc1xuICAgICAqIHN0cmljdCBlcXVhbGl0eS4gRm9yIG9iamVjdHMgaXQgaXMgbGlrZSBkZWVwIHN0cmljdCBlcXVhbGl0eSBleGNlcHQgdGhhdCBhY3R1YWxcbiAgICAgKiBldmVudCBhcmd1bWVudCBtYXkgaGF2ZSBtb3JlIGZpZWxkcyB0aGFuIG1hdGNoLXZhbHVlKHByb3RvKS4gQnV0IGFsbCBmaWVsZHMgZnJvbVxuICAgICAqIG1hdGNoLXZhbHVlIG11c3QgYmUgcHJlc2VudCBpbiBldmVudCBhcmd1bWVudC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7VHxSZWdFeHB9IG1hdGNoVmFsdWUgLSB2YWx1ZSB0byBtYXRjaFxuICAgICAqIEBwYXJhbSB7RXZlbnRQcm9wZXJ0eTxUPn0gZGVzdGluYXRpb24gLSB0YXJnZXQgRXZlbnRQcm9wZXJ0eVxuICAgICAqIEByZXR1cm5zIHtMaXN0ZW5lcklkfVxuICAgICAqXG4gICAgICogQHNlZSBwaXBlLCBtYXRjaFxuICAgICAqL1xuICAgIHJvdXRlKG1hdGNoVmFsdWU6IFR8UmVnRXhwLCBkZXN0aW5hdGlvbjogRXZlbnRQcm9wZXJ0eTxUPik6IExpc3RlbmVySWQge1xuICAgICAgICByZXR1cm4gdGhpcy5tYXRjaChtYXRjaFZhbHVlLCBkZXN0aW5hdGlvbi5lbWl0KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGRzIGFuIGluaXRpYWxpemF0aW9uIGhhbmRsZXIuIEluaXRpYWxpemF0aW9uIGhhbmRsZXJzIGFyZSBpbnZva2VkIGR1cmluZyB0aGUgdmVyeSBmaXJzdFxuICAgICAqIGVtaXQgb2YgZXZlbnQgaW4gdGhpcyAgSWYgZmlyc3QgZW1pdCBhbHJlYWR5IG9jY3VycmVkIHRoZW4gdGhlIGhhbmRsZXIgaXNcbiAgICAgKiBpbnZva2VkIGltbWVkaWF0ZWx5LlxuICAgICAqIFRoaXMgbWV0aG9kIHJldHVybnMgYSBwcm9taXNlIHdoaWNoIG1heSBiZSB1c2VkIGluc3RlYWQgb2YgcGFzc2luZyBhIGNhbGxiYWNrLiBOb3RlIHRoYXQgcHJvbWlzZVxuICAgICAqIHJlc29sdmUgYW5kIHJlamVjdCBoYW5kbGVyIHdpbGwgYmUgaW52b2tlZCBvbmx5IG9uIHRoZSBuZXh0IGV2ZW50IGxvb3AgaXRlcmF0aW9uIHdoaWxlIGNhbGxiYWNrXG4gICAgICogd2hpY2ggaXMgcGFzc2VkIGRpcmVjdGx5IHdpbGwgYmViIGludm9rZWQgaW1tZWRpYXRlbHkgYW5kIGJlZm9yZSBhbnkgZXZlbnQtbGlzdGVuZXJzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtIYW5kbGVyPFQ+fSBoYW5kbGVyIC0gY2FsbGJhY2sgdG8gYmUgaW52b2tlZCB3aGVuIGV2ZW50IGlzIGVtaXR0ZWQgZmlyc3QgdGltZVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbY29udGV4dF0gLSBoYW5kbGVyIHdpbGwgYmUgaW52b2tlZCBpbiB0aGlzIGNvbnRleHRcbiAgICAgKi9cbiAgICBpbml0KGhhbmRsZXI/OiBIYW5kbGVyPFQ+LCBjb250ZXh0PzogT2JqZWN0KTogUHJvbWlzZTxUPiB7XG4gICAgICAgIGlmIChoYW5kbGVyKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5pc0luaXRpYWxpemVkKSB7XG4gICAgICAgICAgICAgICAgaGFuZGxlci5jYWxsKGNvbnRleHQgfHwgbnVsbCwgdGhpcy5pbml0QXJnKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pbml0SGFuZGxlcnMucHVzaChbaGFuZGxlciwgY29udGV4dCB8fCBudWxsXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuaW5pdERlZmVycmVkLnByb21pc2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyBhbGwgbGlzdGVuZXJzIHRoYXQgd2VyZSBhdHRhY2hlZCB3aXRoIGdpdmVuIGhhbmRsZXIgYW5kIHdpdGhvdXQgYSBjb250ZXh0LlxuICAgICAqIE5vdGU6IGl0IHdpbGwgbmV2ZXIgcmVtb3ZlIGFueSBsaXN0ZW5lciB0aGF0IHdhcyBhdHRhY2hlZCB3aXRoIGEgY29udGV4dC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7SGFuZGxlcjxUPn0gaGFuZGxlciAtIHJlbW92ZSBsaXN0ZW5lcnMgaGF2aW5nIHRoaXMgaGFuZGxlclxuICAgICAqL1xuICAgIG9mZihoYW5kbGVyOiBIYW5kbGVyPFQ+KTogdm9pZDtcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgbGlzdGVuZXJzIHRoYXQgd2VyZSBhdHRhY2hlZCB3aXRoIGdpdmVuIGhhbmRsZXIgYW5kIGNvbnRleHQuXG4gICAgICogTm90ZTogaXQgd2lsbCBuZXZlciByZW1vdmUgYW55IGxpc3RlbmVyIHRoYXQgd2FzIGF0dGFjaGVkIHdpdGhvdXQgYSBjb250ZXh0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtIYW5kbGVyPFQ+fSBoYW5kbGVyIC0gcmVtb3ZlIGxpc3RlbmVycyBoYXZpbmcgdGhpcyBoYW5kbGVyXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtjb250ZXh0XSAtIHJlbW92ZSBvbmx5IGxpc3RlbmVycyBoYXZpbmcgdGhpcyBjb250ZXh0XG4gICAgICovXG4gICAgb2ZmKGhhbmRsZXI6IEhhbmRsZXI8VD4sIGNvbnRleHQ6IE9iamVjdCk6IHZvaWQ7XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmVzIGFsbCBsaXN0ZW5lcnMgaGF2aW5nIHRoaXMgY29udGV4dFxuICAgICAqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGNvbnRleHRcbiAgICAgKi9cbiAgICBvZmYoY29udGV4dDogT2JqZWN0KTogdm9pZDtcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgbGlzdGVuZXIgd2l0aCBnaXZlbiBpZC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7TGlzdGVuZXJJZH0gaWRcbiAgICAgKi9cbiAgICBvZmYoaWQ6IExpc3RlbmVySWQpOiB2b2lkO1xuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIHBpcGVzIGNyZWF0ZWQgZm9yIG90aGVyIFxuICAgICAqXG4gICAgICogQHBhcmFtIHtFdmVudFByb3BlcnR5fSBkZXN0aW5hdGlvblxuICAgICAqL1xuICAgIG9mZihkZXN0aW5hdGlvbjogRXZlbnRQcm9wZXJ0eTxUPik6IHZvaWQ7XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgYWxsIGxpc3RlbmVycy5cbiAgICAgKi9cbiAgICBvZmYoKTogdm9pZDtcblxuICAgIG9mZiguLi5hcmdzOiBhbnlbXSk6IHZvaWQge1xuICAgICAgICBsZXQgY29udGV4dDogT2JqZWN0ID0gbnVsbCxcbiAgICAgICAgICAgIGhhbmRsZXI6IEhhbmRsZXI8VD4gPSBudWxsLFxuICAgICAgICAgICAgaWRUb1JlbW92ZTogTGlzdGVuZXJJZCA9IG51bGw7XG4gICAgICAgIHN3aXRjaCAoYXJncy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNhc2UgMDogLy8gTm8gYXJndW1lbnRzIC0gY2xlYXIgYWxsIGxpc3RlbmVyc1xuICAgICAgICAgICAgICAgIHRoaXMubGlzdGVuZXJzID0gW107XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgICAgIGlmIChpc0xpc3RlbmVySWQoYXJnc1swXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWRUb1JlbW92ZSA9IGFyZ3NbMF07XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgYXJnc1swXSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZXIgPSBhcmdzWzBdO1xuICAgICAgICAgICAgICAgICAgICBjb250ZXh0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBhcmdzWzBdID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChhcmdzWzBdIGluc3RhbmNlb2YgRXZlbnRQcm9wZXJ0eSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vZmYoYXJnc1swXS5lbWl0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBoYW5kbGVyID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dCA9IGFyZ3NbMF07XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGFyZ3VtZW50OiAke3R5cGVvZiBhcmdzWzBdfWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgICAgICBoYW5kbGVyID0gYXJnc1swXTtcbiAgICAgICAgICAgICAgICBjb250ZXh0ID0gYXJnc1sxXTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5zdXBwb3J0ZWQgYXJndW1lbnRzIGZvcm1hdC5cIik7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmxpc3RlbmVycyA9IHRoaXMubGlzdGVuZXJzLmZpbHRlcigoaENvbmY6IEhhbmRsZXJEZXNjcmlwdG9yPFQ+KSA9PiB7XG4gICAgICAgICAgICBsZXQgZGlmZmVyZW50SGFuZGxlcjogYm9vbGVhbiA9IGhDb25mLmhhbmRsZXIgIT09IGhhbmRsZXI7XG4gICAgICAgICAgICBsZXQgbm9IYW5kbGVyR2l2ZW46IGJvb2xlYW4gPSAhaGFuZGxlcjtcbiAgICAgICAgICAgIGxldCBub0NvbnRleHRHaXZlbjogYm9vbGVhbiA9ICFjb250ZXh0O1xuICAgICAgICAgICAgbGV0IGNvbmZIYXNOb0NvbnRleHQ6IGJvb2xlYW4gPSAhaENvbmYuY29udGV4dDtcbiAgICAgICAgICAgIGxldCBkaWZmZXJlbnRDb250ZXh0OiBib29sZWFuID0gaENvbmYuY29udGV4dCAhPT0gY29udGV4dDtcbiAgICAgICAgICAgIGxldCBkb250UmVtb3ZlOiBib29sZWFuO1xuXG4gICAgICAgICAgICBpZiAoaWRUb1JlbW92ZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGRvbnRSZW1vdmUgPSBpZFRvUmVtb3ZlICE9PSBoQ29uZi5pZDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKG5vSGFuZGxlckdpdmVuKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChub0NvbnRleHRHaXZlbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5leHBlY3RlZCBjaXJjdW1zdGFuY2VzLlwiKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvbnRSZW1vdmUgPSBjb25mSGFzTm9Db250ZXh0IHx8IChjb250ZXh0ICE9PSBoQ29uZi5jb250ZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkaWZmZXJlbnRIYW5kbGVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkb250UmVtb3ZlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChub0NvbnRleHRHaXZlbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvbnRSZW1vdmUgPSAoIWNvbmZIYXNOb0NvbnRleHQpIHx8IChkaWZmZXJlbnRIYW5kbGVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9udFJlbW92ZSA9IGRpZmZlcmVudENvbnRleHQgfHwgZGlmZmVyZW50SGFuZGxlcjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBkb250UmVtb3ZlO1xuICAgICAgICB9KTtcbiAgICB9XG5cblxuICAgIHByaXZhdGUgcmVtb3ZlTGlzdGVuZXIobGlzdGVuZXI6IEhhbmRsZXJEZXNjcmlwdG9yPFQ+KTogdm9pZCB7XG4gICAgICAgIGxldCBsaXN0ZW5lckluZGV4ID0gdGhpcy5saXN0ZW5lcnMuaW5kZXhPZihsaXN0ZW5lcik7XG4gICAgICAgIGlmIChsaXN0ZW5lckluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgdGhpcy5saXN0ZW5lcnMuc3BsaWNlKGxpc3RlbmVySW5kZXgsIDEpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhZGRMaXN0ZW5lcihvcHRpb25zOiBIYW5kbGVyT3B0aW9uczxUPik6IExpc3RlbmVySWQge1xuICAgICAgICBsZXQge2NvbnRleHQsIGhhbmRsZXIsIG9uY2UsIG9ubHlNYXRjaGluZywgbWF0Y2hWYWx1ZX0gPSBvcHRpb25zO1xuICAgICAgICB0aGlzLmlkQ291bnRlcisrO1xuICAgICAgICB0aGlzLmxpc3RlbmVycy5wdXNoKHtjb250ZXh0LCBoYW5kbGVyLCBvbmNlLCBpZDogdGhpcy5pZENvdW50ZXIsIG9ubHlNYXRjaGluZywgbWF0Y2hWYWx1ZX0pO1xuICAgICAgICByZXR1cm4gdGhpcy5pZENvdW50ZXI7XG4gICAgfVxufVxuXG5cbmV4cG9ydCBuYW1lc3BhY2UgRXZlbnRQcm9wZXJ0eSB7XG4gICAgZXhwb3J0IHR5cGUgRW1pdHRlcjxUPiA9IEludGVyZmFjZXMuRW1pdHRlcjxUPjtcbiAgICBleHBvcnQgdHlwZSAgSGFuZGxlckRlc2NyaXB0b3I8VD4gPSAgSW50ZXJmYWNlcy5IYW5kbGVyRGVzY3JpcHRvcjxUPjtcbiAgICBleHBvcnQgdHlwZSBMaXN0ZW5lcklkID0gSW50ZXJmYWNlcy5MaXN0ZW5lcklkO1xuICAgIGV4cG9ydCBmdW5jdGlvbiBpc0xpc3RlbmVySWQoaWQ6IGFueSkge3JldHVybiAgSW50ZXJmYWNlcy5pc0xpc3RlbmVySWQoaWQpOyB9XG4gICAgZXhwb3J0IHR5cGUgIEhhbmRsZXJPcHRpb25zPFQ+ID0gIEludGVyZmFjZXMuSGFuZGxlck9wdGlvbnM8VD47XG4gICAgZXhwb3J0IHR5cGUgIEVtaXRNZXRob2Q8VD4gPSAgSW50ZXJmYWNlcy5FbWl0TWV0aG9kPFQ+O1xuICAgIGV4cG9ydCB0eXBlICBWb2lkRW1pdE1ldGhvZCA9ICBJbnRlcmZhY2VzLlZvaWRFbWl0TWV0aG9kO1xuICAgIGV4cG9ydCB0eXBlICBIYW5kbGVyPFQ+ID0gIEludGVyZmFjZXMuSGFuZGxlcjxUPjtcbiAgICBleHBvcnQgdHlwZSAgUHJvcGVydHlNb2RlbDxUPiA9ICBJbnRlcmZhY2VzLlByb3BlcnR5TW9kZWw8VD47XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIHBhaXI6IGFuIEV2ZW50UHJvcGVydHkgaW5zdGFuY2UgdG8gYmUgdXNlZCBpbnRlcm5hbGx5IGluIGEgY2xhc3NcbiAgICAgKiBhbmQgYW4gRW1pdHRlci1pbnRlcmZhY2UgdG8gYmUgdXNlZCBhcyBwdWJsaWMgLyBhY2Nlc3NpYmxlIHByb3BlcnR5LlxuICAgICAqIFRoZXkgYm90aCBhY3R1YWxseSByZXByZXNlbnQgdGhlIHNhbWUgRXZlbnRQcm9wZXJ0eSBvYmplY3QuXG4gICAgICpcbiAgICAgKiByZXR1cm5zIHtbRXZlbnRQcm9wZXJ0eSxFbWl0dGVyPFQ+XX1cbiAgICAgKlxuICAgICAqIEBtZXRob2QgRXZlbnRQcm9wZXJ0eS5tYWtlXG4gICAgICogQHN0YXRpY1xuICAgICAqL1xuICAgIGV4cG9ydCBmdW5jdGlvbiBtYWtlPFQ+KCk6IFtFdmVudFByb3BlcnR5PFQ+LCBFbWl0dGVyPFQ+XSB7XG4gICAgICAgIGxldCBldmVudFByb3AgPSBuZXcgRXZlbnRQcm9wZXJ0eTxUPigpO1xuICAgICAgICByZXR1cm4gW2V2ZW50UHJvcCwgPEVtaXR0ZXI8VD4+ZXZlbnRQcm9wXTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuIEV2ZW50UHJvcGVydHkgb2JqZWN0IGFuZCBzcGxpdHMgaXQgaW50byBlbWl0dGVyLWZ1bmN0aW9uIGFuZFxuICAgICAqIEVtaXR0ZXItaW50ZXJmYWNlLiBVc2UgZW1pdHRlciBmdW5jdGlvbiB0byBlbWl0IHRoZSBldmVudCBhbmQgRW1pdHRlci1pbnRlcmZhY2VcbiAgICAgKiB0byBhZGQgYW5kIHJlbW92ZSBsaXN0ZW5lcnMgb2YgdGhhdCBldmVudC5cbiAgICAgKlxuICAgICAqIHJldHVybnMge1tFbWl0TWV0aG9kPFQ+LEVtaXR0ZXI8VD5dfVxuICAgICAqXG4gICAgICogQG1ldGhvZCBFdmVudFByb3BlcnR5LnNwbGl0XG4gICAgICogQHN0YXRpY1xuICAgICAqL1xuICAgIGV4cG9ydCBmdW5jdGlvbiBzcGxpdDxUPigpOiBbRW1pdE1ldGhvZDxUPiwgRW1pdHRlcjxUPl0ge1xuICAgICAgICBsZXQgZXZlbnRQcm9wID0gbmV3IEV2ZW50UHJvcGVydHk8VD4oKTtcbiAgICAgICAgcmV0dXJuIFtldmVudFByb3AuZW1pdCwgPEVtaXR0ZXI8VD4+ZXZlbnRQcm9wXTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuIEV2ZW50UHJvcGVydHkgb2JqZWN0IGFuZCBzcGxpdHMgaXQgaW50byBlbWl0dGVyLWZ1bmN0aW9uIGFuZFxuICAgICAqIEVtaXR0ZXItaW50ZXJmYWNlLiBTcGVjaWFsIHZlcnNpb24gZm9yIHZvaWQtdHlwZWQgZXZlbnRzLlxuICAgICAqXG4gICAgICogcmV0dXJucyB7W1ZvaWRFbWl0TWV0aG9kLEVtaXR0ZXI8VD5dfVxuICAgICAqXG4gICAgICogQG1ldGhvZCBFdmVudFByb3BlcnR5LnNwbGl0Vm9pZFxuICAgICAqIEBzdGF0aWNcbiAgICAgKi9cbiAgICBleHBvcnQgZnVuY3Rpb24gc3BsaXRWb2lkKCk6IFtWb2lkRW1pdE1ldGhvZCwgRW1pdHRlcjx2b2lkPl0ge1xuICAgICAgICBsZXQgZXZlbnRQcm9wID0gbmV3IFZvaWQoKTtcbiAgICAgICAgbGV0IGVtaXR0ZXIgPSA8RW1pdHRlcjx2b2lkPj5ldmVudFByb3A7XG4gICAgICAgIHJldHVybiBbZXZlbnRQcm9wLmVtaXQsIGVtaXR0ZXJdO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNwZWNpYWwgc3ViY2xhc3Mgb2YgRXZlbnRQcm9wZXJ0eSBmb3Igdm9pZCB0eXBlIC0gYWxsb3dzIGNhbGxpbmcgZW1pdCB3aXRob3V0IGFyZ3VtZW50cy5cbiAgICAgKiBFeHRlbmRzIHtAbGluayBFdmVudFByb3BlcnR5fVxuICAgICAqXG4gICAgICogQGNsYXNzIFZvaWRcbiAgICAgKiBAc3RhdGljXG4gICAgICogQHNlZSB7RXZlbnRQcm9wZXJ0eX1cbiAgICAgKi9cbiAgICBleHBvcnQgY2xhc3MgVm9pZCBleHRlbmRzIEV2ZW50UHJvcGVydHk8dm9pZD4ge1xuICAgICAgICBjb25zdHJ1Y3RvcigpIHsgc3VwZXIoKTsgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBFbWl0cyBhbiBldmVudCBpbnZva2luZyBhbGwgbGlzdGVuZXJzLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAbWV0aG9kIFZvaWQjZW1pdFxuICAgICAgICAgKiBAc2VlIHtFdmVudFByb3BlcnR5I2VtaXR9XG4gICAgICAgICAqL1xuICAgICAgICBlbWl0KCkgeyByZXR1cm4gc3VwZXIuZW1pdCh2b2lkIDApOyB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVwcmVzZW50cyBhIG1vZGVsIG9mIGEgc2luZ2xlIHByb3BlcnR5IG9mIHR5cGUgVC4gQSBiYXNpYyBlbGVtZW50IGZvciBjb25zdHJ1Y3RpbmcgbW9kZWxzLlxuICAgICAqIC0gUHJvcGVydHkgY2FuIGJlIHJldHJpZXZlZC9jaGFuZ2VkIGJ5IHVzaW5nIHRoZSAudmFsdWUgcHJvcGVydHkgb2YgdGhlIGJlYWNvbi5cbiAgICAgKiAtIFNldHRpbmcgbmV3IHZhbHVlIHdpbGwgdHJpZ2dlciB0aGUgJ2NoYW5nZWQnIGV2ZW50LlxuICAgICAqIC0gU2V0dGluZyB0aGUgc2FtZSB2YWx1ZSB3aWxsIGJlIGlnbm9yZWQgYW5kIHdvbid0IHRyaWdnZXIgdGhlICdjaGFuZ2VkJyBldmVudC5cbiAgICAgKiAtIENhbiBzeW5jIHRvIGFub3RoZXIgYmVhY29uLiBXaGVuZXZlciB0aGUgdmFsdWUgb2Ygb25lIG9mIHRoZSBzeW5jZWQgYmVhY29ucyBjaGFuZ2VzXG4gICAgICogICAgICB0aGUgdmFsdWUgb2YgdGhlIG90aGVyIGlzIGNoYW5nZWQgYWNjb3JkaW5nbHkuXG4gICAgICogLSBBdHRlbXB0IHRvIGdldCBhIHZhbHVlIGJlZm9yZSBpdCB3YXMgYXNzaWduZWQgcmVzdWx0cyBpbiBleGNlcHRpb24uIEl0IGlzIGJldHRlciB0b1xuICAgICAqICAgICAgcGFzcyBpbml0aWFsIHZhbHVlIHRvIHRoZSBjb25zdHJ1Y3RvclxuICAgICAqL1xuICAgIGV4cG9ydCBjbGFzcyBCZWFjb248VD4gaW1wbGVtZW50cyBJbnRlcmZhY2VzLlByb3BlcnR5TW9kZWw8VD4ge1xuXG4gICAgICAgIHByaXZhdGUgZW1pdENoYW5nZWQ6IEludGVyZmFjZXMuRW1pdE1ldGhvZDxUPjtcbiAgICAgICAgcHVibGljIGNoYW5nZWQ6IEludGVyZmFjZXMuRW1pdHRlcjxUPjtcblxuICAgICAgICBwcml2YXRlIF9wcmlvclZhbHVlOiBUO1xuICAgICAgICBnZXQgcHJpb3JWYWx1ZSgpOiBUIHsgcmV0dXJuIHRoaXMuX3ByaW9yVmFsdWU7IH07XG5cbiAgICAgICAgcHJpdmF0ZSBfdmFsdWU6IFQ7XG4gICAgICAgIGdldCB2YWx1ZSgpOiBUIHsgcmV0dXJuIHRoaXMuX3ZhbHVlOyB9XG4gICAgICAgIHNldCB2YWx1ZSh2YWx1ZTogVCkge1xuICAgICAgICAgICAgaWYgKHRoaXMuX3ZhbHVlICE9PSB2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3ByaW9yVmFsdWUgPSB0aGlzLl92YWx1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLl92YWx1ZSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIHRoaXMuZW1pdENoYW5nZWQodGhpcy5fdmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3RydWN0b3IodmFsdWU6IFR8QmVhY29uPFQ+KSB7XG4gICAgICAgICAgICBbdGhpcy5lbWl0Q2hhbmdlZCwgdGhpcy5jaGFuZ2VkXSA9IEV2ZW50UHJvcGVydHkuc3BsaXQ8VD4oKTtcblxuICAgICAgICAgICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgQmVhY29uKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zeW5jVG8odmFsdWUpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3ByaW9yVmFsdWUgPSB2YWx1ZS5fcHJpb3JWYWx1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fdmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLl9wcmlvclZhbHVlID0gdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBzeW5jVG8ob3RoZXI6IEJlYWNvbjxUPikge1xuICAgICAgICAgICAgb3RoZXIuY2hhbmdlZC5vbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMudmFsdWUgIT09IG90aGVyLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmFsdWUgPSBvdGhlci52YWx1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMuY2hhbmdlZC5vbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKG90aGVyLnZhbHVlICE9PSB0aGlzLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIG90aGVyLnZhbHVlID0gdGhpcy52YWx1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMudmFsdWUgPSBvdGhlci52YWx1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRvSlNPTigpOiBzdHJpbmcge1xuICAgICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHRoaXMudmFsdWUsIG51bGwsIFwiXFx0XCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgZnJvbUpTT04oanNvbjogc3RyaW5nKTogdm9pZCB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlID0gSlNPTi5wYXJzZShqc29uKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRvU3RyaW5nKCk6IHN0cmluZyB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy50b0pTT04oKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhbHVlT2YoKTogYW55IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnZhbHVlLnZhbHVlT2YoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGV4cG9ydCBmdW5jdGlvbiBUcmlnZ2VyPFQ+KG9iamVjdDogT2JqZWN0LCBrZXk6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oYXJnOiBUKSB7XG4gICAgICAgICAgICBzd2l0Y2ggKHR5cGVvZiBvYmplY3Rba2V5XSkge1xuICAgICAgICAgICAgICAgIGNhc2UgXCJmdW5jdGlvblwiOiBvYmplY3Rba2V5XShhcmcpOyBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwib2JqZWN0XCI6XG4gICAgICAgICAgICAgICAgICAgIGlmIChvYmplY3Rba2V5XSBpbnN0YW5jZW9mIEV2ZW50UHJvcGVydHkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdFtrZXldLmVtaXQoYXJnKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChvYmplY3Rba2V5XSBpbnN0YW5jZW9mIEJlYWNvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgb2JqZWN0W2tleV0udmFsdWUgPSBhcmc7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYFRyaWdnZXJlZCBvbiBhbiB1bnN1cHBvcnRlZCB0eXBlIG9mIGZpZWxkIFske2tleX1dOiBcIiR7b2JqZWN0W2tleV19XCIuYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBvYmplY3Rba2V5XSA9IGFyZztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYFRyaWdnZXJlZCBvbiBhbiB1bnN1cHBvcnRlZCB0eXBlIG9mIGZpZWxkIFske2tleX1dOiBcIiR7b2JqZWN0W2tleV19XCIuYCk7XG4gICAgICAgICAgICAgICAgICAgIG9iamVjdFtrZXldID0gYXJnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cblxufVxuXG5cbi8qKlxuICogVXNlZCBpbiBtYXRjaC9tYXRjaE9uY2Uvcm91dGUgbWV0aG9kcyB0byBjb21wYXJlIGV2ZW50IGFyZ3VtZW50IHdpdGggZ2l2ZW4gdmFsdWUuXG4gKiBOb3RlOiBzdWJqZWN0IHRvIGNoYW5nZS5cbiAqXG4gKiBAcGFyYW0ge2FueX0gc3ViamVjdCAtIGFjdHVhbCBldmVudCBhcmd1bWVudFxuICogQHBhcmFtIHthbnl9IHByb3RvIC0gdmFsdWUgdG8gbWF0Y2hcbiAqIEByZXR1cm5zIHtib29sZWFufVxuICpcbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIG9iamVjdE1hdGNoKHN1YmplY3Q6IGFueSwgcHJvdG86IGFueSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBfb2JqZWN0TWF0Y2goc3ViamVjdCwgcHJvdG8pO1xufVxuXG5mdW5jdGlvbiBfb2JqZWN0TWF0Y2goc3ViamVjdDogYW55LCBwcm90bzogYW55LCB0cmF2ZXJzYWxTdGFjazogYW55W10gPSBbXSk6IGJvb2xlYW4ge1xuICAgIHN3aXRjaCAodHlwZW9mIHByb3RvKSB7XG4gICAgICAgIGNhc2UgXCJ1bmRlZmluZWRcIjogcmV0dXJuIHN1YmplY3QgPT09IHVuZGVmaW5lZDtcbiAgICAgICAgY2FzZSBcIm51bWJlclwiOlxuICAgICAgICBjYXNlIFwiYm9vbGVhblwiOlxuICAgICAgICBjYXNlIFwic3RyaW5nXCI6XG4gICAgICAgIGNhc2UgXCJmdW5jdGlvblwiOlxuICAgICAgICAgICAgcmV0dXJuIHN1YmplY3QgPT09IHByb3RvO1xuICAgICAgICBjYXNlIFwib2JqZWN0XCI6XG4gICAgICAgICAgICBsZXQgaXNNYXRjaGluZyA9IHRydWU7XG5cbiAgICAgICAgICAgIGlmICh0cmF2ZXJzYWxTdGFjay5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBpZiAoKHR5cGVvZiBzdWJqZWN0ID09PSBcInN0cmluZ1wiKSAmJiAocHJvdG8gaW5zdGFuY2VvZiBSZWdFeHApKSB7XG4gICAgICAgICAgICAgICAgICAgIGlzTWF0Y2hpbmcgPSBwcm90by50ZXN0KHN1YmplY3QpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBzdWJqZWN0ICE9PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGlzTWF0Y2hpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXByb3RvIHx8ICFzdWJqZWN0KVxuICAgICAgICAgICAgICAgICAgICAgICAgaXNNYXRjaGluZyA9ICFzdWJqZWN0ICYmICFwcm90bztcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAodHJhdmVyc2FsU3RhY2suaW5jbHVkZXMoc3ViamVjdCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlJlY3Vyc2lvbiFcIik7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBrZXkgaW4gcHJvdG8pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJvdG8uaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmF2ZXJzYWxTdGFjay5wdXNoKHN1YmplY3QpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc01hdGNoaW5nID0gaXNNYXRjaGluZyAmJiBfb2JqZWN0TWF0Y2goc3ViamVjdFtrZXldLCBwcm90b1trZXldLCB0cmF2ZXJzYWxTdGFjayk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYXZlcnNhbFN0YWNrLnBvcCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBpc01hdGNoaW5nO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmV4cGVjdGVkIHR5cGVvZjogJHt0eXBlb2YgcHJvdG99YCk7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBFdmVudFByb3BlcnR5OyJdfQ==