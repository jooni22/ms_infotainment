var OMC_VER = 0.1;
// v0.1		:	- Initial testing release, adapted from NADS-1/2 Overhead Map Coordinator

var express 	= require('express'),
	app			= express();
app.use(express.static(__dirname + '/wwwroot'));	
var server  	= require('http').createServer(app),
    io      	= require('socket.io').listen(server),
	colors 		= require('colors'),
	os			= require('os'),
    fs 			= require("fs"),
    port 		= 8899;

var SERVER_NAME = os.hostname();
var ifaces=os.networkInterfaces();
var socketTable = [];

var SERVER_SIMOPSERVER_IP = '127.0.0.1';
var SERVER_SIMOPSERVER_STREAM_PORT = 8889;
var SERVER_MINISIM_ROUTE_TBL_PORT = 8882;

colors.setTheme({
	timestamp: 'grey',
	verbose: 'cyan',
	good: 'green',
	help: 'cyan',
	warn: 'yellow',
	debug: 'blue',
	error: 'red'
});
 
server.listen(port);

eval(fs.readFileSync('minisim_infotainment_config.txt')+'');

var StringDecoder = require('string_decoder').StringDecoder;
var decoder = new StringDecoder('utf8');

Date.prototype.toLocalMysqlFormat = function() {
	return this.getUTCFullYear() + "-" + twoDigits(1 + this.getUTCMonth()) + "-" + twoDigits(this.getDate()) + " " + this.toLocaleTimeString();
};

function secondsConvert(ffmhrs, ffmmin, ffmsec) {
	var total = (3600 * parseInt(ffmhrs)) + (60 * parseInt(ffmmin)) + parseInt(ffmsec);
	return total;
}

function twoDigits(d) {
    if(0 <= d && d < 10) return "0" + d.toString();
    if(-10 < d && d < 0) return "-0" + (-1*d).toString();
    return d.toString();
}

function LOCAL_DATETIME() {
	return '['+new Date().toLocalMysqlFormat()+']';
}

function ObjectLength( object ) {
    var length = 0;
    for( var key in object ) {
        if( object.hasOwnProperty(key) ) {
            ++length;
        }
    }
    return length;
}

function getDateTime() {
	var date = new Date();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    return year + "-" + month + "-" + day + " " + hour + ":" + min + ":" + sec;
} 

/*
io.set('log level', 1);
io.set('transports', [ 'websocket', 'xhr-polling' ]);
*/
io.set('transports', [ 'polling', 'websocket' ]);
io.sockets.setMaxListeners(0);
io.sockets.on('connection', function(socket){
	var data={ IPv4address: socket.handshake.address.address };
	connect(socket, data);
	
	socket.on('disconnect', function(){
		disconnect(socket);
	});
	
	socket.on('node_announce', function(data) {
		handleNA(socket,data);
	});
	
	socket.on('display_request', function(data) {
		if(data.type == 'current_map') {
			console.log(LOCAL_DATETIME().timestamp+' Received map request');
			sendMapInfo(socket,data);
		}
	});
});

// Create a client for the socket
function connect(socket, data){
	data.clientId = generateId();
	socketTable[socket.id] = {
		'socket'	: socket,
		'data' 		: data
	};
}

// Handler for a disconnected display device
function disconnect(socket, data){
	if (socketTable[socket.id]) {
		var simplename;
		if (socketTable[socket.id].clientName) {
			simplename = socketTable[socket.id].clientName;
		} else {
			simplename = '['+socket.id+']';
		}
		console.log(LOCAL_DATETIME().timestamp+' Disconnected: '+simplename);
	}
	try {
		delete socketTable[socket.id];
	}
	catch(e) {}
}

// Unique ID generator
function generateId(){
	var S4 = function () {
		return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
	};
	return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}

function handleNA(socket, data){
	socketTable[socket.id] = data.client;
	var message = "Client connected: "+data.client+" ["+data.ip+"]";
	console.log(LOCAL_DATETIME().timestamp+' '+message);
	socket.emit('ready', { clientId: data.clientId });
}

