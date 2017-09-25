var MINISIM_INFOTAINMENT_SYS_VER = 0.2;
// v0.2		:   - Inital Git check in
//				- Updated socket.io, socket.io-client
//				- New: Standalone miniSim OMC
//				- New: SVG mapping
// v0.1		:	- Initial testing release

var express 	= require('express'),
	app			= express();
app.use(express.static(__dirname + '/wwwroot'));
app.get('/', function(req, res){
    res.sendFile('infotainment_system.htm', { root: __dirname + "/wwwroot" } );
});

var port 		= 80,
	server  	= require('http').createServer(app).listen(port),
    io      	= require('socket.io').listen(server),
	fs 			= require('fs'),
	nodefs 		= require('node-fs'),
	colors 		= require('colors'),
	moment		= require('moment'),
    path		= require('path'),
	SerialPort 	= require('serialport'),
	Buffer 		= require('buffer').Buffer,
	dgram 		= require('dgram'),
	// map IO
	map_io 			= require('socket.io-client'),
	map_serverUrl 	= 'http://localhost:8899',
	//map_io 			= require('socket.io-client.OLD'),
	//map_serverUrl 	= 'http://128.255.250.194:8888',
	map_socket 		= map_io.connect(map_serverUrl);

// var SteeringWheel_AB_SerialPort = "COM3";
// var MultiInfoDisplay_SerialPort = "COM4";

function getDirectories(srcpath) {
  return fs.readdirSync(srcpath).filter(function(file) {
    return fs.statSync(path.join(srcpath, file)).isDirectory();
  });
}
	
var exec = require('child_process').exec;

eval(fs.readFileSync('minisim_infotainment_config.txt')+''); // empty string concatenation is necessary (file content as a string, not object)
app.use('/mp3', express.static(BASE_MP3_JUKEBOX_STORE));

var socketTable = [];
var ALBUMS = {};
var tracks = [];
var AUDIO_CURRENT_STATUS = {};
var MAP_SERVER_STATUS = {};

//var CAB_HOST_IP = '90.0.0.80';
var CAB_HOST_IP = 'localhost';
var RT_PORT_INCOMING = 8889;
//var RT_HOST_IP = '90.0.0.2';
var RT_PORT_OUTGOING = 8887;
var CAB_IGNITION_MODES = {
	1	:	{ desc: 'Off' },
	2	:	{ desc: 'Accessory' },
	3	:	{ desc: 'Ignition On' }
};
var CAB_IGNITION_CURRENT_STATE = 1;

var INF_SCREEN_INDEX = {
	5	:	{ pageDivId: 'pageContainer_ignitionRollover'},
	10	:	{ pageDivId: 'pageContainer_home' },
	20	: 	{ pageDivId: 'pageContainer_apps' },
	30	:	{ pageDivId: 'pageContainer_select_audio_src' },
	40	: 	{ pageDivId: 'pageContainer_MP3' },
	41	: 	{ pageDivId: 'pageContainer_MP3_play' },
	50	:	{ pageDivId: 'pageContainer_radio_play' },
	60	:	{ pageDivId: 'pageContainer_setup' },
	70	: 	{ pageDivId: 'pageContainer_text_entry_task_a' },
	80	: 	{ pageDivId: 'pageContainer_navigation' },
	90	:	{ pageDivId: 'pageContainer_maintenance' },
	100	:	{ pageDivId: 'pageContainer_screen_blackout' },
	101	:	{ pageDivId: 'pageContainer_logo_NADSonly' },
	102	:	{ pageDivId: 'pageContainer_map_debug' }
};
var INF_SCREEN_INDEX_REV = {};

function createINF_SCREEN_INDEX_REV() {
	for(var index in INF_SCREEN_INDEX) {
		var thisPageDivId = INF_SCREEN_INDEX[index].pageDivId;
		INF_SCREEN_INDEX_REV[thisPageDivId] = index;
	}
}

createINF_SCREEN_INDEX_REV();

