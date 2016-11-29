# event

_An alternative approach to implementing events._<br>

This library was designed to be used with **TypeScript**, since IMHO classic **EventEmitter** approach undermines benefits of strong typing - e.g. misspelling event name(which is a string literal) cannot be identified as an error neither during syntactical check in ide, nor in runtime during the execution of script - in classic(**EventEmitter**) approach that just considered an another event. Also classic events commonly cannot be analysed to provide intelligence for autocompletion and other cool ide features.

The main idea used to solve this and other issues of that classic approach was to present each event as a separate object, having its own `listen()` and `trigger()`.

So if in a classic approach you have to either inherit EventEmitter class, or if you prefer composition - create some field as an events manager, which will basically hold an instance of EventEmitter, in 'subj' approach Events - are regular class properties, you just define a property of type `Event` and initialize it using the `Event` constructor, so ide sees all events as any other properties.
