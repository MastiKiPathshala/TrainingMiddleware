var os = require("os");
var log = require('loglevel');
var exec = require('child_process').exec;
var http = require('http');
var async = require('async');
var iwlist = require('wireless-tools/iwlist');
var udhcpc = require('wireless-tools/udhcpc');
var hostapd = require('wireless-tools/hostapd');
var iwconfig = require('wireless-tools/iwconfig')
var hostname = os.hostname();
var ifconfig = require('wireless-tools/ifconfig');
var redis = require('redis');

//Lets define a port we want to listen to
const AP_SERVICE_PORT = 80;


var id;
var liveUrl;
var svrId;
redisClient = redis.createClient();
//Overwriting plugin to allow timestamp to be appended

var originalFactory = log.methodFactory;

log.methodFactory = function(methodName, logLevel, loggerName) {

    var rawMethod = originalFactory(methodName, logLevel, loggerName);

    return function(message) {
        rawMethod("[" + new Date() + "]" + message);
    };
};

//Setting up our log level: select "trace" / "debug" / "warn" / "info" / "error"
log.setLevel('debug');



require('getmac').getMac(function(err, macAddress) {
    if (err) {
        id = "SecurIoT_" + myuuid;
    } else {
        id = "SecurIoT_" + macAddress;
    }
    redisClient.hmset("SystemDetails", 'parkingLotId', id);
    redisClient.hmset("CloudDetails", 'mqttIpAddr', "128.199.173.29");
    redisClient.hmset("CloudDetails", 'mqttPort', "1883");
})

log.info('SecurIoT Training Service: start');

var isStatic = false;

var bodyParser = require('body-parser')

var express = require('express');
var app = express();
app.use(bodyParser.json());
app.use('/', express.static(__dirname + '/www'));
app.get('/',express.static('www'))
app.post('/api/system/v1.0', function(req, res) {

    var body = req.body;
   
    log.debug(req.body)

    switch (body.action) {

         case "CPU":
            log.debug(' received cpu status request');
            res.writeHead(200);
            res.end(JSON.stringify({uptime : os.uptime(), load : os.loadavg(), freemem : os.freemem()}));

         break;

        case "STATUS":
            log.debug(" received status request");
            var ret = {}
            ret.id = id;
            ret.svrId = svrId;
            ret.status = true;

            getInterfaces(function(intfNames) {

                var res = this.res;
                var ret = this.ret;

                if (intfNames) {
                    ret.interfaces = intfNames;
                }

                log.debug(' posting status response: ' + JSON.stringify(ret));
                res.writeHead(200);
                res.end(JSON.stringify(ret));

            }.bind({ res: res, ret: ret }));

            break;

        case "SCAN":

            log.debug(" received scan request");

            var data = body.data;
            var iface = body.iface;

            scanNetworks(iface, function(err, networks) {

                var iface = this.iface;

                if (!err) {

                    res.writeHead(200);
                    res.end(JSON.stringify(networks));
                } else {

                    // scan again on failure
                    scanNetworks(iface, function(err, networks) {

                        var iface = this.iface;

                        if (!err) {
                            res.writeHead(200);
                            res.end(JSON.stringify(networks));
                        } else {
                            res.writeHead(500);
                            res.end('{"status":false}');
                        }

                    }.bind({ iface: iface }));
                }
            }.bind({ iface: iface }));

            break;

        case "STATIC":
            log.debug(" received L3 network request");

            var data = body.data;
            var iface = body.iface;

            addStatic(iface, data, function(err) {

                var data = this.data;
                var iface = this.iface;


                if (err) {

                    log.debug(' add static ip address error: ' + err);
                    res.writeHead(500);
                    res.end('{"status":false}');
                } else {

                    isStatic = true;
                    res.writeHead(200);
                    res.end('{"status":true}');
                }

            }.bind({ iface: iface, data: data }));
            break;

        case "ADD":

            
	    log.debug(" received L2 network request");
	    
            var data = body.data;
            var iface = body.iface;

            addNetwork(iface, data, function(err) {

                var data = this.data;
                var iface = this.iface;

                if (err) {
		
                    res.writeHead(200);
                    res.end('{"status":false}');
                } else {
		
                    res.writeHead(200);
                    res.end('{"status":true}');
                    setTimeout(restartNetwork, 5000);
                }

            }.bind({ iface: iface, data: data }));
            break;

        case "REBOOT":
            log.debug(' received reboot request');
            restartSystem();
            res.writeHead(200);
            res.end('{"status":true}');
            break;

        default:
            log.warn(' received unknown request');
            res.writeHead(200);
            res.end('{"status":true}');
            break;
    }



});

app.listen(AP_SERVICE_PORT);
log.info('Listening on port '+AP_SERVICE_PORT);

var addStatic = function(iface, data, cb) {
    clearInterfaces(iface, 'static', function(err) {

        var cb = this.cb;
        var data = this.data;
        var iface = this.iface;

        if (!err) {
            addStaticNetworkId(iface, data.address, data.netmask, data.gateway, cb)
        } else {
            cb(true);
        }

    }.bind({ iface: iface, data: data, cb: cb }));
}

