# event-property

_An alternative approach to implementing events._<br>

This library was designed to be used with **TypeScript**, since IMHO classic 
**EventEmitter** approach undermines benefits of strong typing - e.g.
misspelling event name(which is a string literal) cannot be identified as an
error neither during syntactical check in ide nor in runtime during the execution
of script - in classic(**EventEmitter**) approach that was just considered an another
event. So classic events usually can't be analysed to provide intelligence for
autocompletion and other usefull ide features.

The main idea used to solve this and other issues of the classic approach was to present 
each event as a separate object having its own `listen()` and `trigger()` methods.

So if in a classic approach you have to either inherit EventEmitter class 
or if you prefer composition - create some field as an events manager
which will basically hold an instance of EventEmitter
in this lib's approach Events - are regular class properties.
You just define a property of type `Event` and initialize it
using the `Event` constructor, so ide sees all events as any other properties.

Another goal of this lib's development is to try integrating some common patterns
involving events. For example, one of those patterns is 'once'(attaching a listener
which automatically deattaches after being triggered the first time) and the other
is 'match'(attaching a listener which is invoked only if event's argument deeply-equals
some given value).

I don't deem this library acceptable for production code right now but I still use it a lot
in a various experimental apllications I write all the time. So test coverage is close to none,
since the majority of API is subject to change. However basic 'on', 'off', 'trigger'
functionality is used a lot on practice and works pretty fine.

## API principles and reasoning behind them.
- There are some aliases for some methods. This is a questionable decision from the api
cleanliness point of view. However it stands for now since some names are short and well-known
but others may be clearer and more accurate.
- Overloading is used to describe possible arguments variants. There are a lot of variants right
now - less number of variants would be clearer. This stands for now since im not sure which
ways to remove a listener(by function, by name, by id, etc.) would be sufficent on practice.
So there are several ways to identify specific listener(s) attached to an event and i think it's
excessive.
- Describing each case is preferred to writing single unsiversal methods. This is a small lib
with core functionality - starting from some point it shouldn't change much.
So i can afford myself to write a long and hard-to-maintain code just to ensure that
code analysis and instrumenting tools run in the most effective and effective way.
It also helps to lower the complexity of code.
- There was no comments initially. I added them only before making this repo public.
I'm used to comment source with jsdocs when needed but not in case of TypeScript - it has
more meta data described by it's syntax than jsdocs could support. So jsdocs here would be just
excessive the only thing to expect from comments is descriptions.
- Getters of context-bound variants of all methods imaginable as callbacks are provided.
I just hate using bind and creating one-liner closures all over the place so much...)
- Event may have only one argument. Any set of arguments may be presented as an object with
    corresponding fields and this in fact is usually a clearer way to present arguments.
    Supporting multiple arguments would make all source code a bit more complex and there is
    no required functionality which cannot be written without using variable argument lists.
    Actually i believe that one has to have irresistable arguments to use this JS/TS language
    feature in some simple core library.
- There are two interfaces which may present the event object: EventEmitter and EventTrait.
    - EventTrait describes full Event class api - this is how events of class should be described
        internally for methods of this class.
    - EventEmitter is 'public' variant of EventTrait. The main difference - it has no 'trigger'
        method.

    I strongly believe that events of any class should be triggered only internally by the
