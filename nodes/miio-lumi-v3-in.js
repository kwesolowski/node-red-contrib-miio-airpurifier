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
            this.device.on('thing:available', child => console.log('Added child:', child));
            this.device.on('thing:unavailable', child => console.log('Removed child:', child));

            this.device.on('thing:initialized', async () => {
                if(node.device.matches('cap:children')) {
                    node.log(`Device can have children`);
                }

                if(node.device.matches('type:miio:gateway')) {
                    node.log(`Getting children1`);
                    let childs = node.device.children();
                    node.log(`Got childs ${util.inspect(childs)}`);

                    node.log(`_updateDeviceList`);
                    await node.device._updateDeviceList();
                    node.log(`_updateDeviceList DONE`);

                    node.log(`Getting children2`);
                    childs = node.device.children();
                    node.log(`Got childs ${util.inspect(childs)}`);

                    const getdevprop = await node.device.call('get_device_prop', [ 'lumi.0', 'device_list' ])

                    node.log(util.inspect(getdevprop, true, 3, true));
                    node.log(`Getting children3`);
                    childs = node.device.children();
                    node.log(`Got childs ${util.inspect(childs)}`);
                } else {
                    node.log(`Hub not recognized as type:miio:gateway`);
                }

                node.log(util.inspect(node.device, true,3, true));
            });
        }
    }



    RED.nodes.registerType('miio-lumi-v3-input', MiioLumiV3Input, {});
};