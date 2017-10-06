var CONTROL_SERVER_URL = 'http://90.0.0.80:80';
var CLIENT_URL_VARS;

var MP3_ALBUM_LIST = {};

var AB_VOL_PRESS_TIMEOUT = null;
var VOL_POPUP_SHOWING = false;

var CURRENT_CLIENT_HASH = 'pageContainer_home';
var AB_CURSOR_HL_TIMEOUT = null;
var AB_CURSOR_HL_SHOWING = false;
var AB_CURSOR_HL_MATRIXLOC = [0,0];
var AB_SCREEN_MATRIX = {
	pageContainer_home	: {
		0:	['AB_pageContainer_home_APPS'],
		1:	['AB_pageContainer_home_NOAUDIO'],
		2:	['AB_pageContainer_home_GPS_ZI'],
		3:	['AB_pageContainer_home_GPS_ZO']
	},
	pageContainer_apps	: {
		0:	['AB_pageContainer_apps_BACK', 'AB_pageContainer_apps_HOME'],
		1:	['AB_pageContainer_apps_NAV', 'AB_pageContainer_apps_AUDIO', 'AB_pageContainer_apps_SETUP'],
		2:	['AB_pageContainer_apps_MAINTENANCE']
	},
	pageContainer_select_audio_src	: {
		0:	['AB_pageContainer_select_audio_src_BACK', 'AB_pageContainer_select_audio_src_HOME'],
		1:	['AB_pageContainer_select_audio_src_FM', 'AB_pageContainer_select_audio_src_MP3']
	},
	pageContainer_MP3: {
		0:	['AB_pageContainer_MP3_BACK', 'AB_pageContainer_MP3_HOME']
	},
	pageContainer_MP3_play	: {
		0:	['AB_pageContainer_MP3_play_BACK', 'AB_pageContainer_MP3_play_HOME'],
		1:	['', 'AB_pageContainer_MP3_play_TR_BACK', 'AB_pageContainer_MP3_play_PAUSE', 'AB_pageContainer_MP3_play_TR_FWD', 'AB_pageContainer_MP3_play_VOLTOG']
	},
	pageContainer_radio_play	: {
		0:	['AB_pageContainer_radio_play_BACK', 'AB_pageContainer_radio_play_HOME'],
		1:	['AB_pageContainer_radio_play_T1', 'AB_pageContainer_radio_play_PAUSE', 'AB_pageContainer_radio_play_VOLTOG'],
		2:	['AB_pageContainer_radio_play_T2'],
		3:	['AB_pageContainer_radio_play_T3'],
		4:	['AB_pageContainer_radio_play_T4'],
		5:	['AB_pageContainer_radio_play_T5'],
		6:	['AB_pageContainer_radio_play_T6'],
		7:	['AB_pageContainer_radio_play_T7'],
		8:	['AB_pageContainer_radio_play_T8'],
		9:	['AB_pageContainer_radio_play_T9']
	},
	pageContainer_setup	: {
		0:	['AB_pageContainer_setup_BACK', 'AB_pageContainer_setup_HOME'],
		1:	['AB_pageContainer_setup_NADSLOGO'],
		2:	['AB_pageContainer_setup_PHONE', 'AB_pageContainer_setup_AUDIO', 'AB_pageContainer_setup_NAV'],
		3:	['AB_pageContainer_setup_BLACK']
	},
	pageContainer_navigation	: {
		0:	['AB_pageContainer_navigation_BACK']
	},
	pageContainer_maintenance	: {
		0:	['AB_pageContainer_maintenance_BACK', 'AB_pageContainer_maintenance_HOME'],
		1:	['AB_pageContainer_mainenance_REFRESH'],
		2: 	['AB_pageContainer_maintenance_AUDIO_OFF']
	},
	pageContainer_map_debug	: {
		0:	['AB_pageContainer_map_debug_BACK', 'AB_pageContainer_map_debug_HOME']
	}
};

var sessionVars = {
	'WINDOW_height'				: 0,
	'WINDOW_width'				: 0,
	'OSD_source_info'			: [],
	'OSD_map_img_info'			: [],
	'VDS_CG_Chassis_Position'	: [],
	'VDS_CG_Chassis_Orient'		: [],
	'MAIN_MAP_IMG'				: '',
	'MAIN_ROUTE_IMG'			: '',
	'LRI_topLeft_X'				: '',
	'LRI_topLeft_Y'				: '',
	'LRI_bottomRight_X'			: '',
	'LRI_bottomRight_Y'			: '',
	'local_zoom'				: 1
};
var dotMarkerOffset_X = -66;
var dotMarkerOffset_Y = -66;

