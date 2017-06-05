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
 * - Attempt to get a value before it was assigned results in exception. It is better to
 *      pass initial value to the constructor
 */
class Beacon {
    constructor(value) {
        [this.emitChanged, this.changed] = event_1.default.split();
        if (value instanceof Beacon) {
            this.syncTo(value);
            this._priorValue = value._priorValue;
        }
        else {
            this._value = value;
            this._priorValue = value;
        }
    }
    get priorValue() { return this._priorValue; }
    ;
    get value() { return this._value; }
    set value(value) {
        if (this._value !== value) {
            this._priorValue = this._value;
            this._value = value;
            this.emitChanged(this._value);
        }
    }
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
    toJSON() {
        return JSON.stringify(this.value, null, "\t");
    }
    fromJSON(json) {
        this.value = JSON.parse(json);
    }
    toString() {
        return this.toJSON();
    }
    valueOf() {
        return this.value.valueOf();
    }
}
exports.Beacon = Beacon;
exports.default = Beacon;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmVhY29uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2JlYWNvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSw2Q0FBNkM7O0FBRTdDLG1DQUFvQztBQUVwQzs7Ozs7Ozs7O0dBU0c7QUFDSDtJQWtCSSxZQUFZLEtBQWtCO1FBQzFCLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsZUFBYSxDQUFDLEtBQUssRUFBSyxDQUFDO1FBRTVELEVBQUUsQ0FBQyxDQUFDLEtBQUssWUFBWSxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQzFCLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDbkIsSUFBSSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDO1FBQ3pDLENBQUM7UUFBQyxJQUFJLENBQUMsQ0FBQztZQUNKLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1lBQ3BCLElBQUksQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDO1FBQzdCLENBQUM7SUFDTCxDQUFDO0lBdEJELElBQUksVUFBVSxLQUFRLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztJQUFBLENBQUM7SUFHakQsSUFBSSxLQUFLLEtBQVEsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ3RDLElBQUksS0FBSyxDQUFDLEtBQVE7UUFDZCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDeEIsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQy9CLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1lBQ3BCLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2xDLENBQUM7SUFDTCxDQUFDO0lBY0QsTUFBTSxDQUFDLEtBQWdCO1FBQ25CLEtBQUssQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQ2IsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssS0FBSyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFDN0IsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDO1lBQzdCLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQ1osRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssS0FBSyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFDN0IsS0FBSyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzdCLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQztJQUM3QixDQUFDO0lBRUQsTUFBTTtRQUNGLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ2xELENBQUM7SUFFRCxRQUFRLENBQUMsSUFBWTtRQUNqQixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDbEMsQ0FBQztJQUVELFFBQVE7UUFDSixNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQ3pCLENBQUM7SUFFRCxPQUFPO1FBQ0gsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDaEMsQ0FBQztDQUNKO0FBM0RELHdCQTJEQztBQUVELGtCQUFlLE1BQU0sQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi90eXBpbmdzL2luZGV4LmQudHNcIi8+XG5cbmltcG9ydCBFdmVudFByb3BlcnR5IGZyb20gXCIuL2V2ZW50XCI7XG5cbi8qKlxuICogUmVwcmVzZW50cyBhIG1vZGVsIG9mIGEgc2luZ2xlIHByb3BlcnR5IG9mIHR5cGUgVC4gQSBiYXNpYyBlbGVtZW50IGZvciBjb25zdHJ1Y3RpbmcgbW9kZWxzLlxuICogLSBQcm9wZXJ0eSBjYW4gYmUgcmV0cmlldmVkL2NoYW5nZWQgYnkgdXNpbmcgdGhlIC52YWx1ZSBwcm9wZXJ0eSBvZiB0aGUgYmVhY29uLlxuICogLSBTZXR0aW5nIG5ldyB2YWx1ZSB3aWxsIHRyaWdnZXIgdGhlICdjaGFuZ2VkJyBldmVudC5cbiAqIC0gU2V0dGluZyB0aGUgc2FtZSB2YWx1ZSB3aWxsIGJlIGlnbm9yZWQgYW5kIHdvbid0IHRyaWdnZXIgdGhlICdjaGFuZ2VkJyBldmVudC5cbiAqIC0gQ2FuIHN5bmMgdG8gYW5vdGhlciBiZWFjb24uIFdoZW5ldmVyIHRoZSB2YWx1ZSBvZiBvbmUgb2YgdGhlIHN5bmNlZCBiZWFjb25zIGNoYW5nZXNcbiAqICAgICAgdGhlIHZhbHVlIG9mIHRoZSBvdGhlciBpcyBjaGFuZ2VkIGFjY29yZGluZ2x5LlxuICogLSBBdHRlbXB0IHRvIGdldCBhIHZhbHVlIGJlZm9yZSBpdCB3YXMgYXNzaWduZWQgcmVzdWx0cyBpbiBleGNlcHRpb24uIEl0IGlzIGJldHRlciB0b1xuICogICAgICBwYXNzIGluaXRpYWwgdmFsdWUgdG8gdGhlIGNvbnN0cnVjdG9yXG4gKi9cbmV4cG9ydCBjbGFzcyBCZWFjb248VD4ge1xuXG4gICAgcHJpdmF0ZSBlbWl0Q2hhbmdlZDogRXZlbnRQcm9wZXJ0eS5FbWl0TWV0aG9kPFQ+O1xuICAgIHB1YmxpYyBjaGFuZ2VkOiBFdmVudFByb3BlcnR5LkVtaXR0ZXI8VD47XG5cbiAgICBwcml2YXRlIF9wcmlvclZhbHVlOiBUO1xuICAgIGdldCBwcmlvclZhbHVlKCk6IFQgeyByZXR1cm4gdGhpcy5fcHJpb3JWYWx1ZTsgfTtcblxuICAgIHByaXZhdGUgX3ZhbHVlOiBUO1xuICAgIGdldCB2YWx1ZSgpOiBUIHsgcmV0dXJuIHRoaXMuX3ZhbHVlOyB9XG4gICAgc2V0IHZhbHVlKHZhbHVlOiBUKSB7XG4gICAgICAgIGlmICh0aGlzLl92YWx1ZSAhPT0gdmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMuX3ByaW9yVmFsdWUgPSB0aGlzLl92YWx1ZTtcbiAgICAgICAgICAgIHRoaXMuX3ZhbHVlID0gdmFsdWU7XG4gICAgICAgICAgICB0aGlzLmVtaXRDaGFuZ2VkKHRoaXMuX3ZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0cnVjdG9yKHZhbHVlOiBUfEJlYWNvbjxUPikge1xuICAgICAgICBbdGhpcy5lbWl0Q2hhbmdlZCwgdGhpcy5jaGFuZ2VkXSA9IEV2ZW50UHJvcGVydHkuc3BsaXQ8VD4oKTtcblxuICAgICAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBCZWFjb24pIHtcbiAgICAgICAgICAgIHRoaXMuc3luY1RvKHZhbHVlKTtcbiAgICAgICAgICAgIHRoaXMuX3ByaW9yVmFsdWUgPSB2YWx1ZS5fcHJpb3JWYWx1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3ZhbHVlID0gdmFsdWU7XG4gICAgICAgICAgICB0aGlzLl9wcmlvclZhbHVlID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzeW5jVG8ob3RoZXI6IEJlYWNvbjxUPikge1xuICAgICAgICBvdGhlci5jaGFuZ2VkLm9uKCgpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLnZhbHVlICE9PSBvdGhlci52YWx1ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMudmFsdWUgPSBvdGhlci52YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuY2hhbmdlZC5vbigoKSA9PiB7XG4gICAgICAgICAgICBpZiAob3RoZXIudmFsdWUgIT09IHRoaXMudmFsdWUpIHtcbiAgICAgICAgICAgICAgICBvdGhlci52YWx1ZSA9IHRoaXMudmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnZhbHVlID0gb3RoZXIudmFsdWU7XG4gICAgfVxuXG4gICAgdG9KU09OKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh0aGlzLnZhbHVlLCBudWxsLCBcIlxcdFwiKTtcbiAgICB9XG5cbiAgICBmcm9tSlNPTihqc29uOiBzdHJpbmcpOiB2b2lkIHtcbiAgICAgICAgdGhpcy52YWx1ZSA9IEpTT04ucGFyc2UoanNvbik7XG4gICAgfVxuXG4gICAgdG9TdHJpbmcoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudG9KU09OKCk7XG4gICAgfVxuXG4gICAgdmFsdWVPZigpOiBhbnkge1xuICAgICAgICByZXR1cm4gdGhpcy52YWx1ZS52YWx1ZU9mKCk7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBCZWFjb247Il19