// see "Camry_infotainment_button_ID_matrix.xlsx" for button mappings
var PHYS_BUTTON_INDEX = {
	'b'	:	513,
	'c'	:	514,
	'd' :	515,
	'D' :	516,
	'e'	:	517,
	'E'	:	518,
	'f'	:	519,
	'g'	:	520,
	'h'	:	521,
	'i'	:	522,
	'j'	:	523,
	'k'	:	524,
	'l'	:	525,
	'm'	:	526,
	'o'	:	527,
	'p'	:	528,
	'q'	:	529,
	'r'	:	530,
	's'	:	531
};

var RT_VARS_INCOMING = {
	SimFrame					: 0,
	SCC_Info_Screen_pageDivId 	: -9999,
	SCC_Info_Screen_state		: -9999,
	VDS_Veh_Eng_RPM				: -9999.99
};

var RT_VARS_OUTGOING = {
	AUX_Info_Screen 	: 0,
	AUX_Info_Button		: 0,
	AUX_Info_Cursor		: { xpos: -9999, ypos: -9999 }
};

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

function arrayObjectIndexOf(myArray, searchTerm, property) {
    for(var i = 0, len = myArray.length; i < len; i++) {
        if (myArray[i][property] === searchTerm) return i;
    }
    return -1;
}

function updateButtonPressVal_PHYS(data) {
	if (PHYS_BUTTON_INDEX[data.asciival]) {
		RT_VARS_OUTGOING.AUX_Info_Button = PHYS_BUTTON_INDEX[data.asciival];
		var resetTimer = setTimeout(function() {
			RT_VARS_OUTGOING.AUX_Info_Button = 0;
		}, (3/60)*1000);
	}
}