function diff(a,b) {
	return Math.abs(a-b);
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

function closestIndex(num, arr) {
	var curr = 0;
	var diff = Math.abs (num - curr);
	for (var val = 0; val < arr.length; val++) {
		var newdiff = Math.abs (num - val);
		if (newdiff < diff) {
			diff = newdiff;
			curr = val;
		}
	}
	return curr;
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

var globalTimer = setInterval(updateOSD, (1000/30));

function updateOSD() {
	//var updatedDate = new Date().toEntuneformat();
	var updatedDate = moment().format('h:mm');
	$('.entune_clock').html(updatedDate);
}

var socket = null,
	clientId = null,
	nickname = null,
	serverAddress = CONTROL_SERVER_URL; 
	
var smartClick = ('ontouchstart' in document.documentElement)  ? 'touchstart' : 'mousedown';

function arrayObjectIndexOf(myArray, searchTerm, property) {
    for(var i = 0, len = myArray.length; i < len; i++) {
        if (myArray[i][property] === searchTerm) return i;
    }
    return -1;
}

function bindDOMEvents() {
	$('.button_BACK_LINK').on('mousedown touchstart',function() {
		$(this).addClass('buttonDOWN');
	});
	$('.button_BACK_LINK').on('mouseup',function() {
		$(this).removeClass('buttonDOWN');
		$('#MSTR_LINK_BACK').click();
	});
	
	$(document.body).on('mousedown touchstart', '.button_LINK', function() {
		$(this).addClass('buttonDOWN');
	});
	
	$(document.body).on('mouseup', '.button_LINK', function() {
		var anchorLink = $(this).data('anchorlink');
		$('#MSTR_LINK').attr('href',anchorLink);
		switch(anchorLink) {
			case '#pageContainer_MP3': {
				socket.emit('mp3_jukebox_enumerate',{});
				break;
			}
		}
		$(this).removeClass('buttonDOWN');
		$('#MSTR_LINK').click();
	});
	
	$(document.body).on('click', '#AB_pageContainer_maintenance_TM3IT', function() {
		window.location.href = serverAddress+'/infotainment_system_tesla_model3.htm?sv='+CLIENT_URL_VARS.sv;
	});
	
	$(document.body).on('mouseup', '.button', function() {
		var outData = { 
			type		: 'buttonUpdate',
			buttonId	: -9999
		};
		if ($(this).data('bid')) {
			outData.buttonId = $(this).data('bid');
		}
		socket.emit('IUI_info', outData);
	});
	
	$(document.body).on('mouseup', '.buttonI', function() {
		var outData = { 
			type		: 'buttonUpdate',
			buttonId	: -9999
		};
		if ($(this).data('bid')) {
			outData.buttonId = $(this).data('bid');
		}
		socket.emit('IUI_info', outData);
	});
	
	$(document.body).on('mouseup', '.just_LINK', function() {
		var anchorLink = $(this).data('anchorlink');
		$('#MSTR_LINK').attr('href',anchorLink);
		$('#MSTR_LINK').click();
	});
	
	$(document.body).on('click', '.mp3_album_LINK', function() {
		$('#MP3_playlist_container').html('');
		var thisAlbumTitle = $(this).data('albumtitle');
		socket.emit('IUI_command', { type: 'select_mp3_album', albumtitle: thisAlbumTitle });
		var track = 1;
		var thisButtonID = 1901;
		console.log(MP3_ALBUM_LIST);
		//console.log('hi'+MP3_ALBUM_LIST[thisAlbumTitle].mp3List);
		$.each(MP3_ALBUM_LIST[thisAlbumTitle].mp3List, function(index, value) {
			//console.log(index+' '+value);
			var thisDivId = 'AB_pageContainer_MP3_play_T'+track;
			var thisDiv =
				'<div id="'+thisDivId+'" class="entune_list_row button_PLAYFILE buttonI" data-bid="'+thisButtonID+'" data-playlink="'+value.url+'" data-albumtitle="'+thisAlbumTitle+'" data-trackname="'+value.filename+'">'+
				value.filename.substr(0,value.filename.length-4)+
				'</div>';
				//console.log(thisDiv);
			$('#MP3_playlist_container').append(thisDiv).trigger('create');
			if (AB_SCREEN_MATRIX.pageContainer_MP3_play[track]) {
				AB_SCREEN_MATRIX.pageContainer_MP3_play[track][0] = ''+thisDivId;
			} else {
				AB_SCREEN_MATRIX.pageContainer_MP3_play[track] = [''+thisDivId];
			}
			track++;
			thisButtonID++;
		}); 
		var timelineHTML =
			'<div style="display: -webkit-flex; display: flex;">'+
				'<div style="flex:1;" class="CURRENTLY_PLAYING_TIME">0:00</div>'+
				'<div style="flex:5;" class="CURRENTLY_PLAYING_METER_outer">'+
					'<div class="CURRENTLY_PLAYING_METER_inner"></div>'+
				'</div>'+
				'<div style="flex:1;" class="CURRENTLY_PLAYING_DURATION">2:00</div>'+
			'</div>';
		$('#MP3_playlist_album_cover_container').html('<img src="'+MP3_ALBUM_LIST[thisAlbumTitle].folderArtURL+'" style="height:250px; margin-left:46px;">'+timelineHTML);
		$('#MP3_playlist_page_title').html(thisAlbumTitle);
	}); 
	
	$(document.body).on('click', '.button_PLAYFILE', function() {
		$(this).addClass('buttonDOWN');
		var playfileTimeout = setTimeout(function() {
			$('.entune_list_row').removeClass('buttonDOWN');
		}, 100);
		//alert(playlink);
	});
	
	$(document.body).on('mouseup', '.button_PLAYFILE', function() {
		var playlink = $(this).data('playlink');
		var thisAlbumTitle = $(this).data('albumtitle');
		var thisTrackName = $(this).data('trackname');
		socket.emit('IUI_command',{ type: 'playMP3', 'playlink':playlink, albumtitle: thisAlbumTitle, trackname: thisTrackName });
	});
	
	// PLAY / PAUSE
	$(document.body).on(smartClick, '.BUTTON_mp3_playPause_toggle, .BUTTON_FM_playPause_toggle', function() {
		var thisButtonType = $(this).data('showing');
		switch(thisButtonType) {
			case 'play':
				socket.emit('IUI_command',{ type: 'audio_pause' });
				break;
			case 'pause':
				socket.emit('IUI_command',{ type: 'audio_play' });
				break;
		}
	});
	
	// FWD / BACK
	$(document.body).on(smartClick, '.BUTTON_mp3_fwd, .BUTTON_mp3_back', function() {
		var thisButtonType = $(this).data('type');
		switch(thisButtonType) {
			case 'back':
				socket.emit('IUI_command',{ type: 'audio_back' });
				break;
			case 'fwd':
				socket.emit('IUI_command',{ type: 'audio_fwd' });
				break;
		}
	});
	
	// FM FWD / BACK
	$(document.body).on(smartClick, '.BUTTON_fm_fwd, .BUTTON_fm_back', function() {
		var thisButtonType = $(this).data('type');
		switch(thisButtonType) {
			case 'back':
				socket.emit('IUI_command',{ type: 'fm_audio_back' });
				break;
			case 'fwd':
				socket.emit('IUI_command',{ type: 'fm_audio_fwd' });
				break;
		}
	});
	
	// VOLUME
	$(document.body).on('mouseup', '.BUTTON_VOLUME_modal_toggle', function() {
		//console.log('ding');
		$('#panelContainer_VOLUME').popup('open');
		//$('#MSTR_LINK_MODAL').click();
	});
	
	$(document.body).on('mousedown touchstart', '.buttonVolume', function() {
		$(this).addClass('buttonDOWN');
	});
	
	$(document.body).on('mouseup', '#VOLUME_level_UP', function() {
		socket.emit('IUI_command',{ type: 'audio_volume_up' });
		$('.buttonVolume').removeClass('buttonDOWN');
	});
	
	$(document.body).on('mouseup', '#VOLUME_level_DOWN', function() {
		socket.emit('IUI_command',{ type: 'audio_volume_down' });
		$('.buttonVolume').removeClass('buttonDOWN');
	});
	
	$(document.body).on('mousedown touchstart', '.PLAY_CONTROLS', function() {
		$(this).addClass('buttonDOWN');
	});
	
	$(document.body).on('mouseup', '.PLAY_CONTROLS', function() {
		$('.PLAY_CONTROLS').removeClass('buttonDOWN');
	});
	
	$('#MP3_album_list_container').on('scroll',function(){
		socket.emit('IUI_info', { type:'container_scroll', target:'#MP3_album_list_container', scroll_top:$(this).scrollTop() });
		// console.log($(this).scrollTop());
	});
	
	$('#MP3_playlist_container').on('scroll',function(){
		socket.emit('IUI_info', { type:'container_scroll', target:'#MP3_playlist_container', scroll_top:$(this).scrollTop() });
		// console.log($(this).scrollTop());
	});
	
	$('#FM_playlist_container').on('scroll',function(){
		socket.emit('IUI_info', { type:'container_scroll', target:'#FM_playlist_container', scroll_top:$(this).scrollTop() });
		// console.log($(this).scrollTop());
	});
	
	// Map zoom lvl
	$('.GPS_ZOOM_LVL').on('click', function(e) {
		var thisZoomType = $(this).data('zoomtype');
		var thisZoomFactor = 0.5;
		if ($(this).data('zoomfactor')) {
			thisZoomFactor = $(this).data('zoomfactor');
		}
		switch(thisZoomType) {
			case 'in':
				if (sessionVars.local_zoom < 5) {
					sessionVars.local_zoom += thisZoomFactor;
					updateLocalZoomFactor();
				}
				break;
			case 'out':
				if (sessionVars.local_zoom > 0.5) {
					sessionVars.local_zoom -= thisZoomFactor;
					updateLocalZoomFactor();
				}
				break;
		} //end switch(thisZoomType)
	});

	// Virtual keyboard
	$('.button_KB').on(smartClick,function() {
		$(this).addClass('buttonDOWN');
		var currentDisplay = $('#task_a_display').html();
		var thisKeyValue = $(this).html();
		if (!$(this).data('specialkey')) {
			// button press update info
			var outData = { 
				type		: 'buttonUpdate',
				buttonId	: $(this).html().charCodeAt(0)
			};
			socket.emit('IUI_info', outData);
			// local output
			$('#task_a_display').html(currentDisplay+thisKeyValue);
			// "total text" server update
			updateSvr_textOutput();
		} else {
			var thisSpecialKeyValue = $(this).data('specialkey');
			
			// button press update info
			var outData = { 
				type		: 'buttonUpdate',
				buttonId	: -9999
			};
			if ($(this).data('bid')) {
				outData.buttonId = $(this).data('bid');
			}
			socket.emit('IUI_info', outData);
			
			switch(thisSpecialKeyValue) {
				case 'backspace':
					var currentDisplayLength = currentDisplay.length;
					$('#task_a_display').html(currentDisplay.substring(0,currentDisplayLength-1));
					updateSvr_textOutput();
					break;
				case 'space':
					$('#task_a_display').html(currentDisplay+' ');
					updateSvr_textOutput();
					break;
				case 'enter':
					$('#task_a_display').html('');
					updateSvr_textOutput();
					break;
			} // end thisSpecialKey switch
		}
	});
	
	function updateSvr_textOutput() {
		var currentTxtDisplay = $('#task_a_display').html();
		socket.emit('IUI_info',{ type: 'txtDisplay', current_output: currentTxtDisplay });
	}
	
	$('.button_KB').on('mouseup', function() {
		$('.button_KB').removeClass('buttonDOWN');
	});
	
	// Page refresh (no cache)
	$(document.body).on('click', '#AB_pageContainer_mainenance_REFRESH', function() {
		window.location.reload(true);
	});
	
	// AUDIO OFF (UI button)
	$(document.body).on('click', '#AB_pageContainer_maintenance_AUDIO_OFF', function() {
		socket.emit('IUI_command',{ type: 'audio_off' });
	});
	
	// Phone menu tab buttons
	$(document.body).on('click', '.buttonCallTab', function() {
		if ($(this).data('targetdiv')) {
			$('.call_list_container').hide();
			$('#'+$(this).data('targetdiv')).show();
		}
	});
	
	// Phone list options
	$(document.body).on('click', '.dial_preset_button', function() {
		$(this).addClass('buttonDOWN');
		
		var thingToDial = $(this).html();
		$('#call_container_NUMBERNAME').html(thingToDial);
		$('#call_callinprogress_info_container').show();
		socket.emit('IUI_command', { type:'phone_call_noanswer' });
		
		var playfileTimeout = setTimeout(function() {
			$('.entune_list_row').removeClass('buttonDOWN');
		}, 100);
		//alert(playlink);
	});
	
	$(document.body).on('click', '#AB_pageContainer_phone_HANGUP', function() {
		if (!$(this).hasClass('buttonDisabled')) {
			hideCallingBox();
			$('#AB_pageContainer_phone_HANGUP').removeClass('button').removeClass('button_MISC').addClass('buttonDisabled');
			socket.emit('IUI_command', { type:'phone_call_hangup' });
		}
	});
	
	// Generic UI button up/down response
	$('.button_MISC').on('mousedown touchstart',function() {
		$(this).addClass('buttonDOWN');
	});
	$('.button_MISC').on('mouseup',function() {
		$('.button_MISC').removeClass('buttonDOWN');
	});
}

function showExpiringVolumePopup() {
	if (VOL_POPUP_SHOWING === false) {
		$('#panelContainer_VOLUME').popup('open');
	}
	clearTimeout(AB_VOL_PRESS_TIMEOUT);
	AB_VOL_PRESS_TIMEOUT = setTimeout(function() {
		if (VOL_POPUP_SHOWING === true) {
			$('#panelContainer_VOLUME').popup('close');
		}
	},5000);
}

function highlightFirstABbutton() {
	if (AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH]) {
		//alert(AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][AB_CURSOR_HL_MATRIXLOC[1]]);
		if (AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][1]) {
			AB_CURSOR_HL_MATRIXLOC = [1,0];
		} else {
			AB_CURSOR_HL_MATRIXLOC = [0,0];
		}
		$('#'+AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][AB_CURSOR_HL_MATRIXLOC[1]]).addClass('BUTTON_AB_HL');
		AB_CURSOR_HL_SHOWING=true;
	}
	else {
		// No AB_SCREEN_MATRIX entry... do nothing
		//alert('No AB_SCREEN_MATRIX entry for: '+CURRENT_CLIENT_HASH);
	}
}
	
