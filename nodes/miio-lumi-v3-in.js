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
            for (const child of node.device.children()) {
                node.log("Handling child " + util.inspect(child.id))
                if(child.matches('type:sensor')) {
                    node.log(util.inspect(child.values()));
                } else {
                    node.log("child is not a sensor");
                }
            }
        }
        async setupGateway() {
            let node = this;
            await this.connect();

            this.device.on('thing:initialized', async () => {
                await node.pollChildren();
                node.pollTimer = setTimeout(() => node.pollChildren(), 10000);
            });

            this.device.on('thing:destroyed', () => {
                clearInterval(node.pollTimer);
                node.pollTimer = null;
            });
        }
    }

    RED.nodes.registerType('miio-lumi-v3-input', MiioLumiV3Input, {});
};