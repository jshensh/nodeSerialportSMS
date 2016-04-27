var Buffer = require("buffer").Buffer;
var iconv = require("iconv");

function Sim900(com,cbfunction) {
    var self=this;
    var serialPort = com;
    this.writing=false;
    this.commandList=[];
    this.cbfunction=cbfunction || function() {};
    this.returnValue=[];
    serialPort.on('data', function(data) {
        if (self.writing) {
            self.writing=false;
            self.returnValue=[];
            self.doWrite();
        } else {
            data=data.toString().split("\r\n");
            self.returnValue.push(data[0]);
        }
    });
    this.cb=function() {
        self.cbfunction(self.returnValue.join("\n"),self);
    };
    this.doWrite=function() {
        setTimeout(function() {
            if (self.writing) {
                return false;
            }
            //console.log(self.commandList);
            for (var i in self.commandList) {
                self.writing=true;
                if (typeof self.commandList[i]==="function") {
                    self.commandList[i]();
                } else {
                    serialPort.write(self.commandList[i]);
                }
                console.log(i,self.commandList.length-1,self.commandList[i]);
                if (parseInt(i)===self.commandList.length-1) {
                    self.commandList=[];
                } else {
                    delete self.commandList[i];
                }
                break;
            }
        }, 300);
    };
    this.write=function(cmd) {
        self.commandList.push(cmd);
        self.doWrite();
        var re={
            "then": function(cmd) {
                self.commandList.push(cmd);
                self.doWrite();
                return re;
            }
        };
        return re;
    };
    this.write("AT\r").then("ATE0\r").then("AT+CMGF=1\r").then("AT+CNMI=2,1\r").then("AT+CMGD=1,4\r");
    this.utf82usc2=function(str) {
        return new iconv.Iconv("UTF-8","UCS-2").convert(str).toString("HEX").toLocaleUpperCase();
    };
    this.usc22utf8=function(str) {
        var tmp=str.match(/.{4}/g).join("%u");
        return unescape((tmp?"%u":"")+tmp);
    };
    this.read=function(id) {
        self.write("AT+CMGR="+id+"\r").then(self.cb());
    };
    this.del=function(id) {
        self.write("AT+CMGD="+id+"\r");
    };
}

if(typeof Sim900.initialized == "undefined") {
    Sim900.prototype.send = function(m,c,callback) {
        this.write("AT+CSMP=17,167,2,25\r")
            .then("AT+CSCS=\"UCS2\"\r")
            .then("AT+CMGS=\""+this.utf82usc2(m)+"\"\r")
            .then(this.utf82usc2(c)+String.fromCharCode(0x1A))
            .then(callback || this.cb() || "\r");
    }
}

module.exports = Sim900;