function bindSocketEvents(){
	socket.on('connect', function(){
		socket.emit('node_announce', { client:"cab_infotainment_ui", type: "cab_infotainment_ui" });
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
	
	socket.on('updateInfotainmentUI', function(data) {
		delete AB_SCREEN_MATRIX.pageContainer_MP3;
		AB_SCREEN_MATRIX.pageContainer_MP3 = {0:	['AB_pageContainer_MP3_BACK', 'AB_pageContainer_MP3_HOME']};
		
		MP3_ALBUM_LIST = data;
		
		$('#MP3_album_list_container').html('');
		var MP3_LIST_COVER_HTML = '';
		var gridIndex = 'a';
		var row = 1;
		var thisAlbumNum = 1;
		var thisButtonID = 1701;
		$.each(data, function(index, value) {
			var thisDiv =
				'<div id="AB_pageContainer_MP3_A'+thisAlbumNum+'" class="ui-block-'+gridIndex+' just_LINK mp3_album_LINK buttonI" data-bid="'+thisButtonID+'" data-anchorlink="#pageContainer_MP3_play" data-albumtitle="'+index+'" title="'+index+'">'+
					'<img class="album_cover" src="'+value.folderArtURL+'">'+
				'</div>';
			
			if (AB_SCREEN_MATRIX.pageContainer_MP3[row]) {
				AB_SCREEN_MATRIX.pageContainer_MP3[row].push('AB_pageContainer_MP3_A'+thisAlbumNum);
			} else {
				AB_SCREEN_MATRIX.pageContainer_MP3[row] = [];
				AB_SCREEN_MATRIX.pageContainer_MP3[row].push('AB_pageContainer_MP3_A'+thisAlbumNum);
			}
			//console.log(thisDiv);
			$('#MP3_album_list_container').append(thisDiv).trigger('create');
				
			switch(gridIndex){ //change class of ui-block
				case 'a' : gridIndex= 'b'; break;
				case 'b' : gridIndex= 'c'; break;
				case 'c' : gridIndex= 'd'; break;
				case 'd' : gridIndex= 'a'; row++; break;
			}
			thisAlbumNum++;
			thisButtonID++;
		}); 
		//console.log('refresh list: '+JSON.stringify(MP3_ALBUM_LIST));
		// end each(data...
	});

	socket.on('PLAY_CURRENT', function(data) {
		//console.log(data);
		var thisFolderArtURL = '';
		var thisFolderArtURLmods = '';
		
		if (data.status.playState === 0) {
			$('#AUDIO_playlist_container .AUDIO_playlist_group').hide();
			$('#AUDIO_playlist_container .AUDIO_OFF').show();
			delete AB_SCREEN_MATRIX.pageContainer_home[1];
			AB_SCREEN_MATRIX.pageContainer_home[1] = [ 'AB_pageContainer_home_NOAUDIO' ];
			
			$('.BUTTON_mp3_playPause_toggle').data('showing','play').find('img:first').attr('src','images/play.png');
			if (!$('.BUTTON_mp3_playPause_toggle').hasClass('buttonDisabled')) {
				$('.BUTTON_mp3_playPause_toggle').addClass('buttonDisabled');
			}
			if (!$('.BUTTON_mp3_fwd').hasClass('buttonDisabled')) {
				$('.BUTTON_mp3_fwd').addClass('buttonDisabled');
			}
			if (!$('.BUTTON_mp3_back').hasClass('buttonDisabled')) {
				$('.BUTTON_mp3_back').addClass('buttonDisabled');
			}
		} else {
			$('#AUDIO_playlist_container .AUDIO_playlist_group').hide();
		
			var tempTitleBreak = data.nowplaying_title.substr(0,2);
			if (tempTitleBreak === 'FM') {
				$('#AUDIO_playlist_container .AUDIO_playlist_radio').show();
				delete AB_SCREEN_MATRIX.pageContainer_home[1];
				AB_SCREEN_MATRIX.pageContainer_home[1] = [ 'AB_pageContainer_home_FM_PAUSE', 'AB_pageContainer_home_FM_VOLTOG' ];
			} else {
				if (MP3_ALBUM_LIST[data.nowplaying_title]) {
					thisFolderArtURL = MP3_ALBUM_LIST[data.nowplaying_title].folderArtURL;
					$('#AUDIO_MAIN_MP3LINK').data('albumtitle',data.nowplaying_title);
					$('#AUDIO_playlist_container .AUDIO_playlist_MP3').show();
					delete AB_SCREEN_MATRIX.pageContainer_home[1];
					AB_SCREEN_MATRIX.pageContainer_home[1] = [ 'AB_pageContainer_home_MP3_TBACK', 'AB_pageContainer_home_MP3_PAUSE', 'AB_pageContainer_home_MP3_TFWD', 'AB_pageContainer_home_MP3_VOLTOG' ];
				}
			}
			$('.CURRENTLY_PLAYING_TIME').html(moment.duration(data.currenttime, 'seconds').format("m:ss",{ trim: false }));
			$('.CURRENTLY_PLAYING_DURATION').html(moment.duration(data.duration, 'seconds').format("m:ss",{ trim: false }));
			$('.CURRENTLY_PLAYING_METER_inner').css('width',((data.currenttime/data.duration)*100)+'%');
			
			if ($('#MP3_playlist_album_cover_container').find('img:first').attr('src') !== thisFolderArtURL) {
				$('#MP3_playlist_album_cover_container').find('img:first').attr('src', thisFolderArtURL);
			}
			if ($('#AUDIO_playlist_container').find('img:first').attr('src') !== thisFolderArtURL) {
				$('#AUDIO_playlist_container').find('img:first').attr('src', thisFolderArtURL);
			}
			
			$('.AUDIO_title').html(data.nowplaying_title.split(' - ')[0]);
			$('.AUDIO_subtitle').html(data.nowplaying_subtitle);
			
			if (!$('#AUDIO_playlist_controls_MAIN').length) {		
				$('#AUDIO_playlist_container').parent().removeClass('just_LINK');
			}
			
			switch(data.status.playState) {
				case 1:
					// Paused, show play button
					$('.BUTTON_mp3_playPause_toggle, .BUTTON_FM_playPause_toggle').data('showing','pause').find('img:first').attr('src','images/play.png');
					if ($('.BUTTON_mp3_playPause_toggle, .BUTTON_FM_playPause_toggle').hasClass('buttonDisabled')) {
						$('.BUTTON_mp3_playPause_toggle, .BUTTON_FM_playPause_toggle').removeClass('buttonDisabled').addClass('button');
					}
					if ($('.BUTTON_mp3_fwd').hasClass('buttonDisabled')) {
						if (tempTitleBreak !== 'FM') {
							$('.BUTTON_mp3_fwd').removeClass('buttonDisabled');
						} else {
							if (!$('.BUTTON_mp3_fwd').hasClass('buttonDisabled')) {
								$('.BUTTON_mp3_fwd').addClass('buttonDisabled');
							}
						}
					}
					if ($('.BUTTON_mp3_back').hasClass('buttonDisabled')) {
						if (tempTitleBreak !== 'FM') {
							$('.BUTTON_mp3_back').removeClass('buttonDisabled');
						} else {
							if (!$('.BUTTON_mp3_back').hasClass('buttonDisabled')) {
								$('.BUTTON_mp3_back').addClass('buttonDisabled');
							}
						}
					}
					$('.CURRENTLY_PLAYING_TIME').toggleClass('blinking-time');
					break;
				case 2:
					// Playing, show pause button
					$('.BUTTON_mp3_playPause_toggle, .BUTTON_FM_playPause_toggle').data('showing','play').find('img:first').attr('src','images/pause.png');
					if ($('.BUTTON_mp3_playPause_toggle, .BUTTON_FM_playPause_toggle').hasClass('buttonDisabled')) {
						$('.BUTTON_mp3_playPause_toggle, .BUTTON_FM_playPause_toggle').removeClass('buttonDisabled').addClass('button');
					}
					if ($('.BUTTON_mp3_fwd').hasClass('buttonDisabled')) {
						if (tempTitleBreak !== 'FM') {
							$('.BUTTON_mp3_fwd').removeClass('buttonDisabled');
						} else {
							if (!$('.BUTTON_mp3_fwd').hasClass('buttonDisabled')) {
								$('.BUTTON_mp3_fwd').addClass('buttonDisabled');
							}
						}
					}
					if ($('.BUTTON_mp3_back').hasClass('buttonDisabled')) {
						if (tempTitleBreak !== 'FM') {
							$('.BUTTON_mp3_back').removeClass('buttonDisabled');
						} else {
							if (!$('.BUTTON_mp3_back').hasClass('buttonDisabled')) {
								$('.BUTTON_mp3_back').addClass('buttonDisabled');
							}
						}
					}
					$('.CURRENTLY_PLAYING_TIME').removeClass('blinking-time');
					break;
			} // end switch(data.playState);

		}
		$('#VOLUME_level_blackout').css('height',250-(data.status.volume*250));
		$('#VOLUME_level_gauge_value').html(Math.round(data.status.volume*100));
		
		//$('.BUTTON_mp3_playPause_toggle').removeClass('buttonDisabled').addClass('button').children(this).attr('src','images/pause.png').data('showing','pause');
	});
	
	socket.on('PLAY_END', function(data) {
		//$('.BUTTON_mp3_playPause_toggle').removeClass('buttonDisabled').addClass('button').children(this).attr('src','images/play.png').data('showing','play');
	});
	
	socket.on('overlay_display', function(data) {
		switch(data.type) {
			case 'update':
				updateSessionVars(socket, data);
				break;
			case 'map_update':
				updateLocalMapping(socket,data);
				break;
			case 'connection_update':
				updateLocalConnectionStatus(data);
				break;
		}
	});
	
	socket.on('minisim_info', function(data) {
		var topLeft_X = 0,
			topLeft_Y = -89430,
			bottomRight_X = 660,
			bottomRight_Y = 90090;
			
		var totalLRIwidth = 0,
			totalLRIheight = 0,
			LRI_offset_x = 0,
			LRI_offset_y = 0;
		
		totalLRIwidth = diff(topLeft_X,bottomRight_X);
		totalLRIheight = diff(topLeft_Y,bottomRight_Y);
		var CG_translated_X = diff(parseFloat(data.VDS_Chassis_CG_Position[1]),topLeft_X);
		var CG_translated_Y = diff(parseFloat(data.VDS_Chassis_CG_Position[0]),topLeft_Y);
		
		var LRI_translated_width = 1000;
		var LRI_translated_height = 272000;
	
		var LRI_CG_percent_X = (CG_translated_X/totalLRIwidth);
		var LRI_CG_percent_Y = (CG_translated_Y/totalLRIheight);
		
		var translated_CG_dot_X = parseInt((LRI_CG_percent_X)*LRI_translated_width);
		var translated_CG_dot_Y = parseInt((LRI_CG_percent_Y)*LRI_translated_height);
		
		//$('#PixPer_dot_x').html(sessionVars['translated_CG_dot_X']);
		//$('#PixPer_dot_y').html(sessionVars['translated_CG_dot_Y']);
		$('#HOME_MAP_IMG').css('top','-'+(translated_CG_dot_Y + dotMarkerOffset_Y) + 'px').css('left','-'+(translated_CG_dot_X + dotMarkerOffset_X) + 'px');
		$('#NAV_MAP_IMG').css('top','-'+(translated_CG_dot_Y + dotMarkerOffset_Y) + 'px').css('left','-'+(translated_CG_dot_X + dotMarkerOffset_X) + 'px');
	});
	
	socket.on('IC_command', function(data) {
		switch(data.type) {
			case 'switch_to_screen':
				var newScreen = data.anchorlink;
				$('#MSTR_LINK').attr('href', newScreen);
				$('#MSTR_LINK').click();
				break;
			case 'revert_screen_to_default':
				switch(data.screenid) { 
					case 'pageContainer_text_entry_task_a':
						$('#task_a_display').html('');
						updateSvr_textOutput();
						break;
				} // end switch(data.screenid)
				break;
			case 'AB_press':
				switch(data.keypress) {
					// WHEEL (LEFT) 
					case 'b':
						// Volume +
						showExpiringVolumePopup();
						socket.emit('IUI_command',{ type: 'audio_volume_up' });
						break;
					case 'c':
						// Volume -
						showExpiringVolumePopup();
						socket.emit('IUI_command',{ type: 'audio_volume_down' });
						break;
					case 'd':
						// Back
						if (CURRENT_CLIENT_HASH !== 'pageContainer_home') {
							$('#MSTR_LINK_BACK').click();
						}
						break;
					case 'D':
						// HOME (Back, long)
						$('#MSTR_LINK').attr('href', '#pageContainer_home');
						$('#MSTR_LINK').click();
						break;
					case 'e':
						// MODE (short)
						$('#MSTR_LINK').attr('href', '#pageContainer_select_audio_src');
						$('#MSTR_LINK').click();
						break;
					case 'E':
						// HOLD (long)
						// (handled through audio frontend for resetting GUI)
						break;
					case 'f':
						// Up
						if (AB_CURSOR_HL_SHOWING === false) {
							// cursor not showing yet, find the default location
							highlightFirstABbutton();
						}
						else {
							// cursor already showing, move up
							if (AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]-1]) {
								$('#'+AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][AB_CURSOR_HL_MATRIXLOC[1]]).removeClass('BUTTON_AB_HL');
								AB_CURSOR_HL_MATRIXLOC[1] = closestIndex(AB_CURSOR_HL_MATRIXLOC[1], AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[1]]);
								AB_CURSOR_HL_MATRIXLOC[0] = parseInt(AB_CURSOR_HL_MATRIXLOC[0])-1;
								//alert(AB_CURSOR_HL_MATRIXLOC);
								$('#'+AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][AB_CURSOR_HL_MATRIXLOC[1]]).addClass('BUTTON_AB_HL');
								//alert(AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][AB_CURSOR_HL_MATRIXLOC[1]]);
								
								// scroll check
								if (!$('#'+AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][AB_CURSOR_HL_MATRIXLOC[1]]).hasClass('button')) {
									var buttonPos = $('#'+AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][AB_CURSOR_HL_MATRIXLOC[1]]).position();
									if (buttonPos.top < 0) {
										//$('#MP3_album_list_container').scrollTop(0);
										$('#'+AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][AB_CURSOR_HL_MATRIXLOC[1]]).parent().scrollTop(0);
									}
								}
							}
						}
						break;
					case 'g':
						// Down
						if (AB_CURSOR_HL_SHOWING === false) {
							// cursor not showing yet, find the default location
							highlightFirstABbutton();
						}
						else {
							// cursor already showing, move down
							if (AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]+1]) {
								$('#'+AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][AB_CURSOR_HL_MATRIXLOC[1]]).removeClass('BUTTON_AB_HL');
								AB_CURSOR_HL_MATRIXLOC[1] = closestIndex(AB_CURSOR_HL_MATRIXLOC[1], AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[1]]);
								AB_CURSOR_HL_MATRIXLOC[0] = parseInt(AB_CURSOR_HL_MATRIXLOC[0])+1;
								//alert(AB_CURSOR_HL_MATRIXLOC);
								$('#'+AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][AB_CURSOR_HL_MATRIXLOC[1]]).addClass('BUTTON_AB_HL');
								//alert(AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][AB_CURSOR_HL_MATRIXLOC[1]]);
								
								// scroll check
								if (!$('#'+AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][AB_CURSOR_HL_MATRIXLOC[1]]).hasClass('button')) {
									var buttonPos = $('#'+AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][AB_CURSOR_HL_MATRIXLOC[1]]).position();
									if ((buttonPos.top+ ($('#'+AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][AB_CURSOR_HL_MATRIXLOC[1]]).height())) > 480) {
										//$('#MP3_album_list_container').scrollTop(480+buttonPos.top);
										$('#'+AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][AB_CURSOR_HL_MATRIXLOC[1]]).parent().scrollTop(480+buttonPos.top);
									}
								}
							}
						}
						break;
					case 'h':
						// Left
						if (AB_CURSOR_HL_SHOWING === false) {
							// cursor not showing yet, find the default location
							highlightFirstABbutton();
						}
						else {
							// cursor already showing, move left
							if (AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][AB_CURSOR_HL_MATRIXLOC[1]-1]) {
								$('#'+AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][AB_CURSOR_HL_MATRIXLOC[1]]).removeClass('BUTTON_AB_HL');
								AB_CURSOR_HL_MATRIXLOC[1] = AB_CURSOR_HL_MATRIXLOC[1]-1;
								//alert(AB_CURSOR_HL_MATRIXLOC);
								$('#'+AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][AB_CURSOR_HL_MATRIXLOC[1]]).addClass('BUTTON_AB_HL');
								//alert(AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][AB_CURSOR_HL_MATRIXLOC[1]]);
							}
						}
						break;
					case 'i':
						// Right
						if (AB_CURSOR_HL_SHOWING === false) {
							// cursor not showing yet, find the default location
							highlightFirstABbutton();
						}
						else {
							// cursor already showing, move right
							if (AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][AB_CURSOR_HL_MATRIXLOC[1]+1]) {
								$('#'+AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][AB_CURSOR_HL_MATRIXLOC[1]]).removeClass('BUTTON_AB_HL');
								AB_CURSOR_HL_MATRIXLOC[1] = AB_CURSOR_HL_MATRIXLOC[1]+1;
								//alert(AB_CURSOR_HL_MATRIXLOC);
								$('#'+AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][AB_CURSOR_HL_MATRIXLOC[1]]).addClass('BUTTON_AB_HL');
								//alert(AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][AB_CURSOR_HL_MATRIXLOC[1]]);
							}
						}
						break;
					case 'j':
						// Enter
						if (AB_CURSOR_HL_SHOWING === false) {
							// cursor not showing yet, find the default location
							highlightFirstABbutton();
						}
						else {
							// cursor already showing, "click" the selected element
							$('#'+AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][AB_CURSOR_HL_MATRIXLOC[1]]).removeClass('BUTTON_AB_HL');
							
							if ($('#'+AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][AB_CURSOR_HL_MATRIXLOC[1]]).hasClass('button_BACK_LINK')) {
								$('#MSTR_LINK_BACK').click();
							}
							else if ($('#'+AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][AB_CURSOR_HL_MATRIXLOC[1]]).hasClass('GPS_ZOOM_LVL')) {
								//$('#MSTR_LINK_BACK').click();
								var thisZoomType = $('#'+AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][AB_CURSOR_HL_MATRIXLOC[1]]).data('zoomtype');
								var thisZoomFactor = 0.5;
								if ($('#'+AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][AB_CURSOR_HL_MATRIXLOC[1]]).data('zoomfactor')) {
									thisZoomFactor = $('#'+AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][AB_CURSOR_HL_MATRIXLOC[1]]).data('zoomfactor');
								}
								switch(thisZoomType) {
									case 'in':
										if (sessionVars.local_zoom < 5) {
											sessionVars.local_zoom += thisZoomFactor;
											updateLocalZoomFactor();
										}
										break;
									case 'out':
										if (sessionVars.local_zoom > 0.5) {
											sessionVars.local_zoom -= thisZoomFactor;
											updateLocalZoomFactor();
										}
										break;
								} //end switch(thisZoomType)
							}
							else if ($('#'+AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][AB_CURSOR_HL_MATRIXLOC[1]]).hasClass('BUTTON_mp3_playPause_toggle')){
								// PLAY / PAUSE buttons
								var thisButtonType = $($('#'+AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][AB_CURSOR_HL_MATRIXLOC[1]])).data('showing');
								switch(thisButtonType) {
									case 'play':
										socket.emit('IUI_command',{ type: 'audio_pause' });
										break;
									case 'pause':
										socket.emit('IUI_command',{ type: 'audio_play' });
										break;
								} //end switch(thisButtonType)
							}
							else if (
								($('#'+AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][AB_CURSOR_HL_MATRIXLOC[1]]).hasClass('BUTTON_mp3_fwd')) ||
								($('#'+AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][AB_CURSOR_HL_MATRIXLOC[1]]).hasClass('BUTTON_mp3_back'))
							) {
								// FWD / BACK buttons
								var thisButtonType = $('#'+AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][AB_CURSOR_HL_MATRIXLOC[1]]).data('type');
								switch(thisButtonType) {
									case 'back':
										socket.emit('IUI_command',{ type: 'audio_back' });
										break;
									case 'fwd':
										socket.emit('IUI_command',{ type: 'audio_fwd' });
										break;
								} // end switch(thisButtonType)
							}
							else if ($('#'+AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][AB_CURSOR_HL_MATRIXLOC[1]]).hasClass('button_PLAYFILE')) {
								// Station / file selection
								var playlink = $('#'+AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][AB_CURSOR_HL_MATRIXLOC[1]]).data('playlink');
								var thisAlbumTitle = $('#'+AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][AB_CURSOR_HL_MATRIXLOC[1]]).data('albumtitle');
								var thisTrackName = $('#'+AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][AB_CURSOR_HL_MATRIXLOC[1]]).data('trackname');
								socket.emit('IUI_command',{ type: 'playMP3', 'playlink':playlink, albumtitle: thisAlbumTitle, trackname: thisTrackName });
							}
							else if ($('#'+AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][AB_CURSOR_HL_MATRIXLOC[1]]).hasClass('BUTTON_VOLUME_modal_toggle')) {
								// Volume toggle
								$('#panelContainer_VOLUME').popup('open');
							} else {
								var anchorLink = $('#'+AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][AB_CURSOR_HL_MATRIXLOC[1]]).data('anchorlink');
								$('#MSTR_LINK').attr('href',anchorLink);
								switch(anchorLink) {
									case '#pageContainer_MP3': {
										socket.emit('mp3_jukebox_enumerate',{});
										break;
									}
								}
								if ($('#'+AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][AB_CURSOR_HL_MATRIXLOC[1]]).hasClass('mp3_album_LINK')) {
									$('#MP3_playlist_container').html('');
									var thisAlbumTitle = $('#'+AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][AB_CURSOR_HL_MATRIXLOC[1]]).data('albumtitle');
									var row = 1;
									$.each(MP3_ALBUM_LIST[thisAlbumTitle].mp3List, function(index, value) {
										var thisDivId = 'AB_pageContainer_MP3_play_T'+row;
										var thisDiv =
											'<div id="'+thisDivId+'" class="entune_list_row button_PLAYFILE" style="width:374px; white-space:nowrap; text-overflow:ellipsis; overflow:hidden;" data-playlink="'+value.url+'" data-albumtitle="'+thisAlbumTitle+'" data-trackname="'+value.filename+'">'+
											value.filename.substr(0,value.filename.length-4)+
											'</div>';
										$('#MP3_playlist_container').append(thisDiv).trigger('create');
										if (AB_SCREEN_MATRIX.pageContainer_MP3_play[row]) {
											AB_SCREEN_MATRIX.pageContainer_MP3_play[row][0] = ''+thisDivId;
										} else {
											AB_SCREEN_MATRIX.pageContainer_MP3_play[row] = [''+thisDivId];
										}
										row++;
									}); 
									var timelineHTML =
										'<div style="display: -webkit-flex; display: flex;">'+
											'<div style="flex:1;" class="CURRENTLY_PLAYING_TIME">0:00</div>'+
											'<div style="flex:5;" class="CURRENTLY_PLAYING_METER_outer">'+
												'<div class="CURRENTLY_PLAYING_METER_inner"></div>'+
											'</div>'+
											'<div style="flex:1;" class="CURRENTLY_PLAYING_DURATION">2:00</div>'+
										'</div>';
									$('#MP3_playlist_album_cover_container').html('<img src="'+MP3_ALBUM_LIST[thisAlbumTitle].folderArtURL+'" style="height:250px; margin-left:46px;">'+timelineHTML);
									$('#MP3_playlist_page_title').html(thisAlbumTitle);
								}
								$('#MSTR_LINK').click();
							}
							AB_CURSOR_HL_SHOWING = false;
							//alert(AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][AB_CURSOR_HL_MATRIXLOC[1]]);
						}
						break;
					// WHEEL (RIGHT)
					// Not yet implemented
					/*
					case 'k':
						// Off hook
						break;
					case 'l':
						// On hook
						break;
					case 'm':
						// Voice
						break;
					case 'o':
						// Back
						break;
					case 'p':
						// Up
						break;
					case 'q':
						// Down
						break;
					case 'r':
						// Page
						break;
					case 's':
						// Enter
						break;
					*/
				} // end switch(data.keypress)
				break; // end case 'AB_press'
			case 'callStatus':
				switch(data.statusName) {
					case 'offhook':
						$('#AB_pageContainer_phone_HANGUP').removeClass('buttonDisabled').addClass('button').addClass('button_MISC');
						break;
					case 'onhook':
						$('#AB_pageContainer_phone_HANGUP').removeClass('button').removeClass('button_MISC').addClass('buttonDisabled');
						hideCallingBox();
						break;
				}
				break;
		}
	});
	
	socket.emit('mp3_jukebox_enumerate',{});
}

