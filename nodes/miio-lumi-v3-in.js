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

        async setupGateway() {
            let node = this;
            await this.connect();

            this.device.on('thing:initialized', async () => {
                node.pollTimer = setTimeout(() =>{
                    let childs = node.device.children();
                    for (const child of childs) {
                        node.info("Handling child " + util.inspect(child))
                    }
                }, 10000);
            });
        }
    }



    RED.nodes.registerType('miio-lumi-v3-input', MiioLumiV3Input, {});
};