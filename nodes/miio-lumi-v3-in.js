const common = require('./common');

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

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
                if(node.device.matches('type:miio:gateway')) {
                    node.log(`Getting children1`);
                    let childs = node.device.children();
                    node.log(`Got childs ${JSON.stringify(childs)}`);

                    node.log(`InitCallback`);
                    await node.device.initCallback();
                    node.log(`InitCallback DONE`);

                    node.log(`Getting children2`);
                    childs = node.device.children();
                    node.log(`Got childs ${JSON.stringify(childs)}`);
                }
                node.log(`Hub not recognized as type:miio:gateway`);
            });
        }
    }



    RED.nodes.registerType('miio-lumi-v3-input', MiioLumiV3Input, {});
};