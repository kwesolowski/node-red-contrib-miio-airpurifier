const common = require('./common');

function isSet(value) {
    return value !== undefined && value !== null;
}

module.exports = function (RED) {
    class MiioPurifierOutput extends common.MiioDeviceOutput {
        constructor(config) {
            super(RED, config);
            this.SetUp().catch(err => this.error(err))
        }
        async SetUp() {
            await this.connect();
            await this.outputSetup(this.handlePayload)
        }

        async handlePayload(payload) {
            const node = this;
            if (isSet(payload.Active)) {
                const value = payload.Active;
                await node.device.call("set_power", [Boolean(value) ? "on" : "off"]);
            }

            if (isSet(payload.LockPhysicalControls)) {
                const value = payload.LockPhysicalControls;
                await node.device.call("set_child_lock", [Boolean(value) ? "on" : "off"]);
            }

            if (isSet(payload.TargetAirPurifierState)) {
                const value = payload.TargetAirPurifierState;
                node.TargetAirPurifierState = value;

                await node.device.call("set_mode", [value == 1 ? (node.SwingMode == 1 ? "silent" : "auto") : "favorite"]);
            }

            if (isSet(payload.SwingMode)) {
                const value = payload.SwingMode;
                node.SwingMode = value;

                await node.device.call("set_mode", [value == 1 ? "silent" : node.TargetAirPurifierState == 1 ? "auto" : "favorite"]);
            }

            if (isSet(payload.RotationSpeed)) {
                const value = payload.RotationSpeed;

                if (node.TargetAirPurifierState == "auto") {
                    if (value !== 0) {
                        await this.callWithError("set_level_favorite", [Math.round(value / 10)]);
                    }
                } else {
                    const load_result = await this.device.getProperties(["favorite_level"]);
                    if (!(node.RotationSpeed <= load_result.favorite_level * 10 && node.RotationSpeed.value > (load_result.favorite_level - 1) * 10)) {
                        await this.callWithError("set_level_favorite", [Math.round(value / 10)]);
                    }
                }
            }

            node.RotationSpeed = value;
        }
    }

    RED.nodes.registerType('miio-purifier-output', MiioPurifierOutput);
};