function addNetwork(iface, data, cb) {
   
    if (isStatic === true) {
	
        if (iface != "eth0") {

            clearNetworks(iface, function(err) {

                var cb = this.cb;
                var data = this.data;
                var iface = this.iface;

                if (err) {
                    log.warn(' failed to clear networks(' + err + ')')
                } else {
                    wifiEnable(iface, data, cb);
                }
            }.bind({ iface: iface, data: data, cb: cb }));

        } else {
            cb(false);
        }

    } else {
	
        clearInterfaces(iface, 'dhcp', function(err) {
	    
            var cb = this.cb;
            var data = this.data;
            var iface = this.iface;

            if (err) {
		
                log.warn(' failed to clear interfaces(' + err + ')')
                return this.cb(true);
            }

            if (iface != "eth0") {
		
                clearNetworks(iface, function(err) {
		    
                    var cb = this.cb;
                    var data = this.data;
                    var iface = this.iface;
		    
                    if (!err) {
			
                        wifiEnable(iface, data, cb);
                    }		    
                }.bind({ iface: iface, data: data, cb: cb }));
            } else {
		
                return this.cb(false);
            }

        }.bind({ iface: iface, data: data, cb: cb }));
    }
}

function wifiEnable(iface, data, cb) {
    // Loop and add each network entry
    for (var i in data) {

        addnetworkid(iface, data[i].rasp_ssid_, data[i].wifiPass);

    }
    setTimeout(function (){wifiTimeoutHandler (cb)}, 5000);
}

var wifiTimeoutHandler = function (cb) {
    cb (false);
}

function clearNetworks(iface, cb) {
   
    var cmd = "sudo cp /etc/wpa_supplicant/wpa_supplicant.default " +
        "/etc/wpa_supplicant/wpa_supplicant_" + iface + ".conf";
    exec(cmd, function(err, stdout, stdout) {
        cb(err);
    });
}

function clearInterfaces(iface, mode, cb) {

	cb(false)
}

function addStaticNetworkId(iface, address, netmask, gateway, cb) {
    //assuming wlan1 is in question
    //addresS: the static address you want to set
    //netmask: the network mask
    //network: the router ip
    //broadcast: the max broadcast range
    //gateway : the default gateway

    var cmd = "sudo echo \"\ninterface " + iface +
        "\nstatic ip_address=" + address +
        "\nstatic network_mask=" + netmask +
        "\nstatic routers=" + gateway +
        "\nstatic domain_name_servers=" + gateway + "\" | sudo tee --append /etc/dhcpcd.conf";

    exec(cmd, function(err, stdout, stderr) {
        cb(err);
    });
}

function addnetworkid(iface, id, pwd) {

    var iface_wpa_file = '/etc/wpa_supplicant/wpa_supplicant_';

    // if no password
    if (pwd === "") {

        log.debug(' network add: ' + iface + '=>(' + id + ')')

        var cmd = "sudo echo \"\nnetwork={\nssid=\\\"" + id +
            "\\\"\nkey_mgmt=NONE\n}\" | sudo tee --append " + iface_wpa_file +
            +iface + ".conf";

        //Open Network
        exec(cmd, function(err, stdout, stderr) {

            var id = this.id;
            var pwd = this.pwd;
            var iface = this.iface;

            if (err) {
                log.warn(cmd + ' exec error: ' + err + '(' + stderr + ')');
            }

            log.debug(stdout);
        }.bind({ iface: iface, id: id, pwd: pwd }));

    } else {

        log.debug(' network add: ' + iface + '=>(' + id + ',' + pwd + ')')
        var cmd = "sudo echo \"\nnetwork={\n\tssid=\\\"" + id +
            "\\\"\n\tpsk=\\\"" + pwd +
            "\\\"\n\tkey_mgmt=WPA-PSK\n\tpriority=10\n}\" | sudo tee --append " +
            iface_wpa_file + iface + ".conf";
	

        // password protected network
        exec(cmd, function(err, stdout, stderr) {

            var id = this.id;
            var pwd = this.pwd;
            var iface = this.iface;

            if (err) {
		
                log.warn(cmd + ' exec error: ' + err + '(' + stderr + ')');
            }

            log.debug(stdout);
	  
        }.bind({ iface: iface, id: id, pwd: pwd }));
    }
}

function restartNetwork() {
    log.debug(' System reboot');

    exec('sudo reboot', function(err, stdout, stderr) {
	log.debug("Exiting....");
        if (err) {
	   
            log.warn(' reboot exec error: ' + err + '(' + stderr + ')');
        } else {
            log.debug(stdout);
        }
    });
}


function scanNetworks(iface, cb) {
    iwlist.scan(iface, function(err, networks) {

        var cb = this.cb;
        var iface = this.iface;

        if (err) {
            log.warn(' network scan error: ' + err);
            cb(true, []);
        } else {
            log.debug(' networks scanned: ' + JSON.stringify(networks));
            cb(false, networks);
        }

    }.bind({ iface: iface, cb: cb }));
}

function restartSystem() {
    log.info(' system restart');

    exec('sudo reboot', function(err, stdout, stderr) {
        if (err) {
            log.warn(err + stderr);
        } else {
            log.debug(stdout);
        }
    });
}



var getInterfaces = function(callback) {

	ifconfig.status(function(err, status) {

        if (err) {
            if (this.cb) { this.cb(false); }
            return;
        }
	var intfNames = [];
        for (var x in status) {

            //looking at ethernet connections
            if (status[x].interface != "lo" && status[x].interface != "usb0") {
                if (status[x].ipv4_address === undefined) {
                   ip = "";
                } else {
                   ip = status[x].ipv4_address;
                }
		var interfaceName = status[x].interface ;
		intfNames.push({[ interfaceName] :ip });

                //testing the ip
                //Since we found a valid ip we return true and break

            }
        }
	if (callback) { callback(intfNames);}
        
    })
}
