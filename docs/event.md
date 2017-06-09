## Classes

<dl>
<dt><a href="#EventProperty">EventProperty</a></dt>
<dd><p>Represents a certain kind of events.
Provides methods to observe and to trigger(emit) that kind of events.</p>
</dd>
<dt><a href="#Beacon">Beacon</a></dt>
<dd><p>Represents a model of a single property of type T. A basic element for constructing models.</p>
<ul>
<li>Property can be retrieved/changed by using the .value property of the beacon.</li>
<li>Setting new value will trigger the &#39;changed&#39; event.</li>
<li>Setting the same value will be ignored and won&#39;t trigger the &#39;changed&#39; event.</li>
<li>Can sync to another beacon. Whenever the value of one of the synced beacons changes
   the value of the other is changed accordingly.</li>
<li>Attempt to get a value before it was assigned results in exception. It is better to
   pass initial value to the constructor</li>
</ul>
</dd>
</dl>

<a name="EventProperty"></a>

## EventProperty
Represents a certain kind of events.
Provides methods to observe and to trigger(emit) that kind of events.

**Kind**: global class  

* [EventProperty](#EventProperty)
    * _instance_
        * [.isInitialized](#EventProperty+isInitialized) ⇒ <code>boolean</code>
        * [.emit(eventArg)](#EventProperty+emit)
        * [.on(handler, [context])](#EventProperty+on) ⇒ <code>ListenerId</code>
        * [.once(handler, [context])](#EventProperty+once) ⇒ <code>ListenerId</code>
        * [.match(value, handler, [context])](#EventProperty+match) ⇒ <code>ListenerId</code>
        * [.matchOnce(value, handler, [context])](#EventProperty+matchOnce) ⇒ <code>ListenerId</code>
        * [.pipe(other)](#EventProperty+pipe) ⇒ <code>ListenerId</code>
        * [.route(matchValue, destination)](#EventProperty+route) ⇒ <code>ListenerId</code>
        * [.init(handler, [context])](#EventProperty+init)
    * _static_
        * [.make()](#EventProperty.make)
        * [.split()](#EventProperty.split)
        * [.splitVoid()](#EventProperty.splitVoid)

<a name="EventProperty+isInitialized"></a>

### eventProperty.isInitialized ⇒ <code>boolean</code>
A special property, indicating that the event was emitted at least once.

**Kind**: instance property of [<code>EventProperty</code>](#EventProperty)  
<a name="EventProperty+emit"></a>

### eventProperty.emit(eventArg)
Emits event with given argument. This invokes all appropriate handlers.

**Kind**: instance method of [<code>EventProperty</code>](#EventProperty)  

| Param | Type | Description |
| --- | --- | --- |
| eventArg | <code>T</code> | event argument, it's passed to each event handler. |

<a name="EventProperty+on"></a>

### eventProperty.on(handler, [context]) ⇒ <code>ListenerId</code>
Adds a listener.

**Kind**: instance method of [<code>EventProperty</code>](#EventProperty)  
**Returns**: <code>ListenerId</code> - - number, identifying new event listener.  

| Param | Type | Description |
| --- | --- | --- |
| handler | <code>Handler.&lt;T&gt;</code> | callback to be called when an event is emitted |
| [context] | <code>Object</code> | context to be used when calling handler. null by default. |

<a name="EventProperty+once"></a>

### eventProperty.once(handler, [context]) ⇒ <code>ListenerId</code>
Adds a listener. This listener will be immediately removed after it's
invoked for the first time.

**Kind**: instance method of [<code>EventProperty</code>](#EventProperty)  
**Returns**: <code>ListenerId</code> - - number, identifying new event listener.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| handler | <code>Handler.&lt;T&gt;</code> |  | callback to be called when an event is emitted |
| [context] | <code>Object</code> | <code></code> | context to be used when calling handler. null by default. |

<a name="EventProperty+match"></a>

### eventProperty.match(value, handler, [context]) ⇒ <code>ListenerId</code>
Adds a listener. This listener will be invoked only if event argument
matches given value.

Note: what "matching" means is not documented well yet since it is subject to change.
For now you should assume that for plain types (boolean, number, string) it is
strict equality. For objects it is like deep strict equality except that actual
event argument may have more fields than match-value(proto). But all fields from
match-value must be present in event argument.

**Kind**: instance method of [<code>EventProperty</code>](#EventProperty)  
**Returns**: <code>ListenerId</code> - - number, identifying new event listener.  
**See**: objectMatch  

| Param | Type | Description |
| --- | --- | --- |
| value | <code>T</code> \| <code>RegExp</code> | handler is invoked only if event argument matches this value |
| handler | <code>Handler.&lt;T&gt;</code> | callback to be called when an event is emitted |
| [context] | <code>Object</code> | context to be used when calling handler. null by default. |

<a name="EventProperty+matchOnce"></a>

### eventProperty.matchOnce(value, handler, [context]) ⇒ <code>ListenerId</code>
Adds a listener for this event type. This listener will be invoked only if event argument
matches given value. This listener will be immediately removed after it's invoked
for the first time.

Note: what "matching" means is not documented well yet since it is subject to change.
For now you should assume that for plain types (boolean, number, string) it is
strict equality. For objects it is like deep strict equality except that actual
event argument may have more fields than match-value(proto). But all fields from
match-value must be present in event argument.

**Kind**: instance method of [<code>EventProperty</code>](#EventProperty)  
**Returns**: <code>ListenerId</code> - - number, identifying new event listener.  
**See**: PropertyEvent.match, PropertyEvent.once  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| value | <code>T</code> \| <code>RegExp</code> |  | handler is invoked only if event argument matches this value |
| handler | <code>Handler.&lt;T&gt;</code> |  | callback to be called when an event is emitted |
| [context] | <code>Object</code> | <code></code> | context to be used when calling handler. null by default. |

<a name="EventProperty+pipe"></a>

### eventProperty.pipe(other) ⇒ <code>ListenerId</code>
"Pipes" EventProperty to other  This means that whenever this event
is emitted it is passed to that other EventProperty which emits it too.

**Kind**: instance method of [<code>EventProperty</code>](#EventProperty)  

| Param | Type |
| --- | --- |
| other | <code>EventProperty.&lt;T&gt;</code> | 

<a name="EventProperty+route"></a>

### eventProperty.route(matchValue, destination) ⇒ <code>ListenerId</code>
Pipe only events with matching argument to destination

Note: what "matching" means is not documented well yet since it is subject to change.
For now you should assume that for plain types (boolean, number, string) it is
strict equality. For objects it is like deep strict equality except that actual
event argument may have more fields than match-value(proto). But all fields from
match-value must be present in event argument.

**Kind**: instance method of [<code>EventProperty</code>](#EventProperty)  
**See**: pipe, match  

| Param | Type | Description |
| --- | --- | --- |
| matchValue | <code>T</code> \| <code>RegExp</code> | value to match |
| destination | <code>EventProperty.&lt;T&gt;</code> | target EventProperty |

<a name="EventProperty+init"></a>

### eventProperty.init(handler, [context])
Adds an initialization handler. Initialization handlers are invoked during the very first
emit of event in this  If first emit already occurred then the handler is
invoked immediately.
This method returns a promise which may be used instead of passing a callback. Note that promise
resolve and reject handler will be invoked only on the next event loop iteration while callback
which is passed directly will beb invoked immediately and before any event-listeners.

**Kind**: instance method of [<code>EventProperty</code>](#EventProperty)  

| Param | Type | Description |
| --- | --- | --- |
| handler | <code>Handler.&lt;T&gt;</code> | callback to be invoked when event is emitted first time |
| [context] | <code>Object</code> | handler will be invoked in this context |

<a name="EventProperty.make"></a>

### EventProperty.make()
Creates a pair: an EventProperty instance to be used internally in a class
and an Emitter-interface to be used as public / accessible property.
They both actually represent the same EventProperty object.

returns {[EventProperty,Emitter<T>]}

**Kind**: static method of [<code>EventProperty</code>](#EventProperty)  
<a name="EventProperty.split"></a>

### EventProperty.split()
Creates an EventProperty object and splits it into emitter-function and
Emitter-interface. Use emitter function to emit the event and Emitter-interface
to add and remove listeners of that event.

returns {[EmitMethod<T>,Emitter<T>]}

**Kind**: static method of [<code>EventProperty</code>](#EventProperty)  
<a name="EventProperty.splitVoid"></a>

### EventProperty.splitVoid()
Creates an EventProperty object and splits it into emitter-function and
Emitter-interface. Special version for void-typed events.

returns {[VoidEmitMethod,Emitter<T>]}

**Kind**: static method of [<code>EventProperty</code>](#EventProperty)  
<a name="Beacon"></a>

## Beacon
Represents a model of a single property of type T. A basic element for constructing models.
- Property can be retrieved/changed by using the .value property of the beacon.
- Setting new value will trigger the 'changed' event.
- Setting the same value will be ignored and won't trigger the 'changed' event.
- Can sync to another beacon. Whenever the value of one of the synced beacons changes
     the value of the other is changed accordingly.
- Attempt to get a value before it was assigned results in exception. It is better to
     pass initial value to the constructor

**Kind**: global class  
<a name="Void"></a>

## .Void
**Kind**: static class  
**See**: {EventProperty}  

* [.Void](#Void)
    * [new Void()](#new_Void_new)
    * [.emit()](#Void+emit)

<a name="new_Void_new"></a>

### new Void()
Special subclass of EventProperty for void type - allows calling emit without arguments.
Extends [EventProperty](#EventProperty)

<a name="Void+emit"></a>

### void.emit()
Emits an event invoking all listeners.

**Kind**: instance method of [<code>Void</code>](#Void)  
**See**: {EventProperty#emit}  
