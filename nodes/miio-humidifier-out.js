const common = require('./common');

function isSet(value) {
    return value !== undefined && value !== null;
}

module.exports = function (RED) {
    class MiioHumidifierOutput extends common.MiioDeviceOutput {
        constructor(config) {
            super(RED, config);
            this.SetUp().catch(err => this.error(err))
        }

        async SetUp() {
            await this.connect();
            await this.outputSetup(this.handlePayload, this.handlePayloadRaw)
        }

        async handlePayload(payload) {
            let calls = [];
            if (isSet(payload.RelativeHumidityHumidifierThreshold)) {
                let value = payload.RelativeHumidityHumidifierThreshold;
                if (value > 0 && value <= 40) {
                    value = 40;
                } else if (value > 80 && value <= 100) {
                    value = 80;
                }
                calls.push(this.callWithError("set_limit_hum", [value]));
            }

            if (isSet(payload.Active)) {
                let value = payload.Active;
                calls.push(this.callWithError("set_power", [Boolean(value) ? "on" : "off"]));
            }

            if (isSet(payload.SwingMode)) {
                let value = payload.SwingMode;
                calls.push(this.callWithError("set_dry", [Boolean(value) ? "on" : "off"]));
            }

            if (isSet(payload.LockPhysicalControls)) {
                let value = payload.LockPhysicalControls;
                calls.push(this.callWithError("set_child_lock", [Boolean(value) ? "on" : "off"]));
            }

            if (isSet(payload.RotationSpeed)) {
                let value = payload.RotationSpeed;
                if (value == 25) {
                    calls.push(this.callWithError("set_mode", ["auto"]));
                } else if (value == 50) {
                    calls.push( this.callWithError("set_mode", ["silent"]));
                } else if (value == 75) {
                    calls.push( this.callWithError("set_mode", ["medium"]));
                } else if (value == 100) {
                    calls.push( this.callWithError("set_mode", ["high"]));
                }
            }

            await Promise.all(calls);
        }
    }

    RED.nodes.registerType('miio-humidifier-output', MiioHumidifierOutput);
};