function hideCallingBox() {
	$('#call_callinprogress_info_container').hide();
}

function updateMapAspect(){}

function getMapHW(){
	//$('#MAIN_MAP_IMG').css('width','200%');
	var naturalW = document.querySelector('#MAIN_MAP_IMG').naturalWidth;
	var naturalH = document.querySelector('#MAIN_MAP_IMG').naturalHeight;
	
	$('#OSD_source_width').html(naturalW);
	$('#OSD_source_height').html(naturalH);
	updateMapAspect();
}

function updateLocalConnectionStatus(data) {
	$('#map_socketConnectionStatus').html(data.connectionstatustext);
}

function checkExpChange(socket,data) {
	if(sessionVars.OSD_lastKnown_exp_name != data.MAIN_Experiment) {
		updateOMCexpInfo(socket,data);
		checkSubjChange(socket,data);
	}
}

function checkSubjChange(socket,data) {
	if(sessionVars.OSD_lastKnown_subj_name != data.MAIN_Subject) {
		updateOMCsubjInfo(socket,data);
		checkRunChange(socket,data);
	}
}

function checkRunChange(socket,data) {
	if(sessionVars.OSD_lastKnown_run_name != data.MAIN_Run) {
		updateOMCrunInfo(socket,data);
	}
}

function updateOMCexpInfo(socket, data) {
	sessionVars.OSD_lastKnown_exp_name = data.MAIN_Experiment;
	sessionVars.OSD_experiment = data.MAIN_Experiment;
	updateOSDrunInfo(socket, data);
}

