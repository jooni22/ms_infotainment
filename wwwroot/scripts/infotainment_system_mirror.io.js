var CONTROL_SERVER_URL = 'http://90.0.0.80:80';
var CLIENT_URL_VARS;

var MP3_ALBUM_LIST = {};

var AB_VOL_PRESS_TIMEOUT = null;
var VOL_POPUP_SHOWING = false;

var CURRENT_CLIENT_HASH = 'pageContainer_home';
var CURRENT_CLIENT_TOUCHLOC_XY = [-1,-1];
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
var dotMarkerOffset_X = -30;
var dotMarkerOffset_Y = -30;

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
	/*
	// Swipes for alerts/control panel
	$( document ).on( "swiperight swipeleft", "#INFOTAINMENT_CONTAINER", function( e ) {
		if ( $.mobile.activePage.jqmData( "panel" ) !== "open" ) {
			
			if ( e.type === "swiperight" ) {
				if (ACTIVEPAGE === 1) {
					$( "#mscMainPanel" ).panel( "open" );
				}
				else {
					var newPageNum = ACTIVEPAGE-1;
					changeToPage(newPageNum);
				}
			}
			
			if ( e.type === "swipeleft" ) {
				$( "#MIRROR_CONTROL" ).panel( "open" );
				
				if (ACTIVEPAGE < 2) {
					var newPageNum = ACTIVEPAGE+1;
					changeToPage(newPageNum);
				}
				
			}
		}
	});
	*/
	
	$(document).on('tap', '#INFOTAINMENT_CONTAINER', function() {
		$( "#MIRROR_CONTROL" ).panel( "open" );
	});
	
	$('#MIRROR_CONTROL_BUTTON_refresh').on('click', function() {
		location.reload();
	});
	
	$('#MIRROR_CONTROL_BUTTON_switchToScreen').on('click',function() {
		$('#MIRROR_CONTROL_PAGESEL').popup('open');
	});
	
	$('.MIRROR_BUTTON_SwitchToScreen').on('click',function() {
		var thisTarget = '#'+$(this).data('infotarget');
		socket.emit('RGUI_command', { type: 'switch_to_screen', anchorlink: thisTarget });
	});
	
	
	
	$('#MIRROR_CONTROL_BUTTON_audioOff').on('click',function() {
		socket.emit('IUI_command',{ type: 'audio_off' });
	});
	
	$('#MIRROR_CONTROL_SW_blackout').on('click',function() {
		var currentBlackoutVal = $(this).data('blackoutval');
		switch(currentBlackoutVal) {
			case 'Off':
				socket.emit('RGUI_command',{ type: 'blackout_on' });
				$('#MIRROR_CONTROL_SW_blackout_sliderBG').css('background','rgba(0,160,0,1)');
				$('#MIRROR_CONTROL_SW_blackout_sliderButtonOuter').css('left','auto').css('border-left','3px solid rgba(160,160,160,1)').css('border-right','none').css('right','1px');
				$('#MIRROR_CONTROL_SW_blackout_sliderButton_Off').hide();
				$('#MIRROR_CONTROL_SW_blackout_sliderButton_On').show();
				$(this).data('blackoutval','On');
				break;
			case 'On':
				socket.emit('RGUI_command',{ type: 'blackout_off' });
				$('#MIRROR_CONTROL_SW_blackout_sliderBG').css('background','rgba(20,20,20,1)');
				$('#MIRROR_CONTROL_SW_blackout_sliderButtonOuter').css('left','1px').css('border-left','none').css('border-right','3px solid rgba(160,160,160,1)').css('right','auto');
				$('#MIRROR_CONTROL_SW_blackout_sliderButton_Off').show();
				$('#MIRROR_CONTROL_SW_blackout_sliderButton_On').hide();
				$(this).data('blackoutval','Off');
				break;
		}
		//socket.emit('IUI_command',{ type: 'audio_off' });
	});
	
	$('#button_CYCLE_WINDOW').on('click',function() {
		window.location.assign('http://90.0.0.194:8888/default_mobile.htm?sv=90.0.0.194');
	});
	$('#button_CYCLE_WINDOW_LOBBYCAM').on('click',function() {
		window.location.assign('http://128.255.250.99:52401/lobbycam_mfd.htm');
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
		socket.emit('node_announce', { client:"cab_infotainment_ui_mirror", type: "cab_infotainment_ui_mirror" });
		$('#MIRROR_CONTROL_BUTTON_refresh').data('status','connected');
		$('#MIRROR_CONTROL_BUTTON_refresh').addClass('ui-disabled');
		$('#MIRROR_CONTROL_BUTTON_refresh_text').html('Connected');
	});
	
	socket.on('connect_error', function(){
		$('#debug_connectionStatus').html('Connection issues');
	});
	
	socket.on('disconnect', function(){
		$('#debug_connectionStatus').html('Disconnected from host');
		$('#MIRROR_CONTROL_BUTTON_refresh').data('status','disconnected');
		$('#MIRROR_CONTROL_BUTTON_refresh').removeClass('ui-disabled');
		$('#MIRROR_CONTROL_BUTTON_refresh_text').html('Reconnect');
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
		$.each(data, function(index, value) {
			//console.log(value);
			var thisDiv =
				'<div id="AB_pageContainer_MP3_A'+thisAlbumNum+'" class="ui-block-'+gridIndex+' just_LINK mp3_album_LINK" data-anchorlink="#pageContainer_MP3_play" data-albumtitle="'+index+'" title="'+index+'">'+
					'<img class="album_cover" src="'+value.folderArtURL+'">'+
				'</div>';
			
			if (AB_SCREEN_MATRIX.pageContainer_MP3[row]) {
				AB_SCREEN_MATRIX.pageContainer_MP3[row].push('AB_pageContainer_MP3_A'+thisAlbumNum);
			} else {
				AB_SCREEN_MATRIX.pageContainer_MP3[row] = [];
				AB_SCREEN_MATRIX.pageContainer_MP3[row].push('AB_pageContainer_MP3_A'+thisAlbumNum);
			}
			$('#MP3_album_list_container').append(thisDiv).trigger('create');
				
			switch(gridIndex){ //change class of ui-block
				case 'a' : gridIndex= 'b'; break;
				case 'b' : gridIndex= 'c'; break;
				case 'c' : gridIndex= 'd'; break;
				case 'd' : gridIndex= 'a'; row++; break;
			}
			thisAlbumNum++;
		}); 
		//console.log(data);
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
				thisFolderArtURL = MP3_ALBUM_LIST[data.nowplaying_title].folderArtURL;
				$('#AUDIO_playlist_container .AUDIO_playlist_MP3').show();
				delete AB_SCREEN_MATRIX.pageContainer_home[1];
				AB_SCREEN_MATRIX.pageContainer_home[1] = [ 'AB_pageContainer_home_MP3_TBACK', 'AB_pageContainer_home_MP3_PAUSE', 'AB_pageContainer_home_MP3_TFWD', 'AB_pageContainer_home_MP3_VOLTOG' ];
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
					$('.BUTTON_mp3_playPause_toggle').data('showing','pause').find('img:first').attr('src','images/play.png');
					if ($('.BUTTON_mp3_playPause_toggle').hasClass('buttonDisabled')) {
						$('.BUTTON_mp3_playPause_toggle').removeClass('buttonDisabled').addClass('button');
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
					$('.BUTTON_mp3_playPause_toggle').data('showing','play').find('img:first').attr('src','images/pause.png');
					if ($('.BUTTON_mp3_playPause_toggle').hasClass('buttonDisabled')) {
						$('.BUTTON_mp3_playPause_toggle').removeClass('buttonDisabled').addClass('button');
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
	
	socket.on('ALERT_drow_command', function(data) {
		switch(data.type) {
			case 'open':			
				switch(data.stagelevel) {
					case 1:
						$('#pageContainer_ALERT_drow_IMG').attr('src',CONTROL_SERVER_URL+'/alert_src/drow/stage1.png');
						$('#MSTR_LINK').attr('href','#pageContainer_ALERT_drow');
						$('#MSTR_LINK').click();
						socket.emit('IUI_command',{ type: 'playALERT', 'playlink': CONTROL_SERVER_URL+'/alert_src/drow/StagedAlert1.mp3' });
						break;
					case 2:
						$('#pageContainer_ALERT_drow_IMG').attr('src',CONTROL_SERVER_URL+'/alert_src/drow/stage2.png');
						$('#MSTR_LINK').attr('href','#pageContainer_ALERT_drow');
						$('#MSTR_LINK').click();
						socket.emit('IUI_command',{ type: 'playALERT', 'playlink': CONTROL_SERVER_URL+'/alert_src/drow/StagedAlert2.mp3' });
						break;
					case 3:
						$('#pageContainer_ALERT_drow_IMG').attr('src',CONTROL_SERVER_URL+'/alert_src/drow/stage3.png');
						$('#MSTR_LINK').attr('href','#pageContainer_ALERT_drow');
						$('#MSTR_LINK').click();
						socket.emit('IUI_command',{ type: 'playALERT', 'playlink': CONTROL_SERVER_URL+'/alert_src/drow/StagedAlert3.mp3' });
						break;
				}
				break;
			case 'close': 
				$('#pageContainer_ALERT_drow_IMG').attr('src','');
				// $('#MSTR_LINK').attr('href','#pageContainer_home');
				$('#MSTR_LINK').attr('href','#pageContainer_screen_blackout');
				$('#MSTR_LINK').click();
				break;
			case 'reset':
				$('#pageContainer_ALERT_drow_IMG').attr('src','');
				$('#MSTR_LINK').attr('href','#pageContainer_home');
				$('#MSTR_LINK').click();
				break;
		} // end switch(data.type)
	});
	
	socket.on('MIRROR_command', function(data) {
		switch(data.type) {
			case 'switch_to_screen':
				console.log('STS: '+data.anchorlink);
				var newScreen = '#'+data.anchorlink;
				$('#MSTR_LINK').attr('href', newScreen);
				$('#MSTR_LINK').click();
				break;
			case 'touch_update':
				//if (!$('#TOUCH_TARGET').is(":visible")) {
					$('#TOUCH_TARGET').stop().show();
					
				//}
				$('#TOUCH_TARGET').css('top',((data.coord_y)-22)+'px').css('left',((data.coord_x)-22)+'px');
				CURRENT_CLIENT_TOUCHLOC_XY[0] = data.coord_x;
				CURRENT_CLIENT_TOUCHLOC_XY[1] = data.coord_y;
				break;
			case 'touch_end':
				var thisSplashOutId = 'touchSpl-'+Date.now();
				$('#TOUCH_TARGET').hide();
				$('#INFOTAINMENT_CONTAINER').append('<div id="'+thisSplashOutId+'" class="touchSplash_echo"></div>');
				$('#'+thisSplashOutId).css('top',((CURRENT_CLIENT_TOUCHLOC_XY[1])-22)+'px').css('left',((CURRENT_CLIENT_TOUCHLOC_XY[0])-22)+'px');
				var touchSplashtimeout = setTimeout(function() {
					$('#'+thisSplashOutId).remove();
				}, 2500);
				break;
			case 'update_container_scroll':
				$(''+data.target).scrollTop(data.scroll_top);
				break;
			case 'update_txt_display':
				$('#task_a_display').html(data.current_output);
				break;
			case 'popup_update':
				//alert(data.targetwindow);
				switch(data.command) {
					case 'open':
						$('#'+data.targetwindow).popup('open');
						console.log('SERVER '+Date.now()+': OPEN CMD '+data.targetwindow);
						break;
					case 'close':
						console.log('SERVER '+Date.now()+': CLOSE CMD '+data.targetwindow);
						break;
					default:
						break;
				}
				break; // end case 'popup_update'
			case 'select_mp3_album':
				$('#MP3_playlist_container').empty();
				var thisAlbumTitle = data.albumtitle;
				var track = 1;
				//console.log(MP3_ALBUM_LIST[thisAlbumTitle].mp3List);
				$.each(MP3_ALBUM_LIST[thisAlbumTitle].mp3List, function(index, value) {
					//console.log(index+' '+value);
					var thisDivId = 'AB_pageContainer_MP3_play_T'+track;
					var thisDiv =
						'<div id="'+thisDivId+'" class="entune_list_row button_PLAYFILE" style="width:374px; white-space:nowrap; text-overflow:ellipsis; overflow:hidden;" data-playlink="'+value.url+'" data-albumtitle="'+thisAlbumTitle+'" data-trackname="'+value.filename+'">'+
						value.filename.substr(0,value.filename.length-4)+
						'</div>';
					$('#MP3_playlist_container').append(thisDiv).trigger('create');
					if (AB_SCREEN_MATRIX.pageContainer_MP3_play[track]) {
						AB_SCREEN_MATRIX.pageContainer_MP3_play[track][0] = ''+thisDivId;
					} else {
						AB_SCREEN_MATRIX.pageContainer_MP3_play[track] = [''+thisDivId];
					}
					track++;
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
				break; // end case 'select_mp3_album'
		}
	}); 
	
	socket.on('IC_command', function(data) {
		switch(data.type) {

			case 'AB_press':
				switch(data.keypress) {
					// WHEEL (LEFT) 
					case 'b':
						// Volume +
						showExpiringVolumePopup();
						//socket.emit('IUI_command',{ type: 'audio_volume_up' });
						break;
					case 'c':
						// Volume -
						showExpiringVolumePopup();
						//socket.emit('IUI_command',{ type: 'audio_volume_down' });
						break;
					case 'd':
						// Back
						break;
					case 'D':
						// HOME (Back, long)
						break;
					case 'e':
						// MODE (short)
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
								//$('#MSTR_LINK_BACK').click();
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
										//socket.emit('IUI_command',{ type: 'audio_pause' });
										break;
									case 'pause':
										//socket.emit('IUI_command',{ type: 'audio_play' });
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
										//socket.emit('IUI_command',{ type: 'audio_back' });
										break;
									case 'fwd':
										//socket.emit('IUI_command',{ type: 'audio_fwd' });
										break;
								} // end switch(thisButtonType)
							}
							else if ($('#'+AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][AB_CURSOR_HL_MATRIXLOC[1]]).hasClass('button_PLAYFILE')) {
								// Station / file selection
								var playlink = $('#'+AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][AB_CURSOR_HL_MATRIXLOC[1]]).data('playlink');
								var thisAlbumTitle = $('#'+AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][AB_CURSOR_HL_MATRIXLOC[1]]).data('albumtitle');
								var thisTrackName = $('#'+AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][AB_CURSOR_HL_MATRIXLOC[1]]).data('trackname');
								//socket.emit('IUI_command',{ type: 'playMP3', 'playlink':playlink, albumtitle: thisAlbumTitle, trackname: thisTrackName });
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
		}
	});
	
	socket.emit('mp3_jukebox_enumerate',{});
}

function updateMapAspect(){}

function getMapHW(){
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
	console.log(sessionVars);
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
}

function connect(){
	socket = io.connect(serverAddress);
	bindSocketEvents();
}


$(function() { 
	readURLvars();
	
	$('#panelContainer_VOLUME').popup();
	
	$(document).on('popupafteropen', '#panelContainer_VOLUME', function() {
		VOL_POPUP_SHOWING = true;
		console.log(Date.now()+' Opening');
	});
	
	$(document).on('popupafterclose', '#panelContainer_VOLUME', function() {
		VOL_POPUP_SHOWING = false;
		console.log(Date.now()+' Closing');
	});
	
	$('#MIRROR_CONTROL').panel();
	$('#MIRROR_CONTROL ul').listview();
	$('#MIRROR_CONTROL_PAGESEL').popup();
	
	bindDOMEvents();
});
