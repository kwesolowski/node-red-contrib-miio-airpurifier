const common = require('./common')

module.exports = function (RED) {
    class MiioAirPurifierInput extends common.MiioDeviceCommon {
        constructor(config) {
            super(RED, config);
            const node = this;
            node.setMaxListeners(255);

            node.connect().then(() => {
                node.getStatus(true).then(result => {

                });
            }).catch(err => node.error(err));

            node.refreshStatusTimer = setInterval(function () {
                node.getStatus(true);
            }, 10000);

        }

        async getStatus(force = false) {
            if (!force) {
                return;
            }

            if (this.device !== null) {
                try {
                    const properties = await this.device.loadProperties(["mode", "filter1_life", "aqi", "child_lock", "power", "favorite_level", "temp_dec", "humidity"])

                    this.status({fill: "green", shape: "dot", text: "receiving"});
                    this.send([
                        {
                            'payload_raw': properties
                        },
                        {
                            'payload': this.formatHomeKit(properties)
                        }
                    ]);
                } catch(err) {
                    this.status({fill: "red", shape: "dot", text: "stopped receiving"});
                    console.error('Encountered an error while controlling device', err);
                    throw err
                }
            }
        }

        formatHomeKit(result) {
            var msg = {};

            if (result.power === "on") {
                msg.Active = 1;
                msg.CurrentAirPurifierState = 2;
            } else if (result.power === "off") {
                msg.Active = 0;
                msg.CurrentAirPurifierState = 0;
            }

            if (result.mode === "favorite") {
                msg.TargetAirPurifierState = 0;
            } else {
                msg.TargetAirPurifierState = 1;
            }

            if (result.mode == "silent") {
                msg.SwingMode = 1;
                msg.TargetAirPurifierState = 1;
            } else {
                msg.SwingMode = 0;
            }

            if (result.child_lock === "on") {
                msg.LockPhysicalControls = 1;
            } else if (result.child_lock === "off") {
                msg.LockPhysicalControls = 0;
            }

            if (result.filter1_life < 5) {
                msg.FilterChangeIndication = 1;
            } else {
                msg.FilterChangeIndication = 0;
            }

            msg.FilterLifeLevel = result.filter1_life;
            msg.RotationSpeed = parseInt(result.favorite_level * 10);
            msg.CurrentTemperature = result.temp_dec / 10;
            msg.CurrentRelativeHumidity = result.humidity;

            msg.PM2_5Density = result.aqi;

            if (result.aqi <= 50) {
                msg.AirQuality = 1;
            } else if (result.aqi > 50 && result.aqi <= 100) {
                msg.AirQuality = 2;
            } else if (result.aqi > 100 && result.aqi <= 200) {
                msg.AirQuality = 3;
            } else if (result.aqi > 200 && result.aqi <= 300) {
                msg.AirQuality = 4;
            } else if (result.aqi > 300) {
                msg.AirQuality = 5;
            } else {
                msg.AirQuality = 0;
            }

            return msg;
        }
    }

    RED.nodes.registerType('miio-airpurifier-input', MiioAirPurifierInput, {});
};