function updateOMCrunInfo(socket, data) {
	sessionVars.OSD_lastKnown_run_name = data.MAIN_Run;
	sessionVars.OSD_run = data.MAIN_Run;
	updateOSDrunInfo(socket, data);
}

function updateOMCsubjInfo(socket, data) {
	sessionVars.OSD_lastKnown_subj_name = data.MAIN_Subject;
	sessionVars.OSD_subject = data.MAIN_Subject;
	updateOSDrunInfo(socket, data);
}

function updateOSDrunInfo(socket, data) {
	$('#OSD_scenario_name').html(sessionVars.OSD_experiment);
	$('#OSD_subject_name').html(sessionVars.OSD_subject);
	$('#OSD_run_name').html(sessionVars.OSD_run);
}

function updateSessionVars(socket, data) {
	checkExpChange(socket,data);
	
	// map image source info
	sessionVars['OSD_source_info']['width'] = $('#OSD_source_width').html();
	sessionVars['OSD_source_info']['height'] = $('#OSD_source_height').html();
	
	// cab position
	sessionVars['VDS_CG_Chassis_Position']['x'] = data.MAIN_VDS_Chassis_Position[1].toFixed(5);
	sessionVars['VDS_CG_Chassis_Position']['y'] = data.MAIN_VDS_Chassis_Position[0].toFixed(5);
	sessionVars['VDS_CG_Chassis_Position']['z'] = data.MAIN_VDS_Chassis_Position[2].toFixed(5);
	// cab orientation
	sessionVars['VDS_CG_Chassis_Orient']['pitch'] = data.MAIN_VDS_Chassis_Orient[0].toFixed(5);
	sessionVars['VDS_CG_Chassis_Orient']['roll'] = data.MAIN_VDS_Chassis_Orient[1].toFixed(5);
	sessionVars['VDS_CG_Chassis_Orient']['yaw'] = data.MAIN_VDS_Chassis_Orient[2].toFixed(5);
	
	// sim frame
	sessionVars['simFrame'] = data.MAIN_simFrameNum;
	
	updateOSDdebugVars(socket,data);			
	updateMapRotation();
	updateCompassRotation();
	updateDotPosition(socket,data);
}