function makeSVGfromLRI(data) {
	var lri2svgExec = require('child_process').spawn;
	var spawnedCommand = lri2svgExec('python.exe', ['lri2svg.py',data.inputFilename,OMC_MAP_PHYS_DIR], {cwd:__dirname +'/bin/lri2svg'});
	spawnedCommand.on('exit', function(code) {
		// copy/read "out.txt" for limits here
		var copyExec = require('child_process').spawn;
		var filenameExtentsTxt = OMC_MAP_PHYS_DIR+(data.inputFilename.substring(0,(parseInt(data.inputFilename.length) - 4)))+'_extents.txt';
		console.log(filenameExtentsTxt);
		var copyCommand = copyExec('copy', ['out.txt', filenameExtentsTxt], {cwd:__dirname +'/bin/lri2svg'});
		
		copyCommand.on('exit', function(code) {
			// copy finished, move on
		});
	});
}

var simStateModel = {
	MAIN_simFrameNum		:	0,
	MAIN_BLI			:	'',
	MAIN_Subject			:	'',
	MAIN_Run				:	'',
	MAIN_VDS_Chassis_Position			:	[0.0, 0.0, 0.0, 0.0],
	MAIN_VDS_Chassis_Orient				:	[0.0, 0.0, 0.0, 0.0],
	MAIN_MAP_IMG			:	'',
	MAIN_ROUTE_IMG			:	'',
	MAIN_MAP_BLI_TL_X		:	'',
	MAIN_MAP_BLI_TL_Y		:	'',
	MAIN_MAP_BLI_BR_X		:	'',
	MAIN_MAP_BLI_BR_Y		:	'',
	SVG_MAP					:	'',
	SVG_MAP_LRI_TL_X		:	'',
	SVG_MAP_LRI_TL_Y		:	'',
	SVG_MAP_LRI_BR_X		:	'',
	SVG_MAP_LRI_BR_Y		:	'',
	
	TMP_Experiment			:	'',
	TMP_Scenario			:	''
};

var simStateModel_last = {
	MAIN_simFrameNum		:	0,
	MAIN_BLI			:	'',
	MAIN_Subject			:	'',
	MAIN_Run				:	''
};

// These currently need to be defined/created from ISAT by hand
//   ** edited 1-15-2015 SKC, 4-17-2015 SKC
//eval(fs.readFileSync('known_scenarios.js')+'');

function check_known_SVGs(data) {
	if (fs.existsSync('wwwroot/maps/'+data.SVG_filename)) {
		// Do something
	}
}

function check_known_experiments() {
	var exp_guess = simStateModel.MAIN_BLI;
	
	// Check if a definition for the experiment is defined
	if (known_scenarios.hasOwnProperty(''+exp_guess)) {
		simStateModel.TMP_Experiment = exp_guess;
		return true;
	} else {
		return false;
	}
}

function check_known_scenarios() {
	var exp_guess = simStateModel.TMP_Experiment;
	var dc_run = simStateModel.MAIN_Run.split('_');
	var scenario_guess = dc_run[1].substring(0, 8);
	// Check if there is anything after the underscore
	if (/\S/.test(scenario_guess)) {
	} // end "if there is nothing after the underscore"
	else {
		switch (exp_guess) {
			case "NewIG_NIDA12_Main":
				simStateModel.TMP_Scenario = 1;
				return true;
				break;
			default:
				return false;
		} // end switch(exp_guess)
	} 
}

function lastBLI_diff() {
	if (simStateModel.MAIN_BLI == simStateModel_last.MAIN_BLI) {
		return false;
	} else {
		return true;
	}
}

function lastRun_diff() {
	if (simStateModel.MAIN_Run == simStateModel_last.MAIN_Run) {
		return false;
	} else {
		return true;
	}
}

