/// <reference path="../typings/index.d.ts"/>
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Represents a certain type of events.
 * Provides methods to observe and to trigger(emit) events of that type.
 */
class EventProperty {
    constructor() {
        this.listeners = [];
        this.firstTriggerPromise = null;
        this.isFirstTriggerDone = false;
        this.idCounter = 0;
        this.firstTriggerPromise = new Promise((resolve, reject) => {
            this.resolveFirstTriggerPromise = resolve;
            this.rejectFirstTriggerPromise = reject;
        });
        this.emit = this.emit.bind(this);
    }
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
        let resolveFirstTimeTrigger = false;
        let toInvoke;
        if (!this.isFirstTriggerDone) {
            this.isFirstTriggerDone = true;
            resolveFirstTimeTrigger = true;
        }
        toInvoke = this.listeners.slice().filter((listener) => {
            let shouldInvoke = !listener.onlyMatching || objectMatch(eventArg, listener.matchValue);
            if (listener.once) {
                this.removeListener(listener);
            }
            return shouldInvoke;
        });
        toInvoke.forEach((listener) => {
            if (listener.context) {
                listener.handler.call(listener.context, eventArg);
            }
            else {
                listener.handler.call(null, eventArg);
            }
        });
        if (resolveFirstTimeTrigger) {
            this.resolveFirstTriggerPromise(eventArg);
        }
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
     * Returns a promise which is resolved next time this event is emitted.
     * Works as a promisified version of 'once'.
     *
     * @returns {Promise<T>}
     *
     * @see EventProperty.once
     */
    next() {
        return new Promise((resolve, reject) => {
            try {
                this.once(resolve);
            }
            catch (e) {
                reject(e);
            }
        });
    }
    /**
     * Stores promise which is resolved when this event is emitted for the first time.
     *
     * @returns {Promise<T>}
     */
    get first() {
        return this.firstTriggerPromise;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvZXZlbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsNkNBQTZDOztBQUU3Qzs7O0dBR0c7QUFDSDtJQVdJO1FBVlEsY0FBUyxHQUF5QyxFQUFFLENBQUM7UUFFckQsd0JBQW1CLEdBQWUsSUFBSSxDQUFDO1FBR3ZDLHVCQUFrQixHQUFZLEtBQUssQ0FBQztRQUVwQyxjQUFTLEdBQTZCLENBQUMsQ0FBQztRQUs1QyxJQUFJLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUEyQixFQUFFLE1BQXdCO1lBQ3pGLElBQUksQ0FBQywwQkFBMEIsR0FBRyxPQUFPLENBQUM7WUFDMUMsSUFBSSxDQUFDLHlCQUF5QixHQUFHLE1BQU0sQ0FBQztRQUM1QyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDckMsQ0FBQztJQUVEOzs7OztPQUtHO0lBRUg7Ozs7T0FJRztJQUNILElBQUksQ0FBQyxRQUFXO1FBQ1osSUFBSSx1QkFBdUIsR0FBWSxLQUFLLENBQUM7UUFDN0MsSUFBSSxRQUE4QyxDQUFDO1FBRW5ELEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQztZQUMzQixJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDO1lBQy9CLHVCQUF1QixHQUFHLElBQUksQ0FBQztRQUNuQyxDQUFDO1FBRUQsUUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsUUFBNEM7WUFDbEYsSUFBSSxZQUFZLEdBQUcsQ0FBQyxRQUFRLENBQUMsWUFBWSxJQUFJLFdBQVcsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3hGLEVBQUUsQ0FB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QU8sSUFBSSxDQUFDLEtBQUssQ0FBQztvQkFDcEMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUN4QyxNQUFNLElBQUksS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDO29CQUNsQyxDQUFDO29CQUFDLElBQUksQ0FBQyxDQUFDO3dCQUNKLEdBQUcsQ0FBQyxDQUFDLElBQUksR0FBRyxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUM7NEJBQ3BCLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dDQUM1QixjQUFjLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dDQUM3QixVQUFVLEdBQUcsVUFBVSxJQUFJLFlBQVksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLGNBQWMsQ0FBQyxDQUFDO2dDQUNsRixjQUFjLENBQUMsR0FBRyxFQUFFLENBQUM7NEJBQ3pCLENBQUM7d0JBQ0wsQ0FBQztvQkFDTCxDQUFDO2dCQUNMLENBQUM7WUFDTCxDQUFDO1lBQ0QsTUFBTSxDQUFDLFVBQVUsQ0FBQztRQUN0QjtZQUNJLE1BQU0sSUFBSSxLQUFLLENBQUMsc0JBQXNCLE9BQU8sS0FBSyxFQUFFLENBQUMsQ0FBQztJQUM5RCxDQUFDO0FBQ0wsQ0FBQztBQUVELGtCQUFlLGFBQWEsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi90eXBpbmdzL2luZGV4LmQudHNcIi8+XG5cbi8qKlxuICogUmVwcmVzZW50cyBhIGNlcnRhaW4gdHlwZSBvZiBldmVudHMuXG4gKiBQcm92aWRlcyBtZXRob2RzIHRvIG9ic2VydmUgYW5kIHRvIHRyaWdnZXIoZW1pdCkgZXZlbnRzIG9mIHRoYXQgdHlwZS5cbiAqL1xuZXhwb3J0IGNsYXNzIEV2ZW50UHJvcGVydHk8VD4gaW1wbGVtZW50cyBFdmVudFByb3BlcnR5LkVtaXR0ZXI8VD4ge1xuICAgIHByaXZhdGUgbGlzdGVuZXJzOiBFdmVudFByb3BlcnR5LkhhbmRsZXJEZXNjcmlwdG9yPFQ+W10gPSBbXTtcblxuICAgIHByaXZhdGUgZmlyc3RUcmlnZ2VyUHJvbWlzZTogUHJvbWlzZTxUPiA9IG51bGw7XG4gICAgcHJpdmF0ZSByZXNvbHZlRmlyc3RUcmlnZ2VyUHJvbWlzZTogKHZhbHVlOiBUKSA9PiBhbnk7XG4gICAgcHJpdmF0ZSByZWplY3RGaXJzdFRyaWdnZXJQcm9taXNlOiAodmFsdWU6IGFueSkgPT4gYW55O1xuICAgIHByaXZhdGUgaXNGaXJzdFRyaWdnZXJEb25lOiBib29sZWFuID0gZmFsc2U7XG5cbiAgICBwcml2YXRlIGlkQ291bnRlcjogRXZlbnRQcm9wZXJ0eS5MaXN0ZW5lcklkID0gMDtcblxuXG4gICAgY29uc3RydWN0b3IoKSB7XG5cbiAgICAgICAgdGhpcy5maXJzdFRyaWdnZXJQcm9taXNlID0gbmV3IFByb21pc2UoKHJlc29sdmU6ICh2YWx1ZTogVCkgPT4gdm9pZCwgcmVqZWN0OiAoZTogYW55KSA9PiB2b2lkKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnJlc29sdmVGaXJzdFRyaWdnZXJQcm9taXNlID0gcmVzb2x2ZTtcbiAgICAgICAgICAgIHRoaXMucmVqZWN0Rmlyc3RUcmlnZ2VyUHJvbWlzZSA9IHJlamVjdDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5lbWl0ID0gdGhpcy5lbWl0LmJpbmQodGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhpcyB0eXBlZGVmIGlzIHVzZWQgdG8gZGVzY3JpYmUgdHlwZS1wYXJhbWV0ZXIgVCBmb3IganNkb2MgcGFyc2VyLlxuICAgICAqXG4gICAgICogQHR5cGVkZWYge2FueX0gVDtcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuXG4gICAgLyoqXG4gICAgICogRW1pdHMgZXZlbnQgd2l0aCBnaXZlbiBhcmd1bWVudC4gVGhpcyBpbnZva2VzIGFsbCBhcHByb3ByaWF0ZSBoYW5kbGVycy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7VH0gZXZlbnRBcmcgLSBldmVudCBhcmd1bWVudCwgaXQncyBwYXNzZWQgdG8gZWFjaCBldmVudCBoYW5kbGVyLlxuICAgICAqL1xuICAgIGVtaXQoZXZlbnRBcmc6IFQpOiB2b2lkIHtcbiAgICAgICAgbGV0IHJlc29sdmVGaXJzdFRpbWVUcmlnZ2VyOiBib29sZWFuID0gZmFsc2U7XG4gICAgICAgIGxldCB0b0ludm9rZTogRXZlbnRQcm9wZXJ0eS5IYW5kbGVyRGVzY3JpcHRvcjxUPltdO1xuXG4gICAgICAgIGlmICghdGhpcy5pc0ZpcnN0VHJpZ2dlckRvbmUpIHtcbiAgICAgICAgICAgIHRoaXMuaXNGaXJzdFRyaWdnZXJEb25lID0gdHJ1ZTtcbiAgICAgICAgICAgIHJlc29sdmVGaXJzdFRpbWVUcmlnZ2VyID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRvSW52b2tlID0gdGhpcy5saXN0ZW5lcnMuc2xpY2UoKS5maWx0ZXIoKGxpc3RlbmVyOiBFdmVudFByb3BlcnR5LkhhbmRsZXJEZXNjcmlwdG9yPFQ+KSA9PiB7XG4gICAgICAgICAgICBsZXQgc2hvdWxkSW52b2tlID0gIWxpc3RlbmVyLm9ubHlNYXRjaGluZyB8fCBvYmplY3RNYXRjaChldmVudEFyZywgbGlzdGVuZXIubWF0Y2hWYWx1ZSk7XG4gICAgICAgICAgICBpZiAobGlzdGVuZXIub25jZSkge1xuICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHNob3VsZEludm9rZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdG9JbnZva2UuZm9yRWFjaCgobGlzdGVuZXI6IEV2ZW50UHJvcGVydHkuSGFuZGxlckRlc2NyaXB0b3I8VD4pID0+IHtcbiAgICAgICAgICAgIGlmIChsaXN0ZW5lci5jb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgbGlzdGVuZXIuaGFuZGxlci5jYWxsKGxpc3RlbmVyLmNvbnRleHQsIGV2ZW50QXJnKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbGlzdGVuZXIuaGFuZGxlci5jYWxsKG51bGwsIGV2ZW50QXJnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHJlc29sdmVGaXJzdFRpbWVUcmlnZ2VyKSB7XG4gICAgICAgICAgICB0aGlzLnJlc29sdmVGaXJzdFRyaWdnZXJQcm9taXNlKGV2ZW50QXJnKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZHMgYSBsaXN0ZW5lci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+fSBoYW5kbGVyIC0gY2FsbGJhY2sgdG8gYmUgY2FsbGVkIHdoZW4gYW4gZXZlbnQgaXMgZW1pdHRlZFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbY29udGV4dF0gLSBjb250ZXh0IHRvIGJlIHVzZWQgd2hlbiBjYWxsaW5nIGhhbmRsZXIuIG51bGwgYnkgZGVmYXVsdC5cbiAgICAgKiBAcmV0dXJucyB7RXZlbnRQcm9wZXJ0eS5MaXN0ZW5lcklkfSAtIG51bWJlciwgaWRlbnRpZnlpbmcgbmV3IGV2ZW50IGxpc3RlbmVyLlxuICAgICAqL1xuICAgIG9uKGhhbmRsZXI6IEV2ZW50UHJvcGVydHkuSGFuZGxlcjxUPiwgY29udGV4dD86IE9iamVjdCk6IEV2ZW50UHJvcGVydHkuTGlzdGVuZXJJZCB7XG4gICAgICAgIHJldHVybiB0aGlzLmFkZExpc3RlbmVyKHsgaGFuZGxlciwgY29udGV4dCB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGRzIGEgbGlzdGVuZXIuIFRoaXMgbGlzdGVuZXIgd2lsbCBiZSBpbW1lZGlhdGVseSByZW1vdmVkIGFmdGVyIGl0J3NcbiAgICAgKiBpbnZva2VkIGZvciB0aGUgZmlyc3QgdGltZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+fSBoYW5kbGVyIC0gY2FsbGJhY2sgdG8gYmUgY2FsbGVkIHdoZW4gYW4gZXZlbnQgaXMgZW1pdHRlZFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbY29udGV4dF0gLSBjb250ZXh0IHRvIGJlIHVzZWQgd2hlbiBjYWxsaW5nIGhhbmRsZXIuIG51bGwgYnkgZGVmYXVsdC5cbiAgICAgKiBAcmV0dXJucyB7RXZlbnRQcm9wZXJ0eS5MaXN0ZW5lcklkfSAtIG51bWJlciwgaWRlbnRpZnlpbmcgbmV3IGV2ZW50IGxpc3RlbmVyLlxuICAgICAqL1xuICAgIG9uY2UoaGFuZGxlcjogRXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+LCBjb250ZXh0OiBPYmplY3QgPSBudWxsKTogRXZlbnRQcm9wZXJ0eS5MaXN0ZW5lcklkIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYWRkTGlzdGVuZXIoeyBjb250ZXh0LCBoYW5kbGVyLCBvbmNlOiB0cnVlIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZHMgYSBsaXN0ZW5lci4gVGhpcyBsaXN0ZW5lciB3aWxsIGJlIGludm9rZWQgb25seSBpZiBldmVudCBhcmd1bWVudFxuICAgICAqIG1hdGNoZXMgZ2l2ZW4gdmFsdWUuXG4gICAgICpcbiAgICAgKiBOb3RlOiB3aGF0IFwibWF0Y2hpbmdcIiBtZWFucyBpcyBub3QgZG9jdW1lbnRlZCB3ZWxsIHlldCBzaW5jZSBpdCBpcyBzdWJqZWN0IHRvIGNoYW5nZS5cbiAgICAgKiBGb3Igbm93IHlvdSBzaG91bGQgYXNzdW1lIHRoYXQgZm9yIHBsYWluIHR5cGVzIChib29sZWFuLCBudW1iZXIsIHN0cmluZykgaXQgaXNcbiAgICAgKiBzdHJpY3QgZXF1YWxpdHkuIEZvciBvYmplY3RzIGl0IGlzIGxpa2UgZGVlcCBzdHJpY3QgZXF1YWxpdHkgZXhjZXB0IHRoYXQgYWN0dWFsXG4gICAgICogZXZlbnQgYXJndW1lbnQgbWF5IGhhdmUgbW9yZSBmaWVsZHMgdGhhbiBtYXRjaC12YWx1ZShwcm90bykuIEJ1dCBhbGwgZmllbGRzIGZyb21cbiAgICAgKiBtYXRjaC12YWx1ZSBtdXN0IGJlIHByZXNlbnQgaW4gZXZlbnQgYXJndW1lbnQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1R8UmVnRXhwfSB2YWx1ZSAtIGhhbmRsZXIgaXMgaW52b2tlZCBvbmx5IGlmIGV2ZW50IGFyZ3VtZW50IG1hdGNoZXMgdGhpcyB2YWx1ZVxuICAgICAqIEBwYXJhbSB7RXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+fSBoYW5kbGVyIC0gY2FsbGJhY2sgdG8gYmUgY2FsbGVkIHdoZW4gYW4gZXZlbnQgaXMgZW1pdHRlZFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbY29udGV4dF0gLSBjb250ZXh0IHRvIGJlIHVzZWQgd2hlbiBjYWxsaW5nIGhhbmRsZXIuIG51bGwgYnkgZGVmYXVsdC5cbiAgICAgKiBAcmV0dXJucyB7RXZlbnRQcm9wZXJ0eS5MaXN0ZW5lcklkfSAtIG51bWJlciwgaWRlbnRpZnlpbmcgbmV3IGV2ZW50IGxpc3RlbmVyLlxuICAgICAqXG4gICAgICogQHNlZSBvYmplY3RNYXRjaFxuICAgICAqL1xuICAgIG1hdGNoKHZhbHVlOiBUfFJlZ0V4cCwgaGFuZGxlcjogRXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+LCBjb250ZXh0PzogT2JqZWN0KTogRXZlbnRQcm9wZXJ0eS5MaXN0ZW5lcklkIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYWRkTGlzdGVuZXIoeyBoYW5kbGVyLCBjb250ZXh0LCBvbmx5TWF0Y2hpbmc6IHRydWUsIG1hdGNoVmFsdWU6IHZhbHVlIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZHMgYSBsaXN0ZW5lciBmb3IgdGhpcyBldmVudCB0eXBlLiBUaGlzIGxpc3RlbmVyIHdpbGwgYmUgaW52b2tlZCBvbmx5IGlmIGV2ZW50IGFyZ3VtZW50XG4gICAgICogbWF0Y2hlcyBnaXZlbiB2YWx1ZS4gVGhpcyBsaXN0ZW5lciB3aWxsIGJlIGltbWVkaWF0ZWx5IHJlbW92ZWQgYWZ0ZXIgaXQncyBpbnZva2VkXG4gICAgICogZm9yIHRoZSBmaXJzdCB0aW1lLlxuICAgICAqXG4gICAgICogTm90ZTogd2hhdCBcIm1hdGNoaW5nXCIgbWVhbnMgaXMgbm90IGRvY3VtZW50ZWQgd2VsbCB5ZXQgc2luY2UgaXQgaXMgc3ViamVjdCB0byBjaGFuZ2UuXG4gICAgICogRm9yIG5vdyB5b3Ugc2hvdWxkIGFzc3VtZSB0aGF0IGZvciBwbGFpbiB0eXBlcyAoYm9vbGVhbiwgbnVtYmVyLCBzdHJpbmcpIGl0IGlzXG4gICAgICogc3RyaWN0IGVxdWFsaXR5LiBGb3Igb2JqZWN0cyBpdCBpcyBsaWtlIGRlZXAgc3RyaWN0IGVxdWFsaXR5IGV4Y2VwdCB0aGF0IGFjdHVhbFxuICAgICAqIGV2ZW50IGFyZ3VtZW50IG1heSBoYXZlIG1vcmUgZmllbGRzIHRoYW4gbWF0Y2gtdmFsdWUocHJvdG8pLiBCdXQgYWxsIGZpZWxkcyBmcm9tXG4gICAgICogbWF0Y2gtdmFsdWUgbXVzdCBiZSBwcmVzZW50IGluIGV2ZW50IGFyZ3VtZW50LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtUfFJlZ0V4cH0gdmFsdWUgLSBoYW5kbGVyIGlzIGludm9rZWQgb25seSBpZiBldmVudCBhcmd1bWVudCBtYXRjaGVzIHRoaXMgdmFsdWVcbiAgICAgKiBAcGFyYW0ge0V2ZW50UHJvcGVydHkuSGFuZGxlcjxUPn0gaGFuZGxlciAtIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCB3aGVuIGFuIGV2ZW50IGlzIGVtaXR0ZWRcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW2NvbnRleHRdIC0gY29udGV4dCB0byBiZSB1c2VkIHdoZW4gY2FsbGluZyBoYW5kbGVyLiBudWxsIGJ5IGRlZmF1bHQuXG4gICAgICogQHJldHVybnMge0V2ZW50UHJvcGVydHkuTGlzdGVuZXJJZH0gLSBudW1iZXIsIGlkZW50aWZ5aW5nIG5ldyBldmVudCBsaXN0ZW5lci5cbiAgICAgKlxuICAgICAqIEBzZWUgUHJvcGVydHlFdmVudC5tYXRjaCwgUHJvcGVydHlFdmVudC5vbmNlXG4gICAgICovXG4gICAgbWF0Y2hPbmNlKHZhbHVlOiBUfFJlZ0V4cCwgaGFuZGxlcjogRXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+LCBjb250ZXh0OiBPYmplY3QgPSBudWxsKTogRXZlbnRQcm9wZXJ0eS5MaXN0ZW5lcklkIHtcbiAgICAgICAgIHJldHVybiB0aGlzLmFkZExpc3RlbmVyKHtcbiAgICAgICAgICAgICBjb250ZXh0LFxuICAgICAgICAgICAgIGhhbmRsZXIsXG4gICAgICAgICAgICAgb25jZTogdHJ1ZSxcbiAgICAgICAgICAgICBvbmx5TWF0Y2hpbmc6IHRydWUsXG4gICAgICAgICAgICAgbWF0Y2hWYWx1ZTogdmFsdWVcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXCJQaXBlc1wiIEV2ZW50UHJvcGVydHkgdG8gb3RoZXIgRXZlbnRQcm9wZXJ0eS4gVGhpcyBtZWFucyB0aGF0IHdoZW5ldmVyIHRoaXMgZXZlbnRcbiAgICAgKiBpcyBlbWl0dGVkIGl0IGlzIHBhc3NlZCB0byB0aGF0IG90aGVyIEV2ZW50UHJvcGVydHkgd2hpY2ggZW1pdHMgaXQgdG9vLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtFdmVudFByb3BlcnR5PFQ+fSBvdGhlclxuICAgICAqIEByZXR1cm5zIHtFdmVudFByb3BlcnR5Lkxpc3RlbmVySWR9XG4gICAgICovXG4gICAgcGlwZShvdGhlcjogRXZlbnRQcm9wZXJ0eTxUPik6IEV2ZW50UHJvcGVydHkuTGlzdGVuZXJJZCB7XG4gICAgICAgIHJldHVybiB0aGlzLm9uKG90aGVyLmVtaXQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFBpcGUgb25seSBldmVudHMgd2l0aCBtYXRjaGluZyBhcmd1bWVudCB0byBkZXN0aW5hdGlvbiBFdmVudFByb3BlcnR5LlxuICAgICAqXG4gICAgICogTm90ZTogd2hhdCBcIm1hdGNoaW5nXCIgbWVhbnMgaXMgbm90IGRvY3VtZW50ZWQgd2VsbCB5ZXQgc2luY2UgaXQgaXMgc3ViamVjdCB0byBjaGFuZ2UuXG4gICAgICogRm9yIG5vdyB5b3Ugc2hvdWxkIGFzc3VtZSB0aGF0IGZvciBwbGFpbiB0eXBlcyAoYm9vbGVhbiwgbnVtYmVyLCBzdHJpbmcpIGl0IGlzXG4gICAgICogc3RyaWN0IGVxdWFsaXR5LiBGb3Igb2JqZWN0cyBpdCBpcyBsaWtlIGRlZXAgc3RyaWN0IGVxdWFsaXR5IGV4Y2VwdCB0aGF0IGFjdHVhbFxuICAgICAqIGV2ZW50IGFyZ3VtZW50IG1heSBoYXZlIG1vcmUgZmllbGRzIHRoYW4gbWF0Y2gtdmFsdWUocHJvdG8pLiBCdXQgYWxsIGZpZWxkcyBmcm9tXG4gICAgICogbWF0Y2gtdmFsdWUgbXVzdCBiZSBwcmVzZW50IGluIGV2ZW50IGFyZ3VtZW50LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtUfFJlZ0V4cH0gbWF0Y2hWYWx1ZSAtIHZhbHVlIHRvIG1hdGNoXG4gICAgICogQHBhcmFtIHtFdmVudFByb3BlcnR5PFQ+fSBkZXN0aW5hdGlvbiAtIHRhcmdldCBFdmVudFByb3BlcnR5XG4gICAgICogQHJldHVybnMge0V2ZW50UHJvcGVydHkuTGlzdGVuZXJJZH1cbiAgICAgKlxuICAgICAqIEBzZWUgRXZlbnRQcm9wZXJ0eS5waXBlLCBFdmVudFByb3BlcnR5Lm1hdGNoXG4gICAgICovXG4gICAgcm91dGUobWF0Y2hWYWx1ZTogVHxSZWdFeHAsIGRlc3RpbmF0aW9uOiBFdmVudFByb3BlcnR5PFQ+KTogRXZlbnRQcm9wZXJ0eS5MaXN0ZW5lcklkIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubWF0Y2gobWF0Y2hWYWx1ZSwgZGVzdGluYXRpb24uZW1pdCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIHByb21pc2Ugd2hpY2ggaXMgcmVzb2x2ZWQgbmV4dCB0aW1lIHRoaXMgZXZlbnQgaXMgZW1pdHRlZC5cbiAgICAgKiBXb3JrcyBhcyBhIHByb21pc2lmaWVkIHZlcnNpb24gb2YgJ29uY2UnLlxuICAgICAqXG4gICAgICogQHJldHVybnMge1Byb21pc2U8VD59XG4gICAgICpcbiAgICAgKiBAc2VlIEV2ZW50UHJvcGVydHkub25jZVxuICAgICAqL1xuICAgIG5leHQoKTogUHJvbWlzZTxUPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZTogKGE6IFQpID0+IHZvaWQsIHJlamVjdDogKGU6IGFueSkgPT4gdm9pZCkgPT4ge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB0aGlzLm9uY2UocmVzb2x2ZSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTdG9yZXMgcHJvbWlzZSB3aGljaCBpcyByZXNvbHZlZCB3aGVuIHRoaXMgZXZlbnQgaXMgZW1pdHRlZCBmb3IgdGhlIGZpcnN0IHRpbWUuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxUPn1cbiAgICAgKi9cbiAgICBnZXQgZmlyc3QoKTogUHJvbWlzZTxUPiB7XG4gICAgICAgIHJldHVybiB0aGlzLmZpcnN0VHJpZ2dlclByb21pc2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyBhbGwgbGlzdGVuZXJzIHRoYXQgd2VyZSBhdHRhY2hlZCB3aXRoIGdpdmVuIGhhbmRsZXIgYW5kIHdpdGhvdXQgYSBjb250ZXh0LlxuICAgICAqIE5vdGU6IGl0IHdpbGwgbmV2ZXIgcmVtb3ZlIGFueSBsaXN0ZW5lciB0aGF0IHdhcyBhdHRhY2hlZCB3aXRoIGEgY29udGV4dC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+fSBoYW5kbGVyIC0gcmVtb3ZlIGxpc3RlbmVycyBoYXZpbmcgdGhpcyBoYW5kbGVyXG4gICAgICovXG4gICAgb2ZmKGhhbmRsZXI6IEV2ZW50UHJvcGVydHkuSGFuZGxlcjxUPik6IHZvaWQ7XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmVzIGxpc3RlbmVycyB0aGF0IHdlcmUgYXR0YWNoZWQgd2l0aCBnaXZlbiBoYW5kbGVyIGFuZCBjb250ZXh0LlxuICAgICAqIE5vdGU6IGl0IHdpbGwgbmV2ZXIgcmVtb3ZlIGFueSBsaXN0ZW5lciB0aGF0IHdhcyBhdHRhY2hlZCB3aXRob3V0IGEgY29udGV4dC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+fSBoYW5kbGVyIC0gcmVtb3ZlIGxpc3RlbmVycyBoYXZpbmcgdGhpcyBoYW5kbGVyXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtjb250ZXh0XSAtIHJlbW92ZSBvbmx5IGxpc3RlbmVycyBoYXZpbmcgdGhpcyBjb250ZXh0XG4gICAgICovXG4gICAgb2ZmKGhhbmRsZXI6IEV2ZW50UHJvcGVydHkuSGFuZGxlcjxUPiwgY29udGV4dDogT2JqZWN0KTogdm9pZDtcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgYWxsIGxpc3RlbmVycyBoYXZpbmcgdGhpcyBjb250ZXh0XG4gICAgICpcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gY29udGV4dFxuICAgICAqL1xuICAgIG9mZihjb250ZXh0OiBPYmplY3QpOiB2b2lkO1xuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyBsaXN0ZW5lciB3aXRoIGdpdmVuIGlkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtFdmVudFByb3BlcnR5Lkxpc3RlbmVySWR9IGlkXG4gICAgICovXG4gICAgb2ZmKGlkOiBFdmVudFByb3BlcnR5Lkxpc3RlbmVySWQpOiB2b2lkO1xuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIHBpcGVzIGNyZWF0ZWQgZm9yIG90aGVyIEV2ZW50UHJvcGVydHkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0V2ZW50UHJvcGVydHl9IGRlc3RpbmF0aW9uXG4gICAgICovXG4gICAgb2ZmKGRlc3RpbmF0aW9uOiBFdmVudFByb3BlcnR5PFQ+KTogdm9pZDtcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBhbGwgbGlzdGVuZXJzLlxuICAgICAqL1xuICAgIG9mZigpOiB2b2lkO1xuXG4gICAgb2ZmKC4uLmFyZ3M6IGFueVtdKTogdm9pZCB7XG4gICAgICAgIGxldCBjb250ZXh0OiBPYmplY3QgPSBudWxsLFxuICAgICAgICAgICAgaGFuZGxlcjogRXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+ID0gbnVsbCxcbiAgICAgICAgICAgIGlkVG9SZW1vdmU6IEV2ZW50UHJvcGVydHkuTGlzdGVuZXJJZCA9IG51bGw7XG4gICAgICAgIHN3aXRjaCAoYXJncy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNhc2UgMDogLy8gTm8gYXJndW1lbnRzIC0gY2xlYXIgYWxsIGxpc3RlbmVyc1xuICAgICAgICAgICAgICAgIHRoaXMubGlzdGVuZXJzID0gW107XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgICAgIGlmIChFdmVudFByb3BlcnR5LmlzTGlzdGVuZXJJZChhcmdzWzBdKSkge1xuICAgICAgICAgICAgICAgICAgICBpZFRvUmVtb3ZlID0gYXJnc1swXTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBhcmdzWzBdID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlciA9IGFyZ3NbMF07XG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQgPSBudWxsO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGFyZ3NbMF0gPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFyZ3NbMF0gaW5zdGFuY2VvZiBFdmVudFByb3BlcnR5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9mZihhcmdzWzBdLmVtaXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZXIgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICBjb250ZXh0ID0gYXJnc1swXTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgYXJndW1lbnQ6ICR7dHlwZW9mIGFyZ3NbMF19YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgICAgIGhhbmRsZXIgPSBhcmdzWzBdO1xuICAgICAgICAgICAgICAgIGNvbnRleHQgPSBhcmdzWzFdO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbnN1cHBvcnRlZCBhcmd1bWVudHMgZm9ybWF0LlwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMubGlzdGVuZXJzID0gdGhpcy5saXN0ZW5lcnMuZmlsdGVyKChoQ29uZjogRXZlbnRQcm9wZXJ0eS5IYW5kbGVyRGVzY3JpcHRvcjxUPikgPT4ge1xuICAgICAgICAgICAgbGV0IGRpZmZlcmVudEhhbmRsZXI6IGJvb2xlYW4gPSBoQ29uZi5oYW5kbGVyICE9PSBoYW5kbGVyO1xuICAgICAgICAgICAgbGV0IG5vSGFuZGxlckdpdmVuOiBib29sZWFuID0gIWhhbmRsZXI7XG4gICAgICAgICAgICBsZXQgbm9Db250ZXh0R2l2ZW46IGJvb2xlYW4gPSAhY29udGV4dDtcbiAgICAgICAgICAgIGxldCBjb25mSGFzTm9Db250ZXh0OiBib29sZWFuID0gIWhDb25mLmNvbnRleHQ7XG4gICAgICAgICAgICBsZXQgZGlmZmVyZW50Q29udGV4dDogYm9vbGVhbiA9IGhDb25mLmNvbnRleHQgIT09IGNvbnRleHQ7XG4gICAgICAgICAgICBsZXQgZG9udFJlbW92ZTogYm9vbGVhbjtcblxuICAgICAgICAgICAgaWYgKGlkVG9SZW1vdmUgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBkb250UmVtb3ZlID0gaWRUb1JlbW92ZSAhPT0gaENvbmYuaWQ7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChub0hhbmRsZXJHaXZlbikge1xuICAgICAgICAgICAgICAgICAgICBpZiAobm9Db250ZXh0R2l2ZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVuZXhwZWN0ZWQgY2lyY3Vtc3RhbmNlcy5cIik7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkb250UmVtb3ZlID0gY29uZkhhc05vQ29udGV4dCB8fCAoY29udGV4dCAhPT0gaENvbmYuY29udGV4dCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZGlmZmVyZW50SGFuZGxlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZG9udFJlbW92ZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobm9Db250ZXh0R2l2ZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb250UmVtb3ZlID0gKCFjb25mSGFzTm9Db250ZXh0KSB8fCAoZGlmZmVyZW50SGFuZGxlcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvbnRSZW1vdmUgPSBkaWZmZXJlbnRDb250ZXh0IHx8IGRpZmZlcmVudEhhbmRsZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZG9udFJlbW92ZTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG5cbiAgICBwcml2YXRlIHJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyOiBFdmVudFByb3BlcnR5LkhhbmRsZXJEZXNjcmlwdG9yPFQ+KTogdm9pZCB7XG4gICAgICAgIGxldCBsaXN0ZW5lckluZGV4ID0gdGhpcy5saXN0ZW5lcnMuaW5kZXhPZihsaXN0ZW5lcik7XG4gICAgICAgIGlmIChsaXN0ZW5lckluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgdGhpcy5saXN0ZW5lcnMuc3BsaWNlKGxpc3RlbmVySW5kZXgsIDEpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhZGRMaXN0ZW5lcihvcHRpb25zOiBFdmVudFByb3BlcnR5LkhhbmRsZXJPcHRpb25zPFQ+KTogRXZlbnRQcm9wZXJ0eS5MaXN0ZW5lcklkIHtcbiAgICAgICAgbGV0IHtjb250ZXh0LCBoYW5kbGVyLCBvbmNlLCBvbmx5TWF0Y2hpbmcsIG1hdGNoVmFsdWV9ID0gb3B0aW9ucztcbiAgICAgICAgdGhpcy5pZENvdW50ZXIrKztcbiAgICAgICAgdGhpcy5saXN0ZW5lcnMucHVzaCh7Y29udGV4dCwgaGFuZGxlciwgb25jZSwgaWQ6IHRoaXMuaWRDb3VudGVyLCBvbmx5TWF0Y2hpbmcsIG1hdGNoVmFsdWV9KTtcbiAgICAgICAgcmV0dXJuIHRoaXMuaWRDb3VudGVyO1xuICAgIH1cbn1cblxuZXhwb3J0IG5hbWVzcGFjZSBFdmVudFByb3BlcnR5IHtcblxuICAgIC8qKlxuICAgICAqIFRoZSBjYWxsYmFjayBmb3JtYXQgdXNlZCBmb3IgYWRkaW5nIGxpc3RlbmVycyB0byBFdmVudFByb3BlcnR5LlxuICAgICAqL1xuICAgIGV4cG9ydCBpbnRlcmZhY2UgSGFuZGxlcjxUPiB7XG4gICAgICAgIChldmVudEFyZzogVCk6IHZvaWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGZvcm1hdCBvZiB0aGUgRXZlbnRQcm9wZXJ0eS5lbWl0IG1ldGhvZC5cbiAgICAgKi9cbiAgICBleHBvcnQgaW50ZXJmYWNlIEVtaXRNZXRob2Q8VD4ge1xuICAgICAgICAoZXZlbnRBcmc6IFQpOiB2b2lkO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBmb3JtYXQgb2YgdGhlIEV2ZW50UHJvcGVydHk6ZW1pdCBtZXRob2QgZm9yIFQ9dm9pZC5cbiAgICAgKi9cbiAgICBleHBvcnQgaW50ZXJmYWNlIFZvaWRFbWl0TWV0aG9kIHtcbiAgICAgICAgKCk6IHZvaWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhpcyB0eXBlIGlzIHVzZWQganVzdCB0byBlbXBoYXNpemUgdGhlIG1lYW5pbmcgb2YgdGhlIHZhbHVlLlxuICAgICAqIE90aGVyd2lzZSBsaXN0ZW5lcnMgaWRzIGFyZSByZWd1bGFyIG51bWJlcnMuXG4gICAgICovXG4gICAgZXhwb3J0IHR5cGUgTGlzdGVuZXJJZCA9IG51bWJlcjtcblxuICAgIC8qKlxuICAgICAqIFRoaXMgbWV0aG9kIGlzIHVzZWQganVzdCB0byBlbXBoYXNpemUgdGhlIG1lYW5pbmcgb2YgdGhlIHZhbHVlLlxuICAgICAqIE90aGVyd2lzZSB3ZSBjb3VsZCBqdXN0IHVzZSB0eXBlb2YgaWQgPT09IFwibnVtYmVyXCIgZGlyZWN0bHkuXG4gICAgICovXG4gICAgZXhwb3J0IGZ1bmN0aW9uIGlzTGlzdGVuZXJJZChpZDogYW55KSB7XG4gICAgICAgIHJldHVybiB0eXBlb2YgaWQgPT09IFwibnVtYmVyXCI7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGZ1bGwgY29uZmlndXJhdGlvbiBmb3IgYSBzcGVjaWZpYyBsaXN0ZW5lci4gSXQgY29udHJvbHMgdGhlIHdheVxuICAgICAqIHRoZSByZWxldmFudCBldmVudC1oYW5kbGVyIGZ1bmN0aW9uIGlzIGludm9rZWQuXG4gICAgICovXG4gICAgZXhwb3J0IGludGVyZmFjZSBIYW5kbGVyT3B0aW9uczxUPiB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgYWN0dWFsIGhhbmRsZXIgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdoZW4gdGhlIGV2ZW50IG9jY3Vycy5cbiAgICAgICAgICovXG4gICAgICAgIGhhbmRsZXI6IEV2ZW50UHJvcGVydHkuSGFuZGxlcjxUPjtcblxuICAgICAgICAvKipcbiAgICAgICAgICogSWYgdGhpcyBmbGFnIGlzIHNldCAtIHRoZSBldmVudCBoYW5kbGVyIHdpbGwgcmVtb3ZlIGl0c2VsZiBmcm9tXG4gICAgICAgICAqIHRoZSBldmVudCBhZnRlciBmaXJzdCBpbnZvY2F0aW9uLlxuICAgICAgICAgKi9cbiAgICAgICAgb25jZT86IGJvb2xlYW47XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIElmIHRoaXMgZmllbGQgaXMgc3BlY2lmaWVkLCB0aGVuIGhhbmRsZXIgd2lsbCBiZSBjYWxsZWQgd2l0aCB0aGF0IGNvbnRleHQuXG4gICAgICAgICAqL1xuICAgICAgICBjb250ZXh0PzogT2JqZWN0O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBbHdheXMgdXNlZCBpbiBjb21iaW5hdGlvbiB3aXRoIGZvbGxvd2luZyBwYXJhbWV0ZXIgJ21hdGNoVmFsdWUnIGFuZCBpcyBhXG4gICAgICAgICAqIGZsYWcsIHdoaWNoIG1lYW5zKGlmIHNldCkgdGhhdCBvbmx5IGV2ZW50IGludm9jYXRpb25zIHdpdGggYXJndW1lbnQgbWF0Y2hpbmdcbiAgICAgICAgICogJ21hdGNoVmFsdWUnIHNob3VsZCBiZSBwYXNzZWQgdG8gdGhlIGhhbmRsZXIgZnVuY3Rpb24uXG4gICAgICAgICAqXG4gICAgICAgICAqIFdoYXQgXCJtYXRjaGluZ1wiIG1lYW5zIGlzIG5vdCBkb2N1bWVudGVkIHdlbGwgeWV0IHNpbmNlIGl0IGlzIHN1YmplY3QgdG8gY2hhbmdlLlxuICAgICAgICAgKiBGb3Igbm93IHlvdSBtYXkgYXNzdW1lIHRoYXQgZm9yIHBsYWluIHR5cGVzIChib29sZWFuLCBudW1iZXIsIHN0cmluZykgaXQgaXNcbiAgICAgICAgICogc3RyaWN0IGVxdWFsaXR5LlxuICAgICAgICAgKi9cbiAgICAgICAgb25seU1hdGNoaW5nPzogYm9vbGVhbjtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIHZhbHVlLCB0byBiZSBtYXRjaGVkIGlmIHRoZSAnb25seU1hdGNoaW5nJyBmbGFnIGlzIHNldC5cbiAgICAgICAgICovXG4gICAgICAgIG1hdGNoVmFsdWU/OiBUfFJlZ0V4cDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIGlzIHRoZSBvYmplY3Qgd2hpY2ggcmVwcmVzZW50cyBhbiBleGlzdGluZyBoYW5kbGVyIGludGVybmFsbHkgaW4gRXZlbnRQcm9wZXJ0eSBvYmplY3QuXG4gICAgICpcbiAgICAgKiBFdmVudFByb3BlcnR5IHN0b3JlcyBsaXN0ZW5lcnMgYXMgSGFuZGxlck9wdGlvbnMgKyBsaXN0ZW5lcklkLlxuICAgICAqL1xuICAgIGV4cG9ydCBpbnRlcmZhY2UgSGFuZGxlckRlc2NyaXB0b3I8VD4gZXh0ZW5kcyBIYW5kbGVyT3B0aW9uczxUPiB7XG4gICAgICAgIGlkOiBMaXN0ZW5lcklkO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFuIEV2ZW50UHJvcGVydHkgaW50ZXJmYWNlIHdpdGhvdXQgdGhlICdlbWl0JyBtZXRob2QuXG4gICAgICpcbiAgICAgKiBJdCBpcyBhIGdvb2QgcHJhY3RpY2UgdG8gcHJvdmlkZSBwdWJsaWMgYWNjZXNzIHRvIEV2ZW50UHJvcGVydGllcyBpbiB0aGlzIGZvcm1cbiAgICAgKiBhbmQgbm90IGluIHRoZSBvcmlnaW5hbCBFdmVudFByb3BlcnR5IGZvcm0uXG4gICAgICogRXZlbnRQcm9wZXJ0eSB1c3VhbGx5IHJlbGF0ZXMgdG8gc29tZSBjbGFzcyBhbmQgb25seSB0aGF0IGNsYXNzIHNob3VsZCBiZSBhYmxlIHRvXG4gICAgICogdHJpZ2dlci9lbWl0IHRoZSBldmVudC4gT24gdGhlIG90aGVyIGhhbmQgYW55b25lIHNob3VsZCBiZSBhYmxlIHRvIGxpc3RlbiB0byB0aGlzXG4gICAgICogZXZlbnQuIFRoaXMgbGlicmFyeSBvZmZlcnMgc3BlY2lhbCBpbnRlcmZhY2UgZm9yIHRoaXMgcHVycG9zZSBhbmQgYSBmZXcgdXRpbGl0eVxuICAgICAqIGZ1bmN0aW9ucyAobWFrZSwgc3BsaXQuIHNwbGl0Vm9pZCkuXG4gICAgICpcbiAgICAgKiBUaGUgaWRlYSBpcyB0byBjcmVhdGUgYSBwcml2YXRlIEV2ZW50UHJvcGVydHkgbWVtYmVyIGFuZCBwdWJsaWNcbiAgICAgKiBFdmVudFByb3BlcnR5LkVtaXR0ZXIgZ2V0dGVyIHdoaWNoIHJldHVybiB0aGF0IHByaXZhdGUgbWVtYmVyLlxuICAgICAqIFlvdSBkb24ndCBoYXZlIHRvIGRvIGl0IGlmIHlvdSB0aGluayBpdCdzIHRvbyBjdW1iZXJzb21lIHRob3VnaC5cbiAgICAgKi9cbiAgICBleHBvcnQgaW50ZXJmYWNlIEVtaXR0ZXI8VD4ge1xuICAgICAgICAvKipcbiAgICAgICAgICogQWRkcyBhIGxpc3RlbmVyIGZvciB0aGlzIGV2ZW50IHR5cGUuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7RXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+fSBoYW5kbGVyIC0gY2FsbGJhY2sgdG8gYmUgY2FsbGVkIHdoZW4gYW4gZXZlbnQgaXMgZW1pdHRlZFxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gW2NvbnRleHRdIC0gY29udGV4dCB0byBiZSB1c2VkIHdoZW4gY2FsbGluZyBoYW5kbGVyLiBudWxsIGJ5IGRlZmF1bHQuXG4gICAgICAgICAqIEByZXR1cm5zIHtFdmVudFByb3BlcnR5Lkxpc3RlbmVySWR9IC0gbnVtYmVyLCBpZGVudGlmeWluZyBuZXcgZXZlbnQgbGlzdGVuZXIuXG4gICAgICAgICAqL1xuICAgICAgICBvbihoYW5kbGVyOiBFdmVudFByb3BlcnR5LkhhbmRsZXI8VD4sIGNvbnRleHQ/OiBPYmplY3QpOiBMaXN0ZW5lcklkO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBZGRzIGEgbGlzdGVuZXIgZm9yIHRoaXMgZXZlbnQgdHlwZS4gVGhpcyBsaXN0ZW5lciB3aWxsIGJlIGltbWVkaWF0ZWx5IHJlbW92ZWQgYWZ0ZXIgaXQnc1xuICAgICAgICAgKiBpbnZva2VkIGZvciB0aGUgZmlyc3QgdGltZS5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtFdmVudFByb3BlcnR5LkhhbmRsZXI8VD59IGhhbmRsZXIgLSBjYWxsYmFjayB0byBiZSBjYWxsZWQgd2hlbiBhbiBldmVudCBpcyBlbWl0dGVkXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbY29udGV4dF0gLSBjb250ZXh0IHRvIGJlIHVzZWQgd2hlbiBjYWxsaW5nIGhhbmRsZXIuIG51bGwgYnkgZGVmYXVsdC5cbiAgICAgICAgICogQHJldHVybnMge0V2ZW50UHJvcGVydHkuTGlzdGVuZXJJZH0gLSBudW1iZXIsIGlkZW50aWZ5aW5nIG5ldyBldmVudCBsaXN0ZW5lci5cbiAgICAgICAgICovXG4gICAgICAgIG9uY2UoaGFuZGxlcjogRXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+LCBjb250ZXh0PzogT2JqZWN0KTogTGlzdGVuZXJJZDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQWRkcyBhIGxpc3RlbmVyIGZvciB0aGlzIGV2ZW50IHR5cGUuIFRoaXMgbGlzdGVuZXIgd2lsbCBiZSBjYWxsZWQgb25seSBpZiBldmVudCBhcmd1bWVudFxuICAgICAgICAgKiBtYXRjaGVzIGdpdmVuIHZhbHVlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBOb3RlOiB3aGF0IFwibWF0Y2hpbmdcIiBtZWFucyBpcyBub3QgZG9jdW1lbnRlZCB3ZWxsIHlldCBzaW5jZSBpdCBpcyBzdWJqZWN0IHRvIGNoYW5nZS5cbiAgICAgICAgICogRm9yIG5vdyB5b3Ugc2hvdWxkIGFzc3VtZSB0aGF0IGZvciBwbGFpbiB0eXBlcyAoYm9vbGVhbiwgbnVtYmVyLCBzdHJpbmcpIGl0IGlzXG4gICAgICAgICAqIHN0cmljdCBlcXVhbGl0eS4gRm9yIG9iamVjdHMgaXQgaXMgbGlrZSBkZWVwIHN0cmljdCBlcXVhbGl0eSBleGNlcHQgdGhhdCBhY3R1YWxcbiAgICAgICAgICogZXZlbnQgYXJndW1lbnQgbWF5IGhhdmUgbW9yZSBmaWVsZHMgdGhhbiBtYXRjaC12YWx1ZShwcm90bykuIEJ1dCBhbGwgZmllbGRzIGZyb21cbiAgICAgICAgICogbWF0Y2gtdmFsdWUgbXVzdCBiZSBwcmVzZW50IGluIGV2ZW50IGFyZ3VtZW50LlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge1R8UmVnRXhwfSB2YWx1ZSAtIGhhbmRsZXIgaXMgaW52b2tlZCBvbmx5IGlmIGV2ZW50IGFyZ3VtZW50IG1hdGNoZXMgdGhpcyB2YWx1ZVxuICAgICAgICAgKiBAcGFyYW0ge0V2ZW50UHJvcGVydHkuSGFuZGxlcjxUPn0gaGFuZGxlciAtIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCB3aGVuIGFuIGV2ZW50IGlzIGVtaXR0ZWRcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IFtjb250ZXh0XSAtIGNvbnRleHQgdG8gYmUgdXNlZCB3aGVuIGNhbGxpbmcgaGFuZGxlci4gbnVsbCBieSBkZWZhdWx0LlxuICAgICAgICAgKiBAcmV0dXJucyB7RXZlbnRQcm9wZXJ0eS5MaXN0ZW5lcklkfSAtIG51bWJlciwgaWRlbnRpZnlpbmcgbmV3IGV2ZW50IGxpc3RlbmVyLlxuICAgICAgICAgKi9cbiAgICAgICAgbWF0Y2godmFsdWU6IFR8UmVnRXhwLCBoYW5kbGVyOiBFdmVudFByb3BlcnR5LkhhbmRsZXI8VD4sIGNvbnRleHQ/OiBPYmplY3QpOiBMaXN0ZW5lcklkO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBZGRzIGEgbGlzdGVuZXIgZm9yIHRoaXMgZXZlbnQgdHlwZS4gVGhpcyBsaXN0ZW5lciB3aWxsIGJlIGludm9rZWQgb25seSBpZiBldmVudCBhcmd1bWVudFxuICAgICAgICAgKiBtYXRjaGVzIGdpdmVuIHZhbHVlLiBUaGlzIGxpc3RlbmVyIHdpbGwgYmUgaW1tZWRpYXRlbHkgcmVtb3ZlZCBhZnRlciBpdCdzIGludm9rZWRcbiAgICAgICAgICogZm9yIHRoZSBmaXJzdCB0aW1lLlxuICAgICAgICAgKlxuICAgICAgICAgKiBOb3RlOiB3aGF0IFwibWF0Y2hpbmdcIiBtZWFucyBpcyBub3QgZG9jdW1lbnRlZCB3ZWxsIHlldCBzaW5jZSBpdCBpcyBzdWJqZWN0IHRvIGNoYW5nZS5cbiAgICAgICAgICogRm9yIG5vdyB5b3Ugc2hvdWxkIGFzc3VtZSB0aGF0IGZvciBwbGFpbiB0eXBlcyAoYm9vbGVhbiwgbnVtYmVyLCBzdHJpbmcpIGl0IGlzXG4gICAgICAgICAqIHN0cmljdCBlcXVhbGl0eS4gRm9yIG9iamVjdHMgaXQgaXMgbGlrZSBkZWVwIHN0cmljdCBlcXVhbGl0eSBleGNlcHQgdGhhdCBhY3R1YWxcbiAgICAgICAgICogZXZlbnQgYXJndW1lbnQgbWF5IGhhdmUgbW9yZSBmaWVsZHMgdGhhbiBtYXRjaC12YWx1ZShwcm90bykuIEJ1dCBhbGwgZmllbGRzIGZyb21cbiAgICAgICAgICogbWF0Y2gtdmFsdWUgbXVzdCBiZSBwcmVzZW50IGluIGV2ZW50IGFyZ3VtZW50LlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge1R8UmVnRXhwfSB2YWx1ZSAtIGhhbmRsZXIgaXMgaW52b2tlZCBvbmx5IGlmIGV2ZW50IGFyZ3VtZW50IG1hdGNoZXMgdGhpcyB2YWx1ZVxuICAgICAgICAgKiBAcGFyYW0ge0V2ZW50UHJvcGVydHkuSGFuZGxlcjxUPn0gaGFuZGxlciAtIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCB3aGVuIGFuIGV2ZW50IGlzIGVtaXR0ZWRcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IFtjb250ZXh0XSAtIGNvbnRleHQgdG8gYmUgdXNlZCB3aGVuIGNhbGxpbmcgaGFuZGxlci4gbnVsbCBieSBkZWZhdWx0LlxuICAgICAgICAgKiBAcmV0dXJucyB7RXZlbnRQcm9wZXJ0eS5MaXN0ZW5lcklkfSAtIG51bWJlciwgaWRlbnRpZnlpbmcgbmV3IGV2ZW50IGxpc3RlbmVyLlxuICAgICAgICAgKi9cbiAgICAgICAgbWF0Y2hPbmNlKHZhbHVlOiBUfFJlZ0V4cCwgaGFuZGxlcjogRXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+LCBjb250ZXh0PzogT2JqZWN0KTogTGlzdGVuZXJJZDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogXCJQaXBlc1wiIEV2ZW50UHJvcGVydHkgdG8gb3RoZXIgRXZlbnRQcm9wZXJ0eS4gVGhpcyBtZWFucyB0aGF0IHdoZW5ldmVyIHRoaXMgZXZlbnRcbiAgICAgICAgICogaXMgZW1pdHRlZCBpdCBpcyBwYXNzZWQgdG8gdGhhdCBvdGhlciBFdmVudFByb3BlcnR5IHdoaWNoIGVtaXRzIGl0IHRvby5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtFdmVudFByb3BlcnR5PFQ+fSBvdGhlclxuICAgICAgICAgKiBAcmV0dXJucyB7RXZlbnRQcm9wZXJ0eS5MaXN0ZW5lcklkfVxuICAgICAgICAgKi9cbiAgICAgICAgcGlwZShvdGhlcjogRXZlbnRQcm9wZXJ0eTxUPik6IEV2ZW50UHJvcGVydHkuTGlzdGVuZXJJZDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogUGlwZSBvbmx5IGV2ZW50cyB3aXRoIG1hdGNoaW5nIGFyZ3VtZW50IHRvIGRlc3RpbmF0aW9uIEV2ZW50UHJvcGVydHkuXG4gICAgICAgICAqXG4gICAgICAgICAqIE5vdGU6IHdoYXQgXCJtYXRjaGluZ1wiIG1lYW5zIGlzIG5vdCBkb2N1bWVudGVkIHdlbGwgeWV0IHNpbmNlIGl0IGlzIHN1YmplY3QgdG8gY2hhbmdlLlxuICAgICAgICAgKiBGb3Igbm93IHlvdSBzaG91bGQgYXNzdW1lIHRoYXQgZm9yIHBsYWluIHR5cGVzIChib29sZWFuLCBudW1iZXIsIHN0cmluZykgaXQgaXNcbiAgICAgICAgICogc3RyaWN0IGVxdWFsaXR5LiBGb3Igb2JqZWN0cyBpdCBpcyBsaWtlIGRlZXAgc3RyaWN0IGVxdWFsaXR5IGV4Y2VwdCB0aGF0IGFjdHVhbFxuICAgICAgICAgKiBldmVudCBhcmd1bWVudCBtYXkgaGF2ZSBtb3JlIGZpZWxkcyB0aGFuIG1hdGNoLXZhbHVlKHByb3RvKS4gQnV0IGFsbCBmaWVsZHMgZnJvbVxuICAgICAgICAgKiBtYXRjaC12YWx1ZSBtdXN0IGJlIHByZXNlbnQgaW4gZXZlbnQgYXJndW1lbnQuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7VHxSZWdFeHB9IG1hdGNoVmFsdWUgLSB2YWx1ZSB0byBtYXRjaFxuICAgICAgICAgKiBAcGFyYW0ge0V2ZW50UHJvcGVydHk8VD59IGRlc3RpbmF0aW9uIC0gdGFyZ2V0IEV2ZW50UHJvcGVydHlcbiAgICAgICAgICogQHJldHVybnMge0V2ZW50UHJvcGVydHkuTGlzdGVuZXJJZH1cbiAgICAgICAgICovXG4gICAgICAgIHJvdXRlKG1hdGNoVmFsdWU6IFR8UmVnRXhwLCBkZXN0aW5hdGlvbjogRXZlbnRQcm9wZXJ0eTxUPik6IEV2ZW50UHJvcGVydHkuTGlzdGVuZXJJZDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmV0dXJucyBhIHByb21pc2Ugd2hpY2ggaXMgcmVzb2x2ZWQgbmV4dCB0aW1lIHRoaXMgZXZlbnQgaXMgZW1pdHRlZC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHJldHVybnMge1Byb21pc2U8VD59XG4gICAgICAgICAqL1xuICAgICAgICBuZXh0KCk6IFByb21pc2U8VD47XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFN0b3JlcyBwcm9taXNlIHdoaWNoIGlzIHJlc29sdmVkIHdoZW4gdGhpcyBldmVudCBpcyBlbWl0dGVkIGZvciB0aGUgZmlyc3QgdGltZS5cbiAgICAgICAgICpcbiAgICAgICAgICogQHR5cGUge1Byb21pc2U8VD59XG4gICAgICAgICAqL1xuICAgICAgICBmaXJzdDogUHJvbWlzZTxUPjtcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVtb3ZlcyBhbGwgbGlzdGVuZXJzIHRoYXQgd2VyZSBhdHRhY2hlZCB3aXRoIGdpdmVuIGhhbmRsZXIgYW5kIHdpdGhvdXQgYSBjb250ZXh0LlxuICAgICAgICAgKiBOb3RlOiBpdCB3aWxsIG5ldmVyIHJlbW92ZSBhbnkgbGlzdGVuZXIgdGhhdCB3YXMgYXR0YWNoZWQgd2l0aCBhIGNvbnRleHQuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7RXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+fSBoYW5kbGVyIC0gcmVtb3ZlIGxpc3RlbmVycyBoYXZpbmcgdGhpcyBoYW5kbGVyXG4gICAgICAgICAqL1xuICAgICAgICBvZmYoaGFuZGxlcjogRXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+KTogdm9pZDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVtb3ZlcyBsaXN0ZW5lcnMgdGhhdCB3ZXJlIGF0dGFjaGVkIHdpdGggZ2l2ZW4gaGFuZGxlciBhbmQgY29udGV4dC5cbiAgICAgICAgICogTm90ZTogaXQgd2lsbCBuZXZlciByZW1vdmUgYW55IGxpc3RlbmVyIHRoYXQgd2FzIGF0dGFjaGVkIHdpdGhvdXQgYSBjb250ZXh0LlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge0V2ZW50UHJvcGVydHkuSGFuZGxlcjxUPn0gaGFuZGxlciAtIHJlbW92ZSBsaXN0ZW5lcnMgaGF2aW5nIHRoaXMgaGFuZGxlclxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gW2NvbnRleHRdIC0gcmVtb3ZlIG9ubHkgbGlzdGVuZXJzIGhhdmluZyB0aGlzIGNvbnRleHRcbiAgICAgICAgICovXG4gICAgICAgIG9mZihoYW5kbGVyOiBFdmVudFByb3BlcnR5LkhhbmRsZXI8VD4sIGNvbnRleHQ6IE9iamVjdCk6IHZvaWQ7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlbW92ZXMgYWxsIGxpc3RlbmVycyBoYXZpbmcgdGhpcyBjb250ZXh0XG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjb250ZXh0XG4gICAgICAgICAqL1xuICAgICAgICBvZmYoY29udGV4dDogT2JqZWN0KTogdm9pZDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVtb3ZlcyBsaXN0ZW5lciB3aXRoIGdpdmVuIGlkLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge0V2ZW50UHJvcGVydHkuTGlzdGVuZXJJZH0gaWRcbiAgICAgICAgICovXG4gICAgICAgIG9mZihpZDogRXZlbnRQcm9wZXJ0eS5MaXN0ZW5lcklkKTogdm9pZDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVtb3ZlIHBpcGVzIGNyZWF0ZWQgZm9yIG90aGVyIEV2ZW50UHJvcGVydHkuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7RXZlbnRQcm9wZXJ0eX0gZGVzdGluYXRpb25cbiAgICAgICAgICovXG4gICAgICAgIG9mZihkZXN0aW5hdGlvbjogRXZlbnRQcm9wZXJ0eTxUPik6IHZvaWQ7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlbW92ZSBhbGwgbGlzdGVuZXJzLlxuICAgICAgICAgKi9cbiAgICAgICAgb2ZmKCk6IHZvaWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIHBhaXI6IGFuIEV2ZW50UHJvcGVydHkgaW5zdGFuY2UgdG8gYmUgdXNlZCBpbnRlcm5hbGx5IGluIGEgY2xhc3NcbiAgICAgKiBhbmQgYW4gRW1pdHRlci1pbnRlcmZhY2UgdG8gYmUgdXNlZCBhcyBwdWJsaWMgLyBhY2Nlc3NpYmxlIHByb3BlcnR5LlxuICAgICAqIFRoZXkgYm90aCBhY3R1YWxseSByZXByZXNlbnQgdGhlIHNhbWUgRXZlbnRQcm9wZXJ0eSBvYmplY3QuXG4gICAgICpcbiAgICAgKiByZXR1cm5zIHtbRXZlbnRQcm9wZXJ0eSxFdmVudFByb3BlcnR5LkVtaXR0ZXI8VD5dfVxuICAgICAqXG4gICAgICogQG1ldGhvZCBFdmVudFByb3BlcnR5Lm1ha2VcbiAgICAgKiBAc3RhdGljXG4gICAgICovXG4gICAgZXhwb3J0IGZ1bmN0aW9uIG1ha2U8VD4oKTogW0V2ZW50UHJvcGVydHk8VD4sIEV2ZW50UHJvcGVydHkuRW1pdHRlcjxUPl0ge1xuICAgICAgICBsZXQgZXZlbnRQcm9wID0gbmV3IEV2ZW50UHJvcGVydHk8VD4oKTtcbiAgICAgICAgcmV0dXJuIFtldmVudFByb3AsIDxFdmVudFByb3BlcnR5LkVtaXR0ZXI8VD4+ZXZlbnRQcm9wXTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuIEV2ZW50UHJvcGVydHkgb2JqZWN0IGFuZCBzcGxpdHMgaXQgaW50byBlbWl0dGVyLWZ1bmN0aW9uIGFuZFxuICAgICAqIEVtaXR0ZXItaW50ZXJmYWNlLiBVc2UgZW1pdHRlciBmdW5jdGlvbiB0byBlbWl0IHRoZSBldmVudCBhbmQgRW1pdHRlci1pbnRlcmZhY2VcbiAgICAgKiB0byBhZGQgYW5kIHJlbW92ZSBsaXN0ZW5lcnMgb2YgdGhhdCBldmVudC5cbiAgICAgKlxuICAgICAqIHJldHVybnMge1tFdmVudFByb3BlcnR5LkVtaXRNZXRob2Q8VD4sRXZlbnRQcm9wZXJ0eS5FbWl0dGVyPFQ+XX1cbiAgICAgKlxuICAgICAqIEBtZXRob2QgRXZlbnRQcm9wZXJ0eS5zcGxpdFxuICAgICAqIEBzdGF0aWNcbiAgICAgKi9cbiAgICBleHBvcnQgZnVuY3Rpb24gc3BsaXQ8VD4oKTogW0V2ZW50UHJvcGVydHkuRW1pdE1ldGhvZDxUPiwgRXZlbnRQcm9wZXJ0eS5FbWl0dGVyPFQ+XSB7XG4gICAgICAgIGxldCBldmVudFByb3AgPSBuZXcgRXZlbnRQcm9wZXJ0eTxUPigpO1xuICAgICAgICByZXR1cm4gW2V2ZW50UHJvcC5lbWl0LCA8RXZlbnRQcm9wZXJ0eS5FbWl0dGVyPFQ+PmV2ZW50UHJvcF07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbiBFdmVudFByb3BlcnR5IG9iamVjdCBhbmQgc3BsaXRzIGl0IGludG8gZW1pdHRlci1mdW5jdGlvbiBhbmRcbiAgICAgKiBFbWl0dGVyLWludGVyZmFjZS4gU3BlY2lhbCB2ZXJzaW9uIGZvciB2b2lkLXR5cGVkIGV2ZW50cy5cbiAgICAgKlxuICAgICAqIHJldHVybnMge1tFdmVudFByb3BlcnR5LlZvaWRFbWl0TWV0aG9kLEV2ZW50UHJvcGVydHkuRW1pdHRlcjxUPl19XG4gICAgICpcbiAgICAgKiBAbWV0aG9kIEV2ZW50UHJvcGVydHkuc3BsaXRWb2lkXG4gICAgICogQHN0YXRpY1xuICAgICAqL1xuICAgIGV4cG9ydCBmdW5jdGlvbiBzcGxpdFZvaWQoKTogW0V2ZW50UHJvcGVydHkuVm9pZEVtaXRNZXRob2QsIEV2ZW50UHJvcGVydHkuRW1pdHRlcjx2b2lkPl0ge1xuICAgICAgICBsZXQgZXZlbnRQcm9wID0gbmV3IEV2ZW50UHJvcGVydHkuVm9pZCgpO1xuICAgICAgICBsZXQgZW1pdHRlciA9IDxFdmVudFByb3BlcnR5LkVtaXR0ZXI8dm9pZD4+ZXZlbnRQcm9wO1xuICAgICAgICByZXR1cm4gW2V2ZW50UHJvcC5lbWl0LCBlbWl0dGVyXTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTcGVjaWFsIHN1YmNsYXNzIG9mIEV2ZW50UHJvcGVydHkgZm9yIHZvaWQgdHlwZSAtIGFsbG93cyBjYWxsaW5nIGVtaXQgd2l0aG91dCBhcmd1bWVudHMuXG4gICAgICogRXh0ZW5kcyB7QGxpbmsgRXZlbnRQcm9wZXJ0eX1cbiAgICAgKlxuICAgICAqIEBjbGFzcyBFdmVudFByb3BlcnR5LlZvaWRcbiAgICAgKiBAc3RhdGljXG4gICAgICogQHNlZSB7RXZlbnRQcm9wZXJ0eX1cbiAgICAgKi9cbiAgICBleHBvcnQgY2xhc3MgVm9pZCBleHRlbmRzIEV2ZW50UHJvcGVydHk8dm9pZD4ge1xuICAgICAgICBjb25zdHJ1Y3RvcigpIHsgc3VwZXIoKTsgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBFbWl0cyBhbiBldmVudCBpbnZva2luZyBhbGwgbGlzdGVuZXJzLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAbWV0aG9kIEV2ZW50UHJvcGVydHkuVm9pZCNlbWl0XG4gICAgICAgICAqIEBzZWUge0V2ZW50UHJvcGVydHkjZW1pdH1cbiAgICAgICAgICovXG4gICAgICAgIGVtaXQoKSB7IHJldHVybiBzdXBlci5lbWl0KHZvaWQgMCk7IH1cbiAgICB9XG59XG5cblxuLyoqXG4gKiBVc2VkIGluIEV2ZW50UHJvcGVydHkubWF0Y2gvbWF0Y2hPbmNlL3JvdXRlIG1ldGhvZHMgdG8gY29tcGFyZSBldmVudCBhcmd1bWVudCB3aXRoIGdpdmVuIHZhbHVlLlxuICogTm90ZTogc3ViamVjdCB0byBjaGFuZ2UuXG4gKlxuICogQHBhcmFtIHthbnl9IHN1YmplY3QgLSBhY3R1YWwgZXZlbnQgYXJndW1lbnRcbiAqIEBwYXJhbSB7YW55fSBwcm90byAtIHZhbHVlIHRvIG1hdGNoXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAqXG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBvYmplY3RNYXRjaChzdWJqZWN0OiBhbnksIHByb3RvOiBhbnkpOiBib29sZWFuIHtcbiAgICByZXR1cm4gX29iamVjdE1hdGNoKHN1YmplY3QsIHByb3RvKTtcbn1cblxuZnVuY3Rpb24gX29iamVjdE1hdGNoKHN1YmplY3Q6IGFueSwgcHJvdG86IGFueSwgdHJhdmVyc2FsU3RhY2s6IGFueVtdID0gW10pOiBib29sZWFuIHtcbiAgICBzd2l0Y2ggKHR5cGVvZiBwcm90bykge1xuICAgICAgICBjYXNlIFwidW5kZWZpbmVkXCI6IHJldHVybiBzdWJqZWN0ID09PSB1bmRlZmluZWQ7XG4gICAgICAgIGNhc2UgXCJudW1iZXJcIjpcbiAgICAgICAgY2FzZSBcImJvb2xlYW5cIjpcbiAgICAgICAgY2FzZSBcInN0cmluZ1wiOlxuICAgICAgICBjYXNlIFwiZnVuY3Rpb25cIjpcbiAgICAgICAgICAgIHJldHVybiBzdWJqZWN0ID09PSBwcm90bztcbiAgICAgICAgY2FzZSBcIm9iamVjdFwiOlxuICAgICAgICAgICAgbGV0IGlzTWF0Y2hpbmcgPSB0cnVlO1xuXG4gICAgICAgICAgICBpZiAodHJhdmVyc2FsU3RhY2subGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgaWYgKCh0eXBlb2Ygc3ViamVjdCA9PT0gXCJzdHJpbmdcIikgJiYgKHByb3RvIGluc3RhbmNlb2YgUmVnRXhwKSkge1xuICAgICAgICAgICAgICAgICAgICBpc01hdGNoaW5nID0gcHJvdG8udGVzdChzdWJqZWN0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygc3ViamVjdCAhPT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgICAgICAgICBpc01hdGNoaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFwcm90byB8fCAhc3ViamVjdClcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzTWF0Y2hpbmcgPSAhc3ViamVjdCAmJiAhcHJvdG87XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHRyYXZlcnNhbFN0YWNrLmluY2x1ZGVzKHN1YmplY3QpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJSZWN1cnNpb24hXCIpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQga2V5IGluIHByb3RvKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb3RvLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhdmVyc2FsU3RhY2sucHVzaChzdWJqZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNNYXRjaGluZyA9IGlzTWF0Y2hpbmcgJiYgX29iamVjdE1hdGNoKHN1YmplY3Rba2V5XSwgcHJvdG9ba2V5XSwgdHJhdmVyc2FsU3RhY2spO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmF2ZXJzYWxTdGFjay5wb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gaXNNYXRjaGluZztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5leHBlY3RlZCB0eXBlb2Y6ICR7dHlwZW9mIHByb3RvfWApO1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgRXZlbnRQcm9wZXJ0eTsiXX0=