methods of this class - otherwise the source cohesion might become so high that maintaing
that source would require an effort close to the effort needed to rewrite it completely.
- There are several additional features that are implemented by this library. All those are
subject to the research which is the goal of this lib for now as described above. This means
they all are subject to change. 
    - **once** - a well-known feature for many event-emitters. Works just as expected.
    - **match** - attaching a listener which is invoked only when the event is triggered with
        the argument deeply-equal to the valued passed to 'match' method. This seemed a
        usefull feature while working with keyboard events and more specifically - defining
        handlers for different keys on the same keyboard-handling event.
        (This feature is subject to detailed testing)
    - **mixin** - usefull sometimes but very questionable feature, since describing types
        when mixin functionality in object without inheritance is often problematic. This lib has
        it's own flavour of mixin concept - mixin is a instance method - it mixes not just abstract
        event functionality but the methods bound to specific existing event.
        (Overally this feature is still subject to basic testing at least)
    - **thenable** - Event implements standard Promise interface(then/catch) - and may be used as a
        Promise(right now that is a subject to carefull and detailed testing). The meaning of the
        event-promise is that it has been triggered for the first time. This IMO elegantly solves
        a common unpleasant scenario when you have some object with some event like 'initialized'
        which is triggered only once. And the problem is that the 'addListener' interface would be
        only available after the has occurred) So internal event promise mechanism stores the
        argument of the first trigger and resolves the event-promise with it. The benefit is that
        with Promise-like interface we can subscribe for such event anywhere we deem right - and
        it will invoke the handler right away if the event has ocurred before or just attach a 
        listener the same way that method 'once' does it.
        This feature certainly creates some overhead which I accept for now.
        And there is also a difference between 'once' and 'then' which you have to understand
        clearly to use this feature: you can attach listener with 'once' method then trigger the
        event then attach it once again and trigger event again. In case of ;once' - first time the
        listener is triggered with first trigger argument and detached. Second time listener is
        attached again and invoked with second trigger argument. Promise-handlers are not detached.
        So if you attach a handler with 'then' second time after the event was triggered for the
        first time - this handler will be invoked immediately with *FIRST* trigger argument and
        will be totally unaware of the event being triggered the second time. In fact the promise
        interface describes only the first time event being triggered for the whole time of it's
        existance and there is no way to make promise-interface to be invoked on any other event
        occurence.

## Dependencies

- **node/npm** *(os)* - obvious, installation depends on your platform,
see [NodeJS](https://nodejs.org)
official site for details.
- **git** *(os)* - even more obvious, i guess you wouldn't get this repo,
if you haven't installed git.

Having those local node-modules should install perfectly when you run 
`npm install` in the terminal while being at the root of this repo. 

There are several other things which may be needed:

### Global dependencies
When the source is compiled and bundled it may imported diectly without any prerequisites, but
to build from source and to work with source y will need several simple tools.

- **typings** *(npm)* - a tool for installing typescript definitions for known node-modules.
Should be installed globally. Installs as any global node-modules: `npm i -g typings`. 
On most linux platforms this will require either to use `sudo` or to grant yourself the rights
to write in '/usr/lib/node_modules' or something like that - hopefully this is not your first
global node-module and you already know how to deal with the issues of this kind.
- **mocha** *(npm)* - used to run tests. The tests in this lib are written in the most straight,
works-out-of-the-box way, so to run the tests you just enter `npm test` in the terminal
or even just `mocha` as stated in the `package.json`.
- **typescript** *(npm)* - actually before you can run anything you'll have to build the TypeScript
sources - the obvious tool for that. I build sources with a common `tsc -p .` - all required
options are already set in `tsconfig.json`.
- **tsfind** *(npm)* - this tool is deprecated and obsolete, I'm just used to it)) And this is not a
requirement, just a recommendation - it adds source paths to `tsconfig.json`, from globs
described in the same file, in the `filesGlob` field. So that you don't have to manually add
any new files, which requires compilation to tsconfig yourself.
- **nodemon** *(npm)* - this is not requirement, just a recomendation. I use it as a ci-automation
tool when working on this library. One can setup this utility in such a way, that it will recompile
source on any change(together with autosave in ide) and run tests(the only thing that can actually
be run if you think of this lib as a standalone project). So just start it in the terminal,
switch to ide and you will be able to observe how test results change as you write code.
This is the way i prefer to work. Right now i start it with
`nodemon -w . -x "tsc -p . && mocha" -d 1 -i "*.js" -e ts` command.
And i have to restart it manually only after system restart, or something like that.
- **tslint** *(npm)* - this one is a recommendation too. I don't even run it myself - it is
integrated into the ide i use, which is Visual Studio Code.
- **gulp** *(npm)* - some tasks are implemented in gulp so this is a requirement in order to
make bundle from source with predefined commands.

## CLI commands
Many of the tool which ares described above are integrated into npm cli(project.json),
so it simple to launch common tasks:  
<span style="font-size: 12px">_Though some of those commands may not work on Windows platform or
something other than linux at all._</span> 
- `npm start` - starts the workflow automation with _nodemon_,
    which is basically re-running build on source code changes and running tests afterwards.
- `npm test` - just run mocha, the source should be already built at this time.
- `npm run build` - bundle the library into a single js file(`index.js`);
- `gulp` - shorter than `npm run build`. Does the same thing. Note that build doesn't run tests.
- `npm run lint` - run tslint on the source.

