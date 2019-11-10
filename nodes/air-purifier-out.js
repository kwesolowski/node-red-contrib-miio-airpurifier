const common = require('./common')

function isSet(value) {
    return value !== undefined && value != null;
}

module.exports = function (RED) {
    class MiioAirpurifierOutput extends common.MiioAirpurifierCommon {
        constructor(config) {
            super(RED, config)
            const node = this;
            node.connect().catch(err => node.error(err))

            node.on('input', (msg, send, done) => {
                if (node.device) {
                    try {
                        if (isSet(msg.payload)) {
                            node.handlePayload(msg.payload).catch(err => node.error(err));
                        }
                        if (isSet(msg.payload_raw)) {
                            node.handlePayloadRaw(msg.payload_raw).catch(err => node.error(err));
                        }
                        this.status({fill: "green", shape: "dot", text: "sent"});
                    } catch (err) {
                        this.error("Failed to send", err)
                        this.status({fill: "red", shape: "dot", text: "not sent"});
                    }
                } else {
                    this.status({fill: "red", shape: "dot", text: "not connected"});
                    return;
                }
                if (done) {
                    done();
                }
            });
        }

        async handlePayloadRaw(payload_raw) {
            const known_properties_setters = {
                "power": "set_power",
                "child_lock": "set_child_lock",
                "mode": "set_mode",
                "favorite_level": "set_level_favorite",
            };
            const known_properties = ["power", "child_lock", "mode", "favorite_level"]
            const change_properties = Object.keys(payload_raw).filter(k => known_properties.includes(k))

            const current_values = await this.device.loadProperties(change_properties);
            for (let i = 0; i < change_properties.length; i++) {
                const prop = change_properties[i]
                const current_value = current_values[prop];
                const target_value = payload_raw[prop];
                const set_cmd = known_properties_setters[prop];

                if (current_value != target_value) {
                    try {
                        const result = await this.device.call(set_cmd, [target_value]);
                        if (result[0] === "ok") {
                            this.debug(`Changing "${prop}" from ${current_value} to "${target_value}" succeeded`);
                        } else {
                            this.debug(new Error(result[0]));
                        }
                    } catch (err) {
                        this.error(`Failed to ${set_cmd} to ${target_value} due to `+ err);
                    }
                } else {
                    this.debug(`Skip calling ${set_cmd} as ${prop} is already ${current_value}`)
                }
            }
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
                    if (value != 0) {
                        const result = await node.device.call("set_level_favorite", [parseInt(value / 10)]);
                        if (result[0] !== "ok") {
                            this.error(new Error(result[0]));
                        }
                    }
                } else {
                    const load_result = await this.device.loadProperties(["favorite_level"])
                    if (!(node.RotationSpeed <= load_result.favorite_level * 10 && node.RotationSpeed.value > (load_result.favorite_level - 1) * 10)) {
                        const set_result = await node.device.call("set_level_favorite", [parseInt(value / 10)])
                        if (set_result[0] !== "ok") {
                            this.error(new Error(result[0]));
                        }
                    }
                }
            }

            node.RotationSpeed = value;
        }
    }

    RED.nodes.registerType('miio-airpurifier-output', MiioAirpurifierOutput);
}