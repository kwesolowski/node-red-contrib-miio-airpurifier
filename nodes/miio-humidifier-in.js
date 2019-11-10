const common = require('./common');

module.exports = function (RED) {
    class MiioHumidifierInput extends common.MiioDeviceInput {
        constructor(config) {
            super(RED, config);

            const getStatusProperties = ["power", "humidity", "child_lock", "dry", "depth", "limit_hum", "mode"];

            const formatHomeKit = (result) => {
                let msg = {};

                if (result.power === "on") {
                    msg.Active = 1;
                    msg.CurrentHumidifierDehumidifierState = 2;
                } else if (result.power === "off") {
                    msg.Active = 0;
                    msg.CurrentHumidifierDehumidifierState = 0;
                }
                if (result.child_lock === "on") {
                    msg.LockPhysicalControls = 1;
                } else if (result.child_lock === "off") {
                    msg.LockPhysicalControls = 0;
                }
                if (result.dry === "on") {
                    msg.SwingMode = 1;
                } else if (result.dry === "off") {
                    msg.SwingMode = 0;
                }

                if (result.mode === "auto") {
                    msg.RotationSpeed = 25;
                } else if (result.mode === "silent") {
                    msg.RotationSpeed = 50;
                } else if (result.mode === "medium") {
                    msg.RotationSpeed = 75;
                } else if (result.mode === "high") {
                    msg.RotationSpeed = 100;
                } else {
                    msg.RotationSpeed = 0;
                }

                msg.WaterLevel = Math.ceil(result.depth / 1.2);
                msg.CurrentRelativeHumidity = result.humidity;
                msg.TargetHumidifierDehumidifierState = 1;
                msg.RelativeHumidityHumidifierThreshold = result.limit_hum;

                return msg;
            };

            this.inputSetup(getStatusProperties, formatHomeKit).catch(err => this.error(err));
        }
    }

    RED.nodes.registerType('miio-humidifier-input', MiioHumidifierInput, {});
};