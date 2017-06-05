<a name="EventProperty"></a>

## EventProperty
Represents a certain type of events.
Provides methods to observe and to trigger(emit) events of that type.

**Kind**: global class  

* [EventProperty](#EventProperty)
    * _instance_
        * [.emit(eventArg)](#EventProperty+emit)
        * [.on(handler, [context])](#EventProperty+on) ⇒ <code>EventProperty.ListenerId</code>
        * [.once(handler, [context])](#EventProperty+once) ⇒ <code>EventProperty.ListenerId</code>
        * [.match(value, handler, [context])](#EventProperty+match) ⇒ <code>EventProperty.ListenerId</code>
        * [.matchOnce(value, handler, [context])](#EventProperty+matchOnce) ⇒ <code>EventProperty.ListenerId</code>
        * [.pipe(other)](#EventProperty+pipe) ⇒ <code>EventProperty.ListenerId</code>
        * [.route(matchValue, destination)](#EventProperty+route) ⇒ <code>EventProperty.ListenerId</code>
        * [.init(handler, [context])](#EventProperty+init)
    * _static_
        * [.Void](#EventProperty.Void)
            * [new Void()](#new_EventProperty.Void_new)
            * [.emit()](#EventProperty.Void+emit)
        * [.make()](#EventProperty.make)
        * [.split()](#EventProperty.split)
        * [.splitVoid()](#EventProperty.splitVoid)

<a name="EventProperty+emit"></a>

### eventProperty.emit(eventArg)
Emits event with given argument. This invokes all appropriate handlers.

**Kind**: instance method of [<code>EventProperty</code>](#EventProperty)  

| Param | Type | Description |
| --- | --- | --- |
| eventArg | <code>T</code> | event argument, it's passed to each event handler. |

<a name="EventProperty+on"></a>

### eventProperty.on(handler, [context]) ⇒ <code>EventProperty.ListenerId</code>
Adds a listener.

**Kind**: instance method of [<code>EventProperty</code>](#EventProperty)  
**Returns**: <code>EventProperty.ListenerId</code> - - number, identifying new event listener.  

| Param | Type | Description |
| --- | --- | --- |
| handler | <code>EventProperty.Handler.&lt;T&gt;</code> | callback to be called when an event is emitted |
| [context] | <code>Object</code> | context to be used when calling handler. null by default. |

<a name="EventProperty+once"></a>

### eventProperty.once(handler, [context]) ⇒ <code>EventProperty.ListenerId</code>
Adds a listener. This listener will be immediately removed after it's
invoked for the first time.

**Kind**: instance method of [<code>EventProperty</code>](#EventProperty)  
**Returns**: <code>EventProperty.ListenerId</code> - - number, identifying new event listener.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| handler | <code>EventProperty.Handler.&lt;T&gt;</code> |  | callback to be called when an event is emitted |
| [context] | <code>Object</code> | <code></code> | context to be used when calling handler. null by default. |

<a name="EventProperty+match"></a>

### eventProperty.match(value, handler, [context]) ⇒ <code>EventProperty.ListenerId</code>
Adds a listener. This listener will be invoked only if event argument
matches given value.

Note: what "matching" means is not documented well yet since it is subject to change.
For now you should assume that for plain types (boolean, number, string) it is
strict equality. For objects it is like deep strict equality except that actual
event argument may have more fields than match-value(proto). But all fields from
match-value must be present in event argument.

**Kind**: instance method of [<code>EventProperty</code>](#EventProperty)  
**Returns**: <code>EventProperty.ListenerId</code> - - number, identifying new event listener.  
**See**: objectMatch  

| Param | Type | Description |
| --- | --- | --- |
| value | <code>T</code> \| <code>RegExp</code> | handler is invoked only if event argument matches this value |
| handler | <code>EventProperty.Handler.&lt;T&gt;</code> | callback to be called when an event is emitted |
| [context] | <code>Object</code> | context to be used when calling handler. null by default. |

<a name="EventProperty+matchOnce"></a>

### eventProperty.matchOnce(value, handler, [context]) ⇒ <code>EventProperty.ListenerId</code>
Adds a listener for this event type. This listener will be invoked only if event argument
matches given value. This listener will be immediately removed after it's invoked
for the first time.

Note: what "matching" means is not documented well yet since it is subject to change.
For now you should assume that for plain types (boolean, number, string) it is
strict equality. For objects it is like deep strict equality except that actual
event argument may have more fields than match-value(proto). But all fields from
match-value must be present in event argument.

**Kind**: instance method of [<code>EventProperty</code>](#EventProperty)  
**Returns**: <code>EventProperty.ListenerId</code> - - number, identifying new event listener.  
**See**: PropertyEvent.match, PropertyEvent.once  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| value | <code>T</code> \| <code>RegExp</code> |  | handler is invoked only if event argument matches this value |
| handler | <code>EventProperty.Handler.&lt;T&gt;</code> |  | callback to be called when an event is emitted |
| [context] | <code>Object</code> | <code></code> | context to be used when calling handler. null by default. |

<a name="EventProperty+pipe"></a>

### eventProperty.pipe(other) ⇒ <code>EventProperty.ListenerId</code>
"Pipes" EventProperty to other EventProperty. This means that whenever this event
is emitted it is passed to that other EventProperty which emits it too.

**Kind**: instance method of [<code>EventProperty</code>](#EventProperty)  

| Param | Type |
| --- | --- |
| other | <code>EventProperty.&lt;T&gt;</code> | 

<a name="EventProperty+route"></a>

### eventProperty.route(matchValue, destination) ⇒ <code>EventProperty.ListenerId</code>
Pipe only events with matching argument to destination EventProperty.

Note: what "matching" means is not documented well yet since it is subject to change.
For now you should assume that for plain types (boolean, number, string) it is
strict equality. For objects it is like deep strict equality except that actual
event argument may have more fields than match-value(proto). But all fields from
match-value must be present in event argument.

**Kind**: instance method of [<code>EventProperty</code>](#EventProperty)  
**See**: EventProperty.pipe, EventProperty.match  

| Param | Type | Description |
| --- | --- | --- |
| matchValue | <code>T</code> \| <code>RegExp</code> | value to match |
| destination | <code>EventProperty.&lt;T&gt;</code> | target EventProperty |

<a name="EventProperty+init"></a>

### eventProperty.init(handler, [context])
Adds an initialization handler. Initialization handlers are invoked during the very first
emit of event in this EventProperty. If first emit already occurred then the handler is
invoked immediately.

**Kind**: instance method of [<code>EventProperty</code>](#EventProperty)  

| Param | Type | Description |
| --- | --- | --- |
| handler | <code>EventProperty.Handler.&lt;T&gt;</code> | callback to be invoked when event is emitted first time |
| [context] | <code>Object</code> | handler will be invoked in this context |

<a name="EventProperty.Void"></a>

### EventProperty.Void
**Kind**: static class of [<code>EventProperty</code>](#EventProperty)  
**See**: {EventProperty}  

* [.Void](#EventProperty.Void)
    * [new Void()](#new_EventProperty.Void_new)
    * [.emit()](#EventProperty.Void+emit)

<a name="new_EventProperty.Void_new"></a>

#### new Void()
Special subclass of EventProperty for void type - allows calling emit without arguments.
Extends [EventProperty](#EventProperty)

<a name="EventProperty.Void+emit"></a>

#### void.emit()
Emits an event invoking all listeners.

**Kind**: instance method of [<code>Void</code>](#EventProperty.Void)  
**See**: {EventProperty#emit}  
<a name="EventProperty.make"></a>

### EventProperty.make()
Creates a pair: an EventProperty instance to be used internally in a class
and an Emitter-interface to be used as public / accessible property.
They both actually represent the same EventProperty object.

returns {[EventProperty,EventProperty.Emitter<T>]}

**Kind**: static method of [<code>EventProperty</code>](#EventProperty)  
<a name="EventProperty.split"></a>

### EventProperty.split()
Creates an EventProperty object and splits it into emitter-function and
Emitter-interface. Use emitter function to emit the event and Emitter-interface
to add and remove listeners of that event.

returns {[EventProperty.EmitMethod<T>,EventProperty.Emitter<T>]}

**Kind**: static method of [<code>EventProperty</code>](#EventProperty)  
<a name="EventProperty.splitVoid"></a>

### EventProperty.splitVoid()
Creates an EventProperty object and splits it into emitter-function and
Emitter-interface. Special version for void-typed events.

returns {[EventProperty.VoidEmitMethod,EventProperty.Emitter<T>]}

**Kind**: static method of [<code>EventProperty</code>](#EventProperty)  