/*
// Steering wheel analog button support
var serialPort_SteeringWheel_AB = new SerialPort("\\\\.\\"+SteeringWheel_AB_SerialPort, { baudrate: 9600 });
var SteeringWheel_AB_LASTVALUE = '';
var SteeringWheel_AB_PRESSED = '';
var SteeringWheel_AB_PRESS_TIMEOUT = null;

serialPort_SteeringWheel_AB.on('error', function(err) {
	// open logic 
	console.log(LOCAL_DATETIME().timestamp+' '+SteeringWheel_AB_SerialPort+' error: '+err);
});

serialPort_SteeringWheel_AB.on('open', function() {
	// open logic 
	console.log(LOCAL_DATETIME().timestamp+' '+SteeringWheel_AB_SerialPort+' open');
});
	
serialPort_SteeringWheel_AB.on('data', function(data) {
	var thisSerialData = String(data);
	if (thisSerialData !== SteeringWheel_AB_LASTVALUE) {
		console.log(LOCAL_DATETIME().timestamp+' '+'[Steering analog button]'.verbose+' Change: ' +SteeringWheel_AB_LASTVALUE+' -> '+thisSerialData);
		// Do leading edge stuff here (if thisSerialData !== 0, d, or e)
		
		// Add serial pass-through for instrument cluster here
		// ...
		
		if ( (thisSerialData !== 'e') && (thisSerialData !== 'd') ){
			if (thisSerialData === '0') {
				// no keys pressed ... the default state
			} else {
				io.sockets.emit('IC_command', { type: 'AB_press', keypress: thisSerialData });
				updateButtonPressVal_PHYS({ asciival: thisSerialData });
				//console.log(LOCAL_DATETIME().timestamp+' '+thisSerialData);
			}
		}
		
		// Handling for the short/long press of the MODE/HOLD button
		if (SteeringWheel_AB_LASTVALUE === 'e') {
			if (SteeringWheel_AB_PRESS_TIMEOUT !== null) {
				// send a "short press" ... 'e'
				io.sockets.emit('IC_command', { type: 'AB_press', keypress: 'e' });
				updateButtonPressVal_PHYS({ asciival: 'e' });
				console.log(LOCAL_DATETIME().timestamp+' MODE (short press)');
				clearTimeout(SteeringWheel_AB_PRESS_TIMEOUT);
				SteeringWheel_AB_PRESS_TIMEOUT = null;
			}
		}
		if (thisSerialData === 'e') {
			SteeringWheel_AB_PRESSED = 'e';
			SteeringWheel_AB_PRESS_TIMEOUT = setTimeout(function() {
				// send a "long press" ... 'E'
				// io.sockets.emit('IC_command', { type: 'AB_press', keypress: 'E' });
				io.sockets.emit('NCWC_control', { type: 'stop' });
				updateButtonPressVal_PHYS({ asciival: 'E' });
				console.log(LOCAL_DATETIME().timestamp+' HOLD (long press)');
				SteeringWheel_AB_PRESS_TIMEOUT = null;
				SteeringWheel_AB_PRESSED = '';
			},2000); // 2 second timeout for a "long press"
		} // end if (thisSerialData=='e')
		
		// Handling for the short/long press of the BACK button (non-OEM addition)
		if (SteeringWheel_AB_LASTVALUE === 'd') {
			if (SteeringWheel_AB_PRESS_TIMEOUT !== null) {
				// send a "short press" ... 'd'
				io.sockets.emit('IC_command', { type: 'AB_press', keypress: 'd' });
				updateButtonPressVal_PHYS({ asciival: 'd' });
				console.log(LOCAL_DATETIME().timestamp+' BACK (short press)');
				clearTimeout(SteeringWheel_AB_PRESS_TIMEOUT);
				SteeringWheel_AB_PRESS_TIMEOUT = null;
			}
		}
		if (thisSerialData === 'd') {
			SteeringWheel_AB_PRESSED = 'd';
			SteeringWheel_AB_PRESS_TIMEOUT = setTimeout(function() {
				// send a "long press" ... 'D'
				io.sockets.emit('IC_command', { type: 'AB_press', keypress: 'D' });
				updateButtonPressVal_PHYS({ asciival: 'D' });
				console.log(LOCAL_DATETIME().timestamp+' BACK (long press)');
				SteeringWheel_AB_PRESS_TIMEOUT = null;
				SteeringWheel_AB_PRESSED = '';
			},2000); // 2 second timeout for a "long press"
		} // end if (thisSerialData=='d')
		
		sendMultiInfoDisplay_routed_data(thisSerialData);
		SteeringWheel_AB_LASTVALUE = thisSerialData;
	} // end if (thisSerialData !== SteeringWheel_AB_LASTVALUE)
}); // end on('data')

var MultiInfoDisplay_SerialPort_CONNECTED = false;
var serialPort_MultiInfoDisplay = new SerialPort("\\\\.\\"+MultiInfoDisplay_SerialPort, { baudrate: 9600 });

serialPort_MultiInfoDisplay.on('error', function(err) {
	// open logic 
	console.log(LOCAL_DATETIME().timestamp+' '+MultiInfoDisplay_SerialPort+' error: '+err);
});

serialPort_MultiInfoDisplay.on('open', function() {
	// open logic 
	console.log(LOCAL_DATETIME().timestamp+' '+MultiInfoDisplay_SerialPort+' open');
	MultiInfoDisplay_SerialPort_CONNECTED = true;
});

function sendMultiInfoDisplay_routed_data(data) {
	if (MultiInfoDisplay_SerialPort_CONNECTED) {
		serialPort_MultiInfoDisplay.write(''+data); // force ASCII character
		console.log(LOCAL_DATETIME().timestamp+' '+'[Multi Info Display]'.help+' Sent: ' +data);
	} else {
		console.log(LOCAL_DATETIME().timestamp+' '+MultiInfoDisplay_SerialPort+' not connected');
	}
}
*/

// Map functions
function requestMapInfo() {
	map_socket.emit('display_request', { type: 'current_map' });
}
// Map I/O
map_socket.on('connect', function(socket){ 
	console.log(LOCAL_DATETIME().timestamp+' [Mapping]'.good+' Connected @ '+map_serverUrl); 
	io.sockets.emit('overlay_display', { type: 'connection_update', connectionstatustext: 'Connected' });
	var mapRequestTimeout = setTimeout(function() {
		requestMapInfo();
	}, 2000);
});

map_socket.on('disconnect', function(){
	console.log(LOCAL_DATETIME().timestamp+' [Mapping]'.good+' Disconnected @ '+map_serverUrl); 
	io.sockets.emit('overlay_display', { type: 'connection_update', connectionstatustext: 'Disconnected' });
});

map_socket.on('ready', function(data) {});

