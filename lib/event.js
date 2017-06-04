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
     */
    function splitVoid() {
        let eventProp = new EventProperty.Void();
        let emitter = eventProp;
        return [eventProp.emit, emitter];
    }
    EventProperty.splitVoid = splitVoid;
    /**
     * Special subclass of EventProperty for void type - allows calling emit without arguments.
     *
     * @extends {EventProperty}
     */
    class Void extends EventProperty {
        constructor() {
            super();
        }
        /**
         * Emits an event invoking all listeners.
         *
         * @see {EventProperty.emit}
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvZXZlbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsNkNBQTZDOztBQUU3Qzs7O0dBR0c7QUFDSDtJQVdJO1FBVlEsY0FBUyxHQUF5QyxFQUFFLENBQUM7UUFFckQsd0JBQW1CLEdBQWUsSUFBSSxDQUFDO1FBR3ZDLHVCQUFrQixHQUFZLEtBQUssQ0FBQztRQUVwQyxjQUFTLEdBQTZCLENBQUMsQ0FBQztRQUs1QyxJQUFJLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUEyQixFQUFFLE1BQXdCO1lBQ3pGLElBQUksQ0FBQywwQkFBMEIsR0FBRyxPQUFPLENBQUM7WUFDMUMsSUFBSSxDQUFDLHlCQUF5QixHQUFHLE1BQU0sQ0FBQztRQUM1QyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDckMsQ0FBQztJQUVEOzs7OztPQUtHO0lBRUg7Ozs7T0FJRztJQUNILElBQUksQ0FBQyxRQUFXO1FBQ1osSUFBSSx1QkFBdUIsR0FBWSxLQUFLLENBQUM7UUFDN0MsSUFBSSxRQUE4QyxDQUFDO1FBRW5ELEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQztZQUMzQixJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDO1lBQy9CLHVCQUF1QixHQUFHLElBQUksQ0FBQztRQUNuQyxDQUFDO1FBRUQsUUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsUUFBNEM7WUFDbEYsSUFBSSxZQUFZLEdBQUcsQ0FBQyxRQUFRLENBQUMsWUFBWSxJQUFJLFdBQVcsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQ3hGLEVBQUUsQ0FB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SyxDQUFDO29CQUNwQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQ3hDLE1BQU0sSUFBSSxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7b0JBQ2xDLENBQUM7b0JBQUMsSUFBSSxDQUFDLENBQUM7d0JBQ0osR0FBRyxDQUFDLENBQUMsSUFBSSxHQUFHLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQzs0QkFDcEIsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0NBQzVCLGNBQWMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7Z0NBQzdCLFVBQVUsR0FBRyxVQUFVLElBQUksWUFBWSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsY0FBYyxDQUFDLENBQUM7Z0NBQ2xGLGNBQWMsQ0FBQyxHQUFHLEVBQUUsQ0FBQzs0QkFDekIsQ0FBQzt3QkFDTCxDQUFDO29CQUNMLENBQUM7Z0JBQ0wsQ0FBQztZQUNMLENBQUM7WUFDRCxNQUFNLENBQUMsVUFBVSxDQUFDO1FBQ3RCO1lBQ0ksTUFBTSxJQUFJLEtBQUssQ0FBQyxzQkFBc0IsT0FBTyxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBQzlELENBQUM7QUFDTCxDQUFDO0FBRUQsa0JBQWUsYUFBYSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL3R5cGluZ3MvaW5kZXguZC50c1wiLz5cblxuLyoqXG4gKiBSZXByZXNlbnRzIGEgY2VydGFpbiB0eXBlIG9mIGV2ZW50cy5cbiAqIFByb3ZpZGVzIG1ldGhvZHMgdG8gb2JzZXJ2ZSBhbmQgdG8gdHJpZ2dlcihlbWl0KSBldmVudHMgb2YgdGhhdCB0eXBlLlxuICovXG5leHBvcnQgY2xhc3MgRXZlbnRQcm9wZXJ0eTxUPiBpbXBsZW1lbnRzIEV2ZW50UHJvcGVydHkuRW1pdHRlcjxUPiB7XG4gICAgcHJpdmF0ZSBsaXN0ZW5lcnM6IEV2ZW50UHJvcGVydHkuSGFuZGxlckRlc2NyaXB0b3I8VD5bXSA9IFtdO1xuXG4gICAgcHJpdmF0ZSBmaXJzdFRyaWdnZXJQcm9taXNlOiBQcm9taXNlPFQ+ID0gbnVsbDtcbiAgICBwcml2YXRlIHJlc29sdmVGaXJzdFRyaWdnZXJQcm9taXNlOiAodmFsdWU6IFQpID0+IGFueTtcbiAgICBwcml2YXRlIHJlamVjdEZpcnN0VHJpZ2dlclByb21pc2U6ICh2YWx1ZTogYW55KSA9PiBhbnk7XG4gICAgcHJpdmF0ZSBpc0ZpcnN0VHJpZ2dlckRvbmU6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAgIHByaXZhdGUgaWRDb3VudGVyOiBFdmVudFByb3BlcnR5Lkxpc3RlbmVySWQgPSAwO1xuXG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcblxuICAgICAgICB0aGlzLmZpcnN0VHJpZ2dlclByb21pc2UgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZTogKHZhbHVlOiBUKSA9PiB2b2lkLCByZWplY3Q6IChlOiBhbnkpID0+IHZvaWQpID0+IHtcbiAgICAgICAgICAgIHRoaXMucmVzb2x2ZUZpcnN0VHJpZ2dlclByb21pc2UgPSByZXNvbHZlO1xuICAgICAgICAgICAgdGhpcy5yZWplY3RGaXJzdFRyaWdnZXJQcm9taXNlID0gcmVqZWN0O1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmVtaXQgPSB0aGlzLmVtaXQuYmluZCh0aGlzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIHR5cGVkZWYgaXMgdXNlZCB0byBkZXNjcmliZSB0eXBlLXBhcmFtZXRlciBUIGZvciBqc2RvYyBwYXJzZXIuXG4gICAgICpcbiAgICAgKiBAdHlwZWRlZiB7YW55fSBUO1xuICAgICAqIEBwcml2YXRlXG4gICAgICovXG5cbiAgICAvKipcbiAgICAgKiBFbWl0cyBldmVudCB3aXRoIGdpdmVuIGFyZ3VtZW50LiBUaGlzIGludm9rZXMgYWxsIGFwcHJvcHJpYXRlIGhhbmRsZXJzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtUfSBldmVudEFyZyAtIGV2ZW50IGFyZ3VtZW50LCBpdCdzIHBhc3NlZCB0byBlYWNoIGV2ZW50IGhhbmRsZXIuXG4gICAgICovXG4gICAgZW1pdChldmVudEFyZzogVCk6IHZvaWQge1xuICAgICAgICBsZXQgcmVzb2x2ZUZpcnN0VGltZVRyaWdnZXI6IGJvb2xlYW4gPSBmYWxzZTtcbiAgICAgICAgbGV0IHRvSW52b2tlOiBFdmVudFByb3BlcnR5LkhhbmRsZXJEZXNjcmlwdG9yPFQ+W107XG5cbiAgICAgICAgaWYgKCF0aGlzLmlzRmlyc3RUcmlnZ2VyRG9uZSkge1xuICAgICAgICAgICAgdGhpcy5pc0ZpcnN0VHJpZ2dlckRvbmUgPSB0cnVlO1xuICAgICAgICAgICAgcmVzb2x2ZUZpcnN0VGltZVRyaWdnZXIgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdG9JbnZva2UgPSB0aGlzLmxpc3RlbmVycy5zbGljZSgpLmZpbHRlcigobGlzdGVuZXI6IEV2ZW50UHJvcGVydHkuSGFuZGxlckRlc2NyaXB0b3I8VD4pID0+IHtcbiAgICAgICAgICAgIGxldCBzaG91bGRJbnZva2UgPSAhbGlzdGVuZXIub25seU1hdGNoaW5nIHx8IG9iamVjdE1hdGNoKGV2ZW50QXJnLCBsaXN0ZW5lci5tYXRjaFZhbHVlKTtcbiAgICAgICAgICAgIGlmIChsaXN0ZW5lci5vbmNlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gc2hvdWxkSW52b2tlO1xuICAgICAgICB9KTtcblxuICAgICAgICB0b0ludm9rZS5mb3JFYWNoKChsaXN0ZW5lcjogRXZlbnRQcm9wZXJ0eS5IYW5kbGVyRGVzY3JpcHRvcjxUPikgPT4ge1xuICAgICAgICAgICAgaWYgKGxpc3RlbmVyLmNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICBsaXN0ZW5lci5oYW5kbGVyLmNhbGwobGlzdGVuZXIuY29udGV4dCwgZXZlbnRBcmcpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBsaXN0ZW5lci5oYW5kbGVyLmNhbGwobnVsbCwgZXZlbnRBcmcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAocmVzb2x2ZUZpcnN0VGltZVRyaWdnZXIpIHtcbiAgICAgICAgICAgIHRoaXMucmVzb2x2ZUZpcnN0VHJpZ2dlclByb21pc2UoZXZlbnRBcmcpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkcyBhIGxpc3RlbmVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtFdmVudFByb3BlcnR5LkhhbmRsZXI8VD59IGhhbmRsZXIgLSBjYWxsYmFjayB0byBiZSBjYWxsZWQgd2hlbiBhbiBldmVudCBpcyBlbWl0dGVkXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtjb250ZXh0XSAtIGNvbnRleHQgdG8gYmUgdXNlZCB3aGVuIGNhbGxpbmcgaGFuZGxlci4gbnVsbCBieSBkZWZhdWx0LlxuICAgICAqIEByZXR1cm5zIHtFdmVudFByb3BlcnR5Lkxpc3RlbmVySWR9IC0gbnVtYmVyLCBpZGVudGlmeWluZyBuZXcgZXZlbnQgbGlzdGVuZXIuXG4gICAgICovXG4gICAgb24oaGFuZGxlcjogRXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+LCBjb250ZXh0PzogT2JqZWN0KTogRXZlbnRQcm9wZXJ0eS5MaXN0ZW5lcklkIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYWRkTGlzdGVuZXIoeyBoYW5kbGVyLCBjb250ZXh0IH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZHMgYSBsaXN0ZW5lci4gVGhpcyBsaXN0ZW5lciB3aWxsIGJlIGltbWVkaWF0ZWx5IHJlbW92ZWQgYWZ0ZXIgaXQnc1xuICAgICAqIGludm9rZWQgZm9yIHRoZSBmaXJzdCB0aW1lLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtFdmVudFByb3BlcnR5LkhhbmRsZXI8VD59IGhhbmRsZXIgLSBjYWxsYmFjayB0byBiZSBjYWxsZWQgd2hlbiBhbiBldmVudCBpcyBlbWl0dGVkXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtjb250ZXh0XSAtIGNvbnRleHQgdG8gYmUgdXNlZCB3aGVuIGNhbGxpbmcgaGFuZGxlci4gbnVsbCBieSBkZWZhdWx0LlxuICAgICAqIEByZXR1cm5zIHtFdmVudFByb3BlcnR5Lkxpc3RlbmVySWR9IC0gbnVtYmVyLCBpZGVudGlmeWluZyBuZXcgZXZlbnQgbGlzdGVuZXIuXG4gICAgICovXG4gICAgb25jZShoYW5kbGVyOiBFdmVudFByb3BlcnR5LkhhbmRsZXI8VD4sIGNvbnRleHQ6IE9iamVjdCA9IG51bGwpOiBFdmVudFByb3BlcnR5Lkxpc3RlbmVySWQge1xuICAgICAgICByZXR1cm4gdGhpcy5hZGRMaXN0ZW5lcih7IGNvbnRleHQsIGhhbmRsZXIsIG9uY2U6IHRydWUgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkcyBhIGxpc3RlbmVyLiBUaGlzIGxpc3RlbmVyIHdpbGwgYmUgaW52b2tlZCBvbmx5IGlmIGV2ZW50IGFyZ3VtZW50XG4gICAgICogbWF0Y2hlcyBnaXZlbiB2YWx1ZS5cbiAgICAgKlxuICAgICAqIE5vdGU6IHdoYXQgXCJtYXRjaGluZ1wiIG1lYW5zIGlzIG5vdCBkb2N1bWVudGVkIHdlbGwgeWV0IHNpbmNlIGl0IGlzIHN1YmplY3QgdG8gY2hhbmdlLlxuICAgICAqIEZvciBub3cgeW91IHNob3VsZCBhc3N1bWUgdGhhdCBmb3IgcGxhaW4gdHlwZXMgKGJvb2xlYW4sIG51bWJlciwgc3RyaW5nKSBpdCBpc1xuICAgICAqIHN0cmljdCBlcXVhbGl0eS4gRm9yIG9iamVjdHMgaXQgaXMgbGlrZSBkZWVwIHN0cmljdCBlcXVhbGl0eSBleGNlcHQgdGhhdCBhY3R1YWxcbiAgICAgKiBldmVudCBhcmd1bWVudCBtYXkgaGF2ZSBtb3JlIGZpZWxkcyB0aGFuIG1hdGNoLXZhbHVlKHByb3RvKS4gQnV0IGFsbCBmaWVsZHMgZnJvbVxuICAgICAqIG1hdGNoLXZhbHVlIG11c3QgYmUgcHJlc2VudCBpbiBldmVudCBhcmd1bWVudC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7VHxSZWdFeHB9IHZhbHVlIC0gaGFuZGxlciBpcyBpbnZva2VkIG9ubHkgaWYgZXZlbnQgYXJndW1lbnQgbWF0Y2hlcyB0aGlzIHZhbHVlXG4gICAgICogQHBhcmFtIHtFdmVudFByb3BlcnR5LkhhbmRsZXI8VD59IGhhbmRsZXIgLSBjYWxsYmFjayB0byBiZSBjYWxsZWQgd2hlbiBhbiBldmVudCBpcyBlbWl0dGVkXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtjb250ZXh0XSAtIGNvbnRleHQgdG8gYmUgdXNlZCB3aGVuIGNhbGxpbmcgaGFuZGxlci4gbnVsbCBieSBkZWZhdWx0LlxuICAgICAqIEByZXR1cm5zIHtFdmVudFByb3BlcnR5Lkxpc3RlbmVySWR9IC0gbnVtYmVyLCBpZGVudGlmeWluZyBuZXcgZXZlbnQgbGlzdGVuZXIuXG4gICAgICpcbiAgICAgKiBAc2VlIG9iamVjdE1hdGNoXG4gICAgICovXG4gICAgbWF0Y2godmFsdWU6IFR8UmVnRXhwLCBoYW5kbGVyOiBFdmVudFByb3BlcnR5LkhhbmRsZXI8VD4sIGNvbnRleHQ/OiBPYmplY3QpOiBFdmVudFByb3BlcnR5Lkxpc3RlbmVySWQge1xuICAgICAgICByZXR1cm4gdGhpcy5hZGRMaXN0ZW5lcih7IGhhbmRsZXIsIGNvbnRleHQsIG9ubHlNYXRjaGluZzogdHJ1ZSwgbWF0Y2hWYWx1ZTogdmFsdWUgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkcyBhIGxpc3RlbmVyIGZvciB0aGlzIGV2ZW50IHR5cGUuIFRoaXMgbGlzdGVuZXIgd2lsbCBiZSBpbnZva2VkIG9ubHkgaWYgZXZlbnQgYXJndW1lbnRcbiAgICAgKiBtYXRjaGVzIGdpdmVuIHZhbHVlLiBUaGlzIGxpc3RlbmVyIHdpbGwgYmUgaW1tZWRpYXRlbHkgcmVtb3ZlZCBhZnRlciBpdCdzIGludm9rZWRcbiAgICAgKiBmb3IgdGhlIGZpcnN0IHRpbWUuXG4gICAgICpcbiAgICAgKiBOb3RlOiB3aGF0IFwibWF0Y2hpbmdcIiBtZWFucyBpcyBub3QgZG9jdW1lbnRlZCB3ZWxsIHlldCBzaW5jZSBpdCBpcyBzdWJqZWN0IHRvIGNoYW5nZS5cbiAgICAgKiBGb3Igbm93IHlvdSBzaG91bGQgYXNzdW1lIHRoYXQgZm9yIHBsYWluIHR5cGVzIChib29sZWFuLCBudW1iZXIsIHN0cmluZykgaXQgaXNcbiAgICAgKiBzdHJpY3QgZXF1YWxpdHkuIEZvciBvYmplY3RzIGl0IGlzIGxpa2UgZGVlcCBzdHJpY3QgZXF1YWxpdHkgZXhjZXB0IHRoYXQgYWN0dWFsXG4gICAgICogZXZlbnQgYXJndW1lbnQgbWF5IGhhdmUgbW9yZSBmaWVsZHMgdGhhbiBtYXRjaC12YWx1ZShwcm90bykuIEJ1dCBhbGwgZmllbGRzIGZyb21cbiAgICAgKiBtYXRjaC12YWx1ZSBtdXN0IGJlIHByZXNlbnQgaW4gZXZlbnQgYXJndW1lbnQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1R8UmVnRXhwfSB2YWx1ZSAtIGhhbmRsZXIgaXMgaW52b2tlZCBvbmx5IGlmIGV2ZW50IGFyZ3VtZW50IG1hdGNoZXMgdGhpcyB2YWx1ZVxuICAgICAqIEBwYXJhbSB7RXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+fSBoYW5kbGVyIC0gY2FsbGJhY2sgdG8gYmUgY2FsbGVkIHdoZW4gYW4gZXZlbnQgaXMgZW1pdHRlZFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbY29udGV4dF0gLSBjb250ZXh0IHRvIGJlIHVzZWQgd2hlbiBjYWxsaW5nIGhhbmRsZXIuIG51bGwgYnkgZGVmYXVsdC5cbiAgICAgKiBAcmV0dXJucyB7RXZlbnRQcm9wZXJ0eS5MaXN0ZW5lcklkfSAtIG51bWJlciwgaWRlbnRpZnlpbmcgbmV3IGV2ZW50IGxpc3RlbmVyLlxuICAgICAqXG4gICAgICogQHNlZSBQcm9wZXJ0eUV2ZW50Lm1hdGNoLCBQcm9wZXJ0eUV2ZW50Lm9uY2VcbiAgICAgKi9cbiAgICBtYXRjaE9uY2UodmFsdWU6IFR8UmVnRXhwLCBoYW5kbGVyOiBFdmVudFByb3BlcnR5LkhhbmRsZXI8VD4sIGNvbnRleHQ6IE9iamVjdCA9IG51bGwpOiBFdmVudFByb3BlcnR5Lkxpc3RlbmVySWQge1xuICAgICAgICAgcmV0dXJuIHRoaXMuYWRkTGlzdGVuZXIoe1xuICAgICAgICAgICAgIGNvbnRleHQsXG4gICAgICAgICAgICAgaGFuZGxlcixcbiAgICAgICAgICAgICBvbmNlOiB0cnVlLFxuICAgICAgICAgICAgIG9ubHlNYXRjaGluZzogdHJ1ZSxcbiAgICAgICAgICAgICBtYXRjaFZhbHVlOiB2YWx1ZVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcIlBpcGVzXCIgRXZlbnRQcm9wZXJ0eSB0byBvdGhlciBFdmVudFByb3BlcnR5LiBUaGlzIG1lYW5zIHRoYXQgd2hlbmV2ZXIgdGhpcyBldmVudFxuICAgICAqIGlzIGVtaXR0ZWQgaXQgaXMgcGFzc2VkIHRvIHRoYXQgb3RoZXIgRXZlbnRQcm9wZXJ0eSB3aGljaCBlbWl0cyBpdCB0b28uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0V2ZW50UHJvcGVydHk8VD59IG90aGVyXG4gICAgICogQHJldHVybnMge0V2ZW50UHJvcGVydHkuTGlzdGVuZXJJZH1cbiAgICAgKi9cbiAgICBwaXBlKG90aGVyOiBFdmVudFByb3BlcnR5PFQ+KTogRXZlbnRQcm9wZXJ0eS5MaXN0ZW5lcklkIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub24ob3RoZXIuZW1pdCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUGlwZSBvbmx5IGV2ZW50cyB3aXRoIG1hdGNoaW5nIGFyZ3VtZW50IHRvIGRlc3RpbmF0aW9uIEV2ZW50UHJvcGVydHkuXG4gICAgICpcbiAgICAgKiBOb3RlOiB3aGF0IFwibWF0Y2hpbmdcIiBtZWFucyBpcyBub3QgZG9jdW1lbnRlZCB3ZWxsIHlldCBzaW5jZSBpdCBpcyBzdWJqZWN0IHRvIGNoYW5nZS5cbiAgICAgKiBGb3Igbm93IHlvdSBzaG91bGQgYXNzdW1lIHRoYXQgZm9yIHBsYWluIHR5cGVzIChib29sZWFuLCBudW1iZXIsIHN0cmluZykgaXQgaXNcbiAgICAgKiBzdHJpY3QgZXF1YWxpdHkuIEZvciBvYmplY3RzIGl0IGlzIGxpa2UgZGVlcCBzdHJpY3QgZXF1YWxpdHkgZXhjZXB0IHRoYXQgYWN0dWFsXG4gICAgICogZXZlbnQgYXJndW1lbnQgbWF5IGhhdmUgbW9yZSBmaWVsZHMgdGhhbiBtYXRjaC12YWx1ZShwcm90bykuIEJ1dCBhbGwgZmllbGRzIGZyb21cbiAgICAgKiBtYXRjaC12YWx1ZSBtdXN0IGJlIHByZXNlbnQgaW4gZXZlbnQgYXJndW1lbnQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1R8UmVnRXhwfSBtYXRjaFZhbHVlIC0gdmFsdWUgdG8gbWF0Y2hcbiAgICAgKiBAcGFyYW0ge0V2ZW50UHJvcGVydHk8VD59IGRlc3RpbmF0aW9uIC0gdGFyZ2V0IEV2ZW50UHJvcGVydHlcbiAgICAgKiBAcmV0dXJucyB7RXZlbnRQcm9wZXJ0eS5MaXN0ZW5lcklkfVxuICAgICAqXG4gICAgICogQHNlZSBFdmVudFByb3BlcnR5LnBpcGUsIEV2ZW50UHJvcGVydHkubWF0Y2hcbiAgICAgKi9cbiAgICByb3V0ZShtYXRjaFZhbHVlOiBUfFJlZ0V4cCwgZGVzdGluYXRpb246IEV2ZW50UHJvcGVydHk8VD4pOiBFdmVudFByb3BlcnR5Lkxpc3RlbmVySWQge1xuICAgICAgICByZXR1cm4gdGhpcy5tYXRjaChtYXRjaFZhbHVlLCBkZXN0aW5hdGlvbi5lbWl0KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgcHJvbWlzZSB3aGljaCBpcyByZXNvbHZlZCBuZXh0IHRpbWUgdGhpcyBldmVudCBpcyBlbWl0dGVkLlxuICAgICAqIFdvcmtzIGFzIGEgcHJvbWlzaWZpZWQgdmVyc2lvbiBvZiAnb25jZScuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxUPn1cbiAgICAgKlxuICAgICAqIEBzZWUgRXZlbnRQcm9wZXJ0eS5vbmNlXG4gICAgICovXG4gICAgbmV4dCgpOiBQcm9taXNlPFQ+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlOiAoYTogVCkgPT4gdm9pZCwgcmVqZWN0OiAoZTogYW55KSA9PiB2b2lkKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHRoaXMub25jZShyZXNvbHZlKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICByZWplY3QoZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFN0b3JlcyBwcm9taXNlIHdoaWNoIGlzIHJlc29sdmVkIHdoZW4gdGhpcyBldmVudCBpcyBlbWl0dGVkIGZvciB0aGUgZmlyc3QgdGltZS5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPFQ+fVxuICAgICAqL1xuICAgIGdldCBmaXJzdCgpOiBQcm9taXNlPFQ+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmlyc3RUcmlnZ2VyUHJvbWlzZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmVzIGFsbCBsaXN0ZW5lcnMgdGhhdCB3ZXJlIGF0dGFjaGVkIHdpdGggZ2l2ZW4gaGFuZGxlciBhbmQgd2l0aG91dCBhIGNvbnRleHQuXG4gICAgICogTm90ZTogaXQgd2lsbCBuZXZlciByZW1vdmUgYW55IGxpc3RlbmVyIHRoYXQgd2FzIGF0dGFjaGVkIHdpdGggYSBjb250ZXh0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtFdmVudFByb3BlcnR5LkhhbmRsZXI8VD59IGhhbmRsZXIgLSByZW1vdmUgbGlzdGVuZXJzIGhhdmluZyB0aGlzIGhhbmRsZXJcbiAgICAgKi9cbiAgICBvZmYoaGFuZGxlcjogRXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+KTogdm9pZDtcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgbGlzdGVuZXJzIHRoYXQgd2VyZSBhdHRhY2hlZCB3aXRoIGdpdmVuIGhhbmRsZXIgYW5kIGNvbnRleHQuXG4gICAgICogTm90ZTogaXQgd2lsbCBuZXZlciByZW1vdmUgYW55IGxpc3RlbmVyIHRoYXQgd2FzIGF0dGFjaGVkIHdpdGhvdXQgYSBjb250ZXh0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtFdmVudFByb3BlcnR5LkhhbmRsZXI8VD59IGhhbmRsZXIgLSByZW1vdmUgbGlzdGVuZXJzIGhhdmluZyB0aGlzIGhhbmRsZXJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW2NvbnRleHRdIC0gcmVtb3ZlIG9ubHkgbGlzdGVuZXJzIGhhdmluZyB0aGlzIGNvbnRleHRcbiAgICAgKi9cbiAgICBvZmYoaGFuZGxlcjogRXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+LCBjb250ZXh0OiBPYmplY3QpOiB2b2lkO1xuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyBhbGwgbGlzdGVuZXJzIGhhdmluZyB0aGlzIGNvbnRleHRcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjb250ZXh0XG4gICAgICovXG4gICAgb2ZmKGNvbnRleHQ6IE9iamVjdCk6IHZvaWQ7XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmVzIGxpc3RlbmVyIHdpdGggZ2l2ZW4gaWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0V2ZW50UHJvcGVydHkuTGlzdGVuZXJJZH0gaWRcbiAgICAgKi9cbiAgICBvZmYoaWQ6IEV2ZW50UHJvcGVydHkuTGlzdGVuZXJJZCk6IHZvaWQ7XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgcGlwZXMgY3JlYXRlZCBmb3Igb3RoZXIgRXZlbnRQcm9wZXJ0eS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RXZlbnRQcm9wZXJ0eX0gZGVzdGluYXRpb25cbiAgICAgKi9cbiAgICBvZmYoZGVzdGluYXRpb246IEV2ZW50UHJvcGVydHk8VD4pOiB2b2lkO1xuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGFsbCBsaXN0ZW5lcnMuXG4gICAgICovXG4gICAgb2ZmKCk6IHZvaWQ7XG5cbiAgICBvZmYoLi4uYXJnczogYW55W10pOiB2b2lkIHtcbiAgICAgICAgbGV0IGNvbnRleHQ6IE9iamVjdCA9IG51bGwsXG4gICAgICAgICAgICBoYW5kbGVyOiBFdmVudFByb3BlcnR5LkhhbmRsZXI8VD4gPSBudWxsLFxuICAgICAgICAgICAgaWRUb1JlbW92ZTogRXZlbnRQcm9wZXJ0eS5MaXN0ZW5lcklkID0gbnVsbDtcbiAgICAgICAgc3dpdGNoIChhcmdzLmxlbmd0aCkge1xuICAgICAgICAgICAgY2FzZSAwOiAvLyBObyBhcmd1bWVudHMgLSBjbGVhciBhbGwgbGlzdGVuZXJzXG4gICAgICAgICAgICAgICAgdGhpcy5saXN0ZW5lcnMgPSBbXTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICAgICAgaWYgKEV2ZW50UHJvcGVydHkuaXNMaXN0ZW5lcklkKGFyZ3NbMF0pKSB7XG4gICAgICAgICAgICAgICAgICAgIGlkVG9SZW1vdmUgPSBhcmdzWzBdO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGFyZ3NbMF0gPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgICBoYW5kbGVyID0gYXJnc1swXTtcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dCA9IG51bGw7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgYXJnc1swXSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoYXJnc1swXSBpbnN0YW5jZW9mIEV2ZW50UHJvcGVydHkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub2ZmKGFyZ3NbMF0uZW1pdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlciA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQgPSBhcmdzWzBdO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBhcmd1bWVudDogJHt0eXBlb2YgYXJnc1swXX1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICAgICAgaGFuZGxlciA9IGFyZ3NbMF07XG4gICAgICAgICAgICAgICAgY29udGV4dCA9IGFyZ3NbMV07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVuc3VwcG9ydGVkIGFyZ3VtZW50cyBmb3JtYXQuXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5saXN0ZW5lcnMgPSB0aGlzLmxpc3RlbmVycy5maWx0ZXIoKGhDb25mOiBFdmVudFByb3BlcnR5LkhhbmRsZXJEZXNjcmlwdG9yPFQ+KSA9PiB7XG4gICAgICAgICAgICBsZXQgZGlmZmVyZW50SGFuZGxlcjogYm9vbGVhbiA9IGhDb25mLmhhbmRsZXIgIT09IGhhbmRsZXI7XG4gICAgICAgICAgICBsZXQgbm9IYW5kbGVyR2l2ZW46IGJvb2xlYW4gPSAhaGFuZGxlcjtcbiAgICAgICAgICAgIGxldCBub0NvbnRleHRHaXZlbjogYm9vbGVhbiA9ICFjb250ZXh0O1xuICAgICAgICAgICAgbGV0IGNvbmZIYXNOb0NvbnRleHQ6IGJvb2xlYW4gPSAhaENvbmYuY29udGV4dDtcbiAgICAgICAgICAgIGxldCBkaWZmZXJlbnRDb250ZXh0OiBib29sZWFuID0gaENvbmYuY29udGV4dCAhPT0gY29udGV4dDtcbiAgICAgICAgICAgIGxldCBkb250UmVtb3ZlOiBib29sZWFuO1xuXG4gICAgICAgICAgICBpZiAoaWRUb1JlbW92ZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGRvbnRSZW1vdmUgPSBpZFRvUmVtb3ZlICE9PSBoQ29uZi5pZDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKG5vSGFuZGxlckdpdmVuKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChub0NvbnRleHRHaXZlbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5leHBlY3RlZCBjaXJjdW1zdGFuY2VzLlwiKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvbnRSZW1vdmUgPSBjb25mSGFzTm9Db250ZXh0IHx8IChjb250ZXh0ICE9PSBoQ29uZi5jb250ZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkaWZmZXJlbnRIYW5kbGVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkb250UmVtb3ZlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChub0NvbnRleHRHaXZlbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvbnRSZW1vdmUgPSAoIWNvbmZIYXNOb0NvbnRleHQpIHx8IChkaWZmZXJlbnRIYW5kbGVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9udFJlbW92ZSA9IGRpZmZlcmVudENvbnRleHQgfHwgZGlmZmVyZW50SGFuZGxlcjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBkb250UmVtb3ZlO1xuICAgICAgICB9KTtcbiAgICB9XG5cblxuICAgIHByaXZhdGUgcmVtb3ZlTGlzdGVuZXIobGlzdGVuZXI6IEV2ZW50UHJvcGVydHkuSGFuZGxlckRlc2NyaXB0b3I8VD4pOiB2b2lkIHtcbiAgICAgICAgbGV0IGxpc3RlbmVySW5kZXggPSB0aGlzLmxpc3RlbmVycy5pbmRleE9mKGxpc3RlbmVyKTtcbiAgICAgICAgaWYgKGxpc3RlbmVySW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICB0aGlzLmxpc3RlbmVycy5zcGxpY2UobGlzdGVuZXJJbmRleCwgMSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGFkZExpc3RlbmVyKG9wdGlvbnM6IEV2ZW50UHJvcGVydHkuSGFuZGxlck9wdGlvbnM8VD4pOiBFdmVudFByb3BlcnR5Lkxpc3RlbmVySWQge1xuICAgICAgICBsZXQge2NvbnRleHQsIGhhbmRsZXIsIG9uY2UsIG9ubHlNYXRjaGluZywgbWF0Y2hWYWx1ZX0gPSBvcHRpb25zO1xuICAgICAgICB0aGlzLmlkQ291bnRlcisrO1xuICAgICAgICB0aGlzLmxpc3RlbmVycy5wdXNoKHtjb250ZXh0LCBoYW5kbGVyLCBvbmNlLCBpZDogdGhpcy5pZENvdW50ZXIsIG9ubHlNYXRjaGluZywgbWF0Y2hWYWx1ZX0pO1xuICAgICAgICByZXR1cm4gdGhpcy5pZENvdW50ZXI7XG4gICAgfVxufVxuXG5leHBvcnQgbmFtZXNwYWNlIEV2ZW50UHJvcGVydHkge1xuXG4gICAgLyoqXG4gICAgICogVGhlIGNhbGxiYWNrIGZvcm1hdCB1c2VkIGZvciBhZGRpbmcgbGlzdGVuZXJzIHRvIEV2ZW50UHJvcGVydHkuXG4gICAgICovXG4gICAgZXhwb3J0IGludGVyZmFjZSBIYW5kbGVyPFQ+IHtcbiAgICAgICAgKGV2ZW50QXJnOiBUKTogdm9pZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgZm9ybWF0IG9mIHRoZSBFdmVudFByb3BlcnR5LmVtaXQgbWV0aG9kLlxuICAgICAqL1xuICAgIGV4cG9ydCBpbnRlcmZhY2UgRW1pdE1ldGhvZDxUPiB7XG4gICAgICAgIChldmVudEFyZzogVCk6IHZvaWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGZvcm1hdCBvZiB0aGUgRXZlbnRQcm9wZXJ0eTplbWl0IG1ldGhvZCBmb3IgVD12b2lkLlxuICAgICAqL1xuICAgIGV4cG9ydCBpbnRlcmZhY2UgVm9pZEVtaXRNZXRob2Qge1xuICAgICAgICAoKTogdm9pZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIHR5cGUgaXMgdXNlZCBqdXN0IHRvIGVtcGhhc2l6ZSB0aGUgbWVhbmluZyBvZiB0aGUgdmFsdWUuXG4gICAgICogT3RoZXJ3aXNlIGxpc3RlbmVycyBpZHMgYXJlIHJlZ3VsYXIgbnVtYmVycy5cbiAgICAgKi9cbiAgICBleHBvcnQgdHlwZSBMaXN0ZW5lcklkID0gbnVtYmVyO1xuXG4gICAgLyoqXG4gICAgICogVGhpcyBtZXRob2QgaXMgdXNlZCBqdXN0IHRvIGVtcGhhc2l6ZSB0aGUgbWVhbmluZyBvZiB0aGUgdmFsdWUuXG4gICAgICogT3RoZXJ3aXNlIHdlIGNvdWxkIGp1c3QgdXNlIHR5cGVvZiBpZCA9PT0gXCJudW1iZXJcIiBkaXJlY3RseS5cbiAgICAgKi9cbiAgICBleHBvcnQgZnVuY3Rpb24gaXNMaXN0ZW5lcklkKGlkOiBhbnkpIHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBpZCA9PT0gXCJudW1iZXJcIjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgZnVsbCBjb25maWd1cmF0aW9uIGZvciBhIHNwZWNpZmljIGxpc3RlbmVyLiBJdCBjb250cm9scyB0aGUgd2F5XG4gICAgICogdGhlIHJlbGV2YW50IGV2ZW50LWhhbmRsZXIgZnVuY3Rpb24gaXMgaW52b2tlZC5cbiAgICAgKi9cbiAgICBleHBvcnQgaW50ZXJmYWNlIEhhbmRsZXJPcHRpb25zPFQ+IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBhY3R1YWwgaGFuZGxlciBmdW5jdGlvbiB0byBiZSBjYWxsZWQgd2hlbiB0aGUgZXZlbnQgb2NjdXJzLlxuICAgICAgICAgKi9cbiAgICAgICAgaGFuZGxlcjogRXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJZiB0aGlzIGZsYWcgaXMgc2V0IC0gdGhlIGV2ZW50IGhhbmRsZXIgd2lsbCByZW1vdmUgaXRzZWxmIGZyb21cbiAgICAgICAgICogdGhlIGV2ZW50IGFmdGVyIGZpcnN0IGludm9jYXRpb24uXG4gICAgICAgICAqL1xuICAgICAgICBvbmNlPzogYm9vbGVhbjtcblxuICAgICAgICAvKipcbiAgICAgICAgICogSWYgdGhpcyBmaWVsZCBpcyBzcGVjaWZpZWQsIHRoZW4gaGFuZGxlciB3aWxsIGJlIGNhbGxlZCB3aXRoIHRoYXQgY29udGV4dC5cbiAgICAgICAgICovXG4gICAgICAgIGNvbnRleHQ/OiBPYmplY3Q7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEFsd2F5cyB1c2VkIGluIGNvbWJpbmF0aW9uIHdpdGggZm9sbG93aW5nIHBhcmFtZXRlciAnbWF0Y2hWYWx1ZScgYW5kIGlzIGFcbiAgICAgICAgICogZmxhZywgd2hpY2ggbWVhbnMoaWYgc2V0KSB0aGF0IG9ubHkgZXZlbnQgaW52b2NhdGlvbnMgd2l0aCBhcmd1bWVudCBtYXRjaGluZ1xuICAgICAgICAgKiAnbWF0Y2hWYWx1ZScgc2hvdWxkIGJlIHBhc3NlZCB0byB0aGUgaGFuZGxlciBmdW5jdGlvbi5cbiAgICAgICAgICpcbiAgICAgICAgICogV2hhdCBcIm1hdGNoaW5nXCIgbWVhbnMgaXMgbm90IGRvY3VtZW50ZWQgd2VsbCB5ZXQgc2luY2UgaXQgaXMgc3ViamVjdCB0byBjaGFuZ2UuXG4gICAgICAgICAqIEZvciBub3cgeW91IG1heSBhc3N1bWUgdGhhdCBmb3IgcGxhaW4gdHlwZXMgKGJvb2xlYW4sIG51bWJlciwgc3RyaW5nKSBpdCBpc1xuICAgICAgICAgKiBzdHJpY3QgZXF1YWxpdHkuXG4gICAgICAgICAqL1xuICAgICAgICBvbmx5TWF0Y2hpbmc/OiBib29sZWFuO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgdmFsdWUsIHRvIGJlIG1hdGNoZWQgaWYgdGhlICdvbmx5TWF0Y2hpbmcnIGZsYWcgaXMgc2V0LlxuICAgICAgICAgKi9cbiAgICAgICAgbWF0Y2hWYWx1ZT86IFR8UmVnRXhwO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoaXMgaXMgdGhlIG9iamVjdCB3aGljaCByZXByZXNlbnRzIGFuIGV4aXN0aW5nIGhhbmRsZXIgaW50ZXJuYWxseSBpbiBFdmVudFByb3BlcnR5IG9iamVjdC5cbiAgICAgKlxuICAgICAqIEV2ZW50UHJvcGVydHkgc3RvcmVzIGxpc3RlbmVycyBhcyBIYW5kbGVyT3B0aW9ucyArIGxpc3RlbmVySWQuXG4gICAgICovXG4gICAgZXhwb3J0IGludGVyZmFjZSBIYW5kbGVyRGVzY3JpcHRvcjxUPiBleHRlbmRzIEhhbmRsZXJPcHRpb25zPFQ+IHtcbiAgICAgICAgaWQ6IExpc3RlbmVySWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQW4gRXZlbnRQcm9wZXJ0eSBpbnRlcmZhY2Ugd2l0aG91dCB0aGUgJ2VtaXQnIG1ldGhvZC5cbiAgICAgKlxuICAgICAqIEl0IGlzIGEgZ29vZCBwcmFjdGljZSB0byBwcm92aWRlIHB1YmxpYyBhY2Nlc3MgdG8gRXZlbnRQcm9wZXJ0aWVzIGluIHRoaXMgZm9ybVxuICAgICAqIGFuZCBub3QgaW4gdGhlIG9yaWdpbmFsIEV2ZW50UHJvcGVydHkgZm9ybS5cbiAgICAgKiBFdmVudFByb3BlcnR5IHVzdWFsbHkgcmVsYXRlcyB0byBzb21lIGNsYXNzIGFuZCBvbmx5IHRoYXQgY2xhc3Mgc2hvdWxkIGJlIGFibGUgdG9cbiAgICAgKiB0cmlnZ2VyL2VtaXQgdGhlIGV2ZW50LiBPbiB0aGUgb3RoZXIgaGFuZCBhbnlvbmUgc2hvdWxkIGJlIGFibGUgdG8gbGlzdGVuIHRvIHRoaXNcbiAgICAgKiBldmVudC4gVGhpcyBsaWJyYXJ5IG9mZmVycyBzcGVjaWFsIGludGVyZmFjZSBmb3IgdGhpcyBwdXJwb3NlIGFuZCBhIGZldyB1dGlsaXR5XG4gICAgICogZnVuY3Rpb25zIChtYWtlLCBzcGxpdC4gc3BsaXRWb2lkKS5cbiAgICAgKlxuICAgICAqIFRoZSBpZGVhIGlzIHRvIGNyZWF0ZSBhIHByaXZhdGUgRXZlbnRQcm9wZXJ0eSBtZW1iZXIgYW5kIHB1YmxpY1xuICAgICAqIEV2ZW50UHJvcGVydHkuRW1pdHRlciBnZXR0ZXIgd2hpY2ggcmV0dXJuIHRoYXQgcHJpdmF0ZSBtZW1iZXIuXG4gICAgICogWW91IGRvbid0IGhhdmUgdG8gZG8gaXQgaWYgeW91IHRoaW5rIGl0J3MgdG9vIGN1bWJlcnNvbWUgdGhvdWdoLlxuICAgICAqL1xuICAgIGV4cG9ydCBpbnRlcmZhY2UgRW1pdHRlcjxUPiB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBZGRzIGEgbGlzdGVuZXIgZm9yIHRoaXMgZXZlbnQgdHlwZS5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtFdmVudFByb3BlcnR5LkhhbmRsZXI8VD59IGhhbmRsZXIgLSBjYWxsYmFjayB0byBiZSBjYWxsZWQgd2hlbiBhbiBldmVudCBpcyBlbWl0dGVkXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbY29udGV4dF0gLSBjb250ZXh0IHRvIGJlIHVzZWQgd2hlbiBjYWxsaW5nIGhhbmRsZXIuIG51bGwgYnkgZGVmYXVsdC5cbiAgICAgICAgICogQHJldHVybnMge0V2ZW50UHJvcGVydHkuTGlzdGVuZXJJZH0gLSBudW1iZXIsIGlkZW50aWZ5aW5nIG5ldyBldmVudCBsaXN0ZW5lci5cbiAgICAgICAgICovXG4gICAgICAgIG9uKGhhbmRsZXI6IEV2ZW50UHJvcGVydHkuSGFuZGxlcjxUPiwgY29udGV4dD86IE9iamVjdCk6IExpc3RlbmVySWQ7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEFkZHMgYSBsaXN0ZW5lciBmb3IgdGhpcyBldmVudCB0eXBlLiBUaGlzIGxpc3RlbmVyIHdpbGwgYmUgaW1tZWRpYXRlbHkgcmVtb3ZlZCBhZnRlciBpdCdzXG4gICAgICAgICAqIGludm9rZWQgZm9yIHRoZSBmaXJzdCB0aW1lLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge0V2ZW50UHJvcGVydHkuSGFuZGxlcjxUPn0gaGFuZGxlciAtIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCB3aGVuIGFuIGV2ZW50IGlzIGVtaXR0ZWRcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IFtjb250ZXh0XSAtIGNvbnRleHQgdG8gYmUgdXNlZCB3aGVuIGNhbGxpbmcgaGFuZGxlci4gbnVsbCBieSBkZWZhdWx0LlxuICAgICAgICAgKiBAcmV0dXJucyB7RXZlbnRQcm9wZXJ0eS5MaXN0ZW5lcklkfSAtIG51bWJlciwgaWRlbnRpZnlpbmcgbmV3IGV2ZW50IGxpc3RlbmVyLlxuICAgICAgICAgKi9cbiAgICAgICAgb25jZShoYW5kbGVyOiBFdmVudFByb3BlcnR5LkhhbmRsZXI8VD4sIGNvbnRleHQ/OiBPYmplY3QpOiBMaXN0ZW5lcklkO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBZGRzIGEgbGlzdGVuZXIgZm9yIHRoaXMgZXZlbnQgdHlwZS4gVGhpcyBsaXN0ZW5lciB3aWxsIGJlIGNhbGxlZCBvbmx5IGlmIGV2ZW50IGFyZ3VtZW50XG4gICAgICAgICAqIG1hdGNoZXMgZ2l2ZW4gdmFsdWUuXG4gICAgICAgICAqXG4gICAgICAgICAqIE5vdGU6IHdoYXQgXCJtYXRjaGluZ1wiIG1lYW5zIGlzIG5vdCBkb2N1bWVudGVkIHdlbGwgeWV0IHNpbmNlIGl0IGlzIHN1YmplY3QgdG8gY2hhbmdlLlxuICAgICAgICAgKiBGb3Igbm93IHlvdSBzaG91bGQgYXNzdW1lIHRoYXQgZm9yIHBsYWluIHR5cGVzIChib29sZWFuLCBudW1iZXIsIHN0cmluZykgaXQgaXNcbiAgICAgICAgICogc3RyaWN0IGVxdWFsaXR5LiBGb3Igb2JqZWN0cyBpdCBpcyBsaWtlIGRlZXAgc3RyaWN0IGVxdWFsaXR5IGV4Y2VwdCB0aGF0IGFjdHVhbFxuICAgICAgICAgKiBldmVudCBhcmd1bWVudCBtYXkgaGF2ZSBtb3JlIGZpZWxkcyB0aGFuIG1hdGNoLXZhbHVlKHByb3RvKS4gQnV0IGFsbCBmaWVsZHMgZnJvbVxuICAgICAgICAgKiBtYXRjaC12YWx1ZSBtdXN0IGJlIHByZXNlbnQgaW4gZXZlbnQgYXJndW1lbnQuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7VHxSZWdFeHB9IHZhbHVlIC0gaGFuZGxlciBpcyBpbnZva2VkIG9ubHkgaWYgZXZlbnQgYXJndW1lbnQgbWF0Y2hlcyB0aGlzIHZhbHVlXG4gICAgICAgICAqIEBwYXJhbSB7RXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+fSBoYW5kbGVyIC0gY2FsbGJhY2sgdG8gYmUgY2FsbGVkIHdoZW4gYW4gZXZlbnQgaXMgZW1pdHRlZFxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gW2NvbnRleHRdIC0gY29udGV4dCB0byBiZSB1c2VkIHdoZW4gY2FsbGluZyBoYW5kbGVyLiBudWxsIGJ5IGRlZmF1bHQuXG4gICAgICAgICAqIEByZXR1cm5zIHtFdmVudFByb3BlcnR5Lkxpc3RlbmVySWR9IC0gbnVtYmVyLCBpZGVudGlmeWluZyBuZXcgZXZlbnQgbGlzdGVuZXIuXG4gICAgICAgICAqL1xuICAgICAgICBtYXRjaCh2YWx1ZTogVHxSZWdFeHAsIGhhbmRsZXI6IEV2ZW50UHJvcGVydHkuSGFuZGxlcjxUPiwgY29udGV4dD86IE9iamVjdCk6IExpc3RlbmVySWQ7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEFkZHMgYSBsaXN0ZW5lciBmb3IgdGhpcyBldmVudCB0eXBlLiBUaGlzIGxpc3RlbmVyIHdpbGwgYmUgaW52b2tlZCBvbmx5IGlmIGV2ZW50IGFyZ3VtZW50XG4gICAgICAgICAqIG1hdGNoZXMgZ2l2ZW4gdmFsdWUuIFRoaXMgbGlzdGVuZXIgd2lsbCBiZSBpbW1lZGlhdGVseSByZW1vdmVkIGFmdGVyIGl0J3MgaW52b2tlZFxuICAgICAgICAgKiBmb3IgdGhlIGZpcnN0IHRpbWUuXG4gICAgICAgICAqXG4gICAgICAgICAqIE5vdGU6IHdoYXQgXCJtYXRjaGluZ1wiIG1lYW5zIGlzIG5vdCBkb2N1bWVudGVkIHdlbGwgeWV0IHNpbmNlIGl0IGlzIHN1YmplY3QgdG8gY2hhbmdlLlxuICAgICAgICAgKiBGb3Igbm93IHlvdSBzaG91bGQgYXNzdW1lIHRoYXQgZm9yIHBsYWluIHR5cGVzIChib29sZWFuLCBudW1iZXIsIHN0cmluZykgaXQgaXNcbiAgICAgICAgICogc3RyaWN0IGVxdWFsaXR5LiBGb3Igb2JqZWN0cyBpdCBpcyBsaWtlIGRlZXAgc3RyaWN0IGVxdWFsaXR5IGV4Y2VwdCB0aGF0IGFjdHVhbFxuICAgICAgICAgKiBldmVudCBhcmd1bWVudCBtYXkgaGF2ZSBtb3JlIGZpZWxkcyB0aGFuIG1hdGNoLXZhbHVlKHByb3RvKS4gQnV0IGFsbCBmaWVsZHMgZnJvbVxuICAgICAgICAgKiBtYXRjaC12YWx1ZSBtdXN0IGJlIHByZXNlbnQgaW4gZXZlbnQgYXJndW1lbnQuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7VHxSZWdFeHB9IHZhbHVlIC0gaGFuZGxlciBpcyBpbnZva2VkIG9ubHkgaWYgZXZlbnQgYXJndW1lbnQgbWF0Y2hlcyB0aGlzIHZhbHVlXG4gICAgICAgICAqIEBwYXJhbSB7RXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+fSBoYW5kbGVyIC0gY2FsbGJhY2sgdG8gYmUgY2FsbGVkIHdoZW4gYW4gZXZlbnQgaXMgZW1pdHRlZFxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gW2NvbnRleHRdIC0gY29udGV4dCB0byBiZSB1c2VkIHdoZW4gY2FsbGluZyBoYW5kbGVyLiBudWxsIGJ5IGRlZmF1bHQuXG4gICAgICAgICAqIEByZXR1cm5zIHtFdmVudFByb3BlcnR5Lkxpc3RlbmVySWR9IC0gbnVtYmVyLCBpZGVudGlmeWluZyBuZXcgZXZlbnQgbGlzdGVuZXIuXG4gICAgICAgICAqL1xuICAgICAgICBtYXRjaE9uY2UodmFsdWU6IFR8UmVnRXhwLCBoYW5kbGVyOiBFdmVudFByb3BlcnR5LkhhbmRsZXI8VD4sIGNvbnRleHQ/OiBPYmplY3QpOiBMaXN0ZW5lcklkO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBcIlBpcGVzXCIgRXZlbnRQcm9wZXJ0eSB0byBvdGhlciBFdmVudFByb3BlcnR5LiBUaGlzIG1lYW5zIHRoYXQgd2hlbmV2ZXIgdGhpcyBldmVudFxuICAgICAgICAgKiBpcyBlbWl0dGVkIGl0IGlzIHBhc3NlZCB0byB0aGF0IG90aGVyIEV2ZW50UHJvcGVydHkgd2hpY2ggZW1pdHMgaXQgdG9vLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge0V2ZW50UHJvcGVydHk8VD59IG90aGVyXG4gICAgICAgICAqIEByZXR1cm5zIHtFdmVudFByb3BlcnR5Lkxpc3RlbmVySWR9XG4gICAgICAgICAqL1xuICAgICAgICBwaXBlKG90aGVyOiBFdmVudFByb3BlcnR5PFQ+KTogRXZlbnRQcm9wZXJ0eS5MaXN0ZW5lcklkO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBQaXBlIG9ubHkgZXZlbnRzIHdpdGggbWF0Y2hpbmcgYXJndW1lbnQgdG8gZGVzdGluYXRpb24gRXZlbnRQcm9wZXJ0eS5cbiAgICAgICAgICpcbiAgICAgICAgICogTm90ZTogd2hhdCBcIm1hdGNoaW5nXCIgbWVhbnMgaXMgbm90IGRvY3VtZW50ZWQgd2VsbCB5ZXQgc2luY2UgaXQgaXMgc3ViamVjdCB0byBjaGFuZ2UuXG4gICAgICAgICAqIEZvciBub3cgeW91IHNob3VsZCBhc3N1bWUgdGhhdCBmb3IgcGxhaW4gdHlwZXMgKGJvb2xlYW4sIG51bWJlciwgc3RyaW5nKSBpdCBpc1xuICAgICAgICAgKiBzdHJpY3QgZXF1YWxpdHkuIEZvciBvYmplY3RzIGl0IGlzIGxpa2UgZGVlcCBzdHJpY3QgZXF1YWxpdHkgZXhjZXB0IHRoYXQgYWN0dWFsXG4gICAgICAgICAqIGV2ZW50IGFyZ3VtZW50IG1heSBoYXZlIG1vcmUgZmllbGRzIHRoYW4gbWF0Y2gtdmFsdWUocHJvdG8pLiBCdXQgYWxsIGZpZWxkcyBmcm9tXG4gICAgICAgICAqIG1hdGNoLXZhbHVlIG11c3QgYmUgcHJlc2VudCBpbiBldmVudCBhcmd1bWVudC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtUfFJlZ0V4cH0gbWF0Y2hWYWx1ZSAtIHZhbHVlIHRvIG1hdGNoXG4gICAgICAgICAqIEBwYXJhbSB7RXZlbnRQcm9wZXJ0eTxUPn0gZGVzdGluYXRpb24gLSB0YXJnZXQgRXZlbnRQcm9wZXJ0eVxuICAgICAgICAgKiBAcmV0dXJucyB7RXZlbnRQcm9wZXJ0eS5MaXN0ZW5lcklkfVxuICAgICAgICAgKi9cbiAgICAgICAgcm91dGUobWF0Y2hWYWx1ZTogVHxSZWdFeHAsIGRlc3RpbmF0aW9uOiBFdmVudFByb3BlcnR5PFQ+KTogRXZlbnRQcm9wZXJ0eS5MaXN0ZW5lcklkO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZXR1cm5zIGEgcHJvbWlzZSB3aGljaCBpcyByZXNvbHZlZCBuZXh0IHRpbWUgdGhpcyBldmVudCBpcyBlbWl0dGVkLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxUPn1cbiAgICAgICAgICovXG4gICAgICAgIG5leHQoKTogUHJvbWlzZTxUPjtcblxuICAgICAgICAvKipcbiAgICAgICAgICogU3RvcmVzIHByb21pc2Ugd2hpY2ggaXMgcmVzb2x2ZWQgd2hlbiB0aGlzIGV2ZW50IGlzIGVtaXR0ZWQgZm9yIHRoZSBmaXJzdCB0aW1lLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAdHlwZSB7UHJvbWlzZTxUPn1cbiAgICAgICAgICovXG4gICAgICAgIGZpcnN0OiBQcm9taXNlPFQ+O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZW1vdmVzIGFsbCBsaXN0ZW5lcnMgdGhhdCB3ZXJlIGF0dGFjaGVkIHdpdGggZ2l2ZW4gaGFuZGxlciBhbmQgd2l0aG91dCBhIGNvbnRleHQuXG4gICAgICAgICAqIE5vdGU6IGl0IHdpbGwgbmV2ZXIgcmVtb3ZlIGFueSBsaXN0ZW5lciB0aGF0IHdhcyBhdHRhY2hlZCB3aXRoIGEgY29udGV4dC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtFdmVudFByb3BlcnR5LkhhbmRsZXI8VD59IGhhbmRsZXIgLSByZW1vdmUgbGlzdGVuZXJzIGhhdmluZyB0aGlzIGhhbmRsZXJcbiAgICAgICAgICovXG4gICAgICAgIG9mZihoYW5kbGVyOiBFdmVudFByb3BlcnR5LkhhbmRsZXI8VD4pOiB2b2lkO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZW1vdmVzIGxpc3RlbmVycyB0aGF0IHdlcmUgYXR0YWNoZWQgd2l0aCBnaXZlbiBoYW5kbGVyIGFuZCBjb250ZXh0LlxuICAgICAgICAgKiBOb3RlOiBpdCB3aWxsIG5ldmVyIHJlbW92ZSBhbnkgbGlzdGVuZXIgdGhhdCB3YXMgYXR0YWNoZWQgd2l0aG91dCBhIGNvbnRleHQuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7RXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+fSBoYW5kbGVyIC0gcmVtb3ZlIGxpc3RlbmVycyBoYXZpbmcgdGhpcyBoYW5kbGVyXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbY29udGV4dF0gLSByZW1vdmUgb25seSBsaXN0ZW5lcnMgaGF2aW5nIHRoaXMgY29udGV4dFxuICAgICAgICAgKi9cbiAgICAgICAgb2ZmKGhhbmRsZXI6IEV2ZW50UHJvcGVydHkuSGFuZGxlcjxUPiwgY29udGV4dDogT2JqZWN0KTogdm9pZDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVtb3ZlcyBhbGwgbGlzdGVuZXJzIGhhdmluZyB0aGlzIGNvbnRleHRcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGNvbnRleHRcbiAgICAgICAgICovXG4gICAgICAgIG9mZihjb250ZXh0OiBPYmplY3QpOiB2b2lkO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZW1vdmVzIGxpc3RlbmVyIHdpdGggZ2l2ZW4gaWQuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7RXZlbnRQcm9wZXJ0eS5MaXN0ZW5lcklkfSBpZFxuICAgICAgICAgKi9cbiAgICAgICAgb2ZmKGlkOiBFdmVudFByb3BlcnR5Lkxpc3RlbmVySWQpOiB2b2lkO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZW1vdmUgcGlwZXMgY3JlYXRlZCBmb3Igb3RoZXIgRXZlbnRQcm9wZXJ0eS5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtFdmVudFByb3BlcnR5fSBkZXN0aW5hdGlvblxuICAgICAgICAgKi9cbiAgICAgICAgb2ZmKGRlc3RpbmF0aW9uOiBFdmVudFByb3BlcnR5PFQ+KTogdm9pZDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVtb3ZlIGFsbCBsaXN0ZW5lcnMuXG4gICAgICAgICAqL1xuICAgICAgICBvZmYoKTogdm9pZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGEgcGFpcjogYW4gRXZlbnRQcm9wZXJ0eSBpbnN0YW5jZSB0byBiZSB1c2VkIGludGVybmFsbHkgaW4gYSBjbGFzc1xuICAgICAqIGFuZCBhbiBFbWl0dGVyLWludGVyZmFjZSB0byBiZSB1c2VkIGFzIHB1YmxpYyAvIGFjY2Vzc2libGUgcHJvcGVydHkuXG4gICAgICogVGhleSBib3RoIGFjdHVhbGx5IHJlcHJlc2VudCB0aGUgc2FtZSBFdmVudFByb3BlcnR5IG9iamVjdC5cbiAgICAgKlxuICAgICAqIHJldHVybnMge1tFdmVudFByb3BlcnR5LEV2ZW50UHJvcGVydHkuRW1pdHRlcjxUPl19XG4gICAgICovXG4gICAgZXhwb3J0IGZ1bmN0aW9uIG1ha2U8VD4oKTogW0V2ZW50UHJvcGVydHk8VD4sIEV2ZW50UHJvcGVydHkuRW1pdHRlcjxUPl0ge1xuICAgICAgICBsZXQgZXZlbnRQcm9wID0gbmV3IEV2ZW50UHJvcGVydHk8VD4oKTtcbiAgICAgICAgcmV0dXJuIFtldmVudFByb3AsIDxFdmVudFByb3BlcnR5LkVtaXR0ZXI8VD4+ZXZlbnRQcm9wXTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuIEV2ZW50UHJvcGVydHkgb2JqZWN0IGFuZCBzcGxpdHMgaXQgaW50byBlbWl0dGVyLWZ1bmN0aW9uIGFuZFxuICAgICAqIEVtaXR0ZXItaW50ZXJmYWNlLiBVc2UgZW1pdHRlciBmdW5jdGlvbiB0byBlbWl0IHRoZSBldmVudCBhbmQgRW1pdHRlci1pbnRlcmZhY2VcbiAgICAgKiB0byBhZGQgYW5kIHJlbW92ZSBsaXN0ZW5lcnMgb2YgdGhhdCBldmVudC5cbiAgICAgKlxuICAgICAqIHJldHVybnMge1tFdmVudFByb3BlcnR5LkVtaXRNZXRob2Q8VD4sRXZlbnRQcm9wZXJ0eS5FbWl0dGVyPFQ+XX1cbiAgICAgKi9cbiAgICBleHBvcnQgZnVuY3Rpb24gc3BsaXQ8VD4oKTogW0V2ZW50UHJvcGVydHkuRW1pdE1ldGhvZDxUPiwgRXZlbnRQcm9wZXJ0eS5FbWl0dGVyPFQ+XSB7XG4gICAgICAgIGxldCBldmVudFByb3AgPSBuZXcgRXZlbnRQcm9wZXJ0eTxUPigpO1xuICAgICAgICByZXR1cm4gW2V2ZW50UHJvcC5lbWl0LCA8RXZlbnRQcm9wZXJ0eS5FbWl0dGVyPFQ+PmV2ZW50UHJvcF07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbiBFdmVudFByb3BlcnR5IG9iamVjdCBhbmQgc3BsaXRzIGl0IGludG8gZW1pdHRlci1mdW5jdGlvbiBhbmRcbiAgICAgKiBFbWl0dGVyLWludGVyZmFjZS4gU3BlY2lhbCB2ZXJzaW9uIGZvciB2b2lkLXR5cGVkIGV2ZW50cy5cbiAgICAgKlxuICAgICAqIHJldHVybnMge1tFdmVudFByb3BlcnR5LlZvaWRFbWl0TWV0aG9kLEV2ZW50UHJvcGVydHkuRW1pdHRlcjxUPl19XG4gICAgICovXG4gICAgZXhwb3J0IGZ1bmN0aW9uIHNwbGl0Vm9pZCgpOiBbRXZlbnRQcm9wZXJ0eS5Wb2lkRW1pdE1ldGhvZCwgRXZlbnRQcm9wZXJ0eS5FbWl0dGVyPHZvaWQ+XSB7XG4gICAgICAgIGxldCBldmVudFByb3AgPSBuZXcgRXZlbnRQcm9wZXJ0eS5Wb2lkKCk7XG4gICAgICAgIGxldCBlbWl0dGVyID0gPEV2ZW50UHJvcGVydHkuRW1pdHRlcjx2b2lkPj5ldmVudFByb3A7XG4gICAgICAgIHJldHVybiBbZXZlbnRQcm9wLmVtaXQsIGVtaXR0ZXJdO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNwZWNpYWwgc3ViY2xhc3Mgb2YgRXZlbnRQcm9wZXJ0eSBmb3Igdm9pZCB0eXBlIC0gYWxsb3dzIGNhbGxpbmcgZW1pdCB3aXRob3V0IGFyZ3VtZW50cy5cbiAgICAgKlxuICAgICAqIEBleHRlbmRzIHtFdmVudFByb3BlcnR5fVxuICAgICAqL1xuICAgIGV4cG9ydCBjbGFzcyBWb2lkIGV4dGVuZHMgRXZlbnRQcm9wZXJ0eTx2b2lkPiB7XG4gICAgICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBFbWl0cyBhbiBldmVudCBpbnZva2luZyBhbGwgbGlzdGVuZXJzLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAc2VlIHtFdmVudFByb3BlcnR5LmVtaXR9XG4gICAgICAgICAqL1xuICAgICAgICBlbWl0KCkgeyByZXR1cm4gc3VwZXIuZW1pdCh2b2lkIDApOyB9XG4gICAgfVxufVxuXG5cbi8qKlxuICogVXNlZCBpbiBFdmVudFByb3BlcnR5Lm1hdGNoL21hdGNoT25jZS9yb3V0ZSBtZXRob2RzIHRvIGNvbXBhcmUgZXZlbnQgYXJndW1lbnQgd2l0aCBnaXZlbiB2YWx1ZS5cbiAqIE5vdGU6IHN1YmplY3QgdG8gY2hhbmdlLlxuICpcbiAqIEBwYXJhbSB7YW55fSBzdWJqZWN0IC0gYWN0dWFsIGV2ZW50IGFyZ3VtZW50XG4gKiBAcGFyYW0ge2FueX0gcHJvdG8gLSB2YWx1ZSB0byBtYXRjaFxuICogQHJldHVybnMge2Jvb2xlYW59XG4gKlxuICogQHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gb2JqZWN0TWF0Y2goc3ViamVjdDogYW55LCBwcm90bzogYW55KTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIF9vYmplY3RNYXRjaChzdWJqZWN0LCBwcm90byk7XG59XG5cbmZ1bmN0aW9uIF9vYmplY3RNYXRjaChzdWJqZWN0OiBhbnksIHByb3RvOiBhbnksIHRyYXZlcnNhbFN0YWNrOiBhbnlbXSA9IFtdKTogYm9vbGVhbiB7XG4gICAgc3dpdGNoICh0eXBlb2YgcHJvdG8pIHtcbiAgICAgICAgY2FzZSBcInVuZGVmaW5lZFwiOiByZXR1cm4gc3ViamVjdCA9PT0gdW5kZWZpbmVkO1xuICAgICAgICBjYXNlIFwibnVtYmVyXCI6XG4gICAgICAgIGNhc2UgXCJib29sZWFuXCI6XG4gICAgICAgIGNhc2UgXCJzdHJpbmdcIjpcbiAgICAgICAgY2FzZSBcImZ1bmN0aW9uXCI6XG4gICAgICAgICAgICByZXR1cm4gc3ViamVjdCA9PT0gcHJvdG87XG4gICAgICAgIGNhc2UgXCJvYmplY3RcIjpcbiAgICAgICAgICAgIGxldCBpc01hdGNoaW5nID0gdHJ1ZTtcblxuICAgICAgICAgICAgaWYgKHRyYXZlcnNhbFN0YWNrLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGlmICgodHlwZW9mIHN1YmplY3QgPT09IFwic3RyaW5nXCIpICYmIChwcm90byBpbnN0YW5jZW9mIFJlZ0V4cCkpIHtcbiAgICAgICAgICAgICAgICAgICAgaXNNYXRjaGluZyA9IHByb3RvLnRlc3Qoc3ViamVjdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHN1YmplY3QgIT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgaXNNYXRjaGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghcHJvdG8gfHwgIXN1YmplY3QpXG4gICAgICAgICAgICAgICAgICAgICAgICBpc01hdGNoaW5nID0gIXN1YmplY3QgJiYgIXByb3RvO1xuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICh0cmF2ZXJzYWxTdGFjay5pbmNsdWRlcyhzdWJqZWN0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUmVjdXJzaW9uIVwiKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGtleSBpbiBwcm90bykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm90by5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYXZlcnNhbFN0YWNrLnB1c2goc3ViamVjdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzTWF0Y2hpbmcgPSBpc01hdGNoaW5nICYmIF9vYmplY3RNYXRjaChzdWJqZWN0W2tleV0sIHByb3RvW2tleV0sIHRyYXZlcnNhbFN0YWNrKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhdmVyc2FsU3RhY2sucG9wKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGlzTWF0Y2hpbmc7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVuZXhwZWN0ZWQgdHlwZW9mOiAke3R5cGVvZiBwcm90b31gKTtcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IEV2ZW50UHJvcGVydHk7Il19