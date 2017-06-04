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
     */
    /**
     * Emits event with given argument. This invokes all appropriate handlers.
     *
     * @param {T} eventArg
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
     * Adds a listener for this event type.
     *
     * @param {EventProperty.Handler<T>} handler - callback to be called when an event is emitted
     * @param {Object} [context] - context to be used when calling handler. null by default.
     * @returns {EventProperty.ListenerId} - number, identifying new event listener.
     */
    on(handler, context) {
        return this.addListener({ handler, context });
    }
    /**
     * Adds a listener for this event type. This listener will be immediately removed after it's
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
     * Adds a listener for this event type. This listener will be called only if event argument
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
     */
    route(matchValue, destination) {
        return this.match(matchValue, destination.emit);
    }
    /**
     * Returns a promise which is resolved next time this event is emitted.
     *
     * @returns {Promise<T>}
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
     * @returns {[EventProperty,EventProperty.Emitter<T>]}
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
     * @returns {[EventProperty.EmitMethod<T>,EventProperty.Emitter<T>]}
     */
    function split() {
        let eventProp = new EventProperty();
        return [eventProp.emit, eventProp];
    }
    EventProperty.split = split;
    /**
     * Creates an EventProperty object and splits it into emitter-function and
     * Emitter-interface. Special version for void-typed events.
     */
    function splitVoid() {
        let eventProp = new EventProperty.Void();
        let emitter = eventProp;
        return [eventProp.emit, emitter];
    }
    EventProperty.splitVoid = splitVoid;
    /**
     * Special subclass of EventProperty for void type - allows calling emit without arguments.
     */
    class Void extends EventProperty {
        constructor() {
            super();
        }
        /**
         * Emits an event invoking all listeners.
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvZXZlbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsNkNBQTZDOztBQUU3Qzs7O0dBR0c7QUFDSDtJQVdJO1FBVlEsY0FBUyxHQUF5QyxFQUFFLENBQUM7UUFFckQsd0JBQW1CLEdBQWUsSUFBSSxDQUFDO1FBR3ZDLHVCQUFrQixHQUFZLEtBQUssQ0FBQztRQUVwQyxjQUFTLEdBQTZCLENBQUMsQ0FBQztRQUs1QyxJQUFJLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUEyQixFQUFFLE1BQXdCO1lBQ3pGLElBQUksQ0FBQywwQkFBMEIsR0FBRyxPQUFPLENBQUM7WUFDMUMsSUFBSSxDQUFDLHlCQUF5QixHQUFHLE1BQU0sQ0FBQztRQUM1QyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDckMsQ0FBQztJQUVEOzs7O09BSUc7SUFFSDs7OztPQUlHO0lBQ0gsSUFBSSxDQUFDLFFBQVc7UUFDWixJQUFJLHVCQUF1QixHQUFZLEtBQUssQ0FBQztRQUM3QyxJQUFJLFFBQThDLENBQUM7UUFFbkQsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDO1lBQzNCLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxJQUFJLENBQUM7WUFDL0IsdUJBQXVCLEdBQUcsSUFBSSxDQUFDO1FBQ25DLENBQUM7UUFFRCxRQUFRLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxRQUE0QztZQUNsRixJQUFJLFlBQVksR0FBRyxDQUFDLFFBQVEsQ0FBQyxZQUFZLElBQUksV0FBVyxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDeEYsRUFBRSxDQUFD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QUFDLEVBQUUsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUN4QyxNQUFNLElBQUksS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDO29CQUNsQyxDQUFDO29CQUFDLElBQUksQ0FBQyxDQUFDO3dCQUNKLEdBQUcsQ0FBQyxDQUFDLElBQUksR0FBRyxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUM7NEJBQ3BCLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dDQUM1QixjQUFjLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dDQUM3QixVQUFVLEdBQUcsVUFBVSxJQUFJLFlBQVksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLGNBQWMsQ0FBQyxDQUFDO2dDQUNsRixjQUFjLENBQUMsR0FBRyxFQUFFLENBQUM7NEJBQ3pCLENBQUM7d0JBQ0wsQ0FBQztvQkFDTCxDQUFDO2dCQUNMLENBQUM7WUFDTCxDQUFDO1lBQ0QsTUFBTSxDQUFDLFVBQVUsQ0FBQztRQUN0QjtZQUNJLE1BQU0sSUFBSSxLQUFLLENBQUMsc0JBQXNCLE9BQU8sS0FBSyxFQUFFLENBQUMsQ0FBQztJQUM5RCxDQUFDO0FBQ0wsQ0FBQztBQUVELGtCQUFlLGFBQWEsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi90eXBpbmdzL2luZGV4LmQudHNcIi8+XG5cbi8qKlxuICogUmVwcmVzZW50cyBhIGNlcnRhaW4gdHlwZSBvZiBldmVudHMuXG4gKiBQcm92aWRlcyBtZXRob2RzIHRvIG9ic2VydmUgYW5kIHRvIHRyaWdnZXIoZW1pdCkgZXZlbnRzIG9mIHRoYXQgdHlwZS5cbiAqL1xuZXhwb3J0IGNsYXNzIEV2ZW50UHJvcGVydHk8VD4gaW1wbGVtZW50cyBFdmVudFByb3BlcnR5LkVtaXR0ZXI8VD4ge1xuICAgIHByaXZhdGUgbGlzdGVuZXJzOiBFdmVudFByb3BlcnR5LkhhbmRsZXJEZXNjcmlwdG9yPFQ+W10gPSBbXTtcblxuICAgIHByaXZhdGUgZmlyc3RUcmlnZ2VyUHJvbWlzZTogUHJvbWlzZTxUPiA9IG51bGw7XG4gICAgcHJpdmF0ZSByZXNvbHZlRmlyc3RUcmlnZ2VyUHJvbWlzZTogKHZhbHVlOiBUKSA9PiBhbnk7XG4gICAgcHJpdmF0ZSByZWplY3RGaXJzdFRyaWdnZXJQcm9taXNlOiAodmFsdWU6IGFueSkgPT4gYW55O1xuICAgIHByaXZhdGUgaXNGaXJzdFRyaWdnZXJEb25lOiBib29sZWFuID0gZmFsc2U7XG5cbiAgICBwcml2YXRlIGlkQ291bnRlcjogRXZlbnRQcm9wZXJ0eS5MaXN0ZW5lcklkID0gMDtcblxuXG4gICAgY29uc3RydWN0b3IoKSB7XG5cbiAgICAgICAgdGhpcy5maXJzdFRyaWdnZXJQcm9taXNlID0gbmV3IFByb21pc2UoKHJlc29sdmU6ICh2YWx1ZTogVCkgPT4gdm9pZCwgcmVqZWN0OiAoZTogYW55KSA9PiB2b2lkKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnJlc29sdmVGaXJzdFRyaWdnZXJQcm9taXNlID0gcmVzb2x2ZTtcbiAgICAgICAgICAgIHRoaXMucmVqZWN0Rmlyc3RUcmlnZ2VyUHJvbWlzZSA9IHJlamVjdDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5lbWl0ID0gdGhpcy5lbWl0LmJpbmQodGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhpcyB0eXBlZGVmIGlzIHVzZWQgdG8gZGVzY3JpYmUgdHlwZS1wYXJhbWV0ZXIgVCBmb3IganNkb2MgcGFyc2VyLlxuICAgICAqXG4gICAgICogQHR5cGVkZWYge2FueX0gVDtcbiAgICAgKi9cblxuICAgIC8qKlxuICAgICAqIEVtaXRzIGV2ZW50IHdpdGggZ2l2ZW4gYXJndW1lbnQuIFRoaXMgaW52b2tlcyBhbGwgYXBwcm9wcmlhdGUgaGFuZGxlcnMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1R9IGV2ZW50QXJnXG4gICAgICovXG4gICAgZW1pdChldmVudEFyZzogVCk6IHZvaWQge1xuICAgICAgICBsZXQgcmVzb2x2ZUZpcnN0VGltZVRyaWdnZXI6IGJvb2xlYW4gPSBmYWxzZTtcbiAgICAgICAgbGV0IHRvSW52b2tlOiBFdmVudFByb3BlcnR5LkhhbmRsZXJEZXNjcmlwdG9yPFQ+W107XG5cbiAgICAgICAgaWYgKCF0aGlzLmlzRmlyc3RUcmlnZ2VyRG9uZSkge1xuICAgICAgICAgICAgdGhpcy5pc0ZpcnN0VHJpZ2dlckRvbmUgPSB0cnVlO1xuICAgICAgICAgICAgcmVzb2x2ZUZpcnN0VGltZVRyaWdnZXIgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdG9JbnZva2UgPSB0aGlzLmxpc3RlbmVycy5zbGljZSgpLmZpbHRlcigobGlzdGVuZXI6IEV2ZW50UHJvcGVydHkuSGFuZGxlckRlc2NyaXB0b3I8VD4pID0+IHtcbiAgICAgICAgICAgIGxldCBzaG91bGRJbnZva2UgPSAhbGlzdGVuZXIub25seU1hdGNoaW5nIHx8IG9iamVjdE1hdGNoKGV2ZW50QXJnLCBsaXN0ZW5lci5tYXRjaFZhbHVlKTtcbiAgICAgICAgICAgIGlmIChsaXN0ZW5lci5vbmNlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gc2hvdWxkSW52b2tlO1xuICAgICAgICB9KTtcblxuICAgICAgICB0b0ludm9rZS5mb3JFYWNoKChsaXN0ZW5lcjogRXZlbnRQcm9wZXJ0eS5IYW5kbGVyRGVzY3JpcHRvcjxUPikgPT4ge1xuICAgICAgICAgICAgaWYgKGxpc3RlbmVyLmNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICBsaXN0ZW5lci5oYW5kbGVyLmNhbGwobGlzdGVuZXIuY29udGV4dCwgZXZlbnRBcmcpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBsaXN0ZW5lci5oYW5kbGVyLmNhbGwobnVsbCwgZXZlbnRBcmcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAocmVzb2x2ZUZpcnN0VGltZVRyaWdnZXIpIHtcbiAgICAgICAgICAgIHRoaXMucmVzb2x2ZUZpcnN0VHJpZ2dlclByb21pc2UoZXZlbnRBcmcpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkcyBhIGxpc3RlbmVyIGZvciB0aGlzIGV2ZW50IHR5cGUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0V2ZW50UHJvcGVydHkuSGFuZGxlcjxUPn0gaGFuZGxlciAtIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCB3aGVuIGFuIGV2ZW50IGlzIGVtaXR0ZWRcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW2NvbnRleHRdIC0gY29udGV4dCB0byBiZSB1c2VkIHdoZW4gY2FsbGluZyBoYW5kbGVyLiBudWxsIGJ5IGRlZmF1bHQuXG4gICAgICogQHJldHVybnMge0V2ZW50UHJvcGVydHkuTGlzdGVuZXJJZH0gLSBudW1iZXIsIGlkZW50aWZ5aW5nIG5ldyBldmVudCBsaXN0ZW5lci5cbiAgICAgKi9cbiAgICBvbihoYW5kbGVyOiBFdmVudFByb3BlcnR5LkhhbmRsZXI8VD4sIGNvbnRleHQ/OiBPYmplY3QpOiBFdmVudFByb3BlcnR5Lkxpc3RlbmVySWQge1xuICAgICAgICByZXR1cm4gdGhpcy5hZGRMaXN0ZW5lcih7IGhhbmRsZXIsIGNvbnRleHQgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkcyBhIGxpc3RlbmVyIGZvciB0aGlzIGV2ZW50IHR5cGUuIFRoaXMgbGlzdGVuZXIgd2lsbCBiZSBpbW1lZGlhdGVseSByZW1vdmVkIGFmdGVyIGl0J3NcbiAgICAgKiBpbnZva2VkIGZvciB0aGUgZmlyc3QgdGltZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+fSBoYW5kbGVyIC0gY2FsbGJhY2sgdG8gYmUgY2FsbGVkIHdoZW4gYW4gZXZlbnQgaXMgZW1pdHRlZFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbY29udGV4dF0gLSBjb250ZXh0IHRvIGJlIHVzZWQgd2hlbiBjYWxsaW5nIGhhbmRsZXIuIG51bGwgYnkgZGVmYXVsdC5cbiAgICAgKiBAcmV0dXJucyB7RXZlbnRQcm9wZXJ0eS5MaXN0ZW5lcklkfSAtIG51bWJlciwgaWRlbnRpZnlpbmcgbmV3IGV2ZW50IGxpc3RlbmVyLlxuICAgICAqL1xuICAgIG9uY2UoaGFuZGxlcjogRXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+LCBjb250ZXh0OiBPYmplY3QgPSBudWxsKTogRXZlbnRQcm9wZXJ0eS5MaXN0ZW5lcklkIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYWRkTGlzdGVuZXIoeyBjb250ZXh0LCBoYW5kbGVyLCBvbmNlOiB0cnVlIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZHMgYSBsaXN0ZW5lciBmb3IgdGhpcyBldmVudCB0eXBlLiBUaGlzIGxpc3RlbmVyIHdpbGwgYmUgY2FsbGVkIG9ubHkgaWYgZXZlbnQgYXJndW1lbnRcbiAgICAgKiBtYXRjaGVzIGdpdmVuIHZhbHVlLlxuICAgICAqXG4gICAgICogTm90ZTogd2hhdCBcIm1hdGNoaW5nXCIgbWVhbnMgaXMgbm90IGRvY3VtZW50ZWQgd2VsbCB5ZXQgc2luY2UgaXQgaXMgc3ViamVjdCB0byBjaGFuZ2UuXG4gICAgICogRm9yIG5vdyB5b3Ugc2hvdWxkIGFzc3VtZSB0aGF0IGZvciBwbGFpbiB0eXBlcyAoYm9vbGVhbiwgbnVtYmVyLCBzdHJpbmcpIGl0IGlzXG4gICAgICogc3RyaWN0IGVxdWFsaXR5LiBGb3Igb2JqZWN0cyBpdCBpcyBsaWtlIGRlZXAgc3RyaWN0IGVxdWFsaXR5IGV4Y2VwdCB0aGF0IGFjdHVhbFxuICAgICAqIGV2ZW50IGFyZ3VtZW50IG1heSBoYXZlIG1vcmUgZmllbGRzIHRoYW4gbWF0Y2gtdmFsdWUocHJvdG8pLiBCdXQgYWxsIGZpZWxkcyBmcm9tXG4gICAgICogbWF0Y2gtdmFsdWUgbXVzdCBiZSBwcmVzZW50IGluIGV2ZW50IGFyZ3VtZW50LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtUfFJlZ0V4cH0gdmFsdWUgLSBoYW5kbGVyIGlzIGludm9rZWQgb25seSBpZiBldmVudCBhcmd1bWVudCBtYXRjaGVzIHRoaXMgdmFsdWVcbiAgICAgKiBAcGFyYW0ge0V2ZW50UHJvcGVydHkuSGFuZGxlcjxUPn0gaGFuZGxlciAtIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCB3aGVuIGFuIGV2ZW50IGlzIGVtaXR0ZWRcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW2NvbnRleHRdIC0gY29udGV4dCB0byBiZSB1c2VkIHdoZW4gY2FsbGluZyBoYW5kbGVyLiBudWxsIGJ5IGRlZmF1bHQuXG4gICAgICogQHJldHVybnMge0V2ZW50UHJvcGVydHkuTGlzdGVuZXJJZH0gLSBudW1iZXIsIGlkZW50aWZ5aW5nIG5ldyBldmVudCBsaXN0ZW5lci5cbiAgICAgKi9cbiAgICBtYXRjaCh2YWx1ZTogVHxSZWdFeHAsIGhhbmRsZXI6IEV2ZW50UHJvcGVydHkuSGFuZGxlcjxUPiwgY29udGV4dD86IE9iamVjdCk6IEV2ZW50UHJvcGVydHkuTGlzdGVuZXJJZCB7XG4gICAgICAgIHJldHVybiB0aGlzLmFkZExpc3RlbmVyKHsgaGFuZGxlciwgY29udGV4dCwgb25seU1hdGNoaW5nOiB0cnVlLCBtYXRjaFZhbHVlOiB2YWx1ZSB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGRzIGEgbGlzdGVuZXIgZm9yIHRoaXMgZXZlbnQgdHlwZS4gVGhpcyBsaXN0ZW5lciB3aWxsIGJlIGludm9rZWQgb25seSBpZiBldmVudCBhcmd1bWVudFxuICAgICAqIG1hdGNoZXMgZ2l2ZW4gdmFsdWUuIFRoaXMgbGlzdGVuZXIgd2lsbCBiZSBpbW1lZGlhdGVseSByZW1vdmVkIGFmdGVyIGl0J3MgaW52b2tlZFxuICAgICAqIGZvciB0aGUgZmlyc3QgdGltZS5cbiAgICAgKlxuICAgICAqIE5vdGU6IHdoYXQgXCJtYXRjaGluZ1wiIG1lYW5zIGlzIG5vdCBkb2N1bWVudGVkIHdlbGwgeWV0IHNpbmNlIGl0IGlzIHN1YmplY3QgdG8gY2hhbmdlLlxuICAgICAqIEZvciBub3cgeW91IHNob3VsZCBhc3N1bWUgdGhhdCBmb3IgcGxhaW4gdHlwZXMgKGJvb2xlYW4sIG51bWJlciwgc3RyaW5nKSBpdCBpc1xuICAgICAqIHN0cmljdCBlcXVhbGl0eS4gRm9yIG9iamVjdHMgaXQgaXMgbGlrZSBkZWVwIHN0cmljdCBlcXVhbGl0eSBleGNlcHQgdGhhdCBhY3R1YWxcbiAgICAgKiBldmVudCBhcmd1bWVudCBtYXkgaGF2ZSBtb3JlIGZpZWxkcyB0aGFuIG1hdGNoLXZhbHVlKHByb3RvKS4gQnV0IGFsbCBmaWVsZHMgZnJvbVxuICAgICAqIG1hdGNoLXZhbHVlIG11c3QgYmUgcHJlc2VudCBpbiBldmVudCBhcmd1bWVudC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7VHxSZWdFeHB9IHZhbHVlIC0gaGFuZGxlciBpcyBpbnZva2VkIG9ubHkgaWYgZXZlbnQgYXJndW1lbnQgbWF0Y2hlcyB0aGlzIHZhbHVlXG4gICAgICogQHBhcmFtIHtFdmVudFByb3BlcnR5LkhhbmRsZXI8VD59IGhhbmRsZXIgLSBjYWxsYmFjayB0byBiZSBjYWxsZWQgd2hlbiBhbiBldmVudCBpcyBlbWl0dGVkXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtjb250ZXh0XSAtIGNvbnRleHQgdG8gYmUgdXNlZCB3aGVuIGNhbGxpbmcgaGFuZGxlci4gbnVsbCBieSBkZWZhdWx0LlxuICAgICAqIEByZXR1cm5zIHtFdmVudFByb3BlcnR5Lkxpc3RlbmVySWR9IC0gbnVtYmVyLCBpZGVudGlmeWluZyBuZXcgZXZlbnQgbGlzdGVuZXIuXG4gICAgICovXG4gICAgbWF0Y2hPbmNlKHZhbHVlOiBUfFJlZ0V4cCwgaGFuZGxlcjogRXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+LCBjb250ZXh0OiBPYmplY3QgPSBudWxsKTogRXZlbnRQcm9wZXJ0eS5MaXN0ZW5lcklkIHtcbiAgICAgICAgIHJldHVybiB0aGlzLmFkZExpc3RlbmVyKHtcbiAgICAgICAgICAgICBjb250ZXh0LFxuICAgICAgICAgICAgIGhhbmRsZXIsXG4gICAgICAgICAgICAgb25jZTogdHJ1ZSxcbiAgICAgICAgICAgICBvbmx5TWF0Y2hpbmc6IHRydWUsXG4gICAgICAgICAgICAgbWF0Y2hWYWx1ZTogdmFsdWVcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogXCJQaXBlc1wiIEV2ZW50UHJvcGVydHkgdG8gb3RoZXIgRXZlbnRQcm9wZXJ0eS4gVGhpcyBtZWFucyB0aGF0IHdoZW5ldmVyIHRoaXMgZXZlbnRcbiAgICAgKiBpcyBlbWl0dGVkIGl0IGlzIHBhc3NlZCB0byB0aGF0IG90aGVyIEV2ZW50UHJvcGVydHkgd2hpY2ggZW1pdHMgaXQgdG9vLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtFdmVudFByb3BlcnR5PFQ+fSBvdGhlclxuICAgICAqIEByZXR1cm5zIHtFdmVudFByb3BlcnR5Lkxpc3RlbmVySWR9XG4gICAgICovXG4gICAgcGlwZShvdGhlcjogRXZlbnRQcm9wZXJ0eTxUPik6IEV2ZW50UHJvcGVydHkuTGlzdGVuZXJJZCB7XG4gICAgICAgIHJldHVybiB0aGlzLm9uKG90aGVyLmVtaXQpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFBpcGUgb25seSBldmVudHMgd2l0aCBtYXRjaGluZyBhcmd1bWVudCB0byBkZXN0aW5hdGlvbiBFdmVudFByb3BlcnR5LlxuICAgICAqXG4gICAgICogTm90ZTogd2hhdCBcIm1hdGNoaW5nXCIgbWVhbnMgaXMgbm90IGRvY3VtZW50ZWQgd2VsbCB5ZXQgc2luY2UgaXQgaXMgc3ViamVjdCB0byBjaGFuZ2UuXG4gICAgICogRm9yIG5vdyB5b3Ugc2hvdWxkIGFzc3VtZSB0aGF0IGZvciBwbGFpbiB0eXBlcyAoYm9vbGVhbiwgbnVtYmVyLCBzdHJpbmcpIGl0IGlzXG4gICAgICogc3RyaWN0IGVxdWFsaXR5LiBGb3Igb2JqZWN0cyBpdCBpcyBsaWtlIGRlZXAgc3RyaWN0IGVxdWFsaXR5IGV4Y2VwdCB0aGF0IGFjdHVhbFxuICAgICAqIGV2ZW50IGFyZ3VtZW50IG1heSBoYXZlIG1vcmUgZmllbGRzIHRoYW4gbWF0Y2gtdmFsdWUocHJvdG8pLiBCdXQgYWxsIGZpZWxkcyBmcm9tXG4gICAgICogbWF0Y2gtdmFsdWUgbXVzdCBiZSBwcmVzZW50IGluIGV2ZW50IGFyZ3VtZW50LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtUfFJlZ0V4cH0gbWF0Y2hWYWx1ZSAtIHZhbHVlIHRvIG1hdGNoXG4gICAgICogQHBhcmFtIHtFdmVudFByb3BlcnR5PFQ+fSBkZXN0aW5hdGlvbiAtIHRhcmdldCBFdmVudFByb3BlcnR5XG4gICAgICogQHJldHVybnMge0V2ZW50UHJvcGVydHkuTGlzdGVuZXJJZH1cbiAgICAgKi9cbiAgICByb3V0ZShtYXRjaFZhbHVlOiBUfFJlZ0V4cCwgZGVzdGluYXRpb246IEV2ZW50UHJvcGVydHk8VD4pOiBFdmVudFByb3BlcnR5Lkxpc3RlbmVySWQge1xuICAgICAgICByZXR1cm4gdGhpcy5tYXRjaChtYXRjaFZhbHVlLCBkZXN0aW5hdGlvbi5lbWl0KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgcHJvbWlzZSB3aGljaCBpcyByZXNvbHZlZCBuZXh0IHRpbWUgdGhpcyBldmVudCBpcyBlbWl0dGVkLlxuICAgICAqXG4gICAgICogQHJldHVybnMge1Byb21pc2U8VD59XG4gICAgICovXG4gICAgbmV4dCgpOiBQcm9taXNlPFQ+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlOiAoYTogVCkgPT4gdm9pZCwgcmVqZWN0OiAoZTogYW55KSA9PiB2b2lkKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHRoaXMub25jZShyZXNvbHZlKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICByZWplY3QoZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFN0b3JlcyBwcm9taXNlIHdoaWNoIGlzIHJlc29sdmVkIHdoZW4gdGhpcyBldmVudCBpcyBlbWl0dGVkIGZvciB0aGUgZmlyc3QgdGltZS5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPFQ+fVxuICAgICAqL1xuICAgIGdldCBmaXJzdCgpOiBQcm9taXNlPFQ+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmlyc3RUcmlnZ2VyUHJvbWlzZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmVzIGFsbCBsaXN0ZW5lcnMgdGhhdCB3ZXJlIGF0dGFjaGVkIHdpdGggZ2l2ZW4gaGFuZGxlciBhbmQgd2l0aG91dCBhIGNvbnRleHQuXG4gICAgICogTm90ZTogaXQgd2lsbCBuZXZlciByZW1vdmUgYW55IGxpc3RlbmVyIHRoYXQgd2FzIGF0dGFjaGVkIHdpdGggYSBjb250ZXh0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtFdmVudFByb3BlcnR5LkhhbmRsZXI8VD59IGhhbmRsZXIgLSByZW1vdmUgbGlzdGVuZXJzIGhhdmluZyB0aGlzIGhhbmRsZXJcbiAgICAgKi9cbiAgICBvZmYoaGFuZGxlcjogRXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+KTogdm9pZDtcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgbGlzdGVuZXJzIHRoYXQgd2VyZSBhdHRhY2hlZCB3aXRoIGdpdmVuIGhhbmRsZXIgYW5kIGNvbnRleHQuXG4gICAgICogTm90ZTogaXQgd2lsbCBuZXZlciByZW1vdmUgYW55IGxpc3RlbmVyIHRoYXQgd2FzIGF0dGFjaGVkIHdpdGhvdXQgYSBjb250ZXh0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtFdmVudFByb3BlcnR5LkhhbmRsZXI8VD59IGhhbmRsZXIgLSByZW1vdmUgbGlzdGVuZXJzIGhhdmluZyB0aGlzIGhhbmRsZXJcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW2NvbnRleHRdIC0gcmVtb3ZlIG9ubHkgbGlzdGVuZXJzIGhhdmluZyB0aGlzIGNvbnRleHRcbiAgICAgKi9cbiAgICBvZmYoaGFuZGxlcjogRXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+LCBjb250ZXh0OiBPYmplY3QpOiB2b2lkO1xuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyBhbGwgbGlzdGVuZXJzIGhhdmluZyB0aGlzIGNvbnRleHRcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjb250ZXh0XG4gICAgICovXG4gICAgb2ZmKGNvbnRleHQ6IE9iamVjdCk6IHZvaWQ7XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmVzIGxpc3RlbmVyIHdpdGggZ2l2ZW4gaWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0V2ZW50UHJvcGVydHkuTGlzdGVuZXJJZH0gaWRcbiAgICAgKi9cbiAgICBvZmYoaWQ6IEV2ZW50UHJvcGVydHkuTGlzdGVuZXJJZCk6IHZvaWQ7XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgcGlwZXMgY3JlYXRlZCBmb3Igb3RoZXIgRXZlbnRQcm9wZXJ0eS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RXZlbnRQcm9wZXJ0eX0gZGVzdGluYXRpb25cbiAgICAgKi9cbiAgICBvZmYoZGVzdGluYXRpb246IEV2ZW50UHJvcGVydHk8VD4pOiB2b2lkO1xuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIGFsbCBsaXN0ZW5lcnMuXG4gICAgICovXG4gICAgb2ZmKCk6IHZvaWQ7XG5cbiAgICBvZmYoLi4uYXJnczogYW55W10pOiB2b2lkIHtcbiAgICAgICAgbGV0IGNvbnRleHQ6IE9iamVjdCA9IG51bGwsXG4gICAgICAgICAgICBoYW5kbGVyOiBFdmVudFByb3BlcnR5LkhhbmRsZXI8VD4gPSBudWxsLFxuICAgICAgICAgICAgaWRUb1JlbW92ZTogRXZlbnRQcm9wZXJ0eS5MaXN0ZW5lcklkID0gbnVsbDtcbiAgICAgICAgc3dpdGNoIChhcmdzLmxlbmd0aCkge1xuICAgICAgICAgICAgY2FzZSAwOiAvLyBObyBhcmd1bWVudHMgLSBjbGVhciBhbGwgbGlzdGVuZXJzXG4gICAgICAgICAgICAgICAgdGhpcy5saXN0ZW5lcnMgPSBbXTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICAgICAgaWYgKEV2ZW50UHJvcGVydHkuaXNMaXN0ZW5lcklkKGFyZ3NbMF0pKSB7XG4gICAgICAgICAgICAgICAgICAgIGlkVG9SZW1vdmUgPSBhcmdzWzBdO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGFyZ3NbMF0gPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgICBoYW5kbGVyID0gYXJnc1swXTtcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dCA9IG51bGw7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgYXJnc1swXSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoYXJnc1swXSBpbnN0YW5jZW9mIEV2ZW50UHJvcGVydHkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub2ZmKGFyZ3NbMF0uZW1pdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlciA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQgPSBhcmdzWzBdO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBhcmd1bWVudDogJHt0eXBlb2YgYXJnc1swXX1gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICAgICAgaGFuZGxlciA9IGFyZ3NbMF07XG4gICAgICAgICAgICAgICAgY29udGV4dCA9IGFyZ3NbMV07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVuc3VwcG9ydGVkIGFyZ3VtZW50cyBmb3JtYXQuXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5saXN0ZW5lcnMgPSB0aGlzLmxpc3RlbmVycy5maWx0ZXIoKGhDb25mOiBFdmVudFByb3BlcnR5LkhhbmRsZXJEZXNjcmlwdG9yPFQ+KSA9PiB7XG4gICAgICAgICAgICBsZXQgZGlmZmVyZW50SGFuZGxlcjogYm9vbGVhbiA9IGhDb25mLmhhbmRsZXIgIT09IGhhbmRsZXI7XG4gICAgICAgICAgICBsZXQgbm9IYW5kbGVyR2l2ZW46IGJvb2xlYW4gPSAhaGFuZGxlcjtcbiAgICAgICAgICAgIGxldCBub0NvbnRleHRHaXZlbjogYm9vbGVhbiA9ICFjb250ZXh0O1xuICAgICAgICAgICAgbGV0IGNvbmZIYXNOb0NvbnRleHQ6IGJvb2xlYW4gPSAhaENvbmYuY29udGV4dDtcbiAgICAgICAgICAgIGxldCBkaWZmZXJlbnRDb250ZXh0OiBib29sZWFuID0gaENvbmYuY29udGV4dCAhPT0gY29udGV4dDtcbiAgICAgICAgICAgIGxldCBkb250UmVtb3ZlOiBib29sZWFuO1xuXG4gICAgICAgICAgICBpZiAoaWRUb1JlbW92ZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGRvbnRSZW1vdmUgPSBpZFRvUmVtb3ZlICE9PSBoQ29uZi5pZDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKG5vSGFuZGxlckdpdmVuKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChub0NvbnRleHRHaXZlbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5leHBlY3RlZCBjaXJjdW1zdGFuY2VzLlwiKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvbnRSZW1vdmUgPSBjb25mSGFzTm9Db250ZXh0IHx8IChjb250ZXh0ICE9PSBoQ29uZi5jb250ZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkaWZmZXJlbnRIYW5kbGVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkb250UmVtb3ZlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChub0NvbnRleHRHaXZlbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvbnRSZW1vdmUgPSAoIWNvbmZIYXNOb0NvbnRleHQpIHx8IChkaWZmZXJlbnRIYW5kbGVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZG9udFJlbW92ZSA9IGRpZmZlcmVudENvbnRleHQgfHwgZGlmZmVyZW50SGFuZGxlcjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBkb250UmVtb3ZlO1xuICAgICAgICB9KTtcbiAgICB9XG5cblxuICAgIHByaXZhdGUgcmVtb3ZlTGlzdGVuZXIobGlzdGVuZXI6IEV2ZW50UHJvcGVydHkuSGFuZGxlckRlc2NyaXB0b3I8VD4pOiB2b2lkIHtcbiAgICAgICAgbGV0IGxpc3RlbmVySW5kZXggPSB0aGlzLmxpc3RlbmVycy5pbmRleE9mKGxpc3RlbmVyKTtcbiAgICAgICAgaWYgKGxpc3RlbmVySW5kZXggIT09IC0xKSB7XG4gICAgICAgICAgICB0aGlzLmxpc3RlbmVycy5zcGxpY2UobGlzdGVuZXJJbmRleCwgMSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGFkZExpc3RlbmVyKG9wdGlvbnM6IEV2ZW50UHJvcGVydHkuSGFuZGxlck9wdGlvbnM8VD4pOiBFdmVudFByb3BlcnR5Lkxpc3RlbmVySWQge1xuICAgICAgICBsZXQge2NvbnRleHQsIGhhbmRsZXIsIG9uY2UsIG9ubHlNYXRjaGluZywgbWF0Y2hWYWx1ZX0gPSBvcHRpb25zO1xuICAgICAgICB0aGlzLmlkQ291bnRlcisrO1xuICAgICAgICB0aGlzLmxpc3RlbmVycy5wdXNoKHtjb250ZXh0LCBoYW5kbGVyLCBvbmNlLCBpZDogdGhpcy5pZENvdW50ZXIsIG9ubHlNYXRjaGluZywgbWF0Y2hWYWx1ZX0pO1xuICAgICAgICByZXR1cm4gdGhpcy5pZENvdW50ZXI7XG4gICAgfVxufVxuXG5leHBvcnQgbmFtZXNwYWNlIEV2ZW50UHJvcGVydHkge1xuXG4gICAgLyoqXG4gICAgICogVGhlIGNhbGxiYWNrIGZvcm1hdCB1c2VkIGZvciBhZGRpbmcgbGlzdGVuZXJzIHRvIEV2ZW50UHJvcGVydHkuXG4gICAgICovXG4gICAgZXhwb3J0IGludGVyZmFjZSBIYW5kbGVyPFQ+IHtcbiAgICAgICAgKGV2ZW50QXJnOiBUKTogdm9pZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgZm9ybWF0IG9mIHRoZSBFdmVudFByb3BlcnR5OmVtaXQgbWV0aG9kLlxuICAgICAqL1xuICAgIGV4cG9ydCBpbnRlcmZhY2UgRW1pdE1ldGhvZDxUPiB7XG4gICAgICAgIChldmVudEFyZzogVCk6IHZvaWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGZvcm1hdCBvZiB0aGUgRXZlbnRQcm9wZXJ0eTplbWl0IG1ldGhvZCBmb3IgVD12b2lkLlxuICAgICAqL1xuICAgIGV4cG9ydCBpbnRlcmZhY2UgVm9pZEVtaXRNZXRob2Qge1xuICAgICAgICAoKTogdm9pZDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIHR5cGUgaXMgdXNlZCBqdXN0IHRvIGVtcGhhc2l6ZSB0aGUgbWVhbmluZyBvZiB0aGUgdmFsdWUuXG4gICAgICogT3RoZXJ3aXNlIGxpc3RlbmVycyBpZHMgYXJlIHJlZ3VsYXIgbnVtYmVycy5cbiAgICAgKi9cbiAgICBleHBvcnQgdHlwZSBMaXN0ZW5lcklkID0gbnVtYmVyO1xuXG4gICAgLyoqXG4gICAgICogVGhpcyBtZXRob2QgaXMgdXNlZCBqdXN0IHRvIGVtcGhhc2l6ZSB0aGUgbWVhbmluZyBvZiB0aGUgdmFsdWUuXG4gICAgICogT3RoZXJ3aXNlIHdlIGNvdWxkIGp1c3QgdXNlIHR5cGVvZiBpZCA9PT0gXCJudW1iZXJcIiBkaXJlY3RseS5cbiAgICAgKi9cbiAgICBleHBvcnQgZnVuY3Rpb24gaXNMaXN0ZW5lcklkKGlkOiBhbnkpIHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBpZCA9PT0gXCJudW1iZXJcIjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgZnVsbCBjb25maWd1cmF0aW9uIGZvciBhIHNwZWNpZmljIGxpc3RlbmVyLiBJdCBjb250cm9scyB0aGUgd2F5XG4gICAgICogdGhlIHJlbGV2YW50IGV2ZW50LWhhbmRsZXIgZnVuY3Rpb24gaXMgaW52b2tlZC5cbiAgICAgKi9cbiAgICBleHBvcnQgaW50ZXJmYWNlIEhhbmRsZXJPcHRpb25zPFQ+IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBhY3R1YWwgaGFuZGxlciBmdW5jdGlvbiB0byBiZSBjYWxsZWQgd2hlbiB0aGUgZXZlbnQgb2NjdXJzLlxuICAgICAgICAgKi9cbiAgICAgICAgaGFuZGxlcjogRXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJZiB0aGlzIGZsYWcgaXMgc2V0IC0gdGhlIGV2ZW50IGhhbmRsZXIgd2lsbCByZW1vdmUgaXRzZWxmIGZyb21cbiAgICAgICAgICogdGhlIGV2ZW50IGFmdGVyIGZpcnN0IGludm9jYXRpb24uXG4gICAgICAgICAqL1xuICAgICAgICBvbmNlPzogYm9vbGVhbjtcblxuICAgICAgICAvKipcbiAgICAgICAgICogSWYgdGhpcyBmaWVsZCBpcyBzcGVjaWZpZWQsIHRoZW4gaGFuZGxlciB3aWxsIGJlIGNhbGxlZCB3aXRoIHRoYXQgY29udGV4dC5cbiAgICAgICAgICovXG4gICAgICAgIGNvbnRleHQ/OiBPYmplY3Q7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEFsd2F5cyB1c2VkIGluIGNvbWJpbmF0aW9uIHdpdGggZm9sbG93aW5nIHBhcmFtZXRlciAnbWF0Y2hWYWx1ZScgYW5kIGlzIGFcbiAgICAgICAgICogZmxhZywgd2hpY2ggbWVhbnMoaWYgc2V0KSB0aGF0IG9ubHkgZXZlbnQgaW52b2NhdGlvbnMgd2l0aCBhcmd1bWVudCBtYXRjaGluZ1xuICAgICAgICAgKiAnbWF0Y2hWYWx1ZScgc2hvdWxkIGJlIHBhc3NlZCB0byB0aGUgaGFuZGxlciBmdW5jdGlvbi5cbiAgICAgICAgICpcbiAgICAgICAgICogV2hhdCBcIm1hdGNoaW5nXCIgbWVhbnMgaXMgbm90IGRvY3VtZW50ZWQgd2VsbCB5ZXQgc2luY2UgaXQgaXMgc3ViamVjdCB0byBjaGFuZ2UuXG4gICAgICAgICAqIEZvciBub3cgeW91IG1heSBhc3N1bWUgdGhhdCBmb3IgcGxhaW4gdHlwZXMgKGJvb2xlYW4sIG51bWJlciwgc3RyaW5nKSBpdCBpc1xuICAgICAgICAgKiBzdHJpY3QgZXF1YWxpdHkuXG4gICAgICAgICAqL1xuICAgICAgICBvbmx5TWF0Y2hpbmc/OiBib29sZWFuO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgdmFsdWUsIHRvIGJlIG1hdGNoZWQgaWYgdGhlICdvbmx5TWF0Y2hpbmcnIGZsYWcgaXMgc2V0LlxuICAgICAgICAgKi9cbiAgICAgICAgbWF0Y2hWYWx1ZT86IFR8UmVnRXhwO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoaXMgaXMgdGhlIG9iamVjdCB3aGljaCByZXByZXNlbnRzIGFuIGV4aXN0aW5nIGhhbmRsZXIgaW50ZXJuYWxseSBpbiBFdmVudFByb3BlcnR5IG9iamVjdC5cbiAgICAgKlxuICAgICAqIEV2ZW50UHJvcGVydHkgc3RvcmVzIGxpc3RlbmVycyBhcyBIYW5kbGVyT3B0aW9ucyArIGxpc3RlbmVySWQuXG4gICAgICovXG4gICAgZXhwb3J0IGludGVyZmFjZSBIYW5kbGVyRGVzY3JpcHRvcjxUPiBleHRlbmRzIEhhbmRsZXJPcHRpb25zPFQ+IHtcbiAgICAgICAgaWQ6IExpc3RlbmVySWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQW4gRXZlbnRQcm9wZXJ0eSBpbnRlcmZhY2Ugd2l0aG91dCB0aGUgJ2VtaXQnIG1ldGhvZC5cbiAgICAgKlxuICAgICAqIEl0IGlzIGEgZ29vZCBwcmFjdGljZSB0byBwcm92aWRlIHB1YmxpYyBhY2Nlc3MgdG8gRXZlbnRQcm9wZXJ0aWVzIGluIHRoaXMgZm9ybVxuICAgICAqIGFuZCBub3QgaW4gdGhlIG9yaWdpbmFsIEV2ZW50UHJvcGVydHkgZm9ybS5cbiAgICAgKiBFdmVudFByb3BlcnR5IHVzdWFsIHJlbGF0ZXMgdG8gc29tZSBjbGFzcyBhbmQgb25seSB0aGF0IGNsYXNzIHNob3VsZCBiZSBhYmxlIHRvXG4gICAgICogdHJpZ2dlci9lbWl0IHRoZSBldmVudC4gT24gdGhlIG90aGVyIGhhbmQgYW55b25lIHNob3VsZCBiZSBhYmxlIHRvIGxpc3RlbiB0byB0aGlzXG4gICAgICogZXZlbnQuIFRoaXMgbGlicmFyeSBvZmZlcnMgc3BlY2lhbCBpbnRlcmZhY2UgZm9yIHRoaXMgcHVycG9zZSBhbmQgYSBmZXcgdXRpbGl0eVxuICAgICAqIGZ1bmN0aW9ucyAobWFrZSwgc3BsaXQuIHNwbGl0Vm9pZCkuXG4gICAgICpcbiAgICAgKiBUaGUgaWRlYSBpcyB0byBjcmVhdGUgYSBwcml2YXRlIEV2ZW50UHJvcGVydHkgbWVtYmVyIGFuZCBwdWJsaWNcbiAgICAgKiBFdmVudFByb3BlcnR5LkVtaXR0ZXIgZ2V0dGVyIHdoaWNoIHJldHVybiB0aGF0IHByaXZhdGUgbWVtYmVyLlxuICAgICAqIFlvdSBkb24ndCBoYXZlIHRvIGRvIGl0IGlmIHlvdSB0aGluayBpdCdzIHRvbyBjdW1iZXJzb21lIHRob3VnaC5cbiAgICAgKi9cbiAgICBleHBvcnQgaW50ZXJmYWNlIEVtaXR0ZXI8VD4ge1xuICAgICAgICAvKipcbiAgICAgICAgICogQWRkcyBhIGxpc3RlbmVyIGZvciB0aGlzIGV2ZW50IHR5cGUuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7RXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+fSBoYW5kbGVyIC0gY2FsbGJhY2sgdG8gYmUgY2FsbGVkIHdoZW4gYW4gZXZlbnQgaXMgZW1pdHRlZFxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gW2NvbnRleHRdIC0gY29udGV4dCB0byBiZSB1c2VkIHdoZW4gY2FsbGluZyBoYW5kbGVyLiBudWxsIGJ5IGRlZmF1bHQuXG4gICAgICAgICAqIEByZXR1cm5zIHtFdmVudFByb3BlcnR5Lkxpc3RlbmVySWR9IC0gbnVtYmVyLCBpZGVudGlmeWluZyBuZXcgZXZlbnQgbGlzdGVuZXIuXG4gICAgICAgICAqL1xuICAgICAgICBvbihoYW5kbGVyOiBFdmVudFByb3BlcnR5LkhhbmRsZXI8VD4sIGNvbnRleHQ/OiBPYmplY3QpOiBMaXN0ZW5lcklkO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBZGRzIGEgbGlzdGVuZXIgZm9yIHRoaXMgZXZlbnQgdHlwZS4gVGhpcyBsaXN0ZW5lciB3aWxsIGJlIGltbWVkaWF0ZWx5IHJlbW92ZWQgYWZ0ZXIgaXQnc1xuICAgICAgICAgKiBpbnZva2VkIGZvciB0aGUgZmlyc3QgdGltZS5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtFdmVudFByb3BlcnR5LkhhbmRsZXI8VD59IGhhbmRsZXIgLSBjYWxsYmFjayB0byBiZSBjYWxsZWQgd2hlbiBhbiBldmVudCBpcyBlbWl0dGVkXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbY29udGV4dF0gLSBjb250ZXh0IHRvIGJlIHVzZWQgd2hlbiBjYWxsaW5nIGhhbmRsZXIuIG51bGwgYnkgZGVmYXVsdC5cbiAgICAgICAgICogQHJldHVybnMge0V2ZW50UHJvcGVydHkuTGlzdGVuZXJJZH0gLSBudW1iZXIsIGlkZW50aWZ5aW5nIG5ldyBldmVudCBsaXN0ZW5lci5cbiAgICAgICAgICovXG4gICAgICAgIG9uY2UoaGFuZGxlcjogRXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+LCBjb250ZXh0PzogT2JqZWN0KTogTGlzdGVuZXJJZDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQWRkcyBhIGxpc3RlbmVyIGZvciB0aGlzIGV2ZW50IHR5cGUuIFRoaXMgbGlzdGVuZXIgd2lsbCBiZSBjYWxsZWQgb25seSBpZiBldmVudCBhcmd1bWVudFxuICAgICAgICAgKiBtYXRjaGVzIGdpdmVuIHZhbHVlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBOb3RlOiB3aGF0IFwibWF0Y2hpbmdcIiBtZWFucyBpcyBub3QgZG9jdW1lbnRlZCB3ZWxsIHlldCBzaW5jZSBpdCBpcyBzdWJqZWN0IHRvIGNoYW5nZS5cbiAgICAgICAgICogRm9yIG5vdyB5b3Ugc2hvdWxkIGFzc3VtZSB0aGF0IGZvciBwbGFpbiB0eXBlcyAoYm9vbGVhbiwgbnVtYmVyLCBzdHJpbmcpIGl0IGlzXG4gICAgICAgICAqIHN0cmljdCBlcXVhbGl0eS4gRm9yIG9iamVjdHMgaXQgaXMgbGlrZSBkZWVwIHN0cmljdCBlcXVhbGl0eSBleGNlcHQgdGhhdCBhY3R1YWxcbiAgICAgICAgICogZXZlbnQgYXJndW1lbnQgbWF5IGhhdmUgbW9yZSBmaWVsZHMgdGhhbiBtYXRjaC12YWx1ZShwcm90bykuIEJ1dCBhbGwgZmllbGRzIGZyb21cbiAgICAgICAgICogbWF0Y2gtdmFsdWUgbXVzdCBiZSBwcmVzZW50IGluIGV2ZW50IGFyZ3VtZW50LlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge1R8UmVnRXhwfSB2YWx1ZSAtIGhhbmRsZXIgaXMgaW52b2tlZCBvbmx5IGlmIGV2ZW50IGFyZ3VtZW50IG1hdGNoZXMgdGhpcyB2YWx1ZVxuICAgICAgICAgKiBAcGFyYW0ge0V2ZW50UHJvcGVydHkuSGFuZGxlcjxUPn0gaGFuZGxlciAtIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCB3aGVuIGFuIGV2ZW50IGlzIGVtaXR0ZWRcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IFtjb250ZXh0XSAtIGNvbnRleHQgdG8gYmUgdXNlZCB3aGVuIGNhbGxpbmcgaGFuZGxlci4gbnVsbCBieSBkZWZhdWx0LlxuICAgICAgICAgKiBAcmV0dXJucyB7RXZlbnRQcm9wZXJ0eS5MaXN0ZW5lcklkfSAtIG51bWJlciwgaWRlbnRpZnlpbmcgbmV3IGV2ZW50IGxpc3RlbmVyLlxuICAgICAgICAgKi9cbiAgICAgICAgbWF0Y2godmFsdWU6IFR8UmVnRXhwLCBoYW5kbGVyOiBFdmVudFByb3BlcnR5LkhhbmRsZXI8VD4sIGNvbnRleHQ/OiBPYmplY3QpOiBMaXN0ZW5lcklkO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBZGRzIGEgbGlzdGVuZXIgZm9yIHRoaXMgZXZlbnQgdHlwZS4gVGhpcyBsaXN0ZW5lciB3aWxsIGJlIGludm9rZWQgb25seSBpZiBldmVudCBhcmd1bWVudFxuICAgICAgICAgKiBtYXRjaGVzIGdpdmVuIHZhbHVlLiBUaGlzIGxpc3RlbmVyIHdpbGwgYmUgaW1tZWRpYXRlbHkgcmVtb3ZlZCBhZnRlciBpdCdzIGludm9rZWRcbiAgICAgICAgICogZm9yIHRoZSBmaXJzdCB0aW1lLlxuICAgICAgICAgKlxuICAgICAgICAgKiBOb3RlOiB3aGF0IFwibWF0Y2hpbmdcIiBtZWFucyBpcyBub3QgZG9jdW1lbnRlZCB3ZWxsIHlldCBzaW5jZSBpdCBpcyBzdWJqZWN0IHRvIGNoYW5nZS5cbiAgICAgICAgICogRm9yIG5vdyB5b3Ugc2hvdWxkIGFzc3VtZSB0aGF0IGZvciBwbGFpbiB0eXBlcyAoYm9vbGVhbiwgbnVtYmVyLCBzdHJpbmcpIGl0IGlzXG4gICAgICAgICAqIHN0cmljdCBlcXVhbGl0eS4gRm9yIG9iamVjdHMgaXQgaXMgbGlrZSBkZWVwIHN0cmljdCBlcXVhbGl0eSBleGNlcHQgdGhhdCBhY3R1YWxcbiAgICAgICAgICogZXZlbnQgYXJndW1lbnQgbWF5IGhhdmUgbW9yZSBmaWVsZHMgdGhhbiBtYXRjaC12YWx1ZShwcm90bykuIEJ1dCBhbGwgZmllbGRzIGZyb21cbiAgICAgICAgICogbWF0Y2gtdmFsdWUgbXVzdCBiZSBwcmVzZW50IGluIGV2ZW50IGFyZ3VtZW50LlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge1R8UmVnRXhwfSB2YWx1ZSAtIGhhbmRsZXIgaXMgaW52b2tlZCBvbmx5IGlmIGV2ZW50IGFyZ3VtZW50IG1hdGNoZXMgdGhpcyB2YWx1ZVxuICAgICAgICAgKiBAcGFyYW0ge0V2ZW50UHJvcGVydHkuSGFuZGxlcjxUPn0gaGFuZGxlciAtIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCB3aGVuIGFuIGV2ZW50IGlzIGVtaXR0ZWRcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IFtjb250ZXh0XSAtIGNvbnRleHQgdG8gYmUgdXNlZCB3aGVuIGNhbGxpbmcgaGFuZGxlci4gbnVsbCBieSBkZWZhdWx0LlxuICAgICAgICAgKiBAcmV0dXJucyB7RXZlbnRQcm9wZXJ0eS5MaXN0ZW5lcklkfSAtIG51bWJlciwgaWRlbnRpZnlpbmcgbmV3IGV2ZW50IGxpc3RlbmVyLlxuICAgICAgICAgKi9cbiAgICAgICAgbWF0Y2hPbmNlKHZhbHVlOiBUfFJlZ0V4cCwgaGFuZGxlcjogRXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+LCBjb250ZXh0PzogT2JqZWN0KTogTGlzdGVuZXJJZDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogXCJQaXBlc1wiIEV2ZW50UHJvcGVydHkgdG8gb3RoZXIgRXZlbnRQcm9wZXJ0eS4gVGhpcyBtZWFucyB0aGF0IHdoZW5ldmVyIHRoaXMgZXZlbnRcbiAgICAgICAgICogaXMgZW1pdHRlZCBpdCBpcyBwYXNzZWQgdG8gdGhhdCBvdGhlciBFdmVudFByb3BlcnR5IHdoaWNoIGVtaXRzIGl0IHRvby5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtFdmVudFByb3BlcnR5PFQ+fSBvdGhlclxuICAgICAgICAgKiBAcmV0dXJucyB7RXZlbnRQcm9wZXJ0eS5MaXN0ZW5lcklkfVxuICAgICAgICAgKi9cbiAgICAgICAgcGlwZShvdGhlcjogRXZlbnRQcm9wZXJ0eTxUPik6IEV2ZW50UHJvcGVydHkuTGlzdGVuZXJJZDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogUGlwZSBvbmx5IGV2ZW50cyB3aXRoIG1hdGNoaW5nIGFyZ3VtZW50IHRvIGRlc3RpbmF0aW9uIEV2ZW50UHJvcGVydHkuXG4gICAgICAgICAqXG4gICAgICAgICAqIE5vdGU6IHdoYXQgXCJtYXRjaGluZ1wiIG1lYW5zIGlzIG5vdCBkb2N1bWVudGVkIHdlbGwgeWV0IHNpbmNlIGl0IGlzIHN1YmplY3QgdG8gY2hhbmdlLlxuICAgICAgICAgKiBGb3Igbm93IHlvdSBzaG91bGQgYXNzdW1lIHRoYXQgZm9yIHBsYWluIHR5cGVzIChib29sZWFuLCBudW1iZXIsIHN0cmluZykgaXQgaXNcbiAgICAgICAgICogc3RyaWN0IGVxdWFsaXR5LiBGb3Igb2JqZWN0cyBpdCBpcyBsaWtlIGRlZXAgc3RyaWN0IGVxdWFsaXR5IGV4Y2VwdCB0aGF0IGFjdHVhbFxuICAgICAgICAgKiBldmVudCBhcmd1bWVudCBtYXkgaGF2ZSBtb3JlIGZpZWxkcyB0aGFuIG1hdGNoLXZhbHVlKHByb3RvKS4gQnV0IGFsbCBmaWVsZHMgZnJvbVxuICAgICAgICAgKiBtYXRjaC12YWx1ZSBtdXN0IGJlIHByZXNlbnQgaW4gZXZlbnQgYXJndW1lbnQuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7VHxSZWdFeHB9IG1hdGNoVmFsdWUgLSB2YWx1ZSB0byBtYXRjaFxuICAgICAgICAgKiBAcGFyYW0ge0V2ZW50UHJvcGVydHk8VD59IGRlc3RpbmF0aW9uIC0gdGFyZ2V0IEV2ZW50UHJvcGVydHlcbiAgICAgICAgICogQHJldHVybnMge0V2ZW50UHJvcGVydHkuTGlzdGVuZXJJZH1cbiAgICAgICAgICovXG4gICAgICAgIHJvdXRlKG1hdGNoVmFsdWU6IFR8UmVnRXhwLCBkZXN0aW5hdGlvbjogRXZlbnRQcm9wZXJ0eTxUPik6IEV2ZW50UHJvcGVydHkuTGlzdGVuZXJJZDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmV0dXJucyBhIHByb21pc2Ugd2hpY2ggaXMgcmVzb2x2ZWQgbmV4dCB0aW1lIHRoaXMgZXZlbnQgaXMgZW1pdHRlZC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHJldHVybnMge1Byb21pc2U8VD59XG4gICAgICAgICAqL1xuICAgICAgICBuZXh0KCk6IFByb21pc2U8VD47XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFN0b3JlcyBwcm9taXNlIHdoaWNoIGlzIHJlc29sdmVkIHdoZW4gdGhpcyBldmVudCBpcyBlbWl0dGVkIGZvciB0aGUgZmlyc3QgdGltZS5cbiAgICAgICAgICpcbiAgICAgICAgICogQHR5cGUge1Byb21pc2U8VD59XG4gICAgICAgICAqL1xuICAgICAgICBmaXJzdDogUHJvbWlzZTxUPjtcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVtb3ZlcyBhbGwgbGlzdGVuZXJzIHRoYXQgd2VyZSBhdHRhY2hlZCB3aXRoIGdpdmVuIGhhbmRsZXIgYW5kIHdpdGhvdXQgYSBjb250ZXh0LlxuICAgICAgICAgKiBOb3RlOiBpdCB3aWxsIG5ldmVyIHJlbW92ZSBhbnkgbGlzdGVuZXIgdGhhdCB3YXMgYXR0YWNoZWQgd2l0aCBhIGNvbnRleHQuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7RXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+fSBoYW5kbGVyIC0gcmVtb3ZlIGxpc3RlbmVycyBoYXZpbmcgdGhpcyBoYW5kbGVyXG4gICAgICAgICAqL1xuICAgICAgICBvZmYoaGFuZGxlcjogRXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+KTogdm9pZDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVtb3ZlcyBsaXN0ZW5lcnMgdGhhdCB3ZXJlIGF0dGFjaGVkIHdpdGggZ2l2ZW4gaGFuZGxlciBhbmQgY29udGV4dC5cbiAgICAgICAgICogTm90ZTogaXQgd2lsbCBuZXZlciByZW1vdmUgYW55IGxpc3RlbmVyIHRoYXQgd2FzIGF0dGFjaGVkIHdpdGhvdXQgYSBjb250ZXh0LlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge0V2ZW50UHJvcGVydHkuSGFuZGxlcjxUPn0gaGFuZGxlciAtIHJlbW92ZSBsaXN0ZW5lcnMgaGF2aW5nIHRoaXMgaGFuZGxlclxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gW2NvbnRleHRdIC0gcmVtb3ZlIG9ubHkgbGlzdGVuZXJzIGhhdmluZyB0aGlzIGNvbnRleHRcbiAgICAgICAgICovXG4gICAgICAgIG9mZihoYW5kbGVyOiBFdmVudFByb3BlcnR5LkhhbmRsZXI8VD4sIGNvbnRleHQ6IE9iamVjdCk6IHZvaWQ7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlbW92ZXMgYWxsIGxpc3RlbmVycyBoYXZpbmcgdGhpcyBjb250ZXh0XG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBjb250ZXh0XG4gICAgICAgICAqL1xuICAgICAgICBvZmYoY29udGV4dDogT2JqZWN0KTogdm9pZDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVtb3ZlcyBsaXN0ZW5lciB3aXRoIGdpdmVuIGlkLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge0V2ZW50UHJvcGVydHkuTGlzdGVuZXJJZH0gaWRcbiAgICAgICAgICovXG4gICAgICAgIG9mZihpZDogRXZlbnRQcm9wZXJ0eS5MaXN0ZW5lcklkKTogdm9pZDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVtb3ZlIHBpcGVzIGNyZWF0ZWQgZm9yIG90aGVyIEV2ZW50UHJvcGVydHkuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7RXZlbnRQcm9wZXJ0eX0gZGVzdGluYXRpb25cbiAgICAgICAgICovXG4gICAgICAgIG9mZihkZXN0aW5hdGlvbjogRXZlbnRQcm9wZXJ0eTxUPik6IHZvaWQ7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlbW92ZSBhbGwgbGlzdGVuZXJzLlxuICAgICAgICAgKi9cbiAgICAgICAgb2ZmKCk6IHZvaWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIHBhaXI6IGFuIEV2ZW50UHJvcGVydHkgaW5zdGFuY2UgdG8gYmUgdXNlZCBpbnRlcm5hbGx5IGluIGEgY2xhc3NcbiAgICAgKiBhbmQgYW4gRW1pdHRlci1pbnRlcmZhY2UgdG8gYmUgdXNlZCBhcyBwdWJsaWMgLyBhY2Nlc3NpYmxlIHByb3BlcnR5LlxuICAgICAqIFRoZXkgYm90aCBhY3R1YWxseSByZXByZXNlbnQgdGhlIHNhbWUgRXZlbnRQcm9wZXJ0eSBvYmplY3QuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7W0V2ZW50UHJvcGVydHksRXZlbnRQcm9wZXJ0eS5FbWl0dGVyPFQ+XX1cbiAgICAgKi9cbiAgICBleHBvcnQgZnVuY3Rpb24gbWFrZTxUPigpOiBbRXZlbnRQcm9wZXJ0eTxUPiwgRXZlbnRQcm9wZXJ0eS5FbWl0dGVyPFQ+XSB7XG4gICAgICAgIGxldCBldmVudFByb3AgPSBuZXcgRXZlbnRQcm9wZXJ0eTxUPigpO1xuICAgICAgICByZXR1cm4gW2V2ZW50UHJvcCwgPEV2ZW50UHJvcGVydHkuRW1pdHRlcjxUPj5ldmVudFByb3BdO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW4gRXZlbnRQcm9wZXJ0eSBvYmplY3QgYW5kIHNwbGl0cyBpdCBpbnRvIGVtaXR0ZXItZnVuY3Rpb24gYW5kXG4gICAgICogRW1pdHRlci1pbnRlcmZhY2UuIFVzZSBlbWl0dGVyIGZ1bmN0aW9uIHRvIGVtaXQgdGhlIGV2ZW50IGFuZCBFbWl0dGVyLWludGVyZmFjZVxuICAgICAqIHRvIGFkZCBhbmQgcmVtb3ZlIGxpc3RlbmVycyBvZiB0aGF0IGV2ZW50LlxuICAgICAqXG4gICAgICogQHJldHVybnMge1tFdmVudFByb3BlcnR5LkVtaXRNZXRob2Q8VD4sRXZlbnRQcm9wZXJ0eS5FbWl0dGVyPFQ+XX1cbiAgICAgKi9cbiAgICBleHBvcnQgZnVuY3Rpb24gc3BsaXQ8VD4oKTogW0V2ZW50UHJvcGVydHkuRW1pdE1ldGhvZDxUPiwgRXZlbnRQcm9wZXJ0eS5FbWl0dGVyPFQ+XSB7XG4gICAgICAgIGxldCBldmVudFByb3AgPSBuZXcgRXZlbnRQcm9wZXJ0eTxUPigpO1xuICAgICAgICByZXR1cm4gW2V2ZW50UHJvcC5lbWl0LCA8RXZlbnRQcm9wZXJ0eS5FbWl0dGVyPFQ+PmV2ZW50UHJvcF07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbiBFdmVudFByb3BlcnR5IG9iamVjdCBhbmQgc3BsaXRzIGl0IGludG8gZW1pdHRlci1mdW5jdGlvbiBhbmRcbiAgICAgKiBFbWl0dGVyLWludGVyZmFjZS4gU3BlY2lhbCB2ZXJzaW9uIGZvciB2b2lkLXR5cGVkIGV2ZW50cy5cbiAgICAgKi9cbiAgICBleHBvcnQgZnVuY3Rpb24gc3BsaXRWb2lkKCk6IFtFdmVudFByb3BlcnR5LlZvaWRFbWl0TWV0aG9kLCBFdmVudFByb3BlcnR5LkVtaXR0ZXI8dm9pZD5dIHtcbiAgICAgICAgbGV0IGV2ZW50UHJvcCA9IG5ldyBFdmVudFByb3BlcnR5LlZvaWQoKTtcbiAgICAgICAgbGV0IGVtaXR0ZXIgPSA8RXZlbnRQcm9wZXJ0eS5FbWl0dGVyPHZvaWQ+PmV2ZW50UHJvcDtcbiAgICAgICAgcmV0dXJuIFtldmVudFByb3AuZW1pdCwgZW1pdHRlcl07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU3BlY2lhbCBzdWJjbGFzcyBvZiBFdmVudFByb3BlcnR5IGZvciB2b2lkIHR5cGUgLSBhbGxvd3MgY2FsbGluZyBlbWl0IHdpdGhvdXQgYXJndW1lbnRzLlxuICAgICAqL1xuICAgIGV4cG9ydCBjbGFzcyBWb2lkIGV4dGVuZHMgRXZlbnRQcm9wZXJ0eTx2b2lkPiB7XG4gICAgICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBFbWl0cyBhbiBldmVudCBpbnZva2luZyBhbGwgbGlzdGVuZXJzLlxuICAgICAgICAgKi9cbiAgICAgICAgZW1pdCgpIHsgcmV0dXJuIHN1cGVyLmVtaXQodm9pZCAwKTsgfVxuICAgIH1cbn1cblxuXG4vKipcbiAqIFVzZWQgaW4gRXZlbnRQcm9wZXJ0eS5tYXRjaC9tYXRjaE9uY2Uvcm91dGUgbWV0aG9kcyB0byBjb21wYXJlIGV2ZW50IGFyZ3VtZW50IHdpdGggZ2l2ZW4gdmFsdWUuXG4gKiBOb3RlOiBzdWJqZWN0IHRvIGNoYW5nZS5cbiAqXG4gKiBAcGFyYW0ge2FueX0gc3ViamVjdCAtIGFjdHVhbCBldmVudCBhcmd1bWVudFxuICogQHBhcmFtIHthbnl9IHByb3RvIC0gdmFsdWUgdG8gbWF0Y2hcbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG5mdW5jdGlvbiBvYmplY3RNYXRjaChzdWJqZWN0OiBhbnksIHByb3RvOiBhbnkpOiBib29sZWFuIHtcbiAgICByZXR1cm4gX29iamVjdE1hdGNoKHN1YmplY3QsIHByb3RvKTtcbn1cblxuZnVuY3Rpb24gX29iamVjdE1hdGNoKHN1YmplY3Q6IGFueSwgcHJvdG86IGFueSwgdHJhdmVyc2FsU3RhY2s6IGFueVtdID0gW10pOiBib29sZWFuIHtcbiAgICBzd2l0Y2ggKHR5cGVvZiBwcm90bykge1xuICAgICAgICBjYXNlIFwidW5kZWZpbmVkXCI6IHJldHVybiBzdWJqZWN0ID09PSB1bmRlZmluZWQ7XG4gICAgICAgIGNhc2UgXCJudW1iZXJcIjpcbiAgICAgICAgY2FzZSBcImJvb2xlYW5cIjpcbiAgICAgICAgY2FzZSBcInN0cmluZ1wiOlxuICAgICAgICBjYXNlIFwiZnVuY3Rpb25cIjpcbiAgICAgICAgICAgIHJldHVybiBzdWJqZWN0ID09PSBwcm90bztcbiAgICAgICAgY2FzZSBcIm9iamVjdFwiOlxuICAgICAgICAgICAgbGV0IGlzTWF0Y2hpbmcgPSB0cnVlO1xuXG4gICAgICAgICAgICBpZiAodHJhdmVyc2FsU3RhY2subGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgaWYgKCh0eXBlb2Ygc3ViamVjdCA9PT0gXCJzdHJpbmdcIikgJiYgKHByb3RvIGluc3RhbmNlb2YgUmVnRXhwKSkge1xuICAgICAgICAgICAgICAgICAgICBpc01hdGNoaW5nID0gcHJvdG8udGVzdChzdWJqZWN0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2Ygc3ViamVjdCAhPT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgICAgICAgICBpc01hdGNoaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFwcm90byB8fCAhc3ViamVjdClcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzTWF0Y2hpbmcgPSAhc3ViamVjdCAmJiAhcHJvdG87XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHRyYXZlcnNhbFN0YWNrLmluY2x1ZGVzKHN1YmplY3QpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJSZWN1cnNpb24hXCIpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQga2V5IGluIHByb3RvKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb3RvLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhdmVyc2FsU3RhY2sucHVzaChzdWJqZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNNYXRjaGluZyA9IGlzTWF0Y2hpbmcgJiYgX29iamVjdE1hdGNoKHN1YmplY3Rba2V5XSwgcHJvdG9ba2V5XSwgdHJhdmVyc2FsU3RhY2spO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmF2ZXJzYWxTdGFjay5wb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gaXNNYXRjaGluZztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgVW5leHBlY3RlZCB0eXBlb2Y6ICR7dHlwZW9mIHByb3RvfWApO1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgRXZlbnRQcm9wZXJ0eTsiXX0=