var CONTROL_SERVER_URL = 'http://90.0.0.80:80';
var CLIENT_URL_VARS;

var CURRENT_STATUS = {
	state				: {
			playState		:0,
			volume			:0.1
		},
	currentAlbum		: '',
	currentTrack		: '',
	currentCurrentTime	: 0.0,
	currentDuration		: 0.0
};
var ORIG_AUDIO_PLAYER_A_VOL = CURRENT_STATUS.state.volume;

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
	if (CLIENT_URL_VARS.sv) {
		if(CLIENT_URL_VARS.sv.length > 0) {
			serverAddress = 'http://'+CLIENT_URL_VARS.sv+':80';
			connect();
		} else {
			connect();
		}
	} else {
		connect();
	}
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

var min_w = 300; // minimum video width allowed
var vid_w_orig;  // original video dimensions
var vid_h_orig;

var socket = null,
	clientId = null,
	nickname = null,
	serverAddress = CONTROL_SERVER_URL; 
	
var smartClick = ('ontouchstart' in document.documentElement)  ? 'touchstart' : 'mousedown';

function bindDOMEvents() {
	$('#audio-player-a audio').bind('timeupdate', function() {
		var thisAudioPlayer_CT = document.getElementById('audio-player-a-OBJ');
		CURRENT_STATUS.currentCurrentTime = thisAudioPlayer_CT.currentTime;
		//console.log(thisAudioPlayer_CT.currentTime);
		broadcastAudioStatus();
	});
	$('#audio-player-a audio').bind('loadedmetadata', function() {
		var thisAudioPlayer_CT = document.getElementById('audio-player-a-OBJ');
		CURRENT_STATUS.currentDuration = thisAudioPlayer_CT.duration;
	});
	$('#audio-player-a audio').bind('ended', function() {
		broadcastAudioStatus();
		if (CURRENT_STATUS.state.playState !== 0) {
			socket.emit('AUDIO_END', {});
		}
	});
	$('#audio-player-b audio').bind('ended', function() {
		// ramp up #audio-player-a audio volume
		if (CURRENT_STATUS.state.volume < ORIG_AUDIO_PLAYER_A_VOL) {
			var thisAlertTimeout = setTimeout(function() {
				var rampUpInterval = setInterval(function() {
					// ratchet up volume
					if (CURRENT_STATUS.state.volume < ORIG_AUDIO_PLAYER_A_VOL) {
						CURRENT_STATUS.state.volume = CURRENT_STATUS.state.volume+0.01;
						updateAudioVolume();
					} else {
						clearInterval(rampUpInterval);
					}
				},50);
			}, 1000); // wait one second after alert audio finishes playing, then ramp up the volume to it's original level
			
		} // end if (ORIG_AUDIO_PLAYER_A_VOL > CURRENT_STATUS.state.volume)
		socket.emit('AUDIO_ALT_END', {});
	});
}

