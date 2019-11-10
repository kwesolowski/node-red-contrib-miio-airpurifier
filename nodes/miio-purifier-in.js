const common = require('./common')

module.exports = function (RED) {
    class MiioPurifierInput extends common.MiioDeviceCommon {
        constructor(config) {
            super(RED, config);

            const getStatusProperties = ["mode", "filter1_life", "aqi", "child_lock", "power",
                "favorite_level", "temp_dec", "humidity"];

            const formatHomeKit = (result) => {
                let msg = {};

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

            this.inputSetup(getStatusProperties, formatHomeKit).catch(err => this.error(err));

        }
    }

    RED.nodes.registerType('miio-purifier-input', MiioPurifierInput, {});
};