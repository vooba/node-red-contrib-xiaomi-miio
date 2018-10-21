const miio = require('./../common/devices.js');

function isSet(value) {
    return typeof value !== 'undefined' && value != null;
}

module.exports = function(RED) {

    function miioMoonlight(config) {
        console.log('----> Init Moonlight! ');
        
        RED.nodes.createNode(this, config);
        var _node = this;

        //var globalContext = this.context().global;

        if(config.manEnabled)
        {
            miio.addDevice(config.manDeviceIp, config.manDeviceToken).then(
                device => {
                    config.deviceId = device.management.api.id;
                    miioMoonlightHook(_node, config);
                }
            );

            return;
        } 
        else 
        {
            miioMoonlightHook(_node, config);
        }
    } 

    function miioMoonlightHook(_node, config) {
        // hook device events

        var deviceId = config.deviceId;

        if (deviceId) {
            
            _node.on('input', function(msg) {
                if (!_node._enabled) {
                    return;
                }
                
                var payload = msg.payload;

                var device = miio.devices[deviceId];
                
                if (device) {
                    
                    if (isSet(payload.power)) {
                         device.power(payload.power);
                    }
                    
                    if (isSet(payload.brightness)) {
                         device.brightness(payload.brightness);
                    }

                    if (isSet(payload.color)) {
                        device.color(payload.color);
                    }

                    if (isSet(payload.scene)) {
                        device.scene(payload.scene);
                    }
                    
                    if (isSet(payload.refresh && payload.refresh == true))
                    {
                        device.getAllProperties(val => {
                            msg.payload = val;
                            _node.send(msg);
                        });
                    }
                    
                } else {
                    console.log('No such device with identifier ', deviceId);        
                }
            });
            

            miio.registerPropertyListener(deviceId, function(e) {
                // Check if current instance is still enabled, this avoid running old callback when the node is re-loaded
                if (_node._enabled) {
    
                    var msg = { };
                    msg.payload = {};
                    msg.payload[e.key] = e.value;

                    _node.send(msg);
                }
            });

        } else {
            console.log('Device identifier not specified.');
        }

        _node._enabled = true;
        
        _node.on('close',function() {
            _node._enabled = false;
        });
        
    }

    RED.nodes.registerType("miio-moonlight", miioMoonlight, {
        settings: {
            miioMoonlightDevices: {
                value: miio.optionDevices,
                exportable: true
            }
        }
    });
}