const miio = require('miio');

module.exports.MiioDeviceCommon = class MiioDeviceCommon {
    constructor(RED, config) {
        RED.nodes.createNode(this, config);
        this.config = config;

        this.on('close', (removed, done) => {
            if (removed && this.device) {
                this.device.destroy();
                this.device = null;
            }
            done();
        })
    }

    async connect() {
        if (this.config.ip && this.config.token) {
            this.status({fill: "yellow", shape: "dot", text: "connecting..."});
            this.device = await miio.device({
                address: this.config.ip,
                token: this.config.token
            })

            this.device.updateMaxPollFailures(0);

            this.device.on('thing:initialized', () => {
                this.log('Miio Airpurifier: Initialized');
                this.status({fill: "green", shape: "dot", text: "initialized..."});
            });

            this.device.on('thing:destroyed', () => {
                this.log('Miio Airpurifier: Destroyed');
                this.status({fill: "yellow", shape: "dot", text: "destroyed..."});
            });

        } else {
            this.status({fill: "red", shape: "ring", text: "Missing IP or Token"});
        }
    };
}