function updateCompassRotation() {
	$('#compass_horizCircle_container').css('transform','transform:rotateX('+(90+100*(sessionVars['VDS_CG_Chassis_Orient']['pitch']))+'deg) rotateY('+sessionVars['VDS_CG_Chassis_Orient']['roll']+'deg)');
	$('#compass_horizCircle').css('transform','rotateZ('+sessionVars['VDS_CG_Chassis_Orient']['yaw']+'deg)');
	//$('#compass_horizCircle .compass_heading_marker').css('transform','rotateX(-90deg) rotateY(-'+sessionVars['VDS_CG_Chassis_Orient']['yaw']+'deg)');
	//$('.compass_heading_greyout').css('transform','rotateY(-'+sessionVars['VDS_CG_Chassis_Orient']['yaw']+'deg)');
}

function updateOSDdebugVars(socket,data) {
	$('#OSD_VDS_Chassis_Position').html(''+
		sessionVars['VDS_CG_Chassis_Position']['x']+'<br />'+
		sessionVars['VDS_CG_Chassis_Position']['y']+'<br />'+
		sessionVars['VDS_CG_Chassis_Position']['z']
	);
	$('#OSD_VDS_Chassis_Orient').html(''+
		sessionVars['VDS_CG_Chassis_Orient']['pitch']+'<br />'+
		sessionVars['VDS_CG_Chassis_Orient']['roll']+'<br />'+
		sessionVars['VDS_CG_Chassis_Orient']['yaw']
	);
	
	$('#OSD_VDS_Chassis_Position_QPNL_X').html(''+
		sessionVars['VDS_CG_Chassis_Position']['x']
	);
	$('#OSD_VDS_Chassis_Position_QPNL_Y').html(''+
		sessionVars['VDS_CG_Chassis_Position']['y']
	);
	$('#OSD_VDS_Chassis_Position_QPNL_Z').html(''+
		sessionVars['VDS_CG_Chassis_Position']['z']
	);
	$('#OSD_simFrame').html(''+sessionVars['simFrame']);
	
	$('#OSD_VDS_Chassis_Orient_yaw').html(''+
		parseFloat(sessionVars['VDS_CG_Chassis_Orient']['yaw']).toFixed(2)
	);
}

