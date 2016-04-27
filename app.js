var serialport = require("serialport");
var SerialPort = serialport.SerialPort;

var serialPort = new SerialPort("/dev/ttyAMA0", {
    baudrate: 115200,
    parser: serialport.parsers.readline('\r\n')
}, false);

serialPort.open(function (error) {
    if ( error ) {
        console.log('failed to open: '+error);
    } else {
        console.log('open');
        
        var cbfunction=function(data,sim900) {
            console.log(data,sim900);
            var id=data.match(/\+CMTI: \"SM\",(\d*)/);
            if (id) {
                sim900.read(id[1]);
                sim900.del(id[1]);
            }

            var msg=data.match(/\+CMGR: \".*?\",\"(.*?).*?\n(.*?)\n\nOK\"/);
            if (msg) {
                sim900.send(
                    sim900.usc22utf8(msg[1]),
                    "感谢参与测试，您发送的内容是："+sim900.usc22utf8(msg[2]).substr(0,55),
                    function() {
                        console.log("==============================\n\send to "+sim900.usc22utf8(msg[1])+"\n"+sim900.usc22utf8(msg[2]).substr(0,55));
                    }
                );
            }
        };

        var Sim900 = require('./Sim900.js');
        var sim900 = new Sim900(serialPort,cbfunction);

        //sim900.send("13000000000",new Date().toString(),function() { console.log("sended"); });
        //sim900.send("13000000000",new Date().toString(),function() { console.log("sended"); });
        //sim900.read(7);
    }
});