function updateServerLRImapInfo() {
	var tmpExperiment = simStateModel.TMP_Experiment;
	var tmpScenario = simStateModel.TMP_Scenario;
	simStateModel.MAIN_MAP_IMG = known_scenarios[tmpExperiment][tmpScenario].imgMap;
	simStateModel.MAIN_ROUTE_IMG = known_scenarios[tmpExperiment][tmpScenario].imgMapRoute;
	simStateModel.MAIN_MAP_BLI_TL_X = known_scenarios[tmpExperiment][tmpScenario].imgLRItopLeftX;
	simStateModel.MAIN_MAP_BLI_TL_Y = known_scenarios[tmpExperiment][tmpScenario].imgLRItopLeftY;
	simStateModel.MAIN_MAP_BLI_BR_X = known_scenarios[tmpExperiment][tmpScenario].imgLRIbottomRightX;
	simStateModel.MAIN_MAP_BLI_BR_Y = known_scenarios[tmpExperiment][tmpScenario].imgLRIbottomRightY;
	
	// SVG handler (2-21-2017)
	if (known_scenarios[tmpExperiment][tmpScenario].svgMap) {
		simStateModel.SVG_MAP = known_scenarios[tmpExperiment][tmpScenario].svgMap;
		simStateModel.SVG_MAP_LRI_TL_X = known_scenarios[tmpExperiment][tmpScenario].svgLRItopLeftX;
		simStateModel.SVG_MAP_LRI_TL_Y = known_scenarios[tmpExperiment][tmpScenario].svgLRItopLeftY;
		simStateModel.SVG_MAP_LRI_BR_X = known_scenarios[tmpExperiment][tmpScenario].svgLRIbottomRightX;
		simStateModel.SVG_MAP_LRI_BR_Y = known_scenarios[tmpExperiment][tmpScenario].svgLRIbottomRightY;
	} else {
		// ...no SVG source in known_scenarios.js
		simStateModel.SVG_MAP = '';
		simStateModel.SVG_MAP_LRI_TL_X = '';
		simStateModel.SVG_MAP_LRI_TL_Y = '';
		simStateModel.SVG_MAP_LRI_BR_X = '';
		simStateModel.SVG_MAP_LRI_BR_Y = '';
	}
}

function sendMapInfo(socket,data) {
	console.log(LOCAL_DATETIME().timestamp+' Sending requested map info to '+socket.id);
	socket.emit('overlay_display', {
		type: 'map_update',
		MAIN_Experiment: simStateModel.MAIN_BLI,
		MAIN_Subject: simStateModel.MAIN_Subject,
		MAIN_Run: simStateModel.MAIN_Run,
		MAP_IMG: simStateModel.MAIN_MAP_IMG,
		ROUTE_IMG: simStateModel.MAIN_ROUTE_IMG,
		MAP_BLI_TL_X: simStateModel.MAIN_MAP_BLI_TL_X,
		MAP_BLI_TL_Y: simStateModel.MAIN_MAP_BLI_TL_Y,
		MAP_BLI_BR_X: simStateModel.MAIN_MAP_BLI_BR_X,
		MAP_BLI_BR_Y: simStateModel.MAIN_MAP_BLI_BR_Y,
		SVG_MAP: simStateModel.SVG_MAP,
		SVG_MAP_LRI_TL_X: simStateModel.SVG_MAP_LRI_TL_X,
		SVG_MAP_LRI_TL_Y: simStateModel.SVG_MAP_LRI_TL_Y,
		SVG_MAP_LRI_BR_X: simStateModel.SVG_MAP_LRI_BR_X,
		SVG_MAP_LRI_BR_Y: simStateModel.SVG_MAP_LRI_BR_Y
	});
}

function sendMapUpdate() {
	console.log(LOCAL_DATETIME().timestamp+' BROADCASTING system-wide map update');
	io.sockets.emit('overlay_display', {
		type: 'map_update',
		MAIN_Experiment: simStateModel.MAIN_BLI,
		MAIN_Subject: simStateModel.MAIN_Subject,
		MAIN_Run: simStateModel.MAIN_Run,
		MAP_IMG: simStateModel.MAIN_MAP_IMG,
		ROUTE_IMG: simStateModel.MAIN_ROUTE_IMG,
		MAP_BLI_TL_X: simStateModel.MAIN_MAP_BLI_TL_X,
		MAP_BLI_TL_Y: simStateModel.MAIN_MAP_BLI_TL_Y,
		MAP_BLI_BR_X: simStateModel.MAIN_MAP_BLI_BR_X,
		MAP_BLI_BR_Y: simStateModel.MAIN_MAP_BLI_BR_Y,
		SVG_MAP: simStateModel.SVG_MAP,
		SVG_MAP_LRI_TL_X: simStateModel.SVG_MAP_LRI_TL_X,
		SVG_MAP_LRI_TL_Y: simStateModel.SVG_MAP_LRI_TL_Y,
		SVG_MAP_LRI_BR_X: simStateModel.SVG_MAP_LRI_BR_X,
		SVG_MAP_LRI_BR_Y: simStateModel.SVG_MAP_LRI_BR_Y
	});
}