function updateLocalMapping(socket, data) {
	//console.log(sessionVars);
	sessionVars['MAP_IMG'] = data.MAP_IMG;
	sessionVars['ROUTE_IMG'] = data.ROUTE_IMG;
	sessionVars['LRI_topLeft_X'] = data.MAP_BLI_TL_X;
	sessionVars['LRI_topLeft_Y'] = data.MAP_BLI_TL_Y;
	sessionVars['LRI_bottomRight_X'] = data.MAP_BLI_BR_X;
	sessionVars['LRI_bottomRight_Y'] = data.MAP_BLI_BR_Y;
	
	$('#OSD_scenario_name').html(data.MAIN_Experiment);
	$('#OSD_subject_name').html(data.MAIN_Subject);
	$('#OSD_run_name').html(data.MAIN_Run);
	
	updateOSDmaps();
	updateMapRotation();
}

function updateOSDmaps() {
	$('.mapImg').one('load', function() {
		getMapHW();
		//updateOSDmapRoutes();
	}).attr("src", sessionVars['MAP_IMG']);	
	var mapImgSplit = sessionVars['MAP_IMG'].split('.png');
	$('.mapGPSunderlay').attr('src', mapImgSplit[0]+'_gpsoverlay.png');		
}

function updateOSDmapRoutes() {
	$('.routeImg').one('load', function() {
		//adjustLayout();
	}).attr("src", sessionVars['ROUTE_IMG']);
}

function updateDotPosition(socket,data) {
	measureLRIabsoluteWidth();
}

