const miio = require('miio');

function isSet(value) {
    return value !== undefined && value !== null;
}

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
            });

            this.device.updateMaxPollFailures(0);


            const node = this;
            this.device.on('thing:initialized', async () => {
                node.log(`Initialized`);
                node.status({fill: "green", shape: "dot", text: "initialized..."});
            });

            this.device.on('thing:destroyed', () => {
                node.log(`Destroyed`);
                node.status({fill: "yellow", shape: "dot", text: "destroyed..."});
            });

        } else {
            this.status({fill: "red", shape: "ring", text: "Missing IP or Token"});
        }
    };
};

module.exports.MiioDeviceInput = class MiioDeviceInput extends module.exports.MiioDeviceCommon {
    constructor(RED, config) {
        super(RED, config);
    }

    async inputSetup(getStatusProperties, formatHomeKit) {
        this.getStatusProperties = getStatusProperties;
        this.formatHomeKit = formatHomeKit;

        this.setMaxListeners(255);

        await this.connect();
        await this.inputGetStatus(true);

        let node = this;
        this.refreshStatusTimer = setInterval(function () {
            node.inputGetStatus(true);
        }, 10000);
    }

    async inputGetStatus(force = false) {
        if (!force) {
            return;
        }

        if (this.device !== null) {
            try {
                const properties = await this.device.loadProperties(this.getStatusProperties);

                console.log(this.device._reversePropertyDefinitions);

                this.status({fill: "green", shape: "dot", text: "receiving"});
                this.send({
                    'payload_raw': properties,
                    'payload': this.formatHomeKit(properties)
                });
            } catch (err) {
                this.status({fill: "red", shape: "dot", text: "stopped receiving"});
                console.error('Encountered an error while controlling device', err);
                throw err;
            }
        }
    }
};

module.exports.MiioDeviceOutput = class MiioDeviceOutput extends module.exports.MiioDeviceCommon {
    constructor(RED, config) {
        super(RED, config);
    }


    async outputSetup(handlePayload, handlePayloadRaw) {
        this.handlePayload = handlePayload;
        this.handlePayloadRaw = handlePayloadRaw;

        this.on('input', this.outputHandleMsg);
    }

    async outputHandleMsg(msg, send, done) {
        if (this.device) {
            try {
                if(isSet(msg.payload) && isSet(msg.payload_raw)) {
                    throw Error("Can't pass both payload and payload_raw")
                }
                if (isSet(msg.payload)) {
                    await this.handlePayload(msg.payload).catch(err => this.error(err));
                }
                if (isSet(msg.payload_raw)) {
                    await this.handlePayloadRaw(msg.payload_raw).catch(err => this.error(err));
                }
                this.status({fill: "green", shape: "dot", text: "sent"});
            } catch (err) {
                this.error("Failed to send", err);
                this.status({fill: "red", shape: "dot", text: `not sent: ${err}`});
            }
        } else {
            this.status({fill: "red", shape: "dot", text: "not connected"});
            return;
        }
        if (done) {
            done();
        }
    }

    async callWithError(method, args) {
        try {
            const result = await this.device.call(method, args);
            if (result[0] == "ok") {
            } else {
                throw Error(result[0]);
            }
        } catch (err) {
            console.error(err);
            this.error(err)
        }
    };
};