function sendMapUpdate_error() {
	console.log(LOCAL_DATETIME().timestamp+' Error E:'+simStateModel.TMP_Experiment+' S:'+simStateModel.TMP_Scenario);
	io.sockets.emit('overlay_display', {
		type: 'map_error',
		UNKNOWN_Experiment: simStateModel.MAIN_BLI
	});
}

function compare_last_SSM() {
	if (lastBLI_diff()) {
		console.log(LOCAL_DATETIME().timestamp+' *** BLI change detected');
		if (check_known_experiments()) {
			console.log(LOCAL_DATETIME().timestamp+' ** PASSED KNOWN EXPERIMENTS');
			if (check_known_scenarios()) {
				updateServerLRImapInfo();
				sendMapUpdate();
			} else {
				console.log(LOCAL_DATETIME().timestamp+' ** Unknown scenario: '+simStateModel.TMP_Scenario);
				sendMapUpdate_error();
			}
		} else {
			console.log(LOCAL_DATETIME().timestamp+' ** Unknown experiment: '+simStateModel.MAIN_BLI);
			sendMapUpdate_error();
		}
	} // end "has the experiment or run name changed?" conditional
	update_SSM_last_values();
}

function update_SSM_last_values() {
	simStateModel_last.MAIN_simFrameNum = simStateModel.MAIN_simFrameNum;
	simStateModel_last.MAIN_BLI = simStateModel.MAIN_BLI;
	simStateModel_last.MAIN_Subject = simStateModel.MAIN_Subject;
	simStateModel_last.MAIN_Run = simStateModel.MAIN_Run;
}

// UDP handler (data from miniSim route table)
function handleUDPalert(message,remote) {
	//console.log(message);
	simStateModel.MAIN_simFrameNum = message.readInt32LE(0);
		
	simStateModel.MAIN_VDS_Chassis_Position[0] = message.readDoubleLE(4);
	simStateModel.MAIN_VDS_Chassis_Position[1] = message.readDoubleLE(12);
	simStateModel.MAIN_VDS_Chassis_Position[2] = message.readDoubleLE(20);
	
	simStateModel.MAIN_VDS_Chassis_Orient[0] = message.readFloatLE(28);
	simStateModel.MAIN_VDS_Chassis_Orient[1] = message.readFloatLE(32);
	simStateModel.MAIN_VDS_Chassis_Orient[2] = message.readFloatLE(36);
	
	var Orig_BLI = message.toString("utf8",40,423).split(/[\/]|[^\w\s]/);
	simStateModel.MAIN_BLI = Orig_BLI[0];
	//console.log('F: '+simStateModel.MAIN_simFrameNum+' E: '+simStateModel.MAIN_BLI);
	
	/*
	io.sockets.emit('overlay_display', { 
		type: 'update', 
		MAIN_simFrameNum: simStateModel.MAIN_simFrameNum,
		MAIN_Experiment: simStateModel.MAIN_BLI,
		MAIN_Subject: simStateModel.MAIN_Subject,
		MAIN_Run: simStateModel.MAIN_Run,
		MAIN_VDS_Chassis_Position : simStateModel.MAIN_VDS_Chassis_Position,
		MAIN_VDS_Chassis_Orient : simStateModel.MAIN_VDS_Chassis_Orient
	});
	*/
	
	//console.log(LOCAL_DATETIME().timestamp+' F:'+simStateModel.MAIN_simFrameNum+' E:'+simStateModel.MAIN_BLI+' P:'+simStateModel.MAIN_VDS_Chassis_Position);
	
	//compare_last_SSM();
}

// UDP advertisement listener
var UDPPORT = SERVER_MINISIM_ROUTE_TBL_PORT;
var UDPHOST = SERVER_SIMOPSERVER_IP;
var Buffer = require('buffer').Buffer;
var UDPmessage = null;
var dgram = require('dgram');
var UDPserver = dgram.createSocket('udp4');

UDPserver.on('listening', function () {
	var UDPaddress = UDPserver.address();
	console.log(LOCAL_DATETIME().timestamp+' Listening for UDP control on ' + UDPaddress.address + ":" + UDPaddress.port);
});

UDPserver.on('message', function (message, remote) {
	handleUDPalert(message,remote);
});

UDPserver.bind(UDPPORT, UDPHOST);

console.log(LOCAL_DATETIME().timestamp+' miniSim Overhead Map Coordinator (OMC) server running on http://localhost:' + port);