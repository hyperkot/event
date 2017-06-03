# event-property

_An alternative approach to implementing events._

This library provides an `EventProperty` class which works
similar to well-known `EventEmitter` from NodeJS `'events'` 
module and __DOM events__.

This library was specially designed to be used with **TypeScript**.
Common `**EventEmitter**` approach undermines benefits of strong typing
because it uses string literal for event identification. This means that
misspelling event name cannot be identified as an error neither during 
source parsing nor in runtime during the execution. This also means
poor or no autocompletion and intelligence for ide.

The main idea used to solve this issues of the common approach was to present
each event as a separate object having its own `on()` and `trigger()` methods.

So if in a classic approach you have to either inherit EventEmitter class 
or if you prefer composition - create some field as an events manager
which will basically hold an instance of EventEmitter
in this lib's approach Events - are regular class properties.
You just define a property of type `EventProperty` and initialize it
using the `EventProperty` constructor.

```typescript
    import EventProperty from 'event-property';

    class EventHolder {
        readonly somethingHappened: EventProperty<number> = new EventProperty<number>();
        doSomething() {
            this.somethingHappened.trigger(1);
        }
    }
    let eh = new EventHolder();
    eh.somethingHappened.on((arg: number) => {
        console.log('happened:', arg); // happened: 1
    })
```
