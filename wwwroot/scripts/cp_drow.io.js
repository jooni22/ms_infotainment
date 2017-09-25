var CONTROL_SERVER_URL = 'http://128.255.250.145:80';

function diff(a,b) {
	return Math.abs(a-b);
}

function readURLvars() {
	var query_string = {};
	var query = window.location.search.substring(1);
	var vars = query.split("&");
	for (var i=0;i<vars.length;i++) {
		var pair = vars[i].split("=");
			// If first entry with this name
		if (typeof query_string[pair[0]] === "undefined") {
			query_string[pair[0]] = decodeURIComponent(pair[1]);
			// If second entry with this name
		} else if (typeof query_string[pair[0]] === "string") {
			var arr = [ query_string[pair[0]],decodeURIComponent(pair[1]) ];
			query_string[pair[0]] = arr;
			  // If third or later entry with this name
		} else {
			query_string[pair[0]].push(decodeURIComponent(pair[1]));
		}
	} 
	CLIENT_URL_VARS = query_string;
	scanURLvars();
}

function scanURLvars() {
	/*
	if (CLIENT_URL_VARS.ch) {
		if(CLIENT_URL_VARS.ch.length > 0) {
			THIS_CLIENT_HOST = CLIENT_URL_VARS.host;
			THIS_CLIENT_CH = CLIENT_URL_VARS.ch;
			document.title = 'NMC-'+CLIENT_URL_VARS.ch;
			$('#debug-host').html(THIS_CLIENT_HOST);
			$('#debug-channel').html(THIS_CLIENT_CH);
			connect();
		} else {
			//connect();
		}
	} else {
		//connect();
	}
	*/
	
	connect();
}

function connect(){
	socket = io.connect(CONTROL_SERVER_URL);
	bindSocketEvents();
}
	
function twoDigits(d) {
	if(0 <= d && d < 10) return "0" + d.toString();
	if(-10 < d && d < 0) return "-0" + (-1*d).toString();
	return d.toString();
}

Date.prototype.toOSDformat = function() {
	return twoDigits(1 + this.getMonth()) + "/" + twoDigits(this.getDate()) + "/" + this.getFullYear() + "&nbsp;&nbsp;" + this.toLocaleTimeString();
};

Date.prototype.toEntuneformat = function() {
	var HHMM = this.toLocaleTimeString().split(':');
	return HHMM[0]+':'+HHMM[1];
};

var socket = null,
	clientId = null,
	nickname = null,
	serverAddress = CONTROL_SERVER_URL; 
	
var smartClick = ('ontouchstart' in document.documentElement)  ? 'touchstart' : 'mousedown';

function bindDOMEvents() {
	$(document.body).on('mouseup', '.GUI_btn', function() {
		var thisType = $(this).data('reqtype');
		var thisAlertLvl = $(this).data('stagelevel');
		socket.emit('RGUI_command',{ type: thisType, stagelevel: thisAlertLvl });
	});
}

function bindSocketEvents(){
	socket.on('connect', function(){
		socket.emit('node_announce', { client:"cp_drowsiness", type: "cp_drowsiness" });
	});
	
	socket.on('connect_error', function(){
		$('#debug_connectionStatus').html('Connection issues');
	});
	
	socket.on('disconnect', function(){
		$('#debug_connectionStatus').html('Disconnected from host');
	});
	
	socket.on('ready', function(data){
		$('#debug_connectionStatus').html('Connected');
	});
}

$(function() { 
	readURLvars();
	bindDOMEvents();
});