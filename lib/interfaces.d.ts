declare namespace Interfaces {
    /**
     * The callback format used for adding listeners to EventProperty.
     */
    interface Handler<T> {
        (eventArg: T): void;
    }
    /**
     * The format of the EventProperty.emit method.
     */
    interface EmitMethod<T> {
        (eventArg: T): void;
    }
    /**
     * The format of the EventProperty:emit method for T=void.
     */
    interface VoidEmitMethod {
        (): void;
    }
    /**
     * This type is used just to emphasize the meaning of the value.
     * Otherwise listeners ids are regular numbers.
     */
    type ListenerId = number;
    /**
     * This method is used just to emphasize the meaning of the value.
     * Otherwise we could just use typeof id === "number" directly.
     */
    function isListenerId(id: any): boolean;
    /**
     * The full configuration for a specific listener. It controls the way
     * the relevant event-handler function is invoked.
     */
    interface HandlerOptions<T> {
        /**
         * The actual handler function to be called when the event occurs.
         */
        handler: Handler<T>;
        /**
         * If this flag is set - the event handler will remove itself from
         * the event after first invocation.
         */
        once?: boolean;
        /**
         * If this field is specified, then handler will be called with that context.
         */
        context?: Object;
        /**
         * Always used in combination with following parameter 'matchValue' and is a
         * flag, which means(if set) that only event invocations with argument matching
         * 'matchValue' should be passed to the handler function.
         *
         * What "matching" means is not documented well yet since it is subject to change.
         * For now you may assume that for plain types (boolean, number, string) it is
         * strict equality.
         */
        onlyMatching?: boolean;
        /**
         * The value, to be matched if the 'onlyMatching' flag is set.
         */
        matchValue?: T | RegExp;
    }
    /**
     * This is the object which represents an existing handler internally in EventProperty object.
     *
     * EventProperty stores listeners as HandlerOptions + listenerId.
     */
    interface HandlerDescriptor<T> extends HandlerOptions<T> {
        id: ListenerId;
    }
    interface Controller<T> {
        emit(eventArgument: T): void;
    }
    /**
     * An EventProperty interface without the 'emit' method.
     *
     * It is a good practice to provide public access to EventProperties in this form
     * and not in the original EventProperty form.
     * EventProperty usually relates to some class and only that class should be able to
     * trigger/emit the event. On the other hand anyone should be able to listen to this
     * event. This library offers special interface for this purpose and a few utility
     * functions (make, split. splitVoid).
     *
     * The idea is to create a private EventProperty member and public
     * EventProperty.Emitter getter which return that private member.
     * You don't have to do it if you think it's too cumbersome though.
     */
    interface Emitter<T> {
        /**
         * Adds a listener for this event type.
         *
         * @param {EventProperty.Handler<T>} handler - callback to be called when an event is emitted
         * @param {Object} [context] - context to be used when calling handler. null by default.
         * @returns {EventProperty.ListenerId} - number, identifying new event listener.
         */
        on(handler: Handler<T>, context?: Object): ListenerId;
        /**
         * Adds a listener for this event type. This listener will be immediately removed after it's
         * invoked for the first time.
         *
         * @param {EventProperty.Handler<T>} handler - callback to be called when an event is emitted
         * @param {Object} [context] - context to be used when calling handler. null by default.
         * @returns {EventProperty.ListenerId} - number, identifying new event listener.
         */
        once(handler: Handler<T>, context?: Object): ListenerId;
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
        match(value: T | RegExp, handler: Handler<T>, context?: Object): ListenerId;
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
        matchOnce(value: T | RegExp, handler: Handler<T>, context?: Object): ListenerId;
        /**
         * "Pipes" EventProperty to other EventProperty. This means that whenever this event
         * is emitted it is passed to that other EventProperty which emits it too.
         *
         * @param {EventProperty<T>} other
         * @returns {EventProperty.ListenerId}
         */
        pipe(other: Emitter<T>): ListenerId;
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
        route(matchValue: T | RegExp, destination: Emitter<T>): ListenerId;
        /**
         * Adds an initialization handler. Initialization handlers are invoked during the very first
         * emit of event in this EventProperty. If first emit already occurred then the handler is
         * invoked immediately.
         *
         * @param {EventProperty.Handler<T>} handler - callback to be invoked when event is emitted first time
         * @param {Object} [context] - handler will be invoked in this context
         * @returns {
         */
        init(handler: Handler<T>, context?: Object): Promise<T>;
        /**
         * Removes all listeners that were attached with given handler and without a context.
         * Note: it will never remove any listener that was attached with a context.
         *
         * @param {EventProperty.Handler<T>} handler - remove listeners having this handler
         */
        off(handler: Handler<T>): void;
        /**
         * Removes listeners that were attached with given handler and context.
         * Note: it will never remove any listener that was attached without a context.
         *
         * @param {EventProperty.Handler<T>} handler - remove listeners having this handler
         * @param {Object} [context] - remove only listeners having this context
         */
        off(handler: Handler<T>, context: Object): void;
        /**
         * Removes all listeners having this context
         *
         * @param {Object} context
         */
        off(context: Object): void;
        /**
         * Removes listener with given id.
         *
         * @param {EventProperty.ListenerId} id
         */
        off(id: ListenerId): void;
        /**
         * Remove pipes created for other EventProperty.
         *
         * @param {EventProperty} destination
         */
        off(destination: Emitter<T>): void;
        /**
         * Remove all listeners.
         */
        off(): void;
    }
    interface PropertyModel<T> {
        changed: Emitter<T>;
        priorValue: T;
        value: T;
        syncTo(other: PropertyModel<T>): void;
        toJSON(): string;
        fromJSON(json: string): void;
        toString(): string;
        valueOf(): any;
    }
}
export default Interfaces;