function broadcastAudioStatus() {
	socket.emit('AUDIO_STATUS', { 
		status: CURRENT_STATUS.state, 
		nowplaying_title: CURRENT_STATUS.currentAlbum, 
		nowplaying_subtitle: CURRENT_STATUS.currentTrack, 
		currenttime: CURRENT_STATUS.currentCurrentTime, 
		duration: CURRENT_STATUS.currentDuration
	});
}

	
function bindSocketEvents(){
	socket.on('connect', function(){
		socket.emit('node_announce', { client:"cab_infotainment_audio", type: "cab_infotainment_audio" });
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

	socket.on('NCWC_control', function(data) {
		//console.log(data);
		switch(data.type) {
			case 'playALERT':
				ORIG_AUDIO_PLAYER_A_VOL = parseFloat(CURRENT_STATUS.state.volume);
				if (CURRENT_STATUS.state.volume > 0) {
					CURRENT_STATUS.state.volume = 0;
				}
				updateAudioVolume();
				changeAudioSource_ALERT({ source:data.playlink });
				break;
			case 'stopALERT':
				$('#audio-player-b audio').get(0).pause();
				if (CURRENT_STATUS.state.volume < ORIG_AUDIO_PLAYER_A_VOL) {
					var rampUpInterval = setInterval(function() {
						// ratchet up volume
						if (CURRENT_STATUS.state.volume < ORIG_AUDIO_PLAYER_A_VOL) {
							CURRENT_STATUS.state.volume = CURRENT_STATUS.state.volume+0.01;
							updateAudioVolume();
						} else {
							clearInterval(rampUpInterval);
						}
					},50);
					
				} // end if (ORIG_AUDIO_PLAYER_A_VOL > CURRENT_STATUS.state.volume)
				break;
			case 'playMP3':
				changeAudioSource({ source:data.playlink });
				CURRENT_STATUS.state.playState=2;
				CURRENT_STATUS.currentAlbum = data.albumtitle;
				CURRENT_STATUS.currentTrack = data.trackname;
				$('#audio-player-a audio').get(0).play();
				break;
			case 'playStream':
				changeAudioSource({ source:data.playlink });
				CURRENT_STATUS.state.playState=2;
				CURRENT_STATUS.currentAlbum = data.albumtitle;
				CURRENT_STATUS.currentTrack = data.trackname;
				$('#audio-player-a audio').get(0).play();
				break;
			case 'button_play':
				CURRENT_STATUS.state.playState=2;
				$('#audio-player-a audio').get(0).play();
				break;
			case 'button_pause':
				CURRENT_STATUS.state.playState=1;
				$('#audio-player-a audio').get(0).pause();
				break;
			case 'button_rewind':
				$('#audio-player-a audio').get(0).currentTime = 0;
				break;
			case 'button_volume_up':
				if (CURRENT_STATUS.state.volume < 0.91) {
					CURRENT_STATUS.state.volume = CURRENT_STATUS.state.volume+0.1;
				}
				//$('#audio-player-a audio').get(0).volume(CURRENT_STATUS.state.volume);
				updateAudioVolume();
				break;
			case 'button_volume_down':
				if (CURRENT_STATUS.state.volume > 0.01) {
					CURRENT_STATUS.state.volume = CURRENT_STATUS.state.volume-0.1;
				}
				//$('#audio-player-a audio').get(0).volume(CURRENT_STATUS.state.volume);
				updateAudioVolume();
				break;
			case 'load':
				changeAudioSource({ vidgroup:data.vidgroup });
				break;
			case 'reset_and_play':
				$('#audio-player-a audio').get(0).currentTime = 0;
				$('#audio-player-a audio').get(0).play();
				break;	
			case 'stop':
				$('#audio-player-a audio').get(0).pause();
				CURRENT_STATUS.state.playState=0;
				CURRENT_STATUS.currentAlbum = '';
				CURRENT_STATUS.currentTrack = '';
				broadcastAudioStatus();
				break;	
			case 'go_to_time':
				var audioTarget = document.getElementById('audio-player-a-OBJ');
				var skipToSeconds = data.pct * CURRENT_STATUS.currentDuration;
				//console.log(skipToSeconds+' / '+CURRENT_STATUS.currentDuration);
				audioTarget.currentTime = skipToSeconds;
				//audioTarget.play();
				break;		
		}
	});
}

function initializeAudioVolume() {
	document.getElementById('audio-player-a-OBJ').volume = 0.1;
	document.getElementById('audio-player-b-OBJ').volume = 0.4;
}

function updateAudioVolume() {
	document.getElementById('audio-player-a-OBJ').volume = CURRENT_STATUS.state.volume;
	broadcastAudioStatus();
}

function changeAudioSource(data) {
	$('#audio-player-a audio source').attr('src', data.source);
	loadAudio();
}

function loadAudio() {	
	$('#audio-player-a audio')[0].load();
}

function changeAudioSource_ALERT(data) {
	$('#audio-player-b audio source').attr('src', data.source);
	loadAudio_ALERT();
}

function loadAudio_ALERT() {	
	$('#audio-player-b audio')[0].load();
	loadAudio_PLAY_ALERT();
}

function loadAudio_PLAY_ALERT() {	
	$('#audio-player-b audio').get(0).play();
}

function connect(){
	socket = io.connect(serverAddress);
	bindSocketEvents();
}


$(function() { 
	/*
	vid_w_orig = parseInt(jQuery('video').attr('width'));
    vid_h_orig = parseInt(jQuery('video').attr('height'));
    $('#debug').append("<p>DOM loaded</p>");
	*/
    
    $(window).resize(function () { resizeToCover(); });
    $(window).trigger('resize');
	readURLvars();
	
	bindDOMEvents();
	initializeAudioVolume();
	
	$('#audio-player-a audio').get(0).play();
	$('#audio-player-b audio').get(0).play();
});



function resizeToCover() {
    // set the video viewport to the window size
    jQuery('#video-viewport').width(jQuery(window).width());
    jQuery('#video-viewport').height(jQuery(window).height());

    // use largest scale factor of horizontal/vertical
    var scale_h = jQuery(window).width() / vid_w_orig;
    var scale_v = jQuery(window).height() / vid_h_orig;
    var scale = scale_h > scale_v ? scale_h : scale_v;

    // don't allow scaled width < minimum video width
    if (scale * vid_w_orig < min_w) {scale = min_w / vid_w_orig;};

    // now scale the video
    $('video').width(scale * vid_w_orig);
    $('video').height(scale * vid_h_orig);
    // and center it by scrolling the video viewport
    $('#video-viewport').scrollLeft((jQuery('video').width() - jQuery(window).width()) / 2);
    $('#video-viewport').scrollTop((jQuery('video').height() - jQuery(window).height()) / 2);
};
