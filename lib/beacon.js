/// <reference path="../typings/index.d.ts"/>
Object.defineProperty(exports, "__esModule", { value: true });
const event_1 = require("./event");
/**
 * Represents a model of a single property of type T. A basic element for constructing models.
 * - Property can be retrieved/changed by using the .value property of the beacon.
 * - Setting new value will trigger the 'changed' event.
 * - Setting the same value will be ignored and won't trigger the 'changed' event.
 * - Can sync to another beacon. Whenever the value of one of the synced beacons changes
 *      the value of the other is changed accordingly.
 */
class Beacon {
    constructor(value) {
        this._changed = new event_1.default();
        this._isAssigned = false;
        this.changed.first.then(() => this._isAssigned = true);
        if (arguments.length === 1)
            this.value = value;
    }
    get changed() { return this._changed; }
    ;
    get priorValue() { return this._priorValue; }
    get value() { return this._value; }
    set value(value) {
        if (this.value !== value) {
            this._priorValue = this.value;
            this.value = value;
            this._changed.emit(this._value);
        }
    }
    get isAssigned() { return this._isAssigned; }
    syncTo(other) {
        other.changed.on(() => {
            if (this.value !== other.value) {
                this.value = other.value;
            }
        });
        this.changed.on(() => {
            if (other.value !== this.value) {
                other.value = this.value;
            }
        });
        this.value = other.value;
    }
    toString() {
        return JSON.stringify(this.value, null, "\t");
    }
    valueOf() {
        return this.value.valueOf();
    }
    fromString(str) {
        this.value = JSON.parse(str);
    }
}
exports.Beacon = Beacon;
exports.default = Beacon;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmVhY29uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2JlYWNvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSw2Q0FBNkM7O0FBRTdDLG1DQUE0QjtBQUU1Qjs7Ozs7OztHQU9HO0FBQ0g7SUFxQkksWUFBWSxLQUFTO1FBbkJiLGFBQVEsR0FBYSxJQUFJLGVBQUssRUFBSyxDQUFDO1FBZ0JwQyxnQkFBVyxHQUFZLEtBQUssQ0FBQztRQUlqQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxDQUFDO1FBQ3ZELEVBQUUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDO1lBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7SUFDbkQsQ0FBQztJQXJCRCxJQUFXLE9BQU8sS0FBdUIsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBQUEsQ0FBQztJQUdqRSxJQUFJLFVBQVUsS0FBUSxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7SUFHaEQsSUFBSSxLQUFLLEtBQVEsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ3RDLElBQUksS0FBSyxDQUFDLEtBQVE7UUFDZCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDdkIsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzlCLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1lBQ25CLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNwQyxDQUFDO0lBQ0wsQ0FBQztJQUdELElBQUksVUFBVSxLQUFjLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztJQU90RCxNQUFNLENBQUMsS0FBZ0I7UUFDbkIsS0FBSyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDYixFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxLQUFLLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUM3QixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUM7WUFDN0IsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDWixFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxLQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUM3QixLQUFLLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDN0IsQ0FBQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDO0lBQzdCLENBQUM7SUFFRCxRQUFRO1FBQ0osTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDbEQsQ0FBQztJQUVELE9BQU87UUFDSCxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUNoQyxDQUFDO0lBRUQsVUFBVSxDQUFDLEdBQVc7UUFDbEIsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2pDLENBQUM7Q0FDSjtBQW5ERCx3QkFtREM7QUFFRCxrQkFBZSxNQUFNLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vdHlwaW5ncy9pbmRleC5kLnRzXCIvPlxuXG5pbXBvcnQgRXZlbnQgZnJvbSBcIi4vZXZlbnRcIjtcblxuLyoqXG4gKiBSZXByZXNlbnRzIGEgbW9kZWwgb2YgYSBzaW5nbGUgcHJvcGVydHkgb2YgdHlwZSBULiBBIGJhc2ljIGVsZW1lbnQgZm9yIGNvbnN0cnVjdGluZyBtb2RlbHMuXG4gKiAtIFByb3BlcnR5IGNhbiBiZSByZXRyaWV2ZWQvY2hhbmdlZCBieSB1c2luZyB0aGUgLnZhbHVlIHByb3BlcnR5IG9mIHRoZSBiZWFjb24uXG4gKiAtIFNldHRpbmcgbmV3IHZhbHVlIHdpbGwgdHJpZ2dlciB0aGUgJ2NoYW5nZWQnIGV2ZW50LlxuICogLSBTZXR0aW5nIHRoZSBzYW1lIHZhbHVlIHdpbGwgYmUgaWdub3JlZCBhbmQgd29uJ3QgdHJpZ2dlciB0aGUgJ2NoYW5nZWQnIGV2ZW50LlxuICogLSBDYW4gc3luYyB0byBhbm90aGVyIGJlYWNvbi4gV2hlbmV2ZXIgdGhlIHZhbHVlIG9mIG9uZSBvZiB0aGUgc3luY2VkIGJlYWNvbnMgY2hhbmdlc1xuICogICAgICB0aGUgdmFsdWUgb2YgdGhlIG90aGVyIGlzIGNoYW5nZWQgYWNjb3JkaW5nbHkuXG4gKi9cbmV4cG9ydCBjbGFzcyBCZWFjb248VD4ge1xuXG4gICAgcHJpdmF0ZSBfY2hhbmdlZDogRXZlbnQ8VD4gPSBuZXcgRXZlbnQ8VD4oKTtcbiAgICBwdWJsaWMgZ2V0IGNoYW5nZWQoKTogRXZlbnQuRW1pdHRlcjxUPiB7IHJldHVybiB0aGlzLl9jaGFuZ2VkOyB9O1xuXG4gICAgcHJpdmF0ZSBfcHJpb3JWYWx1ZTogVDtcbiAgICBnZXQgcHJpb3JWYWx1ZSgpOiBUIHsgcmV0dXJuIHRoaXMuX3ByaW9yVmFsdWU7IH1cblxuICAgIHByaXZhdGUgX3ZhbHVlOiBUO1xuICAgIGdldCB2YWx1ZSgpOiBUIHsgcmV0dXJuIHRoaXMuX3ZhbHVlOyB9XG4gICAgc2V0IHZhbHVlKHZhbHVlOiBUKSB7XG4gICAgICAgIGlmICh0aGlzLnZhbHVlICE9PSB2YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy5fcHJpb3JWYWx1ZSA9IHRoaXMudmFsdWU7XG4gICAgICAgICAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gICAgICAgICAgICB0aGlzLl9jaGFuZ2VkLmVtaXQodGhpcy5fdmFsdWUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfaXNBc3NpZ25lZDogYm9vbGVhbiA9IGZhbHNlO1xuICAgIGdldCBpc0Fzc2lnbmVkKCk6IGJvb2xlYW4geyByZXR1cm4gdGhpcy5faXNBc3NpZ25lZDsgfVxuXG4gICAgY29uc3RydWN0b3IodmFsdWU/OiBUKSB7XG4gICAgICAgIHRoaXMuY2hhbmdlZC5maXJzdC50aGVuKCgpID0+IHRoaXMuX2lzQXNzaWduZWQgPSB0cnVlKTtcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBzeW5jVG8ob3RoZXI6IEJlYWNvbjxUPikge1xuICAgICAgICBvdGhlci5jaGFuZ2VkLm9uKCgpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLnZhbHVlICE9PSBvdGhlci52YWx1ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMudmFsdWUgPSBvdGhlci52YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuY2hhbmdlZC5vbigoKSA9PiB7XG4gICAgICAgICAgICBpZiAob3RoZXIudmFsdWUgIT09IHRoaXMudmFsdWUpIHtcbiAgICAgICAgICAgICAgICBvdGhlci52YWx1ZSA9IHRoaXMudmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnZhbHVlID0gb3RoZXIudmFsdWU7XG4gICAgfVxuXG4gICAgdG9TdHJpbmcoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHRoaXMudmFsdWUsIG51bGwsIFwiXFx0XCIpO1xuICAgIH1cblxuICAgIHZhbHVlT2YoKTogYW55IHtcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWUudmFsdWVPZigpO1xuICAgIH1cblxuICAgIGZyb21TdHJpbmcoc3RyOiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy52YWx1ZSA9IEpTT04ucGFyc2Uoc3RyKTtcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IEJlYWNvbjsiXX0=