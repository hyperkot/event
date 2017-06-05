# event-property

_An alternative approach to implementing events. TypeScript-Way._

This library provides an `EventProperty` class which works
similar to well-known `EventEmitter` from NodeJS `'events'` 
module and __DOM events__ and some others. The different approach
is to create a separate managing object for each event type instead
of having a single "event manager" object driven by string arguments.

## Installation
```
    npm install --save event-property
```

## Usage
```typescript
    import EventProperty from 'EventProperty';

    let event = new EventProperty<string>();

    event.on((arg: string) => {
        console.log(arg);
    });
    
    event.emit('Hi!');

```

## Purpose
Common `EventEmitter` approach undermines benefits of strong typing
because it uses string literals for event identification. This means that
misspelling event name cannot be identified as an error neither during 
source parsing nor in runtime during the execution. This also means
poor or no autocompletion and intelligence for ide. Look at this example:

```typescript

    let x = new EventEmitter();
    x.on("render", () => {
        console.log("rendering stuff");
    });
    x.trigger("rendr"); // See the mistake here?

```

It's pretty difficult to spot this mistake especially if your code is more
than 4 lines. What's more troublesome is that this code compiles and runs 
fine except nothing is happening. That is because to common EventEmitter
`"rendr"` is actually just another valid event. Also when you dive into
someone else's code if it not documented very well(which is the case most
of the time) you have no clue which events are flying around there until
you carefully read the whole code. Of course you may define constants for
event names, but you have to keep them in some different place and
export and import them and it's still convention. You have to remember
and follow conventions wasting you mind on this and often other people
don't want to. Also if you inherit from `EventEmitter` some minor issues
may arise like inabilty to limit access to triggering events from
outside of the class and requirement to put EventEmitter at the root
of inheritance tree and some others.

The alternative approach is presenting each event as a separate object
having its own `on()` and `emit()` methods.
This concept is sometimes referred to as _signals and slots_ and certainly
there are other libraries implementing it like _ts-events_. 

I've written
this lib for several reasons. I needed a certain set of features and some
features of other libraries where unnecessary and excessive for my tasks.
I wanted to have deep understanding of how my events work and ability to
change details of that behaviour easily on the spot. So I don't claim that
this library is best of it's kind or anything like that.

### Features
_This library implements several additional features I deemed useful for my purposes_

- __`once`__: listen to a single next occurrence of event, actually pretty common feature for any events.
- __`next`__: `once` feature in form of a promise.
- __`init`__: put a special handler which is invoked after the event was triggered fir the first time.
    Argument from the first emit is passed to handler. Useful for initialization events because
    you don't have to care to put a listener on it before the event occurs - if the event was already emitted
    than provided callback will be invoked right away.
- __`match`__: attach a listener which is invoked only if the events argument meets some condition.
    Usefull for stuff like keyboard events (listening to a certain key being pressed for example).
- __`pipe`__: redirect all event occurrences to another `EventProperty`. Useful when you needed to simple
    "buble up" some events from a child to the parent of the complex model system for example.
- __`EventProperty.Emitter`__: an interface of `EventProperty` which hides the `emit` method. Useful
    for describing public interfaces to events.
- __bound `emit` method__ - the `emit` method is bound to `EventProperty` by design thus you may
    pass it anywhere as callback without any additional manipulations.


### API

_[See generated documentation](docs/event.md)_
```typescript
interface EventProperty<T> {
    on(handler: EventProperty.Handler<T>, context?: Object): ListenerId;
    once(handler: EventProperty.Handler<T>, context?: Object): ListenerId;
    
    match(value: T|RegExp, handler: EventProperty.Handler<T>, context?: Object): ListenerId;
    matchOnce(value: T|RegExp, handler: EventProperty.Handler<T>, context?: Object): ListenerId;
    
    pipe(destination: EventProperty.Emitter<T>): ListenerId;
    route(value: T|RegExp, destination: EventProperty.Emitter<T>): ListenerId;
    
    init(handler: EventProperty.Handler<T>, context?: Object): void;
    
    off(handler: EventProperty.Handler<T>): void;
    off(handler: EventProperty.Handler<T>, context: Object): void;
    off(context: Object): void;
    off(id: ListenerId): void;
    off(destination: EventProperty.Emitter<T>): void;
    off(): void;
    
    emit(eventArgument: T): void;
    
    /*static*/ make<T>(): [EventProperty<T>, EventProperty.Emitter<T>];
    /*static*/ split<T>(): [EventProperty.EmitMethod<T>, EventProperty.Emitter<T>];
    /*static*/ splitVoid(): [EventProperty.VoidEmitMethod, EventProperty.Emitter<void>];
}

interface EventProperty.Void extends EventProperty<void> {
    emit(): void;
}
```


### Examples
Look for more examples in [tests](src/test/event.ts)

##### _Limiting access to `emit` in a class_
```typescript
    import EventProperty from 'event-property';

    class MyClass {
        
        // An event
        private readonly _somethingHappened: EventProperty<number> = new EventProperty<number>();
        public get somethingHappened(): EventProperty.Emitter<number> { return this._somethingHappened; }
        
        // Method triggering that event
        doSomething() {
            this._somethingHappened.emit(1);
        }
    }
    let myInstance = new MyClass();
    
    myInstance.somethingHappened.on((arg: number) => {
        console.log('happened:', arg); // happened: 1
    });
```



##### _Using initialization event_

```typescript
    import EventProperty from 'event-property';

    let initEvent = new EventProperty.Void();
    setTimeout(() => {
        initEvent.emit();
    }, 5000);
    setTimeout(() => {
        // We don't have to worry about missing or not an already emitted 'init' event.
        initEvent.init(() => {
            console.log('Doing stuff reliably after initialization');
        });
    }, Math.floor(Math.random() * 10000));
```

##### _Using `match` to handle a certain key_
```typescript
    import EventProperty from 'event-property';

    let keyPressed = new EventProperty();
    
    window.onkeydown = keyPressed.emit;
    
    keyPressed.match({keyCode: 27}, () => console.log('Escape pressed'));
```











