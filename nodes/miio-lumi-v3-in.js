const common = require('./common');

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}
const util = require('util');

module.exports = function (RED) {
    class MiioLumiV3Input extends common.MiioDeviceCommon {
        constructor(config) {
            super(RED, config);

            this.setupGateway().catch(err => this.error(err));
        }
        async pollChildren() {
            let node = this;
            let allSuccess = true;
            for (const child of node.device.children()) {
                if(child.matches('type:sensor')) {
                    try {
                        const vals = await child.values();
                        const valsc = JSON.parse(JSON.stringify(vals));
                        await this.send({
                            'payload': valsc,
                            'topic': child.id,
                        });
                    } catch (err) {
                        allSuccess = false;
                        node.error(`Failed to send values due to ${err}`)
                        this.status({fill: "red", shape: "dot", text: `Failed receive and due to ${err}`});
                    }
                }
            }
            if(allSuccess) {
                this.status({fill: "green", shape: "dot", text: "Sending ok"});
            }
        }
        async setupGateway() {
            let node = this;
            await this.connect();

            this.device.on('thing:initialized', async () => {
                await node.pollChildren();
                node.pollTimer = setTimeout(() => node.pollChildren(), 5000);
            });

            this.device.on('thing:destroyed', () => {
                clearInterval(node.pollTimer);
                node.pollTimer = null;
            });
        }
    }

    RED.nodes.registerType('miio-lumi-v3-input', MiioLumiV3Input, {});
};