map_socket.on('overlay_display', function(data) {
	var remote_MAP_IMG = ''+map_serverUrl+'/'+data.SVG_MAP;
	if (data.type == 'map_update') {
		io.sockets.emit('overlay_display', {
			type: 'map_update',
			MAP_IMG: remote_MAP_IMG, 
			ROUTE_IMG: '',  	
			MAP_BLI_TL_X: data.SVG_MAP_LRI_TL_X, 
			MAP_BLI_TL_Y: data.SVG_MAP_LRI_TL_Y, 
			MAP_BLI_BR_X: data.SVG_MAP_LRI_BR_X, 
			MAP_BLI_BR_Y: data.SVG_MAP_LRI_BR_Y 
		});
	} else {
		io.sockets.emit('overlay_display', data);
	}
});
// end Map I/O

/*
io.set('log level', 1);
io.set('transports', [ 'websocket', 'xhr-polling' ]);
*/
io.set('transports', [ 'polling', 'websocket' ]);
io.sockets.setMaxListeners(0);
io.sockets.on('connection', function(socket){
	var data={ IPv4address: socket.handshake.address.address };
	connect(socket, data);
	
	//requestMapInfo();
	
	socket.on('disconnect', function(){
		disconnect(socket);
	});
	
	socket.on('node_announce', function(data) {
		handleNA(socket,data);
	});
	
	socket.on('map_request', function() {
		console.log('map request');
		requestMapInfo();
	});
	
	socket.on('mp3_jukebox_enumerate', function(data) {
		enumerateMP3Changer();
	});
	
	socket.on('IUI_command', function(data) {
		//console.log(data);
		switch(data.type) {
			case 'playALERT':
				socket.broadcast.emit('NCWC_control', data);
				break;
			case 'playMP3':
				socket.broadcast.emit('NCWC_control', data);
				break;
			case 'playStream':
				socket.broadcast.emit('NCWC_control', data);
				break;
			case 'audio_back':
				var parsedAUDIO_CURRENT_STATUS = JSON.parse(AUDIO_CURRENT_STATUS);				
				if(parsedAUDIO_CURRENT_STATUS.currenttime < 5) {
					ALBUMS[parsedAUDIO_CURRENT_STATUS.nowplaying_title].mp3List.map(function(obj,index) {
						if (obj.filename === parsedAUDIO_CURRENT_STATUS.nowplaying_subtitle) {
							if (index !== 0) {
								//console.log(parsedAUDIO_CURRENT_STATUS);
								socket.broadcast.emit('NCWC_control', { type: 'playMP3', 'playlink':ALBUMS[parsedAUDIO_CURRENT_STATUS.nowplaying_title].mp3List[(index-1)].url, albumtitle: parsedAUDIO_CURRENT_STATUS.nowplaying_title, trackname: ALBUMS[parsedAUDIO_CURRENT_STATUS.nowplaying_title].mp3List[(index-1)].filename });
							} else {
								// this is the first track, return to beginning
								socket.broadcast.emit('NCWC_control', { type:'reset_and_play' });
								console.log('beginning');
							}
						} else {
							// not found
						}
					});
				} else {
					// return to beginning of current track
					socket.broadcast.emit('NCWC_control', { type:'reset_and_play' });
					//console.log('back to beginning');
				}
				break;
			case 'audio_fwd':
				var parsedAUDIO_CURRENT_STATUS = JSON.parse(AUDIO_CURRENT_STATUS);
				ALBUMS[parsedAUDIO_CURRENT_STATUS.nowplaying_title].mp3List.map(function(obj,index) {
					if (obj.filename === parsedAUDIO_CURRENT_STATUS.nowplaying_subtitle) {
						if (index < ObjectLength(ALBUMS[parsedAUDIO_CURRENT_STATUS.nowplaying_title].mp3List)-1) {
							socket.broadcast.emit('NCWC_control', { type: 'playMP3', 'playlink':ALBUMS[parsedAUDIO_CURRENT_STATUS.nowplaying_title].mp3List[(index+1)].url, albumtitle: parsedAUDIO_CURRENT_STATUS.nowplaying_title, trackname: ALBUMS[parsedAUDIO_CURRENT_STATUS.nowplaying_title].mp3List[(index+1)].filename });
						} else {
							// this is the last track in this album--do nothing.
						}
					} else {
						// not found
					}
				});
				break;
			case 'audio_pause':
				socket.broadcast.emit('NCWC_control', { type:'button_pause' });
				break;
			case 'audio_play':
				socket.broadcast.emit('NCWC_control', { type:'button_play' });
				break;
			case 'audio_play_head':
				socket.broadcast.emit('NCWC_control', { type:'go_to_time', pct:data.pct });
				break;
			case 'audio_volume_up':
				socket.broadcast.emit('NCWC_control', { type:'button_volume_up' });
				break;
			case 'audio_volume_down':
				socket.broadcast.emit('NCWC_control', { type:'button_volume_down' });
				break;
			case 'audio_off':
				socket.broadcast.emit('NCWC_control', { type: 'stop' });
				break;
			case 'audio_volume_modal':
				socket.broadcast.emit('MIRROR_command', { type:'popup_update', targetwindow:'panelContainer_VOLUME', command:data.command });
				break; // end case 'audio_volume_modal'
			case 'select_mp3_album':
				socket.broadcast.emit('MIRROR_command', { type:data.type, albumtitle:data.albumtitle });
				break;
			case 'toggle_favorite':
				var thisalbum = data.albumtarget;
				var favoriteFile = BASE_MP3_JUKEBOX_STORE + '/'+ALBUMS[thisalbum].rootDir+'/favorite.fav';
				if (fs.existsSync(favoriteFile)) {
					// this is a favorite... unlink the file
					fs.unlinkSync(favoriteFile);
				} else {
					// this is NOT a favorite... create file
					fs.writeFile(favoriteFile, "", function(err) {
						if(err) {
							return console.log(LOCAL_DATETIME().timestamp+' Favorite ERR: '+err);
						}
					}); 
				}
				enumerateMP3Changer();
				break;
		}
	});
	
	socket.on('IUI_touchinfo', function(data) {
		switch(data.type) {
			case 'update':
				socket.broadcast.emit('MIRROR_command', { type:'touch_update', coord_x: data.coord_x, coord_y: data.coord_y });
				// console.log(LOCAL_DATETIME().timestamp+' TOUCH  x:'+data.coord_x+' y:'+data.coord_y);
				RT_VARS_OUTGOING.AUX_Info_Cursor.xpos = data.coord_x;
				RT_VARS_OUTGOING.AUX_Info_Cursor.ypos = data.coord_y;
				break;
			case 'stop':
				socket.broadcast.emit('MIRROR_command', { type:'touch_end' });
				RT_VARS_OUTGOING.AUX_Info_Cursor.xpos = -9999;
				RT_VARS_OUTGOING.AUX_Info_Cursor.ypos = -9999;
				break;
		} // end switch(data.type)
	});
	
	socket.on('IUI_info', function(data) {
		switch(data.type) {
			case 'container_scroll':
				socket.broadcast.emit('MIRROR_command', { type:'update_container_scroll', target:data.target, scroll_top:data.scroll_top });
				break;
			case 'update':
				socket.broadcast.emit('MIRROR_command', { type:'switch_to_screen', anchorlink:data.current_page_hash });
				console.log(LOCAL_DATETIME().timestamp+' Current screen: '+data.current_page_hash);
				if (INF_SCREEN_INDEX_REV[data.current_page_hash]) {
					RT_VARS_OUTGOING.AUX_Info_Screen = INF_SCREEN_INDEX_REV[data.current_page_hash];
				} else {
					RT_VARS_OUTGOING.AUX_Info_Screen = -9999;
				}
				break;
			case 'buttonUpdate':
				var thisBID = data.buttonId;
				RT_VARS_OUTGOING.AUX_Info_Button = thisBID;
				var resetTimer = setTimeout(function() {
					RT_VARS_OUTGOING.AUX_Info_Button = 0;
				}, (3/60)*1000);
				break;
			case 'txtDisplay':
				socket.broadcast.emit('MIRROR_command', { type:'update_txt_display', current_output:data.current_output });
				// console.log(LOCAL_DATETIME().timestamp+' TXT display: '+data.current_output);
				break;
		} // end switch(data.type)
	});
	
	socket.on('AUDIO_STATUS', function(data) {
		//console.log(data);
		AUDIO_CURRENT_STATUS = JSON.stringify(data);
		socket.broadcast.emit('PLAY_CURRENT', data);
	});
	
	socket.on('AUDIO_END', function(data) {
		var parsedAUDIO_CURRENT_STATUS = JSON.parse(AUDIO_CURRENT_STATUS);
		ALBUMS[parsedAUDIO_CURRENT_STATUS.nowplaying_title].mp3List.map(function(obj,index) {
			if (obj.filename === parsedAUDIO_CURRENT_STATUS.nowplaying_subtitle) {
				if (index < ObjectLength(ALBUMS[parsedAUDIO_CURRENT_STATUS.nowplaying_title].mp3List)-1) {
					socket.emit('NCWC_control', { type: 'playMP3', 'playlink':ALBUMS[parsedAUDIO_CURRENT_STATUS.nowplaying_title].mp3List[(index+1)].url, albumtitle: parsedAUDIO_CURRENT_STATUS.nowplaying_title, trackname: ALBUMS[parsedAUDIO_CURRENT_STATUS.nowplaying_title].mp3List[(index+1)].filename });
				} else {
					// this is the last track in this album--do nothing.
				}
			} else {
				// No match
			}
		});
	});
	
	// Researcher GUI command
	socket.on('RGUI_command', function(data) {
		//console.log(data);
		//socket.broadcast.emit('ALERT_drow_command', data);
		switch(data.type) {
			case 'blackout_on':
				socket.broadcast.emit('IC_command', { type:'switch_to_screen', anchorlink:'#pageContainer_screen_blackout' });
				break;
			case 'blackout_off':
				socket.broadcast.emit('IC_command', { type:'switch_to_screen', anchorlink:'#pageContainer_home' });
				break;
			case 'switch_to_screen':
				socket.broadcast.emit('IC_command', data);
				break;
		}
	});
	// end temp GUI command
});

// Create a client for the socket
function connect(socket, data){
	data.clientId = generateId();
	socketTable[socket.id] = {
		'socket'	: socket,
		'data' 		: data
	};
	// console.log(LOCAL_DATETIME().timestamp+' Client connected: '+socket.id); 
}


// Handler for a disconnected control device
function disconnect(socket, data){
	if (socketTable[socket.id]) {
		if (socketTable[socket.id].clientName) {
			var simplename = socketTable[socket.id].clientName;
		} else {
			var simplename = "(unknown client)";
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

function broadcastNMCRequest(socket,data) {
	socket.broadcast.emit('nmc_control', data);
}

function handleNA(socket, data){
	var socketAddress = socket.handshake.address;
	socketTable[socket.id] = { clientName: data.client, IPv4address:socketAddress.address };
	switch(data.client) {
		case 'cab_infotainment_ui':
			requestMapInfo();
		case 'cab_infotainment_ui_mirror':
			requestMapInfo();
		case 'cab_instrument_cluster':
			requestMapInfo();
			enumerateMP3Changer();
		default:
			console.log(LOCAL_DATETIME().timestamp+' Connected: '+data.client+' ['+socketAddress.address+']');
	}
	// console.log(socketTable[socket.id])
	socket.emit('ready', { clientId: data.clientId });
}

function enumerateMP3Changer() {
	// var BASE_MP3_JUKEBOX_DIR = BASE_WWWROOT_DIR+'/mp3';
	var ignoreFilesAndDirs = [	'Recycle.Bin','RECYCLE.BIN','pagefile','hiberfil','swapfile.sys','Documents and Settings','MSOCache',
								'Program Files','Program Files(x86)','ProgramData','System Volume Information','Users','Windows' ];
	
	var traverseFileSystem = function (currentPath) {
		var files = fs.readdirSync(currentPath);
		for (var i in files) {
			var currentFile = currentPath + '/' + files[i];
			if (!(new RegExp(ignoreFilesAndDirs.join("|")).test(currentFile))) {
				try {
					var stats = fs.statSync(currentFile);
					if (stats.isFile()) {
						var explodedFile = files[i].split('.');
						
						switch(explodedFile[ObjectLength(explodedFile)-1].toLowerCase()) {
							case 'mp3': 
								var splitCurrentPath = currentPath.split('/');
								ALBUMS[splitCurrentPath[ObjectLength(splitCurrentPath)-1]].mp3List.push({
									'path'		: currentPath,
									'filename'	: files[i],
									'url'		: BASE_WWWROOT_URL+'/mp3'+currentFile.substr(BASE_MP3_JUKEBOX_STORE.length)
								});
								break;
							case 'jpg':
								var explPath = currentPath.split('/');
								ALBUMS[explPath[ObjectLength(explPath)-1]].folderArt = currentPath.substring(BASE_WWWROOT_DIR.length)+'/'+files[i]; 
								//ALBUMS[explPath[ObjectLength(explPath)-1]].folderArtURL = BASE_WWWROOT_URL+currentPath.substring(BASE_WWWROOT_DIR.length)+'/'+files[i]; 
								ALBUMS[explPath[ObjectLength(explPath)-1]].folderArtURL = BASE_WWWROOT_URL+'/mp3'+currentPath.substring(BASE_MP3_JUKEBOX_STORE.length)+'/'+files[i]; 
								break;
							case 'fav':
								ALBUMS[splitCurrentPath[ObjectLength(splitCurrentPath)-1]].favorite = true;
								break;
						}
					}
					else if (stats.isDirectory()) {
						ALBUMS[files[i]] = {
							'rootDir'		: currentPath.substring(BASE_MP3_JUKEBOX_STORE.length)+'/'+files[i],
							'folderArt'		: '',
							'folderArtURL'	: '',
							'mp3List'		: [],
							'favorite'		: false
						};
						traverseFileSystem(currentFile);
					}
				} catch (e) {
					// File problem (EPERM, etc), do nothing 
				}			
			}
		}
	};
		
	traverseFileSystem(BASE_MP3_JUKEBOX_STORE);

	console.log(LOCAL_DATETIME().timestamp+' Searching MP3 directory for folders - DONE - Found: '+ObjectLength(ALBUMS));
	//console.log(ALBUMS);
	//console.log(tracks);	
	updateInfotainmentUIs();
}

function updateInfotainmentUIs() {
	io.sockets.emit('updateInfotainmentUI', ALBUMS);
}

function runEngineRolloverSequence() {
	io.sockets.emit('IC_command', { type:'switch_to_screen', anchorlink: '#pageContainer_ignitionRollover' });
	var engineAnimationTimer = setTimeout(function() {
		io.sockets.emit('IC_command', { type:'switch_to_screen', anchorlink: '#pageContainer_home' });
	}, 5000); // 5s of wait before Home screen
}

function handleRouteTablePacket(message,remote) {
	// console.log(getDateTime()+' ALERT:');
	var packetLength 	= message.length;
	
	var THIS_RT_PACKET = {
		SimFrame 					: message.readInt32LE(0), // 4 bytes
		SCC_Info_Screen_pageDivId 	: message.readInt16LE(4), // 2 bytes
		SCC_Info_Screen_state 		: message.readInt16LE(6),
		VDS_Veh_Eng_RPM				: message.readFloatLE(8) // 4 bytes
	};
	
	if ((THIS_RT_PACKET.SCC_Info_Screen_pageDivId !== RT_VARS_INCOMING.SCC_Info_Screen_pageDivId) ||
		(THIS_RT_PACKET.SCC_Info_Screen_state !== RT_VARS_INCOMING.SCC_Info_Screen_state)) {
			console.log(LOCAL_DATETIME().timestamp+' RT input change: ' + THIS_RT_PACKET.SCC_Info_Screen_pageDivId + ":" + THIS_RT_PACKET.SCC_Info_Screen_state);
			if (THIS_RT_PACKET.SCC_Info_Screen_pageDivId !== RT_VARS_INCOMING.SCC_Info_Screen_pageDivId) {
				if (INF_SCREEN_INDEX[THIS_RT_PACKET.SCC_Info_Screen_pageDivId]) {
					var thisAnchorLink = '#'+INF_SCREEN_INDEX[THIS_RT_PACKET.SCC_Info_Screen_pageDivId].pageDivId;
					io.sockets.emit('IC_command', { type:'switch_to_screen', anchorlink: thisAnchorLink });
				} else {
					console.log(LOCAL_DATETIME().timestamp+' Unknown RT page (#): '+THIS_RT_PACKET.SCC_Info_Screen_pageDivId);
				}
			} // end screen change IF
			
			if (THIS_RT_PACKET.SCC_Info_Screen_state !== RT_VARS_INCOMING.SCC_Info_Screen_state) {
				if (THIS_RT_PACKET.SCC_Info_Screen_state === 1) {
					io.sockets.emit('IC_command', { type:'revert_screen_to_default', screenid: INF_SCREEN_INDEX[THIS_RT_PACKET.SCC_Info_Screen_pageDivId].pageDivId });
					console.log(LOCAL_DATETIME().timestamp+' Reverting '+INF_SCREEN_INDEX[THIS_RT_PACKET.SCC_Info_Screen_pageDivId].pageDivId+' to its default state');
				} // end if (THIS_RT_PACKET.SCC_Info_Screen_state === 1)
			} // end state change IF
	}
	
	// Engine RPM check
	if (THIS_RT_PACKET.VDS_Veh_Eng_RPM > 0) {
		// engine is on
		if (CAB_IGNITION_CURRENT_STATE !== 3) { // if the current known state is not 3 (running), set it to 3
			CAB_IGNITION_CURRENT_STATE = 3;
			runEngineRolloverSequence();
			//sendMultiInfoDisplay_routed_data(CAB_IGNITION_CURRENT_STATE);
		}
	} else {
		// engine is off
		if (CAB_IGNITION_CURRENT_STATE !== 1) { // if the current known state is not 1 (off), set it to 1
			CAB_IGNITION_CURRENT_STATE = 1;
			io.sockets.emit('NCWC_control', { type: 'stop' });
			io.sockets.emit('IC_command', { type:'switch_to_screen', anchorlink: '#pageContainer_screen_blackout' });
			//sendMultiInfoDisplay_routed_data(CAB_IGNITION_CURRENT_STATE);
		}
	}
	
	RT_VARS_INCOMING.SimFrame =	THIS_RT_PACKET.SimFrame;
	RT_VARS_INCOMING.SCC_Info_Screen_pageDivId = THIS_RT_PACKET.SCC_Info_Screen_pageDivId;
	RT_VARS_INCOMING.SCC_Info_Screen_state = THIS_RT_PACKET.SCC_Info_Screen_state;
	RT_VARS_INCOMING.VDS_Veh_Eng_RPM = THIS_RT_PACKET.VDS_Veh_Eng_RPM;
}

// Route table listener
var UDPmessage = null;
var UDPserver = dgram.createSocket('udp4');

UDPserver.on('listening', function () {
	var UDPaddress = UDPserver.address();
	console.log(LOCAL_DATETIME().timestamp+' Listening for route table stream @ ' + UDPaddress.address + ":" + UDPaddress.port);
});

UDPserver.on('message', function (message, remote) {
	handleRouteTablePacket(message,remote);
});

function sendRTPacket() {
	var buf = new Buffer(8);
	buf.writeInt16LE(RT_VARS_OUTGOING.AUX_Info_Screen,0);
	buf.writeInt16LE(RT_VARS_OUTGOING.AUX_Info_Button,2);
	buf.writeInt16LE(Math.round(RT_VARS_OUTGOING.AUX_Info_Cursor.xpos),4);
	buf.writeInt16LE(Math.round(RT_VARS_OUTGOING.AUX_Info_Cursor.ypos),6);
	UDPserver.send(buf, 0, buf.length, RT_PORT_OUTGOING, RT_HOST_IP, function(err) {
		//UDPserver.close();
		if (err) {
			console.log(LOCAL_DATETIME().timestamp+' UDP write error: '+err);
		}
	});
}

//UDPserver.bind(RT_PORT_INCOMING, CAB_HOST_IP);

console.log(LOCAL_DATETIME().timestamp+' Infotainment server up @ http://localhost:'+port);

/*
var RT_Update_Interval = setInterval(function() {
	//console.log(LOCAL_DATETIME().timestamp+' '+JSON.stringify(RT_VARS_OUTGOING));
	sendRTPacket();
//}, 1000);
}, (1/60)*1000);
*/