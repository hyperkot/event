# event

_An alternative approach to implementing events._<br>

This library was designed to be used with **TypeScript**, since IMHO classic 
**EventEmitter** approach undermines benefits of strong typing - e.g.
misspelling event name(which is a string literal) cannot be identified as an
error neither during syntactical check in ide, nor in runtime during the execution
of script - in classic(**EventEmitter**) approach that just considered an another
event. Also classic events commonly cannot be analysed to provide intelligence for
autocompletion and other cool ide features.

The main idea used to solve this and other issues of that classic approach was to present each event as a separate object, having its own `listen()` and `trigger()`.

So if in a classic approach you have to either inherit EventEmitter class, or if you prefer composition - create some field as an events manager, which will basically hold an instance of EventEmitter, in 'subj' approach Events - are regular class properties, you just define a property of type `Event` and initialize it using the `Event` constructor, so ide sees all events as any other properties.

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

- **typings** *(npm)* - automation tool for installing typescript definitions for known npm-modules.
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

