/// <reference path="../typings/index.d.ts"/>
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Represents a certain type of events.
 * Provides methods to observe and to trigger(emit) events of that type.
 */
class EventProperty {
    constructor() {
        this.listeners = [];
        this.initHandlers = [];
        this.idCounter = 0;
        this.emit = this.emit.bind(this);
    }
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
        let resolveFirstTimeTrigger = false;
        let toInvoke;
        if (!this.isInitialized) {
            let initHandlers = this.initHandlers;
            this.initHandlers = null;
            this.initArg = eventArg;
            initHandlers.forEach(([handler, context]) => {
                handler.call(context || null, this.initArg);
            });
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
     *
     * @param {EventProperty.Handler<T>} handler - callback to be invoked when event is emitted first time
     * @param {Object} [context] - handler will be invoked in this context
     */
    init(handler, context) {
        if (this.isInitialized) {
            handler.call(context || null, this.initArg);
        }
        else {
            this.initHandlers.push([handler, context || null]);
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvZXZlbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsNkNBQTZDOztBQUU3Qzs7O0dBR0c7QUFDSDtJQVVJO1FBVFEsY0FBUyxHQUF5QyxFQUFFLENBQUM7UUFHckQsaUJBQVksR0FBeUMsRUFBRSxDQUFDO1FBR3hELGNBQVMsR0FBNkIsQ0FBQyxDQUFDO1FBSzVDLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDckMsQ0FBQztJQVJELElBQUksYUFBYSxLQUFjLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUM7SUFVbkU7Ozs7O09BS0c7SUFFSDs7OztPQUlHO0lBQ0gsSUFBSSxDQUFDLFFBQVc7UUFDWixJQUFJLHVCQUF1QixHQUFZLEtBQUssQ0FBQztRQUM3QyxJQUFJLFFBQThDLENBQUM7UUFFbkQsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztZQUN0QixJQUFJLFlBQVksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDO1lBQ3JDLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO1lBQ3pCLElBQUksQ0FBQyxPQUFPLEdBQUcsUUFBUSxDQUFDO1lBQ3hCLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQXFDO2dCQUN4RSxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sSUFBSSxJQUFJLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2hELENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQztRQUVELFFBQVEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLFFBQTRDO1lBQ2xGLElBQUksWUFBWSxHQUFHLENBQUMsUUFB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LENBQUMsQ0FBQyxJQUFJLEdBQUcsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDOzRCQUNwQixFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQ0FDNUIsY0FBYyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztnQ0FDN0IsVUFBVSxHQUFHLFVBQVUsSUFBSSxZQUFZLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQztnQ0FDbEYsY0FBYyxDQUFDLEdBQUcsRUFBRSxDQUFDOzRCQUN6QixDQUFDO3dCQUNMLENBQUM7b0JBQ0wsQ0FBQztnQkFDTCxDQUFDO1lBQ0wsQ0FBQztZQUNELE1BQU0sQ0FBQyxVQUFVLENBQUM7UUFDdEI7WUFDSSxNQUFNLElBQUksS0FBSyxDQUFDLHNCQUFzQixPQUFPLEtBQUssRUFBRSxDQUFDLENBQUM7SUFDOUQsQ0FBQztBQUNMLENBQUM7QUFFRCxrQkFBZSxhQUFhLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vdHlwaW5ncy9pbmRleC5kLnRzXCIvPlxuXG4vKipcbiAqIFJlcHJlc2VudHMgYSBjZXJ0YWluIHR5cGUgb2YgZXZlbnRzLlxuICogUHJvdmlkZXMgbWV0aG9kcyB0byBvYnNlcnZlIGFuZCB0byB0cmlnZ2VyKGVtaXQpIGV2ZW50cyBvZiB0aGF0IHR5cGUuXG4gKi9cbmV4cG9ydCBjbGFzcyBFdmVudFByb3BlcnR5PFQ+IGltcGxlbWVudHMgRXZlbnRQcm9wZXJ0eS5FbWl0dGVyPFQ+IHtcbiAgICBwcml2YXRlIGxpc3RlbmVyczogRXZlbnRQcm9wZXJ0eS5IYW5kbGVyRGVzY3JpcHRvcjxUPltdID0gW107XG5cbiAgICBwcml2YXRlIGluaXRBcmc6IFQ7XG4gICAgcHJpdmF0ZSBpbml0SGFuZGxlcnM6IFtFdmVudFByb3BlcnR5LkhhbmRsZXI8VD4sIE9iamVjdF1bXSA9IFtdO1xuICAgIGdldCBpc0luaXRpYWxpemVkKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5pbml0SGFuZGxlcnMgPT09IG51bGw7IH1cblxuICAgIHByaXZhdGUgaWRDb3VudGVyOiBFdmVudFByb3BlcnR5Lkxpc3RlbmVySWQgPSAwO1xuXG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcblxuICAgICAgICB0aGlzLmVtaXQgPSB0aGlzLmVtaXQuYmluZCh0aGlzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIHR5cGVkZWYgaXMgdXNlZCB0byBkZXNjcmliZSB0eXBlLXBhcmFtZXRlciBUIGZvciBqc2RvYyBwYXJzZXIuXG4gICAgICpcbiAgICAgKiBAdHlwZWRlZiB7YW55fSBUO1xuICAgICAqIEBwcml2YXRlXG4gICAgICovXG5cbiAgICAvKipcbiAgICAgKiBFbWl0cyBldmVudCB3aXRoIGdpdmVuIGFyZ3VtZW50LiBUaGlzIGludm9rZXMgYWxsIGFwcHJvcHJpYXRlIGhhbmRsZXJzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtUfSBldmVudEFyZyAtIGV2ZW50IGFyZ3VtZW50LCBpdCdzIHBhc3NlZCB0byBlYWNoIGV2ZW50IGhhbmRsZXIuXG4gICAgICovXG4gICAgZW1pdChldmVudEFyZzogVCk6IHZvaWQge1xuICAgICAgICBsZXQgcmVzb2x2ZUZpcnN0VGltZVRyaWdnZXI6IGJvb2xlYW4gPSBmYWxzZTtcbiAgICAgICAgbGV0IHRvSW52b2tlOiBFdmVudFByb3BlcnR5LkhhbmRsZXJEZXNjcmlwdG9yPFQ+W107XG5cbiAgICAgICAgaWYgKCF0aGlzLmlzSW5pdGlhbGl6ZWQpIHtcbiAgICAgICAgICAgIGxldCBpbml0SGFuZGxlcnMgPSB0aGlzLmluaXRIYW5kbGVycztcbiAgICAgICAgICAgIHRoaXMuaW5pdEhhbmRsZXJzID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuaW5pdEFyZyA9IGV2ZW50QXJnO1xuICAgICAgICAgICAgaW5pdEhhbmRsZXJzLmZvckVhY2goKFtoYW5kbGVyLCBjb250ZXh0XTogW0V2ZW50UHJvcGVydHkuSGFuZGxlcjxUPiwgT2JqZWN0XSkgPT4ge1xuICAgICAgICAgICAgICAgIGhhbmRsZXIuY2FsbChjb250ZXh0IHx8IG51bGwsIHRoaXMuaW5pdEFyZyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRvSW52b2tlID0gdGhpcy5saXN0ZW5lcnMuc2xpY2UoKS5maWx0ZXIoKGxpc3RlbmVyOiBFdmVudFByb3BlcnR5LkhhbmRsZXJEZXNjcmlwdG9yPFQ+KSA9PiB7XG4gICAgICAgICAgICBsZXQgc2hvdWxkSW52b2tlID0gIWxpc3RlbmVyLm9ubHlNYXRjaGluZyB8fCBvYmplY3RNYXRjaChldmVudEFyZywgbGlzdGVuZXIubWF0Y2hWYWx1ZSk7XG4gICAgICAgICAgICBpZiAobGlzdGVuZXIub25jZSAmJiBzaG91bGRJbnZva2UpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBzaG91bGRJbnZva2U7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRvSW52b2tlLmZvckVhY2goKHtoYW5kbGVyLCBjb250ZXh0fToge2hhbmRsZXI6IEV2ZW50UHJvcGVydHkuSGFuZGxlcjxUPiwgY29udGV4dD86IE9iamVjdH0pID0+IHtcbiAgICAgICAgICAgIGhhbmRsZXIuY2FsbChjb250ZXh0IHx8IG51bGwsIGV2ZW50QXJnKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkcyBhIGxpc3RlbmVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtFdmVudFByb3BlcnR5LkhhbmRsZXI8VD59IGhhbmRsZXIgLSBjYWxsYmFjayB0byBiZSBjYWxsZWQgd2hlbiBhbiBldmVudCBpcyBlbWl0dGVkXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtjb250ZXh0XSAtIGNvbnRleHQgdG8gYmUgdXNlZCB3aGVuIGNhbGxpbmcgaGFuZGxlci4gbnVsbCBieSBkZWZhdWx0LlxuICAgICAqIEByZXR1cm5zIHtFdmVudFByb3BlcnR5Lkxpc3RlbmVySWR9IC0gbnVtYmVyLCBpZGVudGlmeWluZyBuZXcgZXZlbnQgbGlzdGVuZXIuXG4gICAgICovXG4gICAgb24oaGFuZGxlcjogRXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+LCBjb250ZXh0PzogT2JqZWN0KTogRXZlbnRQcm9wZXJ0eS5MaXN0ZW5lcklkIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYWRkTGlzdGVuZXIoeyBoYW5kbGVyLCBjb250ZXh0IH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZHMgYSBsaXN0ZW5lci4gVGhpcyBsaXN0ZW5lciB3aWxsIGJlIGltbWVkaWF0ZWx5IHJlbW92ZWQgYWZ0ZXIgaXQnc1xuICAgICAqIGludm9rZWQgZm9yIHRoZSBmaXJzdCB0aW1lLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtFdmVudFByb3BlcnR5LkhhbmRsZXI8VD59IGhhbmRsZXIgLSBjYWxsYmFjayB0byBiZSBjYWxsZWQgd2hlbiBhbiBldmVudCBpcyBlbWl0dGVkXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtjb250ZXh0XSAtIGNvbnRleHQgdG8gYmUgdXNlZCB3aGVuIGNhbGxpbmcgaGFuZGxlci4gbnVsbCBieSBkZWZhdWx0LlxuICAgICAqIEByZXR1cm5zIHtFdmVudFByb3BlcnR5Lkxpc3RlbmVySWR9IC0gbnVtYmVyLCBpZGVudGlmeWluZyBuZXcgZXZlbnQgbGlzdGVuZXIuXG4gICAgICovXG4gICAgb25jZShoYW5kbGVyOiBFdmVudFByb3BlcnR5LkhhbmRsZXI8VD4sIGNvbnRleHQ6IE9iamVjdCA9IG51bGwpOiBFdmVudFByb3BlcnR5Lkxpc3RlbmVySWQge1xuICAgICAgICByZXR1cm4gdGhpcy5hZGRMaXN0ZW5lcih7IGNvbnRleHQsIGhhbmRsZXIsIG9uY2U6IHRydWUgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkcyBhIGxpc3RlbmVyLiBUaGlzIGxpc3RlbmVyIHdpbGwgYmUgaW52b2tlZCBvbmx5IGlmIGV2ZW50IGFyZ3VtZW50XG4gICAgICogbWF0Y2hlcyBnaXZlbiB2YWx1ZS5cbiAgICAgKlxuICAgICAqIE5vdGU6IHdoYXQgXCJtYXRjaGluZ1wiIG1lYW5zIGlzIG5vdCBkb2N1bWVudGVkIHdlbGwgeWV0IHNpbmNlIGl0IGlzIHN1YmplY3QgdG8gY2hhbmdlLlxuICAgICAqIEZvciBub3cgeW91IHNob3VsZCBhc3N1bWUgdGhhdCBmb3IgcGxhaW4gdHlwZXMgKGJvb2xlYW4sIG51bWJlciwgc3RyaW5nKSBpdCBpc1xuICAgICAqIHN0cmljdCBlcXVhbGl0eS4gRm9yIG9iamVjdHMgaXQgaXMgbGlrZSBkZWVwIHN0cmljdCBlcXVhbGl0eSBleGNlcHQgdGhhdCBhY3R1YWxcbiAgICAgKiBldmVudCBhcmd1bWVudCBtYXkgaGF2ZSBtb3JlIGZpZWxkcyB0aGFuIG1hdGNoLXZhbHVlKHByb3RvKS4gQnV0IGFsbCBmaWVsZHMgZnJvbVxuICAgICAqIG1hdGNoLXZhbHVlIG11c3QgYmUgcHJlc2VudCBpbiBldmVudCBhcmd1bWVudC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7VHxSZWdFeHB9IHZhbHVlIC0gaGFuZGxlciBpcyBpbnZva2VkIG9ubHkgaWYgZXZlbnQgYXJndW1lbnQgbWF0Y2hlcyB0aGlzIHZhbHVlXG4gICAgICogQHBhcmFtIHtFdmVudFByb3BlcnR5LkhhbmRsZXI8VD59IGhhbmRsZXIgLSBjYWxsYmFjayB0byBiZSBjYWxsZWQgd2hlbiBhbiBldmVudCBpcyBlbWl0dGVkXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtjb250ZXh0XSAtIGNvbnRleHQgdG8gYmUgdXNlZCB3aGVuIGNhbGxpbmcgaGFuZGxlci4gbnVsbCBieSBkZWZhdWx0LlxuICAgICAqIEByZXR1cm5zIHtFdmVudFByb3BlcnR5Lkxpc3RlbmVySWR9IC0gbnVtYmVyLCBpZGVudGlmeWluZyBuZXcgZXZlbnQgbGlzdGVuZXIuXG4gICAgICpcbiAgICAgKiBAc2VlIG9iamVjdE1hdGNoXG4gICAgICovXG4gICAgbWF0Y2godmFsdWU6IFR8UmVnRXhwLCBoYW5kbGVyOiBFdmVudFByb3BlcnR5LkhhbmRsZXI8VD4sIGNvbnRleHQ/OiBPYmplY3QpOiBFdmVudFByb3BlcnR5Lkxpc3RlbmVySWQge1xuICAgICAgICByZXR1cm4gdGhpcy5hZGRMaXN0ZW5lcih7IGhhbmRsZXIsIGNvbnRleHQsIG9ubHlNYXRjaGluZzogdHJ1ZSwgbWF0Y2hWYWx1ZTogdmFsdWUgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkcyBhIGxpc3RlbmVyIGZvciB0aGlzIGV2ZW50IHR5cGUuIFRoaXMgbGlzdGVuZXIgd2lsbCBiZSBpbnZva2VkIG9ubHkgaWYgZXZlbnQgYXJndW1lbnRcbiAgICAgKiBtYXRjaGVzIGdpdmVuIHZhbHVlLiBUaGlzIGxpc3RlbmVyIHdpbGwgYmUgaW1tZWRpYXRlbHkgcmVtb3ZlZCBhZnRlciBpdCdzIGludm9rZWRcbiAgICAgKiBmb3IgdGhlIGZpcnN0IHRpbWUuXG4gICAgICpcbiAgICAgKiBOb3RlOiB3aGF0IFwibWF0Y2hpbmdcIiBtZWFucyBpcyBub3QgZG9jdW1lbnRlZCB3ZWxsIHlldCBzaW5jZSBpdCBpcyBzdWJqZWN0IHRvIGNoYW5nZS5cbiAgICAgKiBGb3Igbm93IHlvdSBzaG91bGQgYXNzdW1lIHRoYXQgZm9yIHBsYWluIHR5cGVzIChib29sZWFuLCBudW1iZXIsIHN0cmluZykgaXQgaXNcbiAgICAgKiBzdHJpY3QgZXF1YWxpdHkuIEZvciBvYmplY3RzIGl0IGlzIGxpa2UgZGVlcCBzdHJpY3QgZXF1YWxpdHkgZXhjZXB0IHRoYXQgYWN0dWFsXG4gICAgICogZXZlbnQgYXJndW1lbnQgbWF5IGhhdmUgbW9yZSBmaWVsZHMgdGhhbiBtYXRjaC12YWx1ZShwcm90bykuIEJ1dCBhbGwgZmllbGRzIGZyb21cbiAgICAgKiBtYXRjaC12YWx1ZSBtdXN0IGJlIHByZXNlbnQgaW4gZXZlbnQgYXJndW1lbnQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1R8UmVnRXhwfSB2YWx1ZSAtIGhhbmRsZXIgaXMgaW52b2tlZCBvbmx5IGlmIGV2ZW50IGFyZ3VtZW50IG1hdGNoZXMgdGhpcyB2YWx1ZVxuICAgICAqIEBwYXJhbSB7RXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+fSBoYW5kbGVyIC0gY2FsbGJhY2sgdG8gYmUgY2FsbGVkIHdoZW4gYW4gZXZlbnQgaXMgZW1pdHRlZFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbY29udGV4dF0gLSBjb250ZXh0IHRvIGJlIHVzZWQgd2hlbiBjYWxsaW5nIGhhbmRsZXIuIG51bGwgYnkgZGVmYXVsdC5cbiAgICAgKiBAcmV0dXJucyB7RXZlbnRQcm9wZXJ0eS5MaXN0ZW5lcklkfSAtIG51bWJlciwgaWRlbnRpZnlpbmcgbmV3IGV2ZW50IGxpc3RlbmVyLlxuICAgICAqXG4gICAgICogQHNlZSBQcm9wZXJ0eUV2ZW50Lm1hdGNoLCBQcm9wZXJ0eUV2ZW50Lm9uY2VcbiAgICAgKi9cbiAgICBtYXRjaE9uY2UodmFsdWU6IFR8UmVnRXhwLCBoYW5kbGVyOiBFdmVudFByb3BlcnR5LkhhbmRsZXI8VD4sIGNvbnRleHQ6IE9iamVjdCA9IG51bGwpOiBFdmVudFByb3BlcnR5Lkxpc3RlbmVySWQge1xuICAgICAgICAgcmV0dXJuIHRoaXMuYWRkTGlzdGVuZXIoe1xuICAgICAgICAgICAgIGNvbnRleHQsXG4gICAgICAgICAgICAgaGFuZGxlcixcbiAgICAgICAgICAgICBvbmNlOiB0cnVlLFxuICAgICAgICAgICAgIG9ubHlNYXRjaGluZzogdHJ1ZSxcbiAgICAgICAgICAgICBtYXRjaFZhbHVlOiB2YWx1ZVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBcIlBpcGVzXCIgRXZlbnRQcm9wZXJ0eSB0byBvdGhlciBFdmVudFByb3BlcnR5LiBUaGlzIG1lYW5zIHRoYXQgd2hlbmV2ZXIgdGhpcyBldmVudFxuICAgICAqIGlzIGVtaXR0ZWQgaXQgaXMgcGFzc2VkIHRvIHRoYXQgb3RoZXIgRXZlbnRQcm9wZXJ0eSB3aGljaCBlbWl0cyBpdCB0b28uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0V2ZW50UHJvcGVydHk8VD59IG90aGVyXG4gICAgICogQHJldHVybnMge0V2ZW50UHJvcGVydHkuTGlzdGVuZXJJZH1cbiAgICAgKi9cbiAgICBwaXBlKG90aGVyOiBFdmVudFByb3BlcnR5PFQ+KTogRXZlbnRQcm9wZXJ0eS5MaXN0ZW5lcklkIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub24ob3RoZXIuZW1pdCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUGlwZSBvbmx5IGV2ZW50cyB3aXRoIG1hdGNoaW5nIGFyZ3VtZW50IHRvIGRlc3RpbmF0aW9uIEV2ZW50UHJvcGVydHkuXG4gICAgICpcbiAgICAgKiBOb3RlOiB3aGF0IFwibWF0Y2hpbmdcIiBtZWFucyBpcyBub3QgZG9jdW1lbnRlZCB3ZWxsIHlldCBzaW5jZSBpdCBpcyBzdWJqZWN0IHRvIGNoYW5nZS5cbiAgICAgKiBGb3Igbm93IHlvdSBzaG91bGQgYXNzdW1lIHRoYXQgZm9yIHBsYWluIHR5cGVzIChib29sZWFuLCBudW1iZXIsIHN0cmluZykgaXQgaXNcbiAgICAgKiBzdHJpY3QgZXF1YWxpdHkuIEZvciBvYmplY3RzIGl0IGlzIGxpa2UgZGVlcCBzdHJpY3QgZXF1YWxpdHkgZXhjZXB0IHRoYXQgYWN0dWFsXG4gICAgICogZXZlbnQgYXJndW1lbnQgbWF5IGhhdmUgbW9yZSBmaWVsZHMgdGhhbiBtYXRjaC12YWx1ZShwcm90bykuIEJ1dCBhbGwgZmllbGRzIGZyb21cbiAgICAgKiBtYXRjaC12YWx1ZSBtdXN0IGJlIHByZXNlbnQgaW4gZXZlbnQgYXJndW1lbnQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1R8UmVnRXhwfSBtYXRjaFZhbHVlIC0gdmFsdWUgdG8gbWF0Y2hcbiAgICAgKiBAcGFyYW0ge0V2ZW50UHJvcGVydHk8VD59IGRlc3RpbmF0aW9uIC0gdGFyZ2V0IEV2ZW50UHJvcGVydHlcbiAgICAgKiBAcmV0dXJucyB7RXZlbnRQcm9wZXJ0eS5MaXN0ZW5lcklkfVxuICAgICAqXG4gICAgICogQHNlZSBFdmVudFByb3BlcnR5LnBpcGUsIEV2ZW50UHJvcGVydHkubWF0Y2hcbiAgICAgKi9cbiAgICByb3V0ZShtYXRjaFZhbHVlOiBUfFJlZ0V4cCwgZGVzdGluYXRpb246IEV2ZW50UHJvcGVydHk8VD4pOiBFdmVudFByb3BlcnR5Lkxpc3RlbmVySWQge1xuICAgICAgICByZXR1cm4gdGhpcy5tYXRjaChtYXRjaFZhbHVlLCBkZXN0aW5hdGlvbi5lbWl0KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGRzIGFuIGluaXRpYWxpemF0aW9uIGhhbmRsZXIuIEluaXRpYWxpemF0aW9uIGhhbmRsZXJzIGFyZSBpbnZva2VkIGR1cmluZyB0aGUgdmVyeSBmaXJzdFxuICAgICAqIGVtaXQgb2YgZXZlbnQgaW4gdGhpcyBFdmVudFByb3BlcnR5LiBJZiBmaXJzdCBlbWl0IGFscmVhZHkgb2NjdXJyZWQgdGhlbiB0aGUgaGFuZGxlciBpc1xuICAgICAqIGludm9rZWQgaW1tZWRpYXRlbHkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0V2ZW50UHJvcGVydHkuSGFuZGxlcjxUPn0gaGFuZGxlciAtIGNhbGxiYWNrIHRvIGJlIGludm9rZWQgd2hlbiBldmVudCBpcyBlbWl0dGVkIGZpcnN0IHRpbWVcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW2NvbnRleHRdIC0gaGFuZGxlciB3aWxsIGJlIGludm9rZWQgaW4gdGhpcyBjb250ZXh0XG4gICAgICovXG4gICAgaW5pdChoYW5kbGVyOiBFdmVudFByb3BlcnR5LkhhbmRsZXI8VD4sIGNvbnRleHQ/OiBPYmplY3QpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNJbml0aWFsaXplZCkge1xuICAgICAgICAgICAgaGFuZGxlci5jYWxsKGNvbnRleHQgfHwgbnVsbCwgdGhpcy5pbml0QXJnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuaW5pdEhhbmRsZXJzLnB1c2goW2hhbmRsZXIsIGNvbnRleHQgfHwgbnVsbF0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyBhbGwgbGlzdGVuZXJzIHRoYXQgd2VyZSBhdHRhY2hlZCB3aXRoIGdpdmVuIGhhbmRsZXIgYW5kIHdpdGhvdXQgYSBjb250ZXh0LlxuICAgICAqIE5vdGU6IGl0IHdpbGwgbmV2ZXIgcmVtb3ZlIGFueSBsaXN0ZW5lciB0aGF0IHdhcyBhdHRhY2hlZCB3aXRoIGEgY29udGV4dC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+fSBoYW5kbGVyIC0gcmVtb3ZlIGxpc3RlbmVycyBoYXZpbmcgdGhpcyBoYW5kbGVyXG4gICAgICovXG4gICAgb2ZmKGhhbmRsZXI6IEV2ZW50UHJvcGVydHkuSGFuZGxlcjxUPik6IHZvaWQ7XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmVzIGxpc3RlbmVycyB0aGF0IHdlcmUgYXR0YWNoZWQgd2l0aCBnaXZlbiBoYW5kbGVyIGFuZCBjb250ZXh0LlxuICAgICAqIE5vdGU6IGl0IHdpbGwgbmV2ZXIgcmVtb3ZlIGFueSBsaXN0ZW5lciB0aGF0IHdhcyBhdHRhY2hlZCB3aXRob3V0IGEgY29udGV4dC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7RXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+fSBoYW5kbGVyIC0gcmVtb3ZlIGxpc3RlbmVycyBoYXZpbmcgdGhpcyBoYW5kbGVyXG4gICAgICogQHBhcmFtIHtPYmplY3R9IFtjb250ZXh0XSAtIHJlbW92ZSBvbmx5IGxpc3RlbmVycyBoYXZpbmcgdGhpcyBjb250ZXh0XG4gICAgICovXG4gICAgb2ZmKGhhbmRsZXI6IEV2ZW50UHJvcGVydHkuSGFuZGxlcjxUPiwgY29udGV4dDogT2JqZWN0KTogdm9pZDtcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgYWxsIGxpc3RlbmVycyBoYXZpbmcgdGhpcyBjb250ZXh0XG4gICAgICpcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gY29udGV4dFxuICAgICAqL1xuICAgIG9mZihjb250ZXh0OiBPYmplY3QpOiB2b2lkO1xuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyBsaXN0ZW5lciB3aXRoIGdpdmVuIGlkLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtFdmVudFByb3BlcnR5Lkxpc3RlbmVySWR9IGlkXG4gICAgICovXG4gICAgb2ZmKGlkOiBFdmVudFByb3BlcnR5Lkxpc3RlbmVySWQpOiB2b2lkO1xuXG4gICAgLyoqXG4gICAgICogUmVtb3ZlIHBpcGVzIGNyZWF0ZWQgZm9yIG90aGVyIEV2ZW50UHJvcGVydHkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0V2ZW50UHJvcGVydHl9IGRlc3RpbmF0aW9uXG4gICAgICovXG4gICAgb2ZmKGRlc3RpbmF0aW9uOiBFdmVudFByb3BlcnR5PFQ+KTogdm9pZDtcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBhbGwgbGlzdGVuZXJzLlxuICAgICAqL1xuICAgIG9mZigpOiB2b2lkO1xuXG4gICAgb2ZmKC4uLmFyZ3M6IGFueVtdKTogdm9pZCB7XG4gICAgICAgIGxldCBjb250ZXh0OiBPYmplY3QgPSBudWxsLFxuICAgICAgICAgICAgaGFuZGxlcjogRXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+ID0gbnVsbCxcbiAgICAgICAgICAgIGlkVG9SZW1vdmU6IEV2ZW50UHJvcGVydHkuTGlzdGVuZXJJZCA9IG51bGw7XG4gICAgICAgIHN3aXRjaCAoYXJncy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNhc2UgMDogLy8gTm8gYXJndW1lbnRzIC0gY2xlYXIgYWxsIGxpc3RlbmVyc1xuICAgICAgICAgICAgICAgIHRoaXMubGlzdGVuZXJzID0gW107XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgICAgIGlmIChFdmVudFByb3BlcnR5LmlzTGlzdGVuZXJJZChhcmdzWzBdKSkge1xuICAgICAgICAgICAgICAgICAgICBpZFRvUmVtb3ZlID0gYXJnc1swXTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBhcmdzWzBdID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlciA9IGFyZ3NbMF07XG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQgPSBudWxsO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGFyZ3NbMF0gPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFyZ3NbMF0gaW5zdGFuY2VvZiBFdmVudFByb3BlcnR5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9mZihhcmdzWzBdLmVtaXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGhhbmRsZXIgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICBjb250ZXh0ID0gYXJnc1swXTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgYXJndW1lbnQ6ICR7dHlwZW9mIGFyZ3NbMF19YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgICAgIGhhbmRsZXIgPSBhcmdzWzBdO1xuICAgICAgICAgICAgICAgIGNvbnRleHQgPSBhcmdzWzFdO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbnN1cHBvcnRlZCBhcmd1bWVudHMgZm9ybWF0LlwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMubGlzdGVuZXJzID0gdGhpcy5saXN0ZW5lcnMuZmlsdGVyKChoQ29uZjogRXZlbnRQcm9wZXJ0eS5IYW5kbGVyRGVzY3JpcHRvcjxUPikgPT4ge1xuICAgICAgICAgICAgbGV0IGRpZmZlcmVudEhhbmRsZXI6IGJvb2xlYW4gPSBoQ29uZi5oYW5kbGVyICE9PSBoYW5kbGVyO1xuICAgICAgICAgICAgbGV0IG5vSGFuZGxlckdpdmVuOiBib29sZWFuID0gIWhhbmRsZXI7XG4gICAgICAgICAgICBsZXQgbm9Db250ZXh0R2l2ZW46IGJvb2xlYW4gPSAhY29udGV4dDtcbiAgICAgICAgICAgIGxldCBjb25mSGFzTm9Db250ZXh0OiBib29sZWFuID0gIWhDb25mLmNvbnRleHQ7XG4gICAgICAgICAgICBsZXQgZGlmZmVyZW50Q29udGV4dDogYm9vbGVhbiA9IGhDb25mLmNvbnRleHQgIT09IGNvbnRleHQ7XG4gICAgICAgICAgICBsZXQgZG9udFJlbW92ZTogYm9vbGVhbjtcblxuICAgICAgICAgICAgaWYgKGlkVG9SZW1vdmUgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBkb250UmVtb3ZlID0gaWRUb1JlbW92ZSAhPT0gaENvbmYuaWQ7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChub0hhbmRsZXJHaXZlbikge1xuICAgICAgICAgICAgICAgICAgICBpZiAobm9Db250ZXh0R2l2ZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVuZXhwZWN0ZWQgY2lyY3Vtc3RhbmNlcy5cIik7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkb250UmVtb3ZlID0gY29uZkhhc05vQ29udGV4dCB8fCAoY29udGV4dCAhPT0gaENvbmYuY29udGV4dCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZGlmZmVyZW50SGFuZGxlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZG9udFJlbW92ZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobm9Db250ZXh0R2l2ZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb250UmVtb3ZlID0gKCFjb25mSGFzTm9Db250ZXh0KSB8fCAoZGlmZmVyZW50SGFuZGxlcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRvbnRSZW1vdmUgPSBkaWZmZXJlbnRDb250ZXh0IHx8IGRpZmZlcmVudEhhbmRsZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZG9udFJlbW92ZTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG5cbiAgICBwcml2YXRlIHJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyOiBFdmVudFByb3BlcnR5LkhhbmRsZXJEZXNjcmlwdG9yPFQ+KTogdm9pZCB7XG4gICAgICAgIGxldCBsaXN0ZW5lckluZGV4ID0gdGhpcy5saXN0ZW5lcnMuaW5kZXhPZihsaXN0ZW5lcik7XG4gICAgICAgIGlmIChsaXN0ZW5lckluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgdGhpcy5saXN0ZW5lcnMuc3BsaWNlKGxpc3RlbmVySW5kZXgsIDEpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhZGRMaXN0ZW5lcihvcHRpb25zOiBFdmVudFByb3BlcnR5LkhhbmRsZXJPcHRpb25zPFQ+KTogRXZlbnRQcm9wZXJ0eS5MaXN0ZW5lcklkIHtcbiAgICAgICAgbGV0IHtjb250ZXh0LCBoYW5kbGVyLCBvbmNlLCBvbmx5TWF0Y2hpbmcsIG1hdGNoVmFsdWV9ID0gb3B0aW9ucztcbiAgICAgICAgdGhpcy5pZENvdW50ZXIrKztcbiAgICAgICAgdGhpcy5saXN0ZW5lcnMucHVzaCh7Y29udGV4dCwgaGFuZGxlciwgb25jZSwgaWQ6IHRoaXMuaWRDb3VudGVyLCBvbmx5TWF0Y2hpbmcsIG1hdGNoVmFsdWV9KTtcbiAgICAgICAgcmV0dXJuIHRoaXMuaWRDb3VudGVyO1xuICAgIH1cbn1cblxuZXhwb3J0IG5hbWVzcGFjZSBFdmVudFByb3BlcnR5IHtcblxuICAgIC8qKlxuICAgICAqIFRoZSBjYWxsYmFjayBmb3JtYXQgdXNlZCBmb3IgYWRkaW5nIGxpc3RlbmVycyB0byBFdmVudFByb3BlcnR5LlxuICAgICAqL1xuICAgIGV4cG9ydCBpbnRlcmZhY2UgSGFuZGxlcjxUPiB7XG4gICAgICAgIChldmVudEFyZzogVCk6IHZvaWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGZvcm1hdCBvZiB0aGUgRXZlbnRQcm9wZXJ0eS5lbWl0IG1ldGhvZC5cbiAgICAgKi9cbiAgICBleHBvcnQgaW50ZXJmYWNlIEVtaXRNZXRob2Q8VD4ge1xuICAgICAgICAoZXZlbnRBcmc6IFQpOiB2b2lkO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFRoZSBmb3JtYXQgb2YgdGhlIEV2ZW50UHJvcGVydHk6ZW1pdCBtZXRob2QgZm9yIFQ9dm9pZC5cbiAgICAgKi9cbiAgICBleHBvcnQgaW50ZXJmYWNlIFZvaWRFbWl0TWV0aG9kIHtcbiAgICAgICAgKCk6IHZvaWQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhpcyB0eXBlIGlzIHVzZWQganVzdCB0byBlbXBoYXNpemUgdGhlIG1lYW5pbmcgb2YgdGhlIHZhbHVlLlxuICAgICAqIE90aGVyd2lzZSBsaXN0ZW5lcnMgaWRzIGFyZSByZWd1bGFyIG51bWJlcnMuXG4gICAgICovXG4gICAgZXhwb3J0IHR5cGUgTGlzdGVuZXJJZCA9IG51bWJlcjtcblxuICAgIC8qKlxuICAgICAqIFRoaXMgbWV0aG9kIGlzIHVzZWQganVzdCB0byBlbXBoYXNpemUgdGhlIG1lYW5pbmcgb2YgdGhlIHZhbHVlLlxuICAgICAqIE90aGVyd2lzZSB3ZSBjb3VsZCBqdXN0IHVzZSB0eXBlb2YgaWQgPT09IFwibnVtYmVyXCIgZGlyZWN0bHkuXG4gICAgICovXG4gICAgZXhwb3J0IGZ1bmN0aW9uIGlzTGlzdGVuZXJJZChpZDogYW55KSB7XG4gICAgICAgIHJldHVybiB0eXBlb2YgaWQgPT09IFwibnVtYmVyXCI7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhlIGZ1bGwgY29uZmlndXJhdGlvbiBmb3IgYSBzcGVjaWZpYyBsaXN0ZW5lci4gSXQgY29udHJvbHMgdGhlIHdheVxuICAgICAqIHRoZSByZWxldmFudCBldmVudC1oYW5kbGVyIGZ1bmN0aW9uIGlzIGludm9rZWQuXG4gICAgICovXG4gICAgZXhwb3J0IGludGVyZmFjZSBIYW5kbGVyT3B0aW9uczxUPiB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgYWN0dWFsIGhhbmRsZXIgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdoZW4gdGhlIGV2ZW50IG9jY3Vycy5cbiAgICAgICAgICovXG4gICAgICAgIGhhbmRsZXI6IEV2ZW50UHJvcGVydHkuSGFuZGxlcjxUPjtcblxuICAgICAgICAvKipcbiAgICAgICAgICogSWYgdGhpcyBmbGFnIGlzIHNldCAtIHRoZSBldmVudCBoYW5kbGVyIHdpbGwgcmVtb3ZlIGl0c2VsZiBmcm9tXG4gICAgICAgICAqIHRoZSBldmVudCBhZnRlciBmaXJzdCBpbnZvY2F0aW9uLlxuICAgICAgICAgKi9cbiAgICAgICAgb25jZT86IGJvb2xlYW47XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIElmIHRoaXMgZmllbGQgaXMgc3BlY2lmaWVkLCB0aGVuIGhhbmRsZXIgd2lsbCBiZSBjYWxsZWQgd2l0aCB0aGF0IGNvbnRleHQuXG4gICAgICAgICAqL1xuICAgICAgICBjb250ZXh0PzogT2JqZWN0O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBbHdheXMgdXNlZCBpbiBjb21iaW5hdGlvbiB3aXRoIGZvbGxvd2luZyBwYXJhbWV0ZXIgJ21hdGNoVmFsdWUnIGFuZCBpcyBhXG4gICAgICAgICAqIGZsYWcsIHdoaWNoIG1lYW5zKGlmIHNldCkgdGhhdCBvbmx5IGV2ZW50IGludm9jYXRpb25zIHdpdGggYXJndW1lbnQgbWF0Y2hpbmdcbiAgICAgICAgICogJ21hdGNoVmFsdWUnIHNob3VsZCBiZSBwYXNzZWQgdG8gdGhlIGhhbmRsZXIgZnVuY3Rpb24uXG4gICAgICAgICAqXG4gICAgICAgICAqIFdoYXQgXCJtYXRjaGluZ1wiIG1lYW5zIGlzIG5vdCBkb2N1bWVudGVkIHdlbGwgeWV0IHNpbmNlIGl0IGlzIHN1YmplY3QgdG8gY2hhbmdlLlxuICAgICAgICAgKiBGb3Igbm93IHlvdSBtYXkgYXNzdW1lIHRoYXQgZm9yIHBsYWluIHR5cGVzIChib29sZWFuLCBudW1iZXIsIHN0cmluZykgaXQgaXNcbiAgICAgICAgICogc3RyaWN0IGVxdWFsaXR5LlxuICAgICAgICAgKi9cbiAgICAgICAgb25seU1hdGNoaW5nPzogYm9vbGVhbjtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIHZhbHVlLCB0byBiZSBtYXRjaGVkIGlmIHRoZSAnb25seU1hdGNoaW5nJyBmbGFnIGlzIHNldC5cbiAgICAgICAgICovXG4gICAgICAgIG1hdGNoVmFsdWU/OiBUfFJlZ0V4cDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIGlzIHRoZSBvYmplY3Qgd2hpY2ggcmVwcmVzZW50cyBhbiBleGlzdGluZyBoYW5kbGVyIGludGVybmFsbHkgaW4gRXZlbnRQcm9wZXJ0eSBvYmplY3QuXG4gICAgICpcbiAgICAgKiBFdmVudFByb3BlcnR5IHN0b3JlcyBsaXN0ZW5lcnMgYXMgSGFuZGxlck9wdGlvbnMgKyBsaXN0ZW5lcklkLlxuICAgICAqL1xuICAgIGV4cG9ydCBpbnRlcmZhY2UgSGFuZGxlckRlc2NyaXB0b3I8VD4gZXh0ZW5kcyBIYW5kbGVyT3B0aW9uczxUPiB7XG4gICAgICAgIGlkOiBMaXN0ZW5lcklkO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFuIEV2ZW50UHJvcGVydHkgaW50ZXJmYWNlIHdpdGhvdXQgdGhlICdlbWl0JyBtZXRob2QuXG4gICAgICpcbiAgICAgKiBJdCBpcyBhIGdvb2QgcHJhY3RpY2UgdG8gcHJvdmlkZSBwdWJsaWMgYWNjZXNzIHRvIEV2ZW50UHJvcGVydGllcyBpbiB0aGlzIGZvcm1cbiAgICAgKiBhbmQgbm90IGluIHRoZSBvcmlnaW5hbCBFdmVudFByb3BlcnR5IGZvcm0uXG4gICAgICogRXZlbnRQcm9wZXJ0eSB1c3VhbGx5IHJlbGF0ZXMgdG8gc29tZSBjbGFzcyBhbmQgb25seSB0aGF0IGNsYXNzIHNob3VsZCBiZSBhYmxlIHRvXG4gICAgICogdHJpZ2dlci9lbWl0IHRoZSBldmVudC4gT24gdGhlIG90aGVyIGhhbmQgYW55b25lIHNob3VsZCBiZSBhYmxlIHRvIGxpc3RlbiB0byB0aGlzXG4gICAgICogZXZlbnQuIFRoaXMgbGlicmFyeSBvZmZlcnMgc3BlY2lhbCBpbnRlcmZhY2UgZm9yIHRoaXMgcHVycG9zZSBhbmQgYSBmZXcgdXRpbGl0eVxuICAgICAqIGZ1bmN0aW9ucyAobWFrZSwgc3BsaXQuIHNwbGl0Vm9pZCkuXG4gICAgICpcbiAgICAgKiBUaGUgaWRlYSBpcyB0byBjcmVhdGUgYSBwcml2YXRlIEV2ZW50UHJvcGVydHkgbWVtYmVyIGFuZCBwdWJsaWNcbiAgICAgKiBFdmVudFByb3BlcnR5LkVtaXR0ZXIgZ2V0dGVyIHdoaWNoIHJldHVybiB0aGF0IHByaXZhdGUgbWVtYmVyLlxuICAgICAqIFlvdSBkb24ndCBoYXZlIHRvIGRvIGl0IGlmIHlvdSB0aGluayBpdCdzIHRvbyBjdW1iZXJzb21lIHRob3VnaC5cbiAgICAgKi9cbiAgICBleHBvcnQgaW50ZXJmYWNlIEVtaXR0ZXI8VD4ge1xuICAgICAgICAvKipcbiAgICAgICAgICogQWRkcyBhIGxpc3RlbmVyIGZvciB0aGlzIGV2ZW50IHR5cGUuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7RXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+fSBoYW5kbGVyIC0gY2FsbGJhY2sgdG8gYmUgY2FsbGVkIHdoZW4gYW4gZXZlbnQgaXMgZW1pdHRlZFxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gW2NvbnRleHRdIC0gY29udGV4dCB0byBiZSB1c2VkIHdoZW4gY2FsbGluZyBoYW5kbGVyLiBudWxsIGJ5IGRlZmF1bHQuXG4gICAgICAgICAqIEByZXR1cm5zIHtFdmVudFByb3BlcnR5Lkxpc3RlbmVySWR9IC0gbnVtYmVyLCBpZGVudGlmeWluZyBuZXcgZXZlbnQgbGlzdGVuZXIuXG4gICAgICAgICAqL1xuICAgICAgICBvbihoYW5kbGVyOiBFdmVudFByb3BlcnR5LkhhbmRsZXI8VD4sIGNvbnRleHQ/OiBPYmplY3QpOiBMaXN0ZW5lcklkO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBZGRzIGEgbGlzdGVuZXIgZm9yIHRoaXMgZXZlbnQgdHlwZS4gVGhpcyBsaXN0ZW5lciB3aWxsIGJlIGltbWVkaWF0ZWx5IHJlbW92ZWQgYWZ0ZXIgaXQnc1xuICAgICAgICAgKiBpbnZva2VkIGZvciB0aGUgZmlyc3QgdGltZS5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtFdmVudFByb3BlcnR5LkhhbmRsZXI8VD59IGhhbmRsZXIgLSBjYWxsYmFjayB0byBiZSBjYWxsZWQgd2hlbiBhbiBldmVudCBpcyBlbWl0dGVkXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbY29udGV4dF0gLSBjb250ZXh0IHRvIGJlIHVzZWQgd2hlbiBjYWxsaW5nIGhhbmRsZXIuIG51bGwgYnkgZGVmYXVsdC5cbiAgICAgICAgICogQHJldHVybnMge0V2ZW50UHJvcGVydHkuTGlzdGVuZXJJZH0gLSBudW1iZXIsIGlkZW50aWZ5aW5nIG5ldyBldmVudCBsaXN0ZW5lci5cbiAgICAgICAgICovXG4gICAgICAgIG9uY2UoaGFuZGxlcjogRXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+LCBjb250ZXh0PzogT2JqZWN0KTogTGlzdGVuZXJJZDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQWRkcyBhIGxpc3RlbmVyIGZvciB0aGlzIGV2ZW50IHR5cGUuIFRoaXMgbGlzdGVuZXIgd2lsbCBiZSBjYWxsZWQgb25seSBpZiBldmVudCBhcmd1bWVudFxuICAgICAgICAgKiBtYXRjaGVzIGdpdmVuIHZhbHVlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBOb3RlOiB3aGF0IFwibWF0Y2hpbmdcIiBtZWFucyBpcyBub3QgZG9jdW1lbnRlZCB3ZWxsIHlldCBzaW5jZSBpdCBpcyBzdWJqZWN0IHRvIGNoYW5nZS5cbiAgICAgICAgICogRm9yIG5vdyB5b3Ugc2hvdWxkIGFzc3VtZSB0aGF0IGZvciBwbGFpbiB0eXBlcyAoYm9vbGVhbiwgbnVtYmVyLCBzdHJpbmcpIGl0IGlzXG4gICAgICAgICAqIHN0cmljdCBlcXVhbGl0eS4gRm9yIG9iamVjdHMgaXQgaXMgbGlrZSBkZWVwIHN0cmljdCBlcXVhbGl0eSBleGNlcHQgdGhhdCBhY3R1YWxcbiAgICAgICAgICogZXZlbnQgYXJndW1lbnQgbWF5IGhhdmUgbW9yZSBmaWVsZHMgdGhhbiBtYXRjaC12YWx1ZShwcm90bykuIEJ1dCBhbGwgZmllbGRzIGZyb21cbiAgICAgICAgICogbWF0Y2gtdmFsdWUgbXVzdCBiZSBwcmVzZW50IGluIGV2ZW50IGFyZ3VtZW50LlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge1R8UmVnRXhwfSB2YWx1ZSAtIGhhbmRsZXIgaXMgaW52b2tlZCBvbmx5IGlmIGV2ZW50IGFyZ3VtZW50IG1hdGNoZXMgdGhpcyB2YWx1ZVxuICAgICAgICAgKiBAcGFyYW0ge0V2ZW50UHJvcGVydHkuSGFuZGxlcjxUPn0gaGFuZGxlciAtIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCB3aGVuIGFuIGV2ZW50IGlzIGVtaXR0ZWRcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IFtjb250ZXh0XSAtIGNvbnRleHQgdG8gYmUgdXNlZCB3aGVuIGNhbGxpbmcgaGFuZGxlci4gbnVsbCBieSBkZWZhdWx0LlxuICAgICAgICAgKiBAcmV0dXJucyB7RXZlbnRQcm9wZXJ0eS5MaXN0ZW5lcklkfSAtIG51bWJlciwgaWRlbnRpZnlpbmcgbmV3IGV2ZW50IGxpc3RlbmVyLlxuICAgICAgICAgKi9cbiAgICAgICAgbWF0Y2godmFsdWU6IFR8UmVnRXhwLCBoYW5kbGVyOiBFdmVudFByb3BlcnR5LkhhbmRsZXI8VD4sIGNvbnRleHQ/OiBPYmplY3QpOiBMaXN0ZW5lcklkO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBZGRzIGEgbGlzdGVuZXIgZm9yIHRoaXMgZXZlbnQgdHlwZS4gVGhpcyBsaXN0ZW5lciB3aWxsIGJlIGludm9rZWQgb25seSBpZiBldmVudCBhcmd1bWVudFxuICAgICAgICAgKiBtYXRjaGVzIGdpdmVuIHZhbHVlLiBUaGlzIGxpc3RlbmVyIHdpbGwgYmUgaW1tZWRpYXRlbHkgcmVtb3ZlZCBhZnRlciBpdCdzIGludm9rZWRcbiAgICAgICAgICogZm9yIHRoZSBmaXJzdCB0aW1lLlxuICAgICAgICAgKlxuICAgICAgICAgKiBOb3RlOiB3aGF0IFwibWF0Y2hpbmdcIiBtZWFucyBpcyBub3QgZG9jdW1lbnRlZCB3ZWxsIHlldCBzaW5jZSBpdCBpcyBzdWJqZWN0IHRvIGNoYW5nZS5cbiAgICAgICAgICogRm9yIG5vdyB5b3Ugc2hvdWxkIGFzc3VtZSB0aGF0IGZvciBwbGFpbiB0eXBlcyAoYm9vbGVhbiwgbnVtYmVyLCBzdHJpbmcpIGl0IGlzXG4gICAgICAgICAqIHN0cmljdCBlcXVhbGl0eS4gRm9yIG9iamVjdHMgaXQgaXMgbGlrZSBkZWVwIHN0cmljdCBlcXVhbGl0eSBleGNlcHQgdGhhdCBhY3R1YWxcbiAgICAgICAgICogZXZlbnQgYXJndW1lbnQgbWF5IGhhdmUgbW9yZSBmaWVsZHMgdGhhbiBtYXRjaC12YWx1ZShwcm90bykuIEJ1dCBhbGwgZmllbGRzIGZyb21cbiAgICAgICAgICogbWF0Y2gtdmFsdWUgbXVzdCBiZSBwcmVzZW50IGluIGV2ZW50IGFyZ3VtZW50LlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge1R8UmVnRXhwfSB2YWx1ZSAtIGhhbmRsZXIgaXMgaW52b2tlZCBvbmx5IGlmIGV2ZW50IGFyZ3VtZW50IG1hdGNoZXMgdGhpcyB2YWx1ZVxuICAgICAgICAgKiBAcGFyYW0ge0V2ZW50UHJvcGVydHkuSGFuZGxlcjxUPn0gaGFuZGxlciAtIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCB3aGVuIGFuIGV2ZW50IGlzIGVtaXR0ZWRcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IFtjb250ZXh0XSAtIGNvbnRleHQgdG8gYmUgdXNlZCB3aGVuIGNhbGxpbmcgaGFuZGxlci4gbnVsbCBieSBkZWZhdWx0LlxuICAgICAgICAgKiBAcmV0dXJucyB7RXZlbnRQcm9wZXJ0eS5MaXN0ZW5lcklkfSAtIG51bWJlciwgaWRlbnRpZnlpbmcgbmV3IGV2ZW50IGxpc3RlbmVyLlxuICAgICAgICAgKi9cbiAgICAgICAgbWF0Y2hPbmNlKHZhbHVlOiBUfFJlZ0V4cCwgaGFuZGxlcjogRXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+LCBjb250ZXh0PzogT2JqZWN0KTogTGlzdGVuZXJJZDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogXCJQaXBlc1wiIEV2ZW50UHJvcGVydHkgdG8gb3RoZXIgRXZlbnRQcm9wZXJ0eS4gVGhpcyBtZWFucyB0aGF0IHdoZW5ldmVyIHRoaXMgZXZlbnRcbiAgICAgICAgICogaXMgZW1pdHRlZCBpdCBpcyBwYXNzZWQgdG8gdGhhdCBvdGhlciBFdmVudFByb3BlcnR5IHdoaWNoIGVtaXRzIGl0IHRvby5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtFdmVudFByb3BlcnR5PFQ+fSBvdGhlclxuICAgICAgICAgKiBAcmV0dXJucyB7RXZlbnRQcm9wZXJ0eS5MaXN0ZW5lcklkfVxuICAgICAgICAgKi9cbiAgICAgICAgcGlwZShvdGhlcjogRXZlbnRQcm9wZXJ0eTxUPik6IEV2ZW50UHJvcGVydHkuTGlzdGVuZXJJZDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogUGlwZSBvbmx5IGV2ZW50cyB3aXRoIG1hdGNoaW5nIGFyZ3VtZW50IHRvIGRlc3RpbmF0aW9uIEV2ZW50UHJvcGVydHkuXG4gICAgICAgICAqXG4gICAgICAgICAqIE5vdGU6IHdoYXQgXCJtYXRjaGluZ1wiIG1lYW5zIGlzIG5vdCBkb2N1bWVudGVkIHdlbGwgeWV0IHNpbmNlIGl0IGlzIHN1YmplY3QgdG8gY2hhbmdlLlxuICAgICAgICAgKiBGb3Igbm93IHlvdSBzaG91bGQgYXNzdW1lIHRoYXQgZm9yIHBsYWluIHR5cGVzIChib29sZWFuLCBudW1iZXIsIHN0cmluZykgaXQgaXNcbiAgICAgICAgICogc3RyaWN0IGVxdWFsaXR5LiBGb3Igb2JqZWN0cyBpdCBpcyBsaWtlIGRlZXAgc3RyaWN0IGVxdWFsaXR5IGV4Y2VwdCB0aGF0IGFjdHVhbFxuICAgICAgICAgKiBldmVudCBhcmd1bWVudCBtYXkgaGF2ZSBtb3JlIGZpZWxkcyB0aGFuIG1hdGNoLXZhbHVlKHByb3RvKS4gQnV0IGFsbCBmaWVsZHMgZnJvbVxuICAgICAgICAgKiBtYXRjaC12YWx1ZSBtdXN0IGJlIHByZXNlbnQgaW4gZXZlbnQgYXJndW1lbnQuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7VHxSZWdFeHB9IG1hdGNoVmFsdWUgLSB2YWx1ZSB0byBtYXRjaFxuICAgICAgICAgKiBAcGFyYW0ge0V2ZW50UHJvcGVydHk8VD59IGRlc3RpbmF0aW9uIC0gdGFyZ2V0IEV2ZW50UHJvcGVydHlcbiAgICAgICAgICogQHJldHVybnMge0V2ZW50UHJvcGVydHkuTGlzdGVuZXJJZH1cbiAgICAgICAgICovXG4gICAgICAgIHJvdXRlKG1hdGNoVmFsdWU6IFR8UmVnRXhwLCBkZXN0aW5hdGlvbjogRXZlbnRQcm9wZXJ0eTxUPik6IEV2ZW50UHJvcGVydHkuTGlzdGVuZXJJZDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQWRkcyBhbiBpbml0aWFsaXphdGlvbiBoYW5kbGVyLiBJbml0aWFsaXphdGlvbiBoYW5kbGVycyBhcmUgaW52b2tlZCBkdXJpbmcgdGhlIHZlcnkgZmlyc3RcbiAgICAgICAgICogZW1pdCBvZiBldmVudCBpbiB0aGlzIEV2ZW50UHJvcGVydHkuIElmIGZpcnN0IGVtaXQgYWxyZWFkeSBvY2N1cnJlZCB0aGVuIHRoZSBoYW5kbGVyIGlzXG4gICAgICAgICAqIGludm9rZWQgaW1tZWRpYXRlbHkuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7RXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+fSBoYW5kbGVyIC0gY2FsbGJhY2sgdG8gYmUgaW52b2tlZCB3aGVuIGV2ZW50IGlzIGVtaXR0ZWQgZmlyc3QgdGltZVxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gW2NvbnRleHRdIC0gaGFuZGxlciB3aWxsIGJlIGludm9rZWQgaW4gdGhpcyBjb250ZXh0XG4gICAgICAgICAqL1xuICAgICAgICBpbml0KGhhbmRsZXI6IEV2ZW50UHJvcGVydHkuSGFuZGxlcjxUPiwgY29udGV4dD86IE9iamVjdCk6IHZvaWQ7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlbW92ZXMgYWxsIGxpc3RlbmVycyB0aGF0IHdlcmUgYXR0YWNoZWQgd2l0aCBnaXZlbiBoYW5kbGVyIGFuZCB3aXRob3V0IGEgY29udGV4dC5cbiAgICAgICAgICogTm90ZTogaXQgd2lsbCBuZXZlciByZW1vdmUgYW55IGxpc3RlbmVyIHRoYXQgd2FzIGF0dGFjaGVkIHdpdGggYSBjb250ZXh0LlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge0V2ZW50UHJvcGVydHkuSGFuZGxlcjxUPn0gaGFuZGxlciAtIHJlbW92ZSBsaXN0ZW5lcnMgaGF2aW5nIHRoaXMgaGFuZGxlclxuICAgICAgICAgKi9cbiAgICAgICAgb2ZmKGhhbmRsZXI6IEV2ZW50UHJvcGVydHkuSGFuZGxlcjxUPik6IHZvaWQ7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlbW92ZXMgbGlzdGVuZXJzIHRoYXQgd2VyZSBhdHRhY2hlZCB3aXRoIGdpdmVuIGhhbmRsZXIgYW5kIGNvbnRleHQuXG4gICAgICAgICAqIE5vdGU6IGl0IHdpbGwgbmV2ZXIgcmVtb3ZlIGFueSBsaXN0ZW5lciB0aGF0IHdhcyBhdHRhY2hlZCB3aXRob3V0IGEgY29udGV4dC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtFdmVudFByb3BlcnR5LkhhbmRsZXI8VD59IGhhbmRsZXIgLSByZW1vdmUgbGlzdGVuZXJzIGhhdmluZyB0aGlzIGhhbmRsZXJcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IFtjb250ZXh0XSAtIHJlbW92ZSBvbmx5IGxpc3RlbmVycyBoYXZpbmcgdGhpcyBjb250ZXh0XG4gICAgICAgICAqL1xuICAgICAgICBvZmYoaGFuZGxlcjogRXZlbnRQcm9wZXJ0eS5IYW5kbGVyPFQ+LCBjb250ZXh0OiBPYmplY3QpOiB2b2lkO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZW1vdmVzIGFsbCBsaXN0ZW5lcnMgaGF2aW5nIHRoaXMgY29udGV4dFxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gY29udGV4dFxuICAgICAgICAgKi9cbiAgICAgICAgb2ZmKGNvbnRleHQ6IE9iamVjdCk6IHZvaWQ7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlbW92ZXMgbGlzdGVuZXIgd2l0aCBnaXZlbiBpZC5cbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtFdmVudFByb3BlcnR5Lkxpc3RlbmVySWR9IGlkXG4gICAgICAgICAqL1xuICAgICAgICBvZmYoaWQ6IEV2ZW50UHJvcGVydHkuTGlzdGVuZXJJZCk6IHZvaWQ7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlbW92ZSBwaXBlcyBjcmVhdGVkIGZvciBvdGhlciBFdmVudFByb3BlcnR5LlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge0V2ZW50UHJvcGVydHl9IGRlc3RpbmF0aW9uXG4gICAgICAgICAqL1xuICAgICAgICBvZmYoZGVzdGluYXRpb246IEV2ZW50UHJvcGVydHk8VD4pOiB2b2lkO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZW1vdmUgYWxsIGxpc3RlbmVycy5cbiAgICAgICAgICovXG4gICAgICAgIG9mZigpOiB2b2lkO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSBwYWlyOiBhbiBFdmVudFByb3BlcnR5IGluc3RhbmNlIHRvIGJlIHVzZWQgaW50ZXJuYWxseSBpbiBhIGNsYXNzXG4gICAgICogYW5kIGFuIEVtaXR0ZXItaW50ZXJmYWNlIHRvIGJlIHVzZWQgYXMgcHVibGljIC8gYWNjZXNzaWJsZSBwcm9wZXJ0eS5cbiAgICAgKiBUaGV5IGJvdGggYWN0dWFsbHkgcmVwcmVzZW50IHRoZSBzYW1lIEV2ZW50UHJvcGVydHkgb2JqZWN0LlxuICAgICAqXG4gICAgICogcmV0dXJucyB7W0V2ZW50UHJvcGVydHksRXZlbnRQcm9wZXJ0eS5FbWl0dGVyPFQ+XX1cbiAgICAgKlxuICAgICAqIEBtZXRob2QgRXZlbnRQcm9wZXJ0eS5tYWtlXG4gICAgICogQHN0YXRpY1xuICAgICAqL1xuICAgIGV4cG9ydCBmdW5jdGlvbiBtYWtlPFQ+KCk6IFtFdmVudFByb3BlcnR5PFQ+LCBFdmVudFByb3BlcnR5LkVtaXR0ZXI8VD5dIHtcbiAgICAgICAgbGV0IGV2ZW50UHJvcCA9IG5ldyBFdmVudFByb3BlcnR5PFQ+KCk7XG4gICAgICAgIHJldHVybiBbZXZlbnRQcm9wLCA8RXZlbnRQcm9wZXJ0eS5FbWl0dGVyPFQ+PmV2ZW50UHJvcF07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbiBFdmVudFByb3BlcnR5IG9iamVjdCBhbmQgc3BsaXRzIGl0IGludG8gZW1pdHRlci1mdW5jdGlvbiBhbmRcbiAgICAgKiBFbWl0dGVyLWludGVyZmFjZS4gVXNlIGVtaXR0ZXIgZnVuY3Rpb24gdG8gZW1pdCB0aGUgZXZlbnQgYW5kIEVtaXR0ZXItaW50ZXJmYWNlXG4gICAgICogdG8gYWRkIGFuZCByZW1vdmUgbGlzdGVuZXJzIG9mIHRoYXQgZXZlbnQuXG4gICAgICpcbiAgICAgKiByZXR1cm5zIHtbRXZlbnRQcm9wZXJ0eS5FbWl0TWV0aG9kPFQ+LEV2ZW50UHJvcGVydHkuRW1pdHRlcjxUPl19XG4gICAgICpcbiAgICAgKiBAbWV0aG9kIEV2ZW50UHJvcGVydHkuc3BsaXRcbiAgICAgKiBAc3RhdGljXG4gICAgICovXG4gICAgZXhwb3J0IGZ1bmN0aW9uIHNwbGl0PFQ+KCk6IFtFdmVudFByb3BlcnR5LkVtaXRNZXRob2Q8VD4sIEV2ZW50UHJvcGVydHkuRW1pdHRlcjxUPl0ge1xuICAgICAgICBsZXQgZXZlbnRQcm9wID0gbmV3IEV2ZW50UHJvcGVydHk8VD4oKTtcbiAgICAgICAgcmV0dXJuIFtldmVudFByb3AuZW1pdCwgPEV2ZW50UHJvcGVydHkuRW1pdHRlcjxUPj5ldmVudFByb3BdO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYW4gRXZlbnRQcm9wZXJ0eSBvYmplY3QgYW5kIHNwbGl0cyBpdCBpbnRvIGVtaXR0ZXItZnVuY3Rpb24gYW5kXG4gICAgICogRW1pdHRlci1pbnRlcmZhY2UuIFNwZWNpYWwgdmVyc2lvbiBmb3Igdm9pZC10eXBlZCBldmVudHMuXG4gICAgICpcbiAgICAgKiByZXR1cm5zIHtbRXZlbnRQcm9wZXJ0eS5Wb2lkRW1pdE1ldGhvZCxFdmVudFByb3BlcnR5LkVtaXR0ZXI8VD5dfVxuICAgICAqXG4gICAgICogQG1ldGhvZCBFdmVudFByb3BlcnR5LnNwbGl0Vm9pZFxuICAgICAqIEBzdGF0aWNcbiAgICAgKi9cbiAgICBleHBvcnQgZnVuY3Rpb24gc3BsaXRWb2lkKCk6IFtFdmVudFByb3BlcnR5LlZvaWRFbWl0TWV0aG9kLCBFdmVudFByb3BlcnR5LkVtaXR0ZXI8dm9pZD5dIHtcbiAgICAgICAgbGV0IGV2ZW50UHJvcCA9IG5ldyBFdmVudFByb3BlcnR5LlZvaWQoKTtcbiAgICAgICAgbGV0IGVtaXR0ZXIgPSA8RXZlbnRQcm9wZXJ0eS5FbWl0dGVyPHZvaWQ+PmV2ZW50UHJvcDtcbiAgICAgICAgcmV0dXJuIFtldmVudFByb3AuZW1pdCwgZW1pdHRlcl07XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU3BlY2lhbCBzdWJjbGFzcyBvZiBFdmVudFByb3BlcnR5IGZvciB2b2lkIHR5cGUgLSBhbGxvd3MgY2FsbGluZyBlbWl0IHdpdGhvdXQgYXJndW1lbnRzLlxuICAgICAqIEV4dGVuZHMge0BsaW5rIEV2ZW50UHJvcGVydHl9XG4gICAgICpcbiAgICAgKiBAY2xhc3MgRXZlbnRQcm9wZXJ0eS5Wb2lkXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBzZWUge0V2ZW50UHJvcGVydHl9XG4gICAgICovXG4gICAgZXhwb3J0IGNsYXNzIFZvaWQgZXh0ZW5kcyBFdmVudFByb3BlcnR5PHZvaWQ+IHtcbiAgICAgICAgY29uc3RydWN0b3IoKSB7IHN1cGVyKCk7IH1cblxuICAgICAgICAvKipcbiAgICAgICAgICogRW1pdHMgYW4gZXZlbnQgaW52b2tpbmcgYWxsIGxpc3RlbmVycy5cbiAgICAgICAgICpcbiAgICAgICAgICogQG1ldGhvZCBFdmVudFByb3BlcnR5LlZvaWQjZW1pdFxuICAgICAgICAgKiBAc2VlIHtFdmVudFByb3BlcnR5I2VtaXR9XG4gICAgICAgICAqL1xuICAgICAgICBlbWl0KCkgeyByZXR1cm4gc3VwZXIuZW1pdCh2b2lkIDApOyB9XG4gICAgfVxufVxuXG5cbi8qKlxuICogVXNlZCBpbiBFdmVudFByb3BlcnR5Lm1hdGNoL21hdGNoT25jZS9yb3V0ZSBtZXRob2RzIHRvIGNvbXBhcmUgZXZlbnQgYXJndW1lbnQgd2l0aCBnaXZlbiB2YWx1ZS5cbiAqIE5vdGU6IHN1YmplY3QgdG8gY2hhbmdlLlxuICpcbiAqIEBwYXJhbSB7YW55fSBzdWJqZWN0IC0gYWN0dWFsIGV2ZW50IGFyZ3VtZW50XG4gKiBAcGFyYW0ge2FueX0gcHJvdG8gLSB2YWx1ZSB0byBtYXRjaFxuICogQHJldHVybnMge2Jvb2xlYW59XG4gKlxuICogQHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gb2JqZWN0TWF0Y2goc3ViamVjdDogYW55LCBwcm90bzogYW55KTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIF9vYmplY3RNYXRjaChzdWJqZWN0LCBwcm90byk7XG59XG5cbmZ1bmN0aW9uIF9vYmplY3RNYXRjaChzdWJqZWN0OiBhbnksIHByb3RvOiBhbnksIHRyYXZlcnNhbFN0YWNrOiBhbnlbXSA9IFtdKTogYm9vbGVhbiB7XG4gICAgc3dpdGNoICh0eXBlb2YgcHJvdG8pIHtcbiAgICAgICAgY2FzZSBcInVuZGVmaW5lZFwiOiByZXR1cm4gc3ViamVjdCA9PT0gdW5kZWZpbmVkO1xuICAgICAgICBjYXNlIFwibnVtYmVyXCI6XG4gICAgICAgIGNhc2UgXCJib29sZWFuXCI6XG4gICAgICAgIGNhc2UgXCJzdHJpbmdcIjpcbiAgICAgICAgY2FzZSBcImZ1bmN0aW9uXCI6XG4gICAgICAgICAgICByZXR1cm4gc3ViamVjdCA9PT0gcHJvdG87XG4gICAgICAgIGNhc2UgXCJvYmplY3RcIjpcbiAgICAgICAgICAgIGxldCBpc01hdGNoaW5nID0gdHJ1ZTtcblxuICAgICAgICAgICAgaWYgKHRyYXZlcnNhbFN0YWNrLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGlmICgodHlwZW9mIHN1YmplY3QgPT09IFwic3RyaW5nXCIpICYmIChwcm90byBpbnN0YW5jZW9mIFJlZ0V4cCkpIHtcbiAgICAgICAgICAgICAgICAgICAgaXNNYXRjaGluZyA9IHByb3RvLnRlc3Qoc3ViamVjdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHN1YmplY3QgIT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgaXNNYXRjaGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghcHJvdG8gfHwgIXN1YmplY3QpXG4gICAgICAgICAgICAgICAgICAgICAgICBpc01hdGNoaW5nID0gIXN1YmplY3QgJiYgIXByb3RvO1xuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICh0cmF2ZXJzYWxTdGFjay5pbmNsdWRlcyhzdWJqZWN0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUmVjdXJzaW9uIVwiKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGtleSBpbiBwcm90bykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm90by5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYXZlcnNhbFN0YWNrLnB1c2goc3ViamVjdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzTWF0Y2hpbmcgPSBpc01hdGNoaW5nICYmIF9vYmplY3RNYXRjaChzdWJqZWN0W2tleV0sIHByb3RvW2tleV0sIHRyYXZlcnNhbFN0YWNrKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhdmVyc2FsU3RhY2sucG9wKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGlzTWF0Y2hpbmc7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVuZXhwZWN0ZWQgdHlwZW9mOiAke3R5cGVvZiBwcm90b31gKTtcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IEV2ZW50UHJvcGVydHk7Il19