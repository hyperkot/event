## Classes

<dl>
<dt><a href="#EventProperty">EventProperty</a></dt>
<dd><p>Represents a certain type of events.
Provides methods to observe and to trigger(emit) events of that type.</p>
</dd>
<dt><a href="#Void">Void</a> ⇐ <code><a href="#EventProperty">EventProperty</a></code></dt>
<dd><p>Special subclass of EventProperty for void type - allows calling emit without arguments.</p>
</dd>
</dl>

<a name="EventProperty"></a>

## EventProperty
Represents a certain type of events.
Provides methods to observe and to trigger(emit) events of that type.

**Kind**: global class  

* [EventProperty](#EventProperty)
    * [.first](#EventProperty+first) ⇒ <code>Promise.&lt;T&gt;</code>
    * [.emit(eventArg)](#EventProperty+emit)
    * [.on(handler, [context])](#EventProperty+on) ⇒ <code>EventProperty.ListenerId</code>
    * [.once(handler, [context])](#EventProperty+once) ⇒ <code>EventProperty.ListenerId</code>
    * [.match(value, handler, [context])](#EventProperty+match) ⇒ <code>EventProperty.ListenerId</code>
    * [.matchOnce(value, handler, [context])](#EventProperty+matchOnce) ⇒ <code>EventProperty.ListenerId</code>
    * [.pipe(other)](#EventProperty+pipe) ⇒ <code>EventProperty.ListenerId</code>
    * [.route(matchValue, destination)](#EventProperty+route) ⇒ <code>EventProperty.ListenerId</code>
    * [.next()](#EventProperty+next) ⇒ <code>Promise.&lt;T&gt;</code>

<a name="EventProperty+first"></a>

### eventProperty.first ⇒ <code>Promise.&lt;T&gt;</code>
Stores promise which is resolved when this event is emitted for the first time.

**Kind**: instance property of [<code>EventProperty</code>](#EventProperty)  
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

<a name="EventProperty+next"></a>

### eventProperty.next() ⇒ <code>Promise.&lt;T&gt;</code>
Returns a promise which is resolved next time this event is emitted.
Works as a promisified version of 'once'.

**Kind**: instance method of [<code>EventProperty</code>](#EventProperty)  
**See**: EventProperty.once  
<a name="Void"></a>

## Void ⇐ [<code>EventProperty</code>](#EventProperty)
Special subclass of EventProperty for void type - allows calling emit without arguments.

**Kind**: global class  
**Extends**: [<code>EventProperty</code>](#EventProperty)  

* [Void](#Void) ⇐ [<code>EventProperty</code>](#EventProperty)
    * [.first](#EventProperty+first) ⇒ <code>Promise.&lt;T&gt;</code>
    * [.emit()](#Void+emit)
    * [.on(handler, [context])](#EventProperty+on) ⇒ <code>EventProperty.ListenerId</code>
    * [.once(handler, [context])](#EventProperty+once) ⇒ <code>EventProperty.ListenerId</code>
    * [.match(value, handler, [context])](#EventProperty+match) ⇒ <code>EventProperty.ListenerId</code>
    * [.matchOnce(value, handler, [context])](#EventProperty+matchOnce) ⇒ <code>EventProperty.ListenerId</code>
    * [.pipe(other)](#EventProperty+pipe) ⇒ <code>EventProperty.ListenerId</code>
    * [.route(matchValue, destination)](#EventProperty+route) ⇒ <code>EventProperty.ListenerId</code>
    * [.next()](#EventProperty+next) ⇒ <code>Promise.&lt;T&gt;</code>

<a name="EventProperty+first"></a>

### void.first ⇒ <code>Promise.&lt;T&gt;</code>
Stores promise which is resolved when this event is emitted for the first time.

**Kind**: instance property of [<code>Void</code>](#Void)  
<a name="Void+emit"></a>

### void.emit()
Emits an event invoking all listeners.

**Kind**: instance method of [<code>Void</code>](#Void)  
**Overrides**: [<code>emit</code>](#EventProperty+emit)  
**See**: {EventProperty.emit}  
<a name="EventProperty+on"></a>

### void.on(handler, [context]) ⇒ <code>EventProperty.ListenerId</code>
Adds a listener.

**Kind**: instance method of [<code>Void</code>](#Void)  
**Returns**: <code>EventProperty.ListenerId</code> - - number, identifying new event listener.  

| Param | Type | Description |
| --- | --- | --- |
| handler | <code>EventProperty.Handler.&lt;T&gt;</code> | callback to be called when an event is emitted |
| [context] | <code>Object</code> | context to be used when calling handler. null by default. |

<a name="EventProperty+once"></a>

### void.once(handler, [context]) ⇒ <code>EventProperty.ListenerId</code>
Adds a listener. This listener will be immediately removed after it's
invoked for the first time.

**Kind**: instance method of [<code>Void</code>](#Void)  
**Returns**: <code>EventProperty.ListenerId</code> - - number, identifying new event listener.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| handler | <code>EventProperty.Handler.&lt;T&gt;</code> |  | callback to be called when an event is emitted |
| [context] | <code>Object</code> | <code></code> | context to be used when calling handler. null by default. |

<a name="EventProperty+match"></a>

### void.match(value, handler, [context]) ⇒ <code>EventProperty.ListenerId</code>
Adds a listener. This listener will be invoked only if event argument
matches given value.

Note: what "matching" means is not documented well yet since it is subject to change.
For now you should assume that for plain types (boolean, number, string) it is
strict equality. For objects it is like deep strict equality except that actual
event argument may have more fields than match-value(proto). But all fields from
match-value must be present in event argument.

**Kind**: instance method of [<code>Void</code>](#Void)  
**Returns**: <code>EventProperty.ListenerId</code> - - number, identifying new event listener.  
**See**: objectMatch  

| Param | Type | Description |
| --- | --- | --- |
| value | <code>T</code> \| <code>RegExp</code> | handler is invoked only if event argument matches this value |
| handler | <code>EventProperty.Handler.&lt;T&gt;</code> | callback to be called when an event is emitted |
| [context] | <code>Object</code> | context to be used when calling handler. null by default. |

<a name="EventProperty+matchOnce"></a>

### void.matchOnce(value, handler, [context]) ⇒ <code>EventProperty.ListenerId</code>
Adds a listener for this event type. This listener will be invoked only if event argument
matches given value. This listener will be immediately removed after it's invoked
for the first time.

Note: what "matching" means is not documented well yet since it is subject to change.
For now you should assume that for plain types (boolean, number, string) it is
strict equality. For objects it is like deep strict equality except that actual
event argument may have more fields than match-value(proto). But all fields from
match-value must be present in event argument.

**Kind**: instance method of [<code>Void</code>](#Void)  
**Returns**: <code>EventProperty.ListenerId</code> - - number, identifying new event listener.  
**See**: PropertyEvent.match, PropertyEvent.once  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| value | <code>T</code> \| <code>RegExp</code> |  | handler is invoked only if event argument matches this value |
| handler | <code>EventProperty.Handler.&lt;T&gt;</code> |  | callback to be called when an event is emitted |
| [context] | <code>Object</code> | <code></code> | context to be used when calling handler. null by default. |

<a name="EventProperty+pipe"></a>

### void.pipe(other) ⇒ <code>EventProperty.ListenerId</code>
"Pipes" EventProperty to other EventProperty. This means that whenever this event
is emitted it is passed to that other EventProperty which emits it too.

**Kind**: instance method of [<code>Void</code>](#Void)  

| Param | Type |
| --- | --- |
| other | <code>EventProperty.&lt;T&gt;</code> | 

<a name="EventProperty+route"></a>

### void.route(matchValue, destination) ⇒ <code>EventProperty.ListenerId</code>
Pipe only events with matching argument to destination EventProperty.

Note: what "matching" means is not documented well yet since it is subject to change.
For now you should assume that for plain types (boolean, number, string) it is
strict equality. For objects it is like deep strict equality except that actual
event argument may have more fields than match-value(proto). But all fields from
match-value must be present in event argument.

**Kind**: instance method of [<code>Void</code>](#Void)  
**See**: EventProperty.pipe, EventProperty.match  

| Param | Type | Description |
| --- | --- | --- |
| matchValue | <code>T</code> \| <code>RegExp</code> | value to match |
| destination | <code>EventProperty.&lt;T&gt;</code> | target EventProperty |

<a name="EventProperty+next"></a>

### void.next() ⇒ <code>Promise.&lt;T&gt;</code>
Returns a promise which is resolved next time this event is emitted.
Works as a promisified version of 'once'.

**Kind**: instance method of [<code>Void</code>](#Void)  
**See**: EventProperty.once  
