/// <reference path="../typings/index.d.ts"/>
var _ = require("lodash");
var Event = (function () {
    function Event() {
        var _this = this;
        this.listeners = [];
        this.isBeingTriggered = false;
        this.triggerDelegate = null;
        this.listenDelegate = null;
        this.matchDelegate = null;
        this.matchOnceDelegate = null;
        this.unlistenDelegate = null;
        this.onceDelegate = null;
        this.whenDelegate = null;
        this.thenDelegate = null;
        this.catchDelegate = null;
        this.promise = null;
        this.isFirstTriggerDone = false;
        this.idCounter = 0;
        this.triggerDelegate = function (eventArg) { return _this.trigger(eventArg); };
        this.listenDelegate = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            return _this.listen.apply(_this, args);
        };
        this.matchDelegate = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            return _this.match.apply(_this, args);
        };
        this.matchOnceDelegate = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            return _this.matchOnce.apply(_this, args);
        };
        this.unlistenDelegate = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            return _this.unlisten.apply(_this, args);
        };
        this.onceDelegate = function (handler, context) {
            if (context === void 0) { context = null; }
            return _this.once(handler, context);
        };
        this.whenDelegate = function () {
            return _this.when();
        };
        this.thenDelegate = function (onOk, onFail) {
            return _this.then(onOk, onFail);
        };
        this.catchDelegate = function (onFail) {
            return _this.catch(onFail);
        };
        this.promise = new Promise(function (resolve) { _this.resolve = resolve; });
    }
    Event.prototype.mixin = function (target) {
        var _this = this;
        target.trigger = this.getTriggerer();
        target.getTriggerer = function () {
            return _this.getTriggerer();
        };
        target.listen = this.getListener();
        target.match = this.getMatchListener();
        target.matchOnce = this.getMatchOncer();
        target.unlisten = this.getUnlistener();
        target.once = this.getOncer();
        target.when = this.getWhener();
        target.then = this.getThener();
        target.catch = this.getCatcher();
        return target;
    };
    /** Returns a context-independent callback that triggers the event with given argument */
    Event.prototype.getTriggerer = function () { return this.triggerDelegate; };
    Event.prototype.getListener = function () { return this.listenDelegate; };
    Event.prototype.getMatchListener = function () { return this.matchDelegate; };
    Event.prototype.getMatchOncer = function () { return this.matchOnceDelegate; };
    Event.prototype.getUnlistener = function () { return this.unlistenDelegate; };
    Event.prototype.getOncer = function () { return this.onceDelegate; };
    Event.prototype.getWhener = function () { return this.whenDelegate; };
    Event.prototype.getThener = function () { return this.thenDelegate; };
    Event.prototype.getCatcher = function () { return this.catchDelegate; };
    /**
     * Triggers the event with given argument, invoking all of its handlers, and if
     * the event is triggered for the first time - removing the once event handlers and
     * saving given argument inetrnally as first trigger argument.
     */
    Event.prototype.trigger = function (eventArg) {
        var _this = this;
        if (this.isBeingTriggered) {
            throw new Error("Event triggered during trigger handling - suspecting recursive event.");
        }
        this.isBeingTriggered = true;
        if (!this.isFirstTriggerDone) {
            this.isFirstTriggerDone = true;
            this.resolve(eventArg);
        }
        this.listeners.slice().forEach(function (listener) {
            var doCall = true;
            if (listener.onlyMatching) {
                doCall = listener.matchValue === eventArg;
            }
            if (doCall) {
                if (listener.context) {
                    listener.handler.call(listener.context, eventArg);
                }
                else {
                    listener.handler.call(null, eventArg);
                }
                if (listener.once) {
                    _this.removeListener(listener);
                }
            }
        });
        this.isBeingTriggered = false;
    };
    Event.prototype.listen = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var id;
        if (typeof args[0] === 'string') {
            var name_1 = args[0], handler = args[1], context = args[2];
            id = this.addListener({ name: name_1, handler: handler, context: context });
        }
        else {
            var handler = args[0], context = args[1];
            id = this.addListener({ handler: handler, context: context });
        }
        return id;
    };
    ;
    Event.prototype.match = function (value) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        var id;
        if (typeof args[0] === 'string') {
            var name_2 = args[0], handler = args[1], context = args[2];
            id = this.addListener({ name: name_2, handler: handler, context: context, onlyMatching: true, matchValue: value });
        }
        else {
            var handler = args[0], context = args[1];
            id = this.addListener({ handler: handler, context: context, onlyMatching: true, matchValue: value });
        }
        return id;
    };
    ;
    Event.prototype.matchOnce = function (value, handler, context) {
        if (context === void 0) { context = null; }
        return this.addListener({ context: context, handler: handler, once: true, onlyMatching: true, matchValue: value });
    };
    Event.prototype.once = function (handler, context) {
        if (context === void 0) { context = null; }
        return this.addListener({ context: context, handler: handler, once: true });
    };
    Event.prototype.unlisten = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        var name = null, context, handler, idToRemove = null;
        switch (args.length) {
            case 0:
                this.listeners = [];
                return;
            case 1:
                if (typeof args[0] === 'string') {
                    name = args[0];
                    handler = args[1];
                    context = args[2];
                }
                else if (typeof args[0] === 'number') {
                    idToRemove = args[0];
                }
                else {
                    handler = args[0];
                    context = args[1];
                }
                ;
                break;
            case 2:
                handler = args[0];
                context = args[1];
                break;
        }
        this.listeners = _.filter(this.listeners, function (hConf) {
            var differentHandler = hConf.handler !== handler;
            var noContextGiven = context === null;
            var confHasNoContext = !!hConf.context;
            var differentContext = hConf.context !== context;
            var sameName = name && hConf.name && (name === hConf.name);
            var dontRemove;
            if (idToRemove !== null) {
                dontRemove = idToRemove !== hConf.id;
            }
            else {
                if (name) {
                    dontRemove = !sameName;
                }
                else {
                    if (differentHandler) {
                        dontRemove = true;
                    }
                    else {
                        dontRemove = noContextGiven ? (!confHasNoContext) : (confHasNoContext || differentContext);
                    }
                }
            }
            return dontRemove;
        });
    };
    Event.prototype.on = function (nameOrHandler, handlerOrNothing) {
        return this.listen.apply(this, arguments);
    };
    Event.prototype.off = function (bullshitWTF, context) {
        return this.unlisten.apply(this, arguments);
    };
    Event.prototype.when = function () { return this.promise; };
    Event.prototype.then = function (onOk, onFail) { return this.when().then(onOk, onFail); };
    Event.prototype.after = function (onAny) { return this.then(onAny).catch(onAny); };
    Event.prototype.catch = function (onFail) { return this.when().catch(onFail); };
    Event.prototype.pipe = function (other) {
        this.on(other.getTriggerer());
    };
    Event.prototype.unpipe = function (other) {
        this.off(other.getTriggerer());
    };
    Event.prototype.removeListener = function (listener) {
        var listenerIndex = this.listeners.indexOf(listener);
        if (listenerIndex !== -1) {
            this.listeners.splice(listenerIndex, 1);
        }
    };
    Event.prototype.addListener = function (options) {
        var context = options.context, handler = options.handler, once = options.once, onlyMatching = options.onlyMatching, matchValue = options.matchValue;
        this.idCounter++;
        this.listeners.push({ context: context, handler: handler, once: once, id: this.idCounter, onlyMatching: onlyMatching, matchValue: matchValue });
        return this.idCounter;
    };
    Event.event = function () {
        return function (prototype, eventName) {
            return {
                configurable: true,
                enumerable: false,
                get: function () {
                    var event = new Event();
                    Reflect.defineProperty(this, eventName, {
                        configurable: false,
                        enumerable: false,
                        writable: false,
                        value: event
                    });
                    return event;
                }
            };
        };
    };
    Event.emits = function (eventName) {
        return function (prototype, methodName, original) {
            var originalMethod = original.value;
            var descriptor = {
                configurable: false,
                enumerable: false,
                writeable: false,
                value: function () {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i - 0] = arguments[_i];
                    }
                    var result = originalMethod.apply(this, args);
                    this[eventName].trigger(result);
                    return result;
                }
            };
            return descriptor;
        };
    };
    return Event;
}());
exports.Event = Event;
function emits(name) {
    return Event.emits(name);
}
exports.emits = emits;
function event(name) {
    return Event.emits(name);
}
exports.event = event;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Event;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvZXZlbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsNkNBQTZDO0FBRTdDLDBCQUE0QjtBQTZHNUI7SUF5Qkk7UUFBQSxpQkEyQkM7UUFuRE8sY0FBUyxHQUFnQyxFQUFFLENBQUM7UUFDNUMscUJBQWdCLEdBQVksS0FBSyxDQUFDO1FBRWxDLG9CQUFlLEdBQXNCLElBQUksQ0FBQztRQUUxQyxtQkFBYyxHQUFxQixJQUFJLENBQUM7UUFDeEMsa0JBQWEsR0FBMEIsSUFBSSxDQUFDO1FBQzVDLHNCQUFpQixHQUF1QixJQUFJLENBQUM7UUFDN0MscUJBQWdCLEdBQXVCLElBQUksQ0FBQztRQUU1QyxpQkFBWSxHQUFrQixJQUFJLENBQUM7UUFFbkMsaUJBQVksR0FBbUIsSUFBSSxDQUFDO1FBRXBDLGlCQUFZLEdBQW1CLElBQUksQ0FBQztRQUNwQyxrQkFBYSxHQUFvQixJQUFJLENBQUM7UUFFdEMsWUFBTyxHQUFlLElBQUksQ0FBQztRQUUzQix1QkFBa0IsR0FBWSxLQUFLLENBQUM7UUFFcEMsY0FBUyxHQUFXLENBQUMsQ0FBQztRQUkxQixJQUFJLENBQUMsZUFBZSxHQUFHLFVBQUMsUUFBVyxJQUFLLE9BQUEsS0FBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBdEIsQ0FBc0IsQ0FBQztRQUMvRCxJQUFJLENBQUMsY0FBYyxHQUFHO1lBQUMsY0FBYztpQkFBZCxVQUFjLEVBQWQscUJBQWMsRUFBZCxJQUFjO2dCQUFkLDZCQUFjOztZQUNqQyxNQUFNLENBQUMsS0FBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3pDLENBQUMsQ0FBQztRQUNGLElBQUksQ0FBQyxhQUFhLEdBQUc7WUFBQyxjQUFjO2lCQUFkLFVBQWMsRUFBZCxxQkFBYyxFQUFkLElBQWM7Z0JBQWQsNkJBQWM7O1lBQ2hDLE1BQU0sQ0FBQyxLQUFJ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cmVmZXJlbmNlIHBhdGg9XCIuLi90eXBpbmdzL2luZGV4LmQudHNcIi8+XG5cbmltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCB1dWlkIGZyb20gJ3V1aWQnO1xuXG5cbmV4cG9ydCBpbnRlcmZhY2UgRXZlbnRIYW5kbGVyPFQ+IHtcbiAgICAoZXZlbnRBcmc6IFQpOiB2b2lkXG59XG5cbmludGVyZmFjZSBFdmVudEhhbmRsZXJPcHRpb25zPFQ+IHtcbiAgICBoYW5kbGVyOiBFdmVudEhhbmRsZXI8VD47XG4gICAgb25jZT86IGJvb2xlYW47XG4gICAgY29udGV4dD86IE9iamVjdDtcbiAgICBuYW1lPzogc3RyaW5nO1xuICAgIG9ubHlNYXRjaGluZz86IGJvb2xlYW47XG4gICAgbWF0Y2hWYWx1ZT86IFQ7XG59XG5cbmludGVyZmFjZSBFdmVudEhhbmRsZXJEZXNjcmlwdG9yPFQ+IGV4dGVuZHMgRXZlbnRIYW5kbGVyT3B0aW9uczxUPiB7XG4gICAgaWQ6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBFdmVudFRyaWdnZXJlcjxUPiB7XG4gICAgKGFyZzogVCk6IHZvaWRcbn1cblxuZXhwb3J0IGludGVyZmFjZSBFdmVudExpc3RlbmVyPFQ+IHtcbiAgICAoaGFuZGxlcjogRXZlbnRIYW5kbGVyPFQ+LCBjb250ZXh0PzogT2JqZWN0KTogdm9pZDtcbiAgICAobmFtZTogc3RyaW5nLCBoOiBFdmVudEhhbmRsZXI8VD4sIGNvbnRleHQ/OiBPYmplY3QpOiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEV2ZW50VW5saXN0ZW5lcjxUPiB7XG4gICAgKGhhbmRsZXI6IEV2ZW50SGFuZGxlcjxUPiwgY29udGV4dD86IE9iamVjdCk6IHZvaWQ7XG4gICAgKGNvbnRleHQ6IE9iamVjdCk6IHZvaWQ7XG4gICAgKG5hbWU6IHN0cmluZyk6IHZvaWQ7XG4gICAgKCk6IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRXZlbnRPbmNlcjxUPiB7XG4gICAgKGhhbmRsZXI6IEV2ZW50SGFuZGxlcjxUPiwgY29udGV4dD86IE9iamVjdCk6IHZvaWRcbn1cblxuZXhwb3J0IGludGVyZmFjZSBFdmVudE1hdGNoTGlzdGVuZXI8VD4ge1xuICAgICh2YWx1ZTogVCwgaGFuZGxlcjogRXZlbnRIYW5kbGVyPFQ+LCBjb250ZXh0PzogT2JqZWN0KTogdm9pZDtcbiAgICAodmFsdWU6IFQsIG5hbWU6IHN0cmluZywgaDogRXZlbnRIYW5kbGVyPFQ+LCBjb250ZXh0PzogT2JqZWN0KTogdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBFdmVudE1hdGNoT25jZXI8VD4ge1xuICAgICh2YWx1ZTogVCwgaGFuZGxlcjogRXZlbnRIYW5kbGVyPFQ+LCBjb250ZXh0PzogT2JqZWN0KTogdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBFdmVudFdoZW5lcjxUPiB7XG4gICAgKCk6IFByb21pc2U8VD47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRXZlbnRUaGVuZXI8VD4ge1xuICAgIChvbk9rOiBGdW5jdGlvbiwgb25GYWlsOiBGdW5jdGlvbik6IFByb21pc2U8VD47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRXZlbnRDYXRjaGVyPFQ+IHtcbiAgICAob25GYWlsOiAoZXJyOmFueSkgPT4gVHxhbnkpOiBQcm9taXNlPFQ+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEV2ZW50RW1pdHRlcjxUPiBleHRlbmRzIFRoZW5hYmxlPFQ+IHtcbiAgICBsaXN0ZW4oaDogRXZlbnRIYW5kbGVyPFQ+LCBjb250ZXh0PzogT2JqZWN0KTogbnVtYmVyO1xuICAgIGxpc3RlbihuYW1lOiBzdHJpbmcsIGg6IEV2ZW50SGFuZGxlcjxUPiwgY29udGV4dD86IE9iamVjdCk6IG51bWJlcjtcbiAgICBtYXRjaCh2YWx1ZTogVCwgaDogRXZlbnRIYW5kbGVyPFQ+LCBjb250ZXh0PzogT2JqZWN0KTogbnVtYmVyO1xuICAgIG1hdGNoKHZhbHVlOiBULCBuYW1lOiBzdHJpbmcsIGg6IEV2ZW50SGFuZGxlcjxUPiwgY29udGV4dD86IE9iamVjdCk6IG51bWJlcjtcbiAgICBtYXRjaE9uY2UodmFsdWU6IFQsIGhhbmRsZXI6IEV2ZW50SGFuZGxlcjxUPiwgY29udGV4dD86IE9iamVjdCk6IG51bWJlcjtcbiAgICBvbihoOiBFdmVudEhhbmRsZXI8VD4sIGNvbnRleHQ/OiBPYmplY3QpOiBudW1iZXI7XG4gICAgb24obmFtZTogc3RyaW5nLCBoOiBFdmVudEhhbmRsZXI8VD4sIGNvbnRleHQ/OiBPYmplY3QpOiBudW1iZXI7XG5cbiAgICBhZnRlcihvblJlc29sdmU6IChyZXN1bHQ6IFR8YW55KT0+YW55KTogVGhlbmFibGU8VD47XG5cbiAgICB1bmxpc3RlbihoYW5kbGVyOiBFdmVudEhhbmRsZXI8VD4sIGNvbnRleHQ/OiBPYmplY3QpOiB2b2lkO1xuICAgIHVubGlzdGVuKGNvbnRleHQ6IE9iamVjdCk6IHZvaWQ7XG4gICAgdW5saXN0ZW4obmFtZTogc3RyaW5nKTogdm9pZDtcbiAgICB1bmxpc3RlbihpZDogbnVtYmVyKTogdm9pZDtcbiAgICB1bmxpc3RlbigpOiB2b2lkO1xuICAgIG9mZihoYW5kbGVyOiBFdmVudEhhbmRsZXI8VD4sIGNvbnRleHQ/OiBPYmplY3QpOiB2b2lkO1xuICAgIG9mZihjb250ZXh0OiBPYmplY3QpOiB2b2lkO1xuICAgIG9mZihuYW1lOiBzdHJpbmcpOiB2b2lkO1xuICAgIG9mZihpZDogbnVtYmVyKTogdm9pZDtcbiAgICBvZmYoKTogdm9pZDtcblxuICAgIHBpcGUob3RoZXI6IEV2ZW50RW1pdHRlcjxUPik6IHZvaWQ7XG5cbiAgICBvbmNlKGg6IEV2ZW50SGFuZGxlcjxUPiwgY29udGV4dD86IE9iamVjdCk6IG51bWJlcjtcblxuICAgIHdoZW4oKTogUHJvbWlzZTxUPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBFdmVudFRyYWl0PFQ+IGV4dGVuZHMgRXZlbnRFbWl0dGVyPFQ+IHtcbiAgICB0cmlnZ2VyKGFyZzogVCk6IHZvaWQ7XG5cbiAgICBnZXRUcmlnZ2VyZXIoKTogRXZlbnRUcmlnZ2VyZXI8VD47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRXZlbnRUcmFpdFRyaWdnZXI8VD4gZXh0ZW5kcyBFdmVudFRyYWl0PFQ+IHtcbiAgICAoYXJnOiBUKTogdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBFdmVudFRyYWl0ZWRNZXRob2Q8TWV0aG9kVCBleHRlbmRzICgpPT52b2lkLCBFdmVudEFyZ3NUPiBleHRlbmRzIEV2ZW50VHJhaXQ8RXZlbnRBcmdzVD4ge1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFRoZW5hYmxlPFQ+IHtcbiAgICB0aGVuKG9uUmVzb2x2ZTogKHJlc3VsdDogVCk9PmFueSwgb25SZWplY3Q/OiAoZXJyb3I6IEVycm9yfGFueSk9PmFueSk6IFRoZW5hYmxlPFQ+O1xuICAgIGNhdGNoKG9uUmVqZWN0OiAoZXJyb3I6IEVycm9yfGFueSk9PmFueSk6IFRoZW5hYmxlPFQ+O1xufSBcblxuZXhwb3J0IGNsYXNzIEV2ZW50PFQ+IGltcGxlbWVudHMgRXZlbnRUcmFpdDxUPiwgVGhlbmFibGU8VD4ge1xuICAgIHByaXZhdGUgbGlzdGVuZXJzOiBFdmVudEhhbmRsZXJEZXNjcmlwdG9yPFQ+W10gPSBbXTtcbiAgICBwcml2YXRlIGlzQmVpbmdUcmlnZ2VyZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAgIHByaXZhdGUgdHJpZ2dlckRlbGVnYXRlOiBFdmVudFRyaWdnZXJlcjxUPiA9IG51bGw7XG5cbiAgICBwcml2YXRlIGxpc3RlbkRlbGVnYXRlOiBFdmVudExpc3RlbmVyPFQ+ID0gbnVsbDtcbiAgICBwcml2YXRlIG1hdGNoRGVsZWdhdGU6IEV2ZW50TWF0Y2hMaXN0ZW5lcjxUPiA9IG51bGw7XG4gICAgcHJpdmF0ZSBtYXRjaE9uY2VEZWxlZ2F0ZTogRXZlbnRNYXRjaE9uY2VyPFQ+ID0gbnVsbDtcbiAgICBwcml2YXRlIHVubGlzdGVuRGVsZWdhdGU6IEV2ZW50VW5saXN0ZW5lcjxUPiA9IG51bGw7XG5cbiAgICBwcml2YXRlIG9uY2VEZWxlZ2F0ZTogRXZlbnRPbmNlcjxUPiA9IG51bGw7XG5cbiAgICBwcml2YXRlIHdoZW5EZWxlZ2F0ZTogRXZlbnRXaGVuZXI8VD4gPSBudWxsO1xuXG4gICAgcHJpdmF0ZSB0aGVuRGVsZWdhdGU6IEV2ZW50VGhlbmVyPFQ+ID0gbnVsbDtcbiAgICBwcml2YXRlIGNhdGNoRGVsZWdhdGU6IEV2ZW50Q2F0Y2hlcjxUPiA9IG51bGw7XG5cbiAgICBwcml2YXRlIHByb21pc2U6IFByb21pc2U8VD4gPSBudWxsOyBcbiAgICBwcml2YXRlIHJlc29sdmU6ICh2YWx1ZTogVCkgPT4gVDtcbiAgICBwcml2YXRlIGlzRmlyc3RUcmlnZ2VyRG9uZTogYm9vbGVhbiA9IGZhbHNlO1xuXG4gICAgcHJpdmF0ZSBpZENvdW50ZXI6IG51bWJlciA9IDA7XG5cblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnRyaWdnZXJEZWxlZ2F0ZSA9IChldmVudEFyZzogVCkgPT4gdGhpcy50cmlnZ2VyKGV2ZW50QXJnKTtcbiAgICAgICAgdGhpcy5saXN0ZW5EZWxlZ2F0ZSA9ICguLi5hcmdzOiBhbnlbXSk6IHZvaWQgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubGlzdGVuLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLm1hdGNoRGVsZWdhdGUgPSAoLi4uYXJnczogYW55W10pOiB2b2lkID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm1hdGNoLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLm1hdGNoT25jZURlbGVnYXRlID0gKC4uLmFyZ3M6IGFueVtdKTogdm9pZCA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5tYXRjaE9uY2UuYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgIH07IFxuICAgICAgICB0aGlzLnVubGlzdGVuRGVsZWdhdGUgPSAoLi4uYXJnczogYW55W10pOiB2b2lkID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnVubGlzdGVuLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLm9uY2VEZWxlZ2F0ZSA9IChoYW5kbGVyOiBFdmVudEhhbmRsZXI8VD4sIGNvbnRleHQ6IE9iamVjdCA9IG51bGwpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm9uY2UoaGFuZGxlciwgY29udGV4dCk7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMud2hlbkRlbGVnYXRlID0gKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMud2hlbigpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLnRoZW5EZWxlZ2F0ZSA9IChvbk9rOiBFdmVudEhhbmRsZXI8VD4sIG9uRmFpbDogRnVuY3Rpb24pID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnRoZW4ob25PaywgPGFueT5vbkZhaWwpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLmNhdGNoRGVsZWdhdGUgPSAob25GYWlsOiBGdW5jdGlvbikgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY2F0Y2goPGFueT5vbkZhaWwpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLnByb21pc2UgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZTogYW55KSA9PiB7IHRoaXMucmVzb2x2ZSA9IHJlc29sdmU7IH0pO1xuICAgIH1cbiAgICBcbiAgICBtaXhpbih0YXJnZXQ6IGFueSk6IEV2ZW50VHJhaXQ8VD4ge1xuICAgICAgICB0YXJnZXQudHJpZ2dlciA9IHRoaXMuZ2V0VHJpZ2dlcmVyKCk7XG4gICAgICAgIHRhcmdldC5nZXRUcmlnZ2VyZXIgPSAoKT0+e1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0VHJpZ2dlcmVyKCk7XG4gICAgICAgIH1cblxuICAgICAgICB0YXJnZXQubGlzdGVuID0gdGhpcy5nZXRMaXN0ZW5lcigpO1xuICAgICAgICB0YXJnZXQubWF0Y2ggPSB0aGlzLmdldE1hdGNoTGlzdGVuZXIoKTtcbiAgICAgICAgdGFyZ2V0Lm1hdGNoT25jZSA9IHRoaXMuZ2V0TWF0Y2hPbmNlcigpO1xuICAgICAgICB0YXJnZXQudW5saXN0ZW4gPSB0aGlzLmdldFVubGlzdGVuZXIoKTtcblxuICAgICAgICB0YXJnZXQub25jZSA9IHRoaXMuZ2V0T25jZXIoKTtcblxuICAgICAgICB0YXJnZXQud2hlbiA9IHRoaXMuZ2V0V2hlbmVyKCk7XG4gICAgICAgIHRhcmdldC50aGVuID0gdGhpcy5nZXRUaGVuZXIoKTtcbiAgICAgICAgdGFyZ2V0LmNhdGNoICA9dGhpcy5nZXRDYXRjaGVyKCk7XG5cbiAgICAgICAgcmV0dXJuIHRhcmdldDtcbiAgICB9XG5cbiAgICAvKiogUmV0dXJucyBhIGNvbnRleHQtaW5kZXBlbmRlbnQgY2FsbGJhY2sgdGhhdCB0cmlnZ2VycyB0aGUgZXZlbnQgd2l0aCBnaXZlbiBhcmd1bWVudCAqL1xuICAgIGdldFRyaWdnZXJlcigpOiBFdmVudFRyaWdnZXJlcjxUPiB7IHJldHVybiB0aGlzLnRyaWdnZXJEZWxlZ2F0ZTsgfVxuICAgIGdldExpc3RlbmVyKCk6IEV2ZW50TGlzdGVuZXI8VD4geyByZXR1cm4gdGhpcy5saXN0ZW5EZWxlZ2F0ZTsgfVxuICAgIGdldE1hdGNoTGlzdGVuZXIoKTogRXZlbnRNYXRjaExpc3RlbmVyPFQ+IHsgcmV0dXJuIHRoaXMubWF0Y2hEZWxlZ2F0ZTsgfVxuICAgIGdldE1hdGNoT25jZXIoKTogRXZlbnRNYXRjaE9uY2VyPFQ+IHsgcmV0dXJuIHRoaXMubWF0Y2hPbmNlRGVsZWdhdGU7IH1cbiAgICBnZXRVbmxpc3RlbmVyKCk6IEV2ZW50VW5saXN0ZW5lcjxUPiB7IHJldHVybiB0aGlzLnVubGlzdGVuRGVsZWdhdGU7IH1cbiAgICBnZXRPbmNlcigpOiBFdmVudE9uY2VyPFQ+IHsgcmV0dXJuIHRoaXMub25jZURlbGVnYXRlOyB9XG4gICAgZ2V0V2hlbmVyKCk6IEV2ZW50V2hlbmVyPFQ+IHsgcmV0dXJuIHRoaXMud2hlbkRlbGVnYXRlOyB9XG4gICAgZ2V0VGhlbmVyKCk6IEV2ZW50VGhlbmVyPFQ+IHsgcmV0dXJuIHRoaXMudGhlbkRlbGVnYXRlOyB9XG4gICAgZ2V0Q2F0Y2hlcigpOiBFdmVudENhdGNoZXI8VD4geyByZXR1cm4gdGhpcy5jYXRjaERlbGVnYXRlOyB9XG5cbiAgICAvKipcbiAgICAgKiBUcmlnZ2VycyB0aGUgZXZlbnQgd2l0aCBnaXZlbiBhcmd1bWVudCwgaW52b2tpbmcgYWxsIG9mIGl0cyBoYW5kbGVycywgYW5kIGlmXG4gICAgICogdGhlIGV2ZW50IGlzIHRyaWdnZXJlZCBmb3IgdGhlIGZpcnN0IHRpbWUgLSByZW1vdmluZyB0aGUgb25jZSBldmVudCBoYW5kbGVycyBhbmRcbiAgICAgKiBzYXZpbmcgZ2l2ZW4gYXJndW1lbnQgaW5ldHJuYWxseSBhcyBmaXJzdCB0cmlnZ2VyIGFyZ3VtZW50LlxuICAgICAqL1xuICAgIHRyaWdnZXIoZXZlbnRBcmc/OiBUKTogdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLmlzQmVpbmdUcmlnZ2VyZWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRXZlbnQgdHJpZ2dlcmVkIGR1cmluZyB0cmlnZ2VyIGhhbmRsaW5nIC0gc3VzcGVjdGluZyByZWN1cnNpdmUgZXZlbnQuYCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pc0JlaW5nVHJpZ2dlcmVkID0gdHJ1ZTtcbiAgICAgICAgaWYgKCF0aGlzLmlzRmlyc3RUcmlnZ2VyRG9uZSkge1xuICAgICAgICAgICAgdGhpcy5pc0ZpcnN0VHJpZ2dlckRvbmUgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5yZXNvbHZlKGV2ZW50QXJnKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxpc3RlbmVycy5zbGljZSgpLmZvckVhY2goKGxpc3RlbmVyKSA9PiB7XG4gICAgICAgICAgICBsZXQgZG9DYWxsID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChsaXN0ZW5lci5vbmx5TWF0Y2hpbmcpIHtcbiAgICAgICAgICAgICAgICBkb0NhbGwgPSBsaXN0ZW5lci5tYXRjaFZhbHVlID09PSBldmVudEFyZztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKGRvQ2FsbCkge1xuICAgICAgICAgICAgICAgIGlmIChsaXN0ZW5lci5jb250ZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgIGxpc3RlbmVyLmhhbmRsZXIuY2FsbChsaXN0ZW5lci5jb250ZXh0LCBldmVudEFyZyk7IFxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGxpc3RlbmVyLmhhbmRsZXIuY2FsbChudWxsLCBldmVudEFyZyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChsaXN0ZW5lci5vbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuaXNCZWluZ1RyaWdnZXJlZCA9IGZhbHNlO1xuICAgIH0gIFxuXG4gICAgLyoqXG4gICAgICogQWRkcyBhIGxpc3RlbmVyLiBJZiBvbmNlPXRydWUgdGhlbiBhZGRzIG9uY2UgbGlzdGVuZXIgd2hpY2ggbWVhbnMgdGhhdCBsaXN0ZW5lciB3aWxsIGJlIHJlbW92ZWQsXG4gICAgICogd2hlbiBldmVudCB0cmlnZ2VycyBmb3IgdGhlIGZpcnN0IHRpbWUuIEFsc28gaWYgZXZlbnQgYWxscmVhZHkgd2FzIHRyaWdnZXJlZCBmb3IgdGhlIGZpcnN0IHRpbWVcbiAgICAgKiB3aGVuIHlvdSBjYWxsICdhZGQoKScgdGhlbiBvbmNlIGxpc3RlbmVyIHdpbGwgbm90IGJlIGFkZGVkIGJ1dCBpbnN0ZWFkIGludm9rZWQgaW1taWRpYXRlbHksXG4gICAgICogd2l0aCBhcmd1bWVudCwgdGhhdCBldmVudCB3YXMgdHJpZ2dlcmVkIHdpdGggdGhlIGZpcnN0IHRpbWUuXG4gICAgICovXG4gICAgbGlzdGVuKGhhbmRsZXI6IEV2ZW50SGFuZGxlcjxUPiwgY29udGV4dD86IE9iamVjdCk6IG51bWJlcjtcbiAgICBsaXN0ZW4obmFtZTogc3RyaW5nLCBoOiBFdmVudEhhbmRsZXI8VD4sIGNvbnRleHQ/OiBPYmplY3QpOiBudW1iZXI7XG4gICAgbGlzdGVuKC4uLmFyZ3M6IGFueVtdKTogbnVtYmVyIHtcbiAgICAgICAgbGV0IGlkOiBudW1iZXI7XG4gICAgICAgIGlmICh0eXBlb2YgYXJnc1swXSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGxldCBbbmFtZSwgaGFuZGxlciwgY29udGV4dF0gPSBhcmdzO1xuICAgICAgICAgICAgaWQgPSB0aGlzLmFkZExpc3RlbmVyKHsgbmFtZSwgaGFuZGxlciwgY29udGV4dCB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxldCBbaGFuZGxlciwgY29udGV4dF0gPSBhcmdzO1xuICAgICAgICAgICAgaWQgPSB0aGlzLmFkZExpc3RlbmVyKHsgaGFuZGxlciwgY29udGV4dCB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaWQ7XG4gICAgfTtcblxuICAgIG1hdGNoKHZhbHVlOiBULCBoOiBFdmVudEhhbmRsZXI8VD4sIGNvbnRleHQ/OiBPYmplY3QpOiBudW1iZXI7XG4gICAgbWF0Y2godmFsdWU6IFQsIG5hbWU6IHN0cmluZywgaDogRXZlbnRIYW5kbGVyPFQ+LCBjb250ZXh0PzogT2JqZWN0KTogbnVtYmVyO1xuICAgIG1hdGNoKHZhbHVlOiBULCAuLi5hcmdzOiBhbnlbXSk6IG51bWJlciB7XG4gICAgICAgIGxldCBpZDogbnVtYmVyO1xuICAgICAgICBpZiAodHlwZW9mIGFyZ3NbMF0gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBsZXQgW25hbWUsIGhhbmRsZXIsIGNvbnRleHRdID0gYXJncztcbiAgICAgICAgICAgIGlkID0gdGhpcy5hZGRMaXN0ZW5lcih7IG5hbWUsIGhhbmRsZXIsIGNvbnRleHQsIG9ubHlNYXRjaGluZzogdHJ1ZSwgbWF0Y2hWYWx1ZTogdmFsdWUgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsZXQgW2hhbmRsZXIsIGNvbnRleHRdID0gYXJncztcbiAgICAgICAgICAgIGlkID0gdGhpcy5hZGRMaXN0ZW5lcih7IGhhbmRsZXIsIGNvbnRleHQsIG9ubHlNYXRjaGluZzogdHJ1ZSwgbWF0Y2hWYWx1ZTogdmFsdWUgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGlkO1xuICAgIH07XG5cbiAgICBtYXRjaE9uY2UodmFsdWU6IFQsIGhhbmRsZXI6IEV2ZW50SGFuZGxlcjxUPiwgY29udGV4dDogT2JqZWN0ID0gbnVsbCk6IG51bWJlciB7XG4gICAgICAgICByZXR1cm4gdGhpcy5hZGRMaXN0ZW5lcih7IGNvbnRleHQsIGhhbmRsZXIsIG9uY2U6IHRydWUsIG9ubHlNYXRjaGluZzogdHJ1ZSwgbWF0Y2hWYWx1ZTogdmFsdWUgfSk7XG4gICAgfVxuXG4gICAgb25jZShoYW5kbGVyOiBFdmVudEhhbmRsZXI8VD4sIGNvbnRleHQ6IE9iamVjdCA9IG51bGwpOiBudW1iZXIge1xuICAgICAgICAgcmV0dXJuIHRoaXMuYWRkTGlzdGVuZXIoeyBjb250ZXh0LCBoYW5kbGVyLCBvbmNlOiB0cnVlIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBhIGxpc3RlbmVyKHMpLiBXaGVuIG5vIGNvbnRleHQgZ2l2ZW4gcmVtb3ZlcyBhbGwgbGlzdGVuZXJzLCB0aGF0IHdlcmUgYXR0YWNoZWRcbiAgICAgKiB3aXRob3V0IGEgY29udGV4dC4gV2hlbiBhIGNvbnRleHQgaXMgZ2l2ZW4gcmVtb3ZlcyBvbmx5IGxpc3RlbmVycyB0aGF0IHdlcmUgYXR0YWNoZWQgd2l0aFxuICAgICAqIHRoYXQgY29udGV4dCBhbmQgZG9lc24ndCByZW1vdmUgYW55IGxpc3RlbmVycyB0aGF0IHdlcmUgYXR0YWNoZWQgd2l0aG91dCBhIGNvbnRleHQuXG4gICAgICovXG4gICAgdW5saXN0ZW4oaGFuZGxlcjogRXZlbnRIYW5kbGVyPFQ+LCBjb250ZXh0PzogT2JqZWN0KTogdm9pZDtcbiAgICB1bmxpc3Rlbihjb250ZXh0OiBPYmplY3QpOiB2b2lkO1xuICAgIHVubGlzdGVuKG5hbWU6IHN0cmluZyk6IHZvaWQ7XG4gICAgdW5saXN0ZW4oaWQ6IG51bWJlcik6IHZvaWQ7XG4gICAgdW5saXN0ZW4oKTogdm9pZDtcbiAgICB1bmxpc3RlbiguLi5hcmdzOiBhbnlbXSk6IHZvaWQge1xuICAgICAgICBsZXQgbmFtZTogc3RyaW5nID0gbnVsbCwgY29udGV4dDogT2JqZWN0LCBoYW5kbGVyOiBFdmVudEhhbmRsZXI8VD4sIGlkVG9SZW1vdmU6IG51bWJlciA9IG51bGw7IFxuICAgICAgICBzd2l0Y2ggKGFyZ3MubGVuZ3RoKSB7XG4gICAgICAgICAgICBjYXNlIDA6IHRoaXMubGlzdGVuZXJzID0gW107IHJldHVybjtcbiAgICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGFyZ3NbMF0gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWUgPSBhcmdzWzBdO1xuICAgICAgICAgICAgICAgICAgICBoYW5kbGVyID0gYXJnc1sxXTtcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dCA9IGFyZ3NbMl07XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgYXJnc1swXSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICAgICAgICAgICAgaWRUb1JlbW92ZSA9IGFyZ3NbMF07XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlciA9IGFyZ3NbMF07XG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQgPSBhcmdzWzFdO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICAgICAgaGFuZGxlciA9IGFyZ3NbMF07XG4gICAgICAgICAgICAgICAgY29udGV4dCA9IGFyZ3NbMV07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxpc3RlbmVycyA9IF8uZmlsdGVyKHRoaXMubGlzdGVuZXJzLCAoaENvbmY6IEV2ZW50SGFuZGxlckRlc2NyaXB0b3I8VD4pID0+IHtcbiAgICAgICAgICAgIGxldCBkaWZmZXJlbnRIYW5kbGVyOiBib29sZWFuID0gaENvbmYuaGFuZGxlciAhPT0gaGFuZGxlcjtcbiAgICAgICAgICAgIGxldCBub0NvbnRleHRHaXZlbjogYm9vbGVhbiA9IGNvbnRleHQgPT09IG51bGw7XG4gICAgICAgICAgICBsZXQgY29uZkhhc05vQ29udGV4dDogYm9vbGVhbiA9ICEhaENvbmYuY29udGV4dDtcbiAgICAgICAgICAgIGxldCBkaWZmZXJlbnRDb250ZXh0OiBib29sZWFuID0gaENvbmYuY29udGV4dCAhPT0gY29udGV4dDtcbiAgICAgICAgICAgIGxldCBzYW1lTmFtZSA9IG5hbWUgJiYgaENvbmYubmFtZSAmJiAobmFtZSA9PT0gaENvbmYubmFtZSk7XG4gICAgICAgICAgICBsZXQgZG9udFJlbW92ZTogYm9vbGVhbjtcbiAgICAgICAgICAgIGlmIChpZFRvUmVtb3ZlICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZG9udFJlbW92ZSA9IGlkVG9SZW1vdmUgIT09IGhDb25mLmlkO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAobmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBkb250UmVtb3ZlID0gIXNhbWVOYW1lO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkaWZmZXJlbnRIYW5kbGVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkb250UmVtb3ZlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvbnRSZW1vdmUgPSBub0NvbnRleHRHaXZlbiA/ICghY29uZkhhc05vQ29udGV4dCkgOiAoY29uZkhhc05vQ29udGV4dCB8fCBkaWZmZXJlbnRDb250ZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIGRvbnRSZW1vdmU7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIG9uKG5hbWU6IHN0cmluZywgaDogRXZlbnRIYW5kbGVyPFQ+KTogbnVtYmVyO1xuICAgIG9uKGhhbmRsZXI6IEV2ZW50SGFuZGxlcjxUPik6IG51bWJlcjtcbiAgICBvbihuYW1lT3JIYW5kbGVyOiBFdmVudEhhbmRsZXI8VD58c3RyaW5nLCBoYW5kbGVyT3JOb3RoaW5nPzogRXZlbnRIYW5kbGVyPFQ+KTogbnVtYmVyIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubGlzdGVuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgb2ZmKGhhbmRsZXI6IEV2ZW50SGFuZGxlcjxUPiwgY29udGV4dD86IE9iamVjdCk6IHZvaWQ7XG4gICAgb2ZmKGNvbnRleHQ6IE9iamVjdCk6IHZvaWQ7XG4gICAgb2ZmKG5hbWU6IHN0cmluZyk6IHZvaWQ7XG4gICAgb2ZmKGlkOiBudW1iZXIpOiB2b2lkO1xuICAgIG9mZigpOiB2b2lkO1xuICAgIG9mZihidWxsc2hpdFdURj86IEV2ZW50SGFuZGxlcjxUPnxzdHJpbmd8bnVtYmVyLCBjb250ZXh0PzogT2JqZWN0KTogdm9pZCB7XG4gICAgICAgIHJldHVybiB0aGlzLnVubGlzdGVuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgd2hlbigpOiBQcm9taXNlPFQ+IHsgcmV0dXJuIHRoaXMucHJvbWlzZTsgfVxuICAgIHRoZW4ob25PazogKHI6IFQpPT4gVHxhbnksIG9uRmFpbD86IChlOiBhbnkpPT5UfGFueSk6IFByb21pc2U8VD4geyByZXR1cm4gdGhpcy53aGVuKCkudGhlbihvbk9rLCBvbkZhaWwpOyB9XG4gICAgYWZ0ZXIob25Bbnk6IChyOiBUfGFueSk9PlR8YW55KTogUHJvbWlzZTxUPiB7IHJldHVybiB0aGlzLnRoZW4ob25BbnkpLmNhdGNoKG9uQW55KTt9XG4gICAgY2F0Y2gob25GYWlsOiAoZTogYW55KT0+VHxhbnkpOiBQcm9taXNlPFQ+IHsgcmV0dXJuIHRoaXMud2hlbigpLmNhdGNoKG9uRmFpbCk7IH1cblxuICAgIHBpcGUob3RoZXI6IEV2ZW50PFQ+KTogdm9pZCB7XG4gICAgICAgIHRoaXMub24ob3RoZXIuZ2V0VHJpZ2dlcmVyKCkpO1xuICAgIH1cbiAgICB1bnBpcGUob3RoZXI6IEV2ZW50PFQ+KTogdm9pZCB7XG4gICAgICAgIHRoaXMub2ZmKG90aGVyLmdldFRyaWdnZXJlcigpKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyOiBFdmVudEhhbmRsZXJEZXNjcmlwdG9yPFQ+KTogdm9pZCB7XG4gICAgICAgIGxldCBsaXN0ZW5lckluZGV4ID0gdGhpcy5saXN0ZW5lcnMuaW5kZXhPZihsaXN0ZW5lcik7XG4gICAgICAgIGlmIChsaXN0ZW5lckluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgdGhpcy5saXN0ZW5lcnMuc3BsaWNlKGxpc3RlbmVySW5kZXgsIDEpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhZGRMaXN0ZW5lcihvcHRpb25zOiBFdmVudEhhbmRsZXJPcHRpb25zPFQ+KTogbnVtYmVyIHtcbiAgICAgICAgbGV0IHtjb250ZXh0LCBoYW5kbGVyLCBvbmNlLCBvbmx5TWF0Y2hpbmcsIG1hdGNoVmFsdWV9ID0gb3B0aW9ucztcbiAgICAgICAgdGhpcy5pZENvdW50ZXIrKztcbiAgICAgICAgdGhpcy5saXN0ZW5lcnMucHVzaCh7Y29udGV4dCwgaGFuZGxlciwgb25jZSwgaWQ6IHRoaXMuaWRDb3VudGVyLCBvbmx5TWF0Y2hpbmcsIG1hdGNoVmFsdWV9KTtcbiAgICAgICAgcmV0dXJuIHRoaXMuaWRDb3VudGVyO1xuICAgIH1cblxuICAgIHN0YXRpYyBldmVudDxFdmVudFQ+KCk6IFByb3BlcnR5RGVjb3JhdG9yIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChwcm90b3R5cGU6IE9iamVjdCwgZXZlbnROYW1lOiBzdHJpbmcpOiBQcm9wZXJ0eURlc2NyaXB0b3Ige1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgICAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgZ2V0KCkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgZXZlbnQgPSBuZXcgRXZlbnQ8RXZlbnRUPigpO1xuICAgICAgICAgICAgICAgICAgICBSZWZsZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIGV2ZW50TmFtZSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgd3JpdGFibGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGV2ZW50XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZXZlbnQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHN0YXRpYyBlbWl0czxFdmVudFQ+KGV2ZW50TmFtZTogc3RyaW5nKSB7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChwcm90b3R5cGU6IE9iamVjdCwgbWV0aG9kTmFtZTogc3RyaW5nLCBvcmlnaW5hbDogUHJvcGVydHlEZXNjcmlwdG9yKTogUHJvcGVydHlEZXNjcmlwdG9yIHtcbiAgICAgICAgICAgIGxldCBvcmlnaW5hbE1ldGhvZDogRnVuY3Rpb24gPSBvcmlnaW5hbC52YWx1ZTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgbGV0IGRlc2NyaXB0b3IgPSB7XG4gICAgICAgICAgICAgICAgY29uZmlndXJhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICB3cml0ZWFibGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHZhbHVlKC4uLmFyZ3M6IGFueVtdKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCByZXN1bHQgPSBvcmlnaW5hbE1ldGhvZC5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpc1tldmVudE5hbWVdLnRyaWdnZXIocmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuIGRlc2NyaXB0b3I7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbWl0cyhuYW1lOiBzdHJpbmcpOiBNZXRob2REZWNvcmF0b3Ige1xuICAgIHJldHVybiBFdmVudC5lbWl0cyhuYW1lKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGV2ZW50KG5hbWU6IHN0cmluZyk6IE1ldGhvZERlY29yYXRvciB7XG4gICAgcmV0dXJuIEV2ZW50LmVtaXRzKG5hbWUpO1xufVxuXG5leHBvcnQgZGVmYXVsdCBFdmVudDsiXX0=