/// <reference path="../typings/index.d.ts"/>
const event_1 = require("../src/event");
describe('Core functionality: construction of event, triggering, listening', () => {
    it('Creates an Event instance, does nothing more, just dont fails', () => {
        let event = new event_1.Event();
    });
    it('Adds a listener, triggers the event, listener is invoked', (done) => {
        let event = new event_1.Event();
        event.listen(done);
        event.trigger();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzaWMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJiYXNpYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSw2Q0FBNkM7QUFDN0Msd0NBQW1DO0FBQ25DLFFBQVEsQ0FBQyxrRUFBa0UsRUFBRTtJQUN6RSxFQUFFLENBQUMsK0RBQStELEVBQUU7UUFDaEUsSUFBSSxLQUFLLEdBQUcsSUFBSSxhQUFLLEVBQU8sQ0FBQztJQUNqQyxDQUFDLENBQUMsQ0FBQztJQUNILEVBQUUsQ0FBQywwREFBMEQsRUFBRSxDQUFDLElBQWU7UUFDM0UsSUFBSSxLQUFLLEdBQUcsSUFBSSxhQUFLLEVBQU8sQ0FBQztRQUM3QixLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ25CLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUNwQixDQUFDLENBQUMsQ0FBQztBQUNQLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL3R5cGluZ3MvaW5kZXguZC50c1wiLz5cbmltcG9ydCB7RXZlbnR9IGZyb20gJy4uL3NyYy9ldmVudCc7XG5kZXNjcmliZSgnQ29yZSBmdW5jdGlvbmFsaXR5OiBjb25zdHJ1Y3Rpb24gb2YgZXZlbnQsIHRyaWdnZXJpbmcsIGxpc3RlbmluZycsICgpID0+IHtcbiAgICBpdCgnQ3JlYXRlcyBhbiBFdmVudCBpbnN0YW5jZSwgZG9lcyBub3RoaW5nIG1vcmUsIGp1c3QgZG9udCBmYWlscycsICgpID0+IHtcbiAgICAgICAgbGV0IGV2ZW50ID0gbmV3IEV2ZW50PGFueT4oKTtcbiAgICB9KTtcbiAgICBpdCgnQWRkcyBhIGxpc3RlbmVyLCB0cmlnZ2VycyB0aGUgZXZlbnQsIGxpc3RlbmVyIGlzIGludm9rZWQnLCAoZG9uZTogTW9jaGFEb25lKSA9PiB7XG4gICAgICAgIGxldCBldmVudCA9IG5ldyBFdmVudDxhbnk+KCk7XG4gICAgICAgIGV2ZW50Lmxpc3Rlbihkb25lKTtcbiAgICAgICAgZXZlbnQudHJpZ2dlcigpO1xuICAgIH0pO1xufSk7Il19