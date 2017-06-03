# event-property

_An alternative approach to implementing events._

This library provides an `EventProperty` class which works
similar to well-known `EventEmitter` from NodeJS `'events'` 
module and __DOM events__.

## Install
```
    npm install --save event-property
```

## Purpose
This library was specially designed to be used with **TypeScript**.
Common `EventEmitter` approach undermines benefits of strong typing
because it uses string literal for event identification. This means that
misspelling event name cannot be identified as an error neither during 
source parsing nor in runtime during the execution. This also means
poor or no autocompletion and intelligence for ide.

The main idea used to solve these issues of the common approach was to present
each event as a separate object having its own `on()` and `emit()` methods.
This concept is sometimes referred to as _signals and slots_.

So if in a classic approach you have to either inherit EventEmitter class 
or if you prefer composition - create some field as an events manager
which will basically hold an instance of EventEmitter
in this lib's approach Events - are regular class properties.
You just define a property of type `EventProperty` and initialize it
using the `EventProperty` constructor.

### Example
```typescript
    import EventProperty from 'event-property';

    class MyClass {
        
        // An event
        readonly somethingHappened: EventProperty<number> =
            new EventProperty<number>();
        
        // Method triggering that event
        doSomething() {
            this.somethingHappened.trigger(1);
        }
    }
    let myInstance = new MyClass();
    
    myInstance.somethingHappened.on((arg: number) => {
        console.log('happened:', arg); // happened: 1
    })
```

### Features
- `once`: listen to a single next occurrence of event
- `next`: promisified version of `once` feature
- `first`: listen to a first occurrence of event,
    activating even if
    listener is attached after the event was emitted
- `match`: attaching listener which are invoked only for event
    ocurrence with a certain parameters
- `pipe`: redirect all event occurrences to another `PropertyEvent`

### API
```typescript
interface EventProperty<T> {
    on(handler: EventProperty.Handler<T>, context?: Object): ListenerId;
    once(handler: EventProperty.Handler<T>, context?: Object): ListenerId;
    
    match(value: T, handler: EventProperty.Handler<T>, context?: Object): ListenerId;
    matchOnce(value: T, handler: EventProperty.Handler<T>, context?: Object): ListenerId;
    
    pipe(destination: EventProperty.Emitter<T>): ListenerId;
    
    first(): Promise<T>;
    next(): Promise<T>;
    
    off(handler: EventProperty.Handler<T>, context?: Object): void;
    off(context: Object): void;
    off(id: ListenerId): void;
    off(destination: EventProperty.Emitter<T>): void;
    off(): void;
}
```