function measureLRIabsoluteWidth() {
	//if (sessionVars['LRI_topLeft_X'].length == 0) {
	//	socket.emit('display_request', { type: "current_map" });
	//}
	
	var topLeft_X = sessionVars['LRI_topLeft_X'],
		topLeft_Y = sessionVars['LRI_topLeft_Y'],
		bottomRight_X = sessionVars['LRI_bottomRight_X'],
		bottomRight_Y = sessionVars['LRI_bottomRight_Y'];
		
	var totalLRIwidth = 0,
		totalLRIheight = 0,
		LRI_offset_x = 0,
		LRI_offset_y = 0;
	
	totalLRIwidth = diff(topLeft_X,bottomRight_X);
	totalLRIheight = diff(topLeft_Y,bottomRight_Y);
	$('#PixPer_yoff').html(diff(parseFloat(sessionVars['VDS_CG_Chassis_Position']['y']),topLeft_Y).toFixed(3));
	$('#PixPer_xoff').html(diff(parseFloat(sessionVars['VDS_CG_Chassis_Position']['x']),topLeft_X).toFixed(3));
	
	$('#PixPer_width').html(totalLRIwidth);
	$('#PixPer_height').html(totalLRIheight);
	
	$('#PixPer_dimensions_TL_X').html(topLeft_X);
	$('#PixPer_dimensions_TL_Y').html(topLeft_Y);
	$('#PixPer_dimensions_BR_X').html(bottomRight_X);
	$('#PixPer_dimensions_BR_Y').html(bottomRight_Y);
	calculateLRIPercentages();
}

function calculateLRIPercentages() {
	var CG_translated_X = $('#PixPer_xoff').html(),
		CG_translated_Y = $('#PixPer_yoff').html(),
		LRI_translated_width = $('#PixPer_width').html(),
		LRI_translated_height = $('#PixPer_height').html();	
	
	sessionVars['LRI_CG_percent_X'] = (CG_translated_X/LRI_translated_width)*100;
	sessionVars['LRI_CG_percent_Y'] = (CG_translated_Y/LRI_translated_height)*100;
	calculateDotPercentages();
}

function calculateDotPercentages() {
	var map_display_width = $('#OSD_source_width').html();
	var map_display_height = $('#OSD_source_height').html();
	$('#PixPer_xoff_percent').html(sessionVars['LRI_CG_percent_X'].toFixed(2));
	$('#PixPer_yoff_percent').html(sessionVars['LRI_CG_percent_Y'].toFixed(2));
	
	sessionVars['translated_CG_dot_X'] = parseInt((sessionVars['LRI_CG_percent_X']/100)*map_display_width);
	sessionVars['translated_CG_dot_Y'] = parseInt((sessionVars['LRI_CG_percent_Y']/100)*map_display_height);
	//console.log((sessionVars['LRI_CG_percent_Y']/100)*map_display_height);
	updateDPOSD();
}

function updateDPOSD() {
	$('#PixPer_dot_x').html(sessionVars['translated_CG_dot_X']);
	$('#PixPer_dot_y').html(sessionVars['translated_CG_dot_Y']);
	$('#MAIN_MAP_IMG').css('top','-'+(sessionVars['translated_CG_dot_Y'] + dotMarkerOffset_Y) + 'px').css('left','-'+(sessionVars['translated_CG_dot_X'] + dotMarkerOffset_X) + 'px');
	$('#HOME_MAP_IMG').css('top','-'+(sessionVars['translated_CG_dot_Y'] + dotMarkerOffset_Y) + 'px').css('left','-'+(sessionVars['translated_CG_dot_X'] + dotMarkerOffset_X) + 'px');
	$('.mapGPSunderlay').css('top','-'+(sessionVars['translated_CG_dot_Y'] + dotMarkerOffset_Y) + 'px').css('left','-'+(sessionVars['translated_CG_dot_X'] + dotMarkerOffset_X) + 'px');
	//console.log(sessionVars['translated_CG_dot_Y'] + dotMarkerOffset_Y);
}

function updateMapRotation() {
	var positiveYaw = (7200+parseFloat(sessionVars['VDS_CG_Chassis_Orient']['yaw'])) % 360;
	$('#mapContainerOuter_HomePage').css('-webkit-transform','rotate(-'+positiveYaw+'deg)').css('transform','rotate(-'+positiveYaw+'deg)');	
	$('#cabCG_car_dot').css('-webkit-transform','rotate('+positiveYaw+'deg)').css('transform','rotate('+positiveYaw+'deg)')
}
	
function updateLocalZoomFactor() {
	//alert(sessionVars.local_zoom);
	$('#mapContainerOuter_HomePage_ZOOM').css('transform', 'scale('+sessionVars.local_zoom+')').css('-webkit-transform', 'scale('+sessionVars.local_zoom+')');	
	$('#mapContainerOuter_navigation_ZOOM').css('transform', 'scale('+sessionVars.local_zoom+')').css('-webkit-transform', 'scale('+sessionVars.local_zoom+')');	
}

function connect() {
	socket = io.connect(serverAddress);
	bindSocketEvents();
}


function updateTouchLocation(x, y) {
	//console.log('X: '+x+'; Y: '+y);
	var modX = x - ((sessionVars.WINDOW_width - ($('#FLOAT_CONTAINER').width())) / 2);
	var modY = y - ((sessionVars.WINDOW_height - ($('#FLOAT_CONTAINER').height())) / 2);
	socket.emit('IUI_touchinfo',{ type: 'update', coord_x: modX, coord_y: modY });
}

function updatePageContainerLoc(pageHashId) {
	socket.emit('IUI_info',{ type: 'update', current_page_hash: pageHashId });
}

function measureWindow() {
	sessionVars.WINDOW_width = $(window).width();
	sessionVars.WINDOW_height = $(window).height();
}

$(function() { 
	readURLvars();
	
	$('#panelContainer_VOLUME').popup();
	$('#panelContainer_VOLUME').on('popupafteropen',function() {
		VOL_POPUP_SHOWING = true;
	}).on('popupafterclose', function() {
		socket.emit('IUI_command',{ type: 'audio_volume_modal', command: 'close' });
		VOL_POPUP_SHOWING = false;	
	});
	
	$(window).on("hashchange", function() {
		checkCurrentPageHash();
  	});
	
	// TOUCH TRACKING
	document.addEventListener("touchstart", function(e) {
        //console.log(e);
		updateTouchLocation(e.changedTouches[0].pageX, e.changedTouches[0].pageY);
    },false);

	document.addEventListener("touchmove", function(e) {
        updateTouchLocation(e.targetTouches[0].pageX, e.targetTouches[0].pageY);
    });
	
	document.addEventListener("touchend", function(e) {
		//console.log('end');
		socket.emit('IUI_touchinfo',{ type: 'stop' });
    });
	// end TOUCH TRACKING
	
	CURRENT_CLIENT_HASH = location.hash.replace(/^#/, "");
	if (CURRENT_CLIENT_HASH === '') {
		CURRENT_CLIENT_HASH = 'pageContainer_home';
	}
	updatePageContainerLoc(CURRENT_CLIENT_HASH);
	
	$(window).resize(function() {
		measureWindow();
	});
	measureWindow();
	
	bindDOMEvents();
});

function checkCurrentPageHash() {
	CURRENT_CLIENT_HASH = location.hash.replace(/^#/, "");
	if (CURRENT_CLIENT_HASH === '') {
		CURRENT_CLIENT_HASH = 'pageContainer_home';
	}
	AB_CURSOR_HL_SHOWING=false;
	$('.BUTTON_AB_HL').removeClass('BUTTON_AB_HL');
	
	if(CURRENT_CLIENT_HASH.indexOf("&ui-state=dialog") == -1) {
		//console.log('page container, moving to: '+CURRENT_CLIENT_HASH);
		updatePageContainerLoc(CURRENT_CLIENT_HASH);
	} else {
		//console.log('dialog, sending mirror notifications. CCH: '+CURRENT_CLIENT_HASH);
		socket.emit('IUI_command',{ type: 'audio_volume_modal', command: 'open' });
	}
};