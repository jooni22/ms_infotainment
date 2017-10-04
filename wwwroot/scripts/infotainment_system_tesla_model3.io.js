var CONTROL_SERVER_URL = 'http://localhost:80';
var CLIENT_URL_VARS;

var MP3_ALBUM_LIST = {};

var INET_RADIO_LIST = {
	'CNN'		: 	{ folderArtURL: 'images/radio_icons/cnn.png'
					},
	'The Nerdist' : { folderArtURL: 'images/radio_icons/nerdistlogo.jpg'
					}
};

var AB_VOL_PRESS_TIMEOUT = null;
var VOL_POPUP_SHOWING = false;
var NP_MP3_ALBUM_TITLE = null;
var NP_MP3_ALBUM_SUBTITLE = null;

var CURRENT_CLIENT_HASH = 'pageContainer_home';
var AB_CURSOR_HL_TIMEOUT = null;
var AB_CURSOR_HL_SHOWING = false;
var AB_CURSOR_HL_MATRIXLOC = [0,0];
var AB_SCREEN_MATRIX = {
	pageContainer_home	: {
	 '-1':  ['NP_container'],	
		0:	['footer_car_system', 'footer_env_front_window', 'footer_env_rear_window', 'footer_seatwarmer_driver', 'footer_env_driver_rocker',
			 'footer_envcontrols_climate_control', 
			 'footer_env_pass_rocker', 'footer_seatwarmer_passenger', 'footer_music', 'footer_phone'
			]
	},
	PANE_AUDIO	: {
		0:	['tab_audio_inner']
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
	'local_zoom'				: 3,
	'DayNight_mode'				: 'day',
	'MAPS_traffic_on'			: 'false',
	'OSK_target'				: '',
	'gesture_control_on'		: false,
	'gesture_control_menus_on'	: false,
	'gesture_control_menu_focus': '',
	'active_pane'				: ''
};

/*
// HERE mapping
var map;
var HERE_BL_MAPS = {
	'day'		: { normal: 'map', traffic: 'traffic' },
	'night'		: { normal: 'mapnight', traffic: 'trafficnight' }
};
*/

var dotMarkerOffset_X = 0;
var dotMarkerOffset_Y = 0;

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
	//console.log('URL VARS READ: ');
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
	} 
	if (CLIENT_URL_VARS.r) {
		// if ?r set, rotate the screen (Samsung tablet)
		$('#TOUCH_COVER').css('transform', 'rotate(-90deg)').css('-webkit-transform', '(-90deg)');
		$('#panelContainer_CONTROLS').css('transform', 'rotate(-90deg)').css('-webkit-transform', '(-90deg)');
		$('#TOUCH_COVER_INNER').css('margin-left', '-100px').css('margin-top', '-960px');
		$('#panelContainer_CONTROLS').addClass('ui-popup-container-rotComp');
	}
}
	
function twoDigits(d) {
	if(0 <= d && d < 10) return "0" + d.toString();
	if(-10 < d && d < 0) return "-0" + (-1*d).toString();
	return d.toString();
}

function isInt(value) {
	var x = parseFloat(value);
	return !isNaN(value) && (x | 0) === x;
}

function makeSafeForCSS(name) {
    return name.replace(/[^a-z0-9]/g, function(s) {
        var c = s.charCodeAt(0);
        if (c == 32) return '-';
        if (c >= 65 && c <= 90) return '_' + s.toLowerCase();
        return '__' + ('000' + c.toString(16)).slice(-4);
    });
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
	//var updatedTime = new Date().toEntuneformat();
	var updatedTime = moment().format('h:mm A');
	var updatedDate = moment().format('D');
	var updatedMonth = moment().format('MMM').toUpperCase();
	$('.tesla_clock').html(updatedTime);
	$('#MM_day').html(updatedDate);
	$('#MM_month').html(updatedMonth);
	//console.log(updatedTime);
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


function checkPaneTop(data) {
	var paneTarget = data.paneTarget;
	var selectedPaneTop = $('#'+paneTarget).css('top').split('px')[0];
	// '870'
	return parseInt(selectedPaneTop);
}

/*
function check_audioPane_height() {
	var audioPaneTop = $('#PANE_AUDIO').css('top').split('px')[0];
	// '870'
	return parseInt(audioPaneTop);
}

function check_phonePane_height() {
	var phonePaneTop = $('#PANE_PHONE').css('top').split('px')[0];
	// '870'
	return parseInt(phonePaneTop);
}

function check_carSystemPane_height() {
	var carSystemPaneTop = $('#PANE_CAR_SYSTEM').css('top').split('px')[0];
	// '870'
	return parseInt(carSystemPaneTop);
}

function showPane(data) {
	var paneToPromote = data.paneToShow;
}*/


// Hammer(time)
$('.left_pane_tab').each(function() {
	var ht_LPE = new Hammer(this);
	ht_LPE.get('swipe').set({ direction: Hammer.DIRECTION_ALL });
	ht_LPE.on('swiperight', function(ev) {
		// Swipe right (on-screen keyboard)
		$('.left_pane_tab').removeClass('showing');
		$('#IN_DRIVE_CONTAINER').addClass('showing');
		$('.AP_control_display').show();
	});
	ht_LPE.on('swipeleft', function(ev) {
		// Swipe left (on-screen keyboard)
		$('.left_pane_tab').removeClass('showing');
		$('#IN_PARK_CONTAINER').addClass('showing');
		$('.AP_control_display').hide();
	});
});

var oskElement = document.getElementById('osk');
var ht_osk = new Hammer(oskElement);
ht_osk.get('swipe').set({ direction: Hammer.DIRECTION_ALL });
ht_osk.on('swipedown', function(ev) {
	// Swipe down (on-screen keyboard)
	$('#osk').removeClass('showing');
});

var carSystemElement = document.getElementById('PANE_CAR_SYSTEM');
var ht_CarSystem = new Hammer(carSystemElement);
ht_CarSystem.get('swipe').set({ direction: Hammer.DIRECTION_ALL });
ht_CarSystem.on('swipedown', function(ev) {
	// Swipe down (Car system pane)
	$('#PANE_CAR_SYSTEM').css('top','870px');
	console.log('swipe down');
});

var phoneElement = document.getElementById('PANE_PHONE');
var ht_Phone = new Hammer(phoneElement);
ht_Phone.get('swipe').set({ direction: Hammer.DIRECTION_ALL });
ht_Phone.on('swipeleft', function(ev) {
	// Swipe left (Phone pane)
	var currentTab = $('#TABS_PHONE div.tab_selected').data('tabtarget');
	if ($('#TABS_PHONE div.tab_selected').next().data('tabtarget')) {
		//alert($('#TABS_PHONE div.tab_selected').next().data('tabtarget'));
		var targetContainer = $('#TABS_PHONE div.tab_selected').next().data('tabtarget');
		var paneProto = $('#TABS_PHONE div.tab_selected').next().data('pproto');
		$('#'+paneProto+' .sub_container_tab').removeClass('tab_selected');
		$('#'+paneProto+' .container_media').hide();
		//$(this).addClass('tab_selected');
		$('#TABS_PHONE div[data-tabtarget="'+targetContainer+'"]').addClass('tab_selected');
		$('#'+targetContainer).show();
	}
	else {
		//alert('nothing to right');
	}
});
ht_Phone.on('swiperight', function(ev) {
	// Swipe right (Phone pane)
	var currentTab = $('#TABS_PHONE div.tab_selected').data('tabtarget');
	if ($('#TABS_PHONE div.tab_selected').prev().data('tabtarget')) {
		//alert($('#TABS_PHONE div.tab_selected').prev().data('tabtarget'));
		var targetContainer = $('#TABS_PHONE div.tab_selected').prev().data('tabtarget');
		var paneProto = $('#TABS_PHONE div.tab_selected').prev().data('pproto');
		$('#'+paneProto+' .sub_container_tab').removeClass('tab_selected');
		$('#'+paneProto+' .container_media').hide();
		//$(this).addClass('tab_selected');
		$('#TABS_PHONE div[data-tabtarget="'+targetContainer+'"]').addClass('tab_selected');
		$('#'+targetContainer).show();
	}
	else {
		//alert('nothing to left');
	}
});
ht_Phone.on('swipedown', function(ev) {
	// Swipe down (Phone pane)
	$('#PANE_PHONE').css('top','870px');
});

var audio_NP_Element = document.getElementById('NOW_PLAYING_container');
var ht_Audio_NP = new Hammer(audio_NP_Element);
ht_Audio_NP.get('swipe').set({ direction: Hammer.DIRECTION_ALL });
ht_Audio_NP.on('swipedown', function(ev) {
	// Swipe down (Audio pane)
	var NP_openStatus = $('#NP_STATUS').data('npopen');
	if (NP_openStatus !== 'no') {
	}
	$('#PANE_AUDIO').css('top','870px');
});
ht_Audio_NP.on('swipeup', function(ev) {
	// Swipe up (Audio pane)
	switch(checkPaneTop({ paneTarget: 'PANE_AUDIO' })) {
		case 710:
			$('#PANE_AUDIO').css('top','60px');
			break;
	}
});
var audio_cat_Element = document.getElementById('AUDIO_CATEGORY_SWIPE_BLOCK');
var ht_Audio_SwipeBlock = new Hammer(audio_cat_Element);
ht_Audio_SwipeBlock.on('swipeleft', function(ev) {
	// Swipe left (Audio pane)
	var currentTab = $('#TABS_AUDIO div.tab_selected').data('tabtarget');
	if ($('#TABS_AUDIO div.tab_selected').next().data('tabtarget')) {
		var targetContainer = $('#TABS_AUDIO div.tab_selected').next().data('tabtarget');
		var paneProto = $('#TABS_AUDIO div.tab_selected').next().data('pproto');
		$('#'+paneProto+' .sub_container_tab').removeClass('tab_selected');
		$('#'+paneProto+' .container_media').hide();
		//$(this).addClass('tab_selected');
		$('#TABS_AUDIO div[data-tabtarget="'+targetContainer+'"]').addClass('tab_selected');
		$('#'+targetContainer).show();
	}
	else {
		//alert('nothing to right');
	}
});
ht_Audio_SwipeBlock.on('swiperight', function(ev) {
	// Swipe right (Audio pane)
	var currentTab = $('#TABS_AUDIO div.tab_selected').data('tabtarget');
	if ($('#TABS_AUDIO div.tab_selected').prev().data('tabtarget')) {
		var targetContainer = $('#TABS_AUDIO div.tab_selected').prev().data('tabtarget');
		var paneProto = $('#TABS_AUDIO div.tab_selected').prev().data('pproto');
		$('#'+paneProto+' .sub_container_tab').removeClass('tab_selected');
		$('#'+paneProto+' .container_media').hide();
		//$(this).addClass('tab_selected');
		$('#TABS_AUDIO div[data-tabtarget="'+targetContainer+'"]').addClass('tab_selected');
		$('#'+targetContainer).show();
	}
	else {
		//alert('nothing to left');
	}
});


function hideActivePane() {
	if (sessionVars.active_pane !== '') {
		$('#'+sessionVars.active_pane).css('top','870px');
		sessionVars.active_pane = '';
	}
}

function showPane(data) {
	var effectedPane = data.paneTarget;
	if ($('#'+effectedPane)) {
		hideActivePane();
		
		$('#'+effectedPane).css('top','60px');
		sessionVars.active_pane = effectedPane;
		return true;
	}
	else {
		console.log('No pane: '+effectedPane);
		return false;
	}
}

function moveIntoPane(data) {
	var effectedPane = data.paneTarget;
	CURRENT_CLIENT_HASH = effectedPane;
	highlightFirstABbutton();
	sessionVars.gesture_control_menu_focus = effectedPane;
}

function bindDOMEvents() {
	$('.button_BACK_LINK').on('mousedown touchstart',function() {
		$(this).addClass('buttonDOWN');
	});
	$('.button_BACK_LINK').on('mouseup',function() {
		$(this).removeClass('buttonDOWN');
		$('#MSTR_LINK_BACK').click();
	});
	
	$(document.body).on('click', '.dialpad_button', function() {
		if ($(this).data('dpval')) {
			var currentDialNum = $('#PHONE_TOCALL_NUM').html();
			var newVal = $(this).data('dpval');
			switch (newVal) {
				case 'CALL':
					$('#PHONE_TOCALL_NUM').addClass('greenGlowBox');
					$('#BTN_DP_CALL').css('background','rgba(245,0,0,1.00)');
					$('#BTN_DP_CALL').data('dpval','HANGUP');
					break;
				case 'HANGUP':
					// clear "number to call" field
					$('#PHONE_TOCALL_NUM').html('');
					$('#PHONE_TOCALL_NUM').removeClass('greenGlowBox');
					$('#BTN_DP_CALL').css('background','rgba(29,219,0,1.00)');
					$('#BTN_DP_CALL').data('dpval','CALL');
					break;
				case 'BSP':
					$('#PHONE_TOCALL_NUM').html(''+currentDialNum.substring(0,(ObjectLength(currentDialNum))-1));
					break;
				case 'Z':
					$('#PHONE_TOCALL_NUM').html(currentDialNum+'0');
					break;
				default:
					$('#PHONE_TOCALL_NUM').html(currentDialNum+(newVal));
					break;
			}
		}
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
	
	$(document.body).on('mouseup', '.just_LINK', function() {
		var anchorLink = $(this).data('anchorlink');
		$('#MSTR_LINK').attr('href',anchorLink);
		$('#MSTR_LINK').click();
	});
	
	$(document.body).on('click', '#slider_gesture_control_onoff div.slider_option', function() {
		socket.emit('RGUI_command', { type:'motion_control', switchPosition:$(this).data('switchval') });
		if ($(this).data('switchval') === 'off') {
			$('#gestureIcon_container').css('border','none');
		}
	});
	
	$(document.body).on('mouseup', '#footer_controls_label', function() {
		$('#panelContainer_CONTROLS').popup('open');
	});
	
	$(document.body).on('click', '.seat_temp_control', function() {
		var targetSeat = $(this).data('targetseat');
		var tempAdjustmentDirection = $(this).data('tempdir');
		var currentSeatTemp = parseInt($('#footer_temp_'+targetSeat+'_val').html());
		switch (tempAdjustmentDirection) {
			case 'up':
				currentSeatTemp++;
				$('#footer_temp_'+targetSeat+'_val').html(currentSeatTemp);
				break;
			case 'down':
				currentSeatTemp--;
				$('#footer_temp_'+targetSeat+'_val').html(currentSeatTemp);
				break;
		}
	});
	
	$(document.body).on('click', '.tesla_it_nested_menu div.topLvl li', function() {
		var thisTarget = $(this).data('menutarget');
		$('.tesla_it_nested_menu div.topLvl li').removeClass('selectedItem');
		$(this).addClass('selectedItem');
		//alert(thisTarget);
		
		$('#browseMedia_menu div.lowerLvl').hide();
		$('#menu_'+thisTarget).show();
	});
	
	$(document.body).on('mouseup', '.mp3_album_LINK', function() {
		$('#MP3_playlist_container').html('');
		var thisAlbumTitle = $(this).data('albumtitle');
		socket.emit('IUI_command', { type: 'select_mp3_album', albumtitle: thisAlbumTitle });
		var track = 1;
		
		console.log('ding');
		console.log(thisAlbumTitle);
		console.log(MP3_ALBUM_LIST);
		
		//alert(MP3_ALBUM_LIST[thisAlbumTitle].mp3List);
		$.each(MP3_ALBUM_LIST[thisAlbumTitle].mp3List, function(index, value) {
			//console.log(index+' '+value);
			var thisDivId = 'AB_pageContainer_MP3_play_T'+track;
			var thisDiv =
				'<div id="'+thisDivId+'" class="tesla_list_row button_PLAYFILE" style="width:320px; white-space:nowrap;" data-playlink="'+value.url+'" data-albumtitle="'+thisAlbumTitle+'" data-trackname="'+value.filename+'">'+
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
		//console.log(MP3_ALBUM_LIST[thisAlbumTitle]);
		var origSplit = MP3_ALBUM_LIST[thisAlbumTitle].rootDir.split('/');
		var artistAlbum = origSplit[ObjectLength(origSplit)-1].split(' - ');
		
		/*
		var new_ALBUM_COVER_content = '<img src="'+MP3_ALBUM_LIST[thisAlbumTitle].folderArtURL+'" style="width:288px;">'+
			'<div style="margin-top:8px;">'+
				'<div>'+artistAlbum[1]+'</div>'+
				'<div><span style="opacity:0.5;">'+artistAlbum[0]+'</span></div>'+
			'</div>';
		$('#menu_ALBUM_COVER_cont').html(new_ALBUM_COVER_content);
		*/
		
		$('#browseMedia_menu div.lowerLvl').hide();
		//$('#menu_ALBUM').show();
	}); 
		
	$(document.body).on('click', '.button_PLAYFILE', function() {
		var playlink = $(this).data('playlink');
		var thisAlbumTitle = $(this).data('albumtitle');
		var thisTrackName = $(this).data('trackname');
		socket.emit('IUI_command',{ type: 'playMP3', 'playlink':playlink, albumtitle: thisAlbumTitle, trackname: thisTrackName });
		
		if ($(this).data('albumtitle')) {
			thisAlbumTitle = $(this).data('albumtitle');
			$('#NP_ALBUMART').data('albumtitle',thisAlbumTitle);
			//console.log('found '+thisAlbumTitle);
		}
		else {
			console.log(thisAlbumTitle+' not found');
		}
	});
	
	$(document.body).on('mouseup', '.button_PLAY_STREAM', function() {
		var playlink = $(this).data('playlink');
		var thisAlbumTitle = $(this).data('albumtitle');
		var thisTrackName = $(this).data('trackname');
		socket.emit('IUI_command',{ type: 'playStream', 'playlink':playlink, albumtitle: thisAlbumTitle, trackname: thisTrackName });
	});
	
	// PLAY / PAUSE
	$(document.body).on('click', '.BUTTON_mp3_playPause_toggle, .BUTTON_FM_playPause_toggle', function() {
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
	$(document.body).on('click', '.BUTTON_mp3_fwd, .BUTTON_mp3_back', function() {
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
	$(document.body).on('click', '.BUTTON_radio_fwd, .BUTTON_radio_back', function() {
		console.log($(this).data('type'));
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
		
	$(document.body).on('click', '#VOLUME_level_UP', function() {
		socket.emit('IUI_command',{ type: 'audio_volume_up' });
		$('.buttonVolume').removeClass('buttonDOWN');
	});
	
	$(document.body).on('click', '#VOLUME_level_DOWN', function() {
		socket.emit('IUI_command',{ type: 'audio_volume_down' });
		$('.buttonVolume').removeClass('buttonDOWN');
	});
	
	$(document.body).on('mousedown touchstart', '.PLAY_CONTROLS', function() {
		//$(this).addClass('buttonDOWN');
	});
	
	$(document.body).on('mouseup', '.PLAY_CONTROLS', function() {
		//$('.PLAY_CONTROLS').removeClass('buttonDOWN');
	});
	
	$(document.body).on('click', '.CURRENTLY_PLAYING_METER_touchtarget', function(e) {
		var normalizedX = Math.floor(e.offsetX);
		var percent =(normalizedX/380);
		socket.emit('IUI_command', { type:'audio_play_head', pct:percent });
		//console.log(e);
	});	
	
	$(document.body).on('click', '.NP_pulltab', function() {
		if ($(this).data('npopen') === 'no') {
			// NOW PLAYING is currently minimized
			$('#NP_PLAYLIST_CONTROLS').removeClass('np_playcontrols_bigwidth').addClass('np_playcontrols_smallwidth');
			//$('#NP_FAVRECENT').show();
			$(this).data('npopen','yes');
			$('#NOW_PLAYING_container').animate({height:655}, {duration:320, easing:'swing'});	
			
			$('#NP_PLAYLIST').show();
		} else {
			// NOW PLAYING is "full" height
			$('#NP_PLAYLIST_CONTROLS').removeClass('np_playcontrols_smallwidth').addClass('np_playcontrols_bigwidth');
			//$('#NP_FAVRECENT').hide();
			$(this).data('npopen','no');
			$('#NOW_PLAYING_container').animate({height:0}, {duration:320, easing:'swing'});	
			$('#NP_PLAYLIST').hide();
		}
		//$(this).toggleClass('dayBG');
		//$('#NP_container div div img.heartIcon').toggle();
		$('.AUDIO_albumtitle_fav').toggle();
		//$('.vertPaddingOpt').toggleClass('np_opt_vertpad');
		$('.vertPaddingOpt_last').toggleClass('np_opt_vertpad_top_big');
		$('.AUDIO_title').toggleClass('smallText');
		$('.AUDIO_albumtitle').toggleClass('smallText');
		//$('.CURRENTLY_PLAYING_TIME').toggle();
		//$('.CURRENTLY_PLAYING_DURATION').toggle();
		$('#NP_ALBUMART').toggleClass('np_largealbumpic');
	});
	
	$(document.body).on('click', '#footer_music', function() {
		switch(checkPaneTop({ paneTarget: 'PANE_AUDIO' })) {
			case 870:
				showPane({ paneTarget:'PANE_AUDIO' });
				break;
			case 710:
				showPane({ paneTarget:'PANE_AUDIO' });
				break;
			case 60:
				hideActivePane();
				sessionVars.gesture_control_menu_focus = 'footer';
				break;
		}
		//$('#PANE_AUDIO').toggle();
	});
	
	$(document.body).on('click', '#footer_phone', function() {
		switch(checkPaneTop({ paneTarget: 'PANE_PHONE' })) {
			case 870:
				showPane({ paneTarget:'PANE_PHONE' });
				break;
			case 60:
				hideActivePane();
				sessionVars.gesture_control_menu_focus = 'footer';
				break;
		}
		//$('#PANE_AUDIO').toggle();
	});
	
	$(document.body).on('click', '#footer_car_system', function() {
		switch(checkPaneTop({ paneTarget: 'PANE_CAR_SYSTEM' })) {
			case 870:
				showPane({ paneTarget:'PANE_CAR_SYSTEM' });
				break;
			case 60:
				hideActivePane();
				sessionVars.gesture_control_menu_focus = 'footer';
				break;
		}
	});
	
	$(document.body).on('click', '.CM_option', function() {
		if ($(this).data('targetdiv')) {
			var targetDiv = $(this).data('targetdiv');
			$('#CAR_SYSTEM_PANEL_CM .CM_row').removeClass('selected');
			$('#CAR_SYSTEM_LEFT_CONTAINER .car_system_panel').hide();
			$('#'+targetDiv).show();
			$(this).addClass('selected');
		}
	});
	
	$(document.body).on('click', '#BTN_InfoCS_Toyota_Entune', function() {
		window.location.href = serverAddress+'/infotainment_system.htm?sv='+CLIENT_URL_VARS.sv;
	});
	
	$(document.body).on('click', '#footer_seatwarmer_passenger', function() {
		$('#osk').addClass('showing');
	});
	
	$(document.body).on('mousedown touchstart', '.gen_button', function() {
		$(this).toggleClass('touch');
	});
	
	$(document.body).on('mouseup touchend', '.gen_button', function() {
		$(this).removeClass('touch');
	});
	
	// FRONT WINDOW DEFROST / HEATER
	$(document.body).on('click', '#footer_env_front_window', function() {
		var currentState = $('#footer_env_front_window').data('bstate');
		switch (currentState) {
			case 'off':
				// currently off, move to defrost
				$('#footer_env_front_window img').prop('src', 'images/tesla_envcontrols_defrost_front_defrost.png');
				$('#footer_env_front_window').data('bstate','defrost');
				break;
			case 'defrost':
				// currently defrost, move to heater
				$('#footer_env_front_window img').prop('src', 'images/tesla_envcontrols_defrost_front_heater.png');
				$('#footer_env_front_window').data('bstate','heater');
				break;
			case 'heater':
				// currently heater, move to off
				$('#footer_env_front_window img').prop('src', 'images/tesla_envcontrols_defrost_front.png');
				$('#footer_env_front_window').data('bstate','off');
				break;
		}
	});
	
	// REAR WINDOW HEATER
	$(document.body).on('click', '#footer_env_rear_window', function() {
		var currentState = $('#footer_env_rear_window').data('bstate');
		switch (currentState) {
			case 'off':
				// currently off, move to heater
				$('#footer_env_rear_window img').prop('src', 'images/tesla_envcontrols_defrost_rear_heater.png');
				$('#footer_env_rear_window').data('bstate','heater');
				break;
			case 'heater':
				// currently heater, move to off
				$('#footer_env_rear_window img').prop('src', 'images/tesla_envcontrols_defrost_rear.png');
				$('#footer_env_rear_window').data('bstate','off');
				break;
		}
	});
	
	// DAY / NIGHT ILLUMINATION
	$(document.body).on('click', '#footer_seatwarmer_driver', function() {
		switch(sessionVars.DayNight_mode) {
			case 'day':
				sessionVars.DayNight_mode = 'night';
				$('#LEFT_PANE').css('box-shadow','0px 0px 20px rgba(100,100,100,1)');
				
				break;
			case 'night':
				sessionVars.DayNight_mode = 'day';
				$('#LEFT_PANE').css('box-shadow','none');
				break;
		}
		// refreshHEREmap(map);
		$('.DARK_TOG').toggleClass('dark');
		$('#PROTO_NAV_MAPCONT').toggleClass('mapNight');
	});
	
	$(document.body).on('click', '#NP_mp3_favtarget', function() {
		var thisalbum = $(this).data('thisalbum');
		socket.emit('IUI_command', { type:'toggle_favorite', albumtarget: thisalbum });
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
	
	$(document.body).on('mouseup', '.sub_container_tab', function() {
		var targetContainer = $(this).data('tabtarget');
		var paneProto = $(this).data('pproto');
		$('#'+paneProto+' .sub_container_tab').removeClass('tab_selected');
		$('#'+paneProto+' .container_media').hide();
		$(this).addClass('tab_selected');
		$('#'+targetContainer).show();
	});
	
	// Map zoom lvl
	$(document.body).on('click', '.IT_zoom', function() {
		var thisZoomType = $(this).data('io');
		var thisZoomFactor = 0.5;
		if ($(this).data('zoomfactor')) {
			thisZoomFactor = $(this).data('zoomfactor');
		}
		switch(thisZoomType) {
			case 'in':
				if (sessionVars.local_zoom < 5) {
					if (sessionVars.local_zoom < 0.5) {
						sessionVars.local_zoom += 0.1;
					} else {
						sessionVars.local_zoom += thisZoomFactor;
					}
					updateLocalZoomFactor();
				}
				break;
			case 'out':
				if (sessionVars.local_zoom > 0.5) {
					sessionVars.local_zoom -= thisZoomFactor;
					updateLocalZoomFactor();
				} else if (sessionVars.local_zoom > 0.2) {
					sessionVars.local_zoom -= 0.1;
					updateLocalZoomFactor();
				}
				break;
		} //end switch(thisZoomType)
	});
	
	$(document.body).on('click', '.osk_spawn_button', function() {
		if ($(this).data('osktarget')) {
			sessionVars.OSK_target = $(this).data('osktarget');
			showPane({ paneToShow:'CAR_SYSTEM' });
		}
	});
	
	$(document.body).on(smartClick, '.slider_option', function () {
		if (!$(this).hasClass('selected')) {
			$(this).siblings('.slider_option').removeClass('selected');
			$(this).addClass('selected');
		}
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
		switch(CURRENT_CLIENT_HASH) {
			case 'pageContainer_home':
				AB_CURSOR_HL_MATRIXLOC = [0,5];
				break;
			default:
				if (AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][1]) {
					AB_CURSOR_HL_MATRIXLOC = [1,0];
				} else {
					AB_CURSOR_HL_MATRIXLOC = [0,0];
				}
		}
		
		select_ABbutton();
		//$('#'+AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][AB_CURSOR_HL_MATRIXLOC[1]]).addClass('BUTTON_AB_HL');
		//AB_CURSOR_HL_SHOWING=true;
	}
	else {
		// No AB_SCREEN_MATRIX entry... do nothing
		console.log('No AB_SCREEN_MATRIX entry for: '+CURRENT_CLIENT_HASH);
	}
}

function highlight_prev_ABbutton() {
	if (AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][(AB_CURSOR_HL_MATRIXLOC[1])-1]) {
		AB_CURSOR_HL_MATRIXLOC = [AB_CURSOR_HL_MATRIXLOC[0], (AB_CURSOR_HL_MATRIXLOC[1])-1];
		select_ABbutton();
	}
}

function highlight_next_ABbutton() {
	if (AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][(AB_CURSOR_HL_MATRIXLOC[1])+1]) {
		AB_CURSOR_HL_MATRIXLOC = [AB_CURSOR_HL_MATRIXLOC[0], (AB_CURSOR_HL_MATRIXLOC[1])+1];
		select_ABbutton();
	}
}

function highlight_prevRow_ABbutton() {
	if (AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][(AB_CURSOR_HL_MATRIXLOC[0])-1]) {
		if (AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][(AB_CURSOR_HL_MATRIXLOC[0])-1][AB_CURSOR_HL_MATRIXLOC[1]]) {
			AB_CURSOR_HL_MATRIXLOC = [(AB_CURSOR_HL_MATRIXLOC[0])-1, AB_CURSOR_HL_MATRIXLOC[1]];
		} else {
			AB_CURSOR_HL_MATRIXLOC = [(AB_CURSOR_HL_MATRIXLOC[0])-1, 0];
		}
		select_ABbutton();
	}
}

function highlight_nextRow_ABbutton() {
	if (AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][(AB_CURSOR_HL_MATRIXLOC[0])+1]) {
		if (AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][(AB_CURSOR_HL_MATRIXLOC[0])+1][AB_CURSOR_HL_MATRIXLOC[1]]) {
			AB_CURSOR_HL_MATRIXLOC = [(AB_CURSOR_HL_MATRIXLOC[0])+1, AB_CURSOR_HL_MATRIXLOC[1]];
		} else {
			AB_CURSOR_HL_MATRIXLOC = [(AB_CURSOR_HL_MATRIXLOC[0])+1, 0];
		}
		select_ABbutton();
	}
}

function highlight_prevRowMP3_ABbutton() {
	if (AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][(AB_CURSOR_HL_MATRIXLOC[1])-5]) {
		AB_CURSOR_HL_MATRIXLOC = [AB_CURSOR_HL_MATRIXLOC[0], (AB_CURSOR_HL_MATRIXLOC[1])-5];
		select_ABbutton();
		checkHLScrollPos({ targetScrollDiv:'cont_BrowseStreaming' });
	} else {
		moveIntoPane({ paneTarget:'PANE_AUDIO' });
		//AB_CURSOR_HL_MATRIXLOC = [(AB_CURSOR_HL_MATRIXLOC[0])-1, 0];
	}
}

function highlight_nextRowMP3_ABbutton() {
	if (AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][(AB_CURSOR_HL_MATRIXLOC[1])+5]) {
			AB_CURSOR_HL_MATRIXLOC = [AB_CURSOR_HL_MATRIXLOC[0], (AB_CURSOR_HL_MATRIXLOC[1])+5];
			select_ABbutton();
			checkHLScrollPos({ targetScrollDiv:'cont_BrowseStreaming' });
		} else {
			//AB_CURSOR_HL_MATRIXLOC = [(AB_CURSOR_HL_MATRIXLOC[0])-1, 0];
		}
}

function select_ABbutton() {
	clearABbuttonHightlights();
	$('#'+AB_SCREEN_MATRIX[CURRENT_CLIENT_HASH][AB_CURSOR_HL_MATRIXLOC[0]][AB_CURSOR_HL_MATRIXLOC[1]]).addClass('BUTTON_AB_HL');
	AB_CURSOR_HL_SHOWING=true;
}

function clearABbuttonHightlights() {
	$('.BUTTON_AB_HL').removeClass('BUTTON_AB_HL');
	AB_CURSOR_HL_SHOWING=false;
}

function getIDofCurrentHightlight() {
	var currentHighlightId = $('.BUTTON_AB_HL').prop('id');
	console.log('----');
	console.log(currentHighlightId);
	console.log('menu focus: '+sessionVars.gesture_control_menu_focus);
	
	return currentHighlightId;
}

function checkHLScrollPos(data) {
	var currentHighlightId = $('.BUTTON_AB_HL').prop('id');
	var currentHighlightTop = $('#'+currentHighlightId).position().top;
	var currentScrollDivContainer = data.targetScrollDiv;
	var currentScrollablePos = $('#'+currentScrollDivContainer+' div:first-child').scrollTop();
	//console.log(currentHighlightTop+' Scrollable: '+currentScrollablePos);
	if (currentHighlightTop < 180) {
		$('#'+currentScrollDivContainer+' div:first-child').scrollTop(currentScrollablePos - 280);
	}
	if (currentHighlightTop > 700) {
		$('#'+currentScrollDivContainer+' div:first-child').scrollTop(currentScrollablePos + 500);
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
		AB_SCREEN_MATRIX.pageContainer_MP3 = {0:[],1:[]};
		// row 0 is favorites, 1 is the full MP3 directory list
		MP3_ALBUM_LIST = data;
		
		$('#MP3_album_list_container').html('');
		$('.FAVORITES_container').html('');
		var MP3_LIST_COVER_HTML = '';
		var row = 1;
		var thisAlbumNum = 1;
		$.each(data, function(index, value) {
			var splitAlbum = index.split(' - ');
			var thisAlbumFirstTrack = MP3_ALBUM_LIST[index].mp3List[0];
			var thisIsFav = value.favorite;
			var thisIdName = 'AB_MP3_MEDIA_'+thisAlbumNum;
			var thisDiv =
				'<div id="'+thisIdName+'" class="media_container button_PLAYFILE" data-playlink="'+thisAlbumFirstTrack.url+'" data-albumtitle="'+index+'" data-trackname="'+thisAlbumFirstTrack.filename+'">'+
					'<img class="media_album_cover" src="'+value.folderArtURL+'" data-albumtitle="'+index+'">'+
					'<div style="width:160px; text-overflow:ellipsis; overflow:hidden;">'+splitAlbum[1]+'</div>'+
				'</div>';
			$('#MP3_album_list_container').append(thisDiv).trigger('create');
			AB_SCREEN_MATRIX.pageContainer_MP3[1].push(thisIdName);
			if(thisIsFav) {
				$('.FAVORITES_container').append(thisDiv).trigger('create');	
			}
			thisAlbumNum++;
		});
		// end each(data...
	});
	
	socket.on('gesture_hb_status', function(data) {
		var currentBorderColor = $('#gestureIcon_container').css('border-left-color');
		if (data.handsInBox === 0) {
			//alert('no hands! '+currentBorderColor);
			$('#gestureIcon_container').css('border','none');
		} else {
			//alert('HANDS! '+currentBorderColor);
			$('#gestureIcon_container').css('border','2px dashed rgba(0,139,20,1)');
		}
	});
	
	socket.on('gesture_finger_status', function(data) {
		if ($('#gestureIcon_bg').css('background') !== 'rgba(223,173,0,1.00)') {
			$('#gestureIcon_bg').css('background','rgba(223,173,0,1.00)');
		}
		switch(data.makingFist) {
			case true:
				$('#gestureIcon_img').attr('src','images/icon_gesture_fist_engage.png');
				$('#gestureIcon_bg').show();
				break;
			case false:
				$('#gestureIcon_bg').fadeOut('fast');
				break;
		}
	});
	
	socket.on('gesture_command', function(data) {
		if ($('#gestureIcon_bg').css('background') !== 'rgba(0,163,3,1.00)') {
			$('#gestureIcon_bg').css('background','rgba(0,163,3,1.00)');
		}
		var currentHLID = getIDofCurrentHightlight();
		switch(data.gesture) {
			case 'swipe_left':
				$('#gestureIcon_img').attr('src','images/icon_gesture_swipe_left.png');
				//socket.emit('IUI_command',{ type: 'audio_back' });
				switch (sessionVars.gesture_control_menu_focus) {
					case 'footer':
						highlight_prev_ABbutton();
						break;
					case 'NP_container':
						$('#AB_pageContainer_home_MP3_TBACK').click();
						break;
					case 'pageContainer_MP3':
						highlight_prev_ABbutton();
						break;
				}
				break;
			case 'swipe_right':
				$('#gestureIcon_img').attr('src','images/icon_gesture_swipe_right.png');
				//socket.emit('IUI_command',{ type: 'audio_fwd' });
				switch (sessionVars.gesture_control_menu_focus) {
					case 'footer':
						highlight_next_ABbutton();
						break;
					case 'NP_container':
						$('#AB_pageContainer_home_MP3_TFWD').click();
						break;
					case 'pageContainer_MP3':
						highlight_next_ABbutton();
						break;
				}
				break;
			case 'swipe_up':
				$('#gestureIcon_img').attr('src','images/icon_gesture_swipe_up.png');
				if (sessionVars.gesture_control_menus_on === true) {
					switch(sessionVars.gesture_control_menu_focus) {
						case 'footer': 
							if (currentHLID === 'footer_env_driver_rocker') {
								$('#footer_env_driver_rocker_up').click();
							}
							if (currentHLID === 'footer_env_pass_rocker') {
								$('#footer_env_pass_rocker_up').click();
							}
							if (currentHLID === 'footer_envcontrols_climate_control') {
								highlight_prevRow_ABbutton();
								sessionVars.gesture_control_menu_focus = 'NP_container';
								
								switch(checkPaneTop({ paneTarget: 'PANE_AUDIO' })) {
									case 870:
										$('#PANE_AUDIO').css('top','710px');
										break;
								}
							}
							if (currentHLID === 'footer_music') {
								moveIntoPane({ paneTarget:'PANE_AUDIO' });
							}
							break;
						case 'NP_container':
							// Volume up
							$('#VOLUME_level_UP').click();
							break;
						case 'pageContainer_MP3':
							highlight_prevRowMP3_ABbutton();
							break;
					}
				}
				break;
			case 'swipe_down': 
				$('#gestureIcon_img').attr('src','images/icon_gesture_swipe_down.png');
				if (sessionVars.gesture_control_menus_on === true) {
					switch(sessionVars.gesture_control_menu_focus) {
						case 'footer': 
							if (currentHLID === 'footer_env_driver_rocker') {
								$('#footer_env_driver_rocker_down').click();
							}
							if (currentHLID === 'footer_env_pass_rocker') {
								$('#footer_env_pass_rocker_down').click();
							}
							break;
						case 'NP_container':
							// Volume down
							$('#VOLUME_level_DOWN').click();
							break;
						case 'pageContainer_MP3':
							highlight_nextRowMP3_ABbutton();
							checkHLScrollPos({ targetScrollDiv:'cont_BrowseStreaming' });
							break;
					}
					if (currentHLID === 'tab_audio_inner') {
						moveIntoPane({ paneTarget:'pageContainer_MP3' });
					}
				}
				break;
			case 'keyTap':
				$('#gestureIcon_img').attr('src','images/icon_gesture_tap.png');
				break;
			case 'screenTap':
				$('#gestureIcon_img').attr('src','images/icon_gesture_tap.png');
				break;
			case 'fist_long':
				// general "menu" gesture
				if (sessionVars.gesture_control_menus_on === false) {
					highlightFirstABbutton();
					sessionVars.gesture_control_menus_on = true;
					sessionVars.gesture_control_menu_focus = 'footer';
				} else {
					hideActivePane();
					// if the menus are already active, close all panes, clear button highlights and focii
					clearABbuttonHightlights();
					sessionVars.gesture_control_menus_on = false;
					sessionVars.gesture_control_menu_focus = '';
					CURRENT_CLIENT_HASH = 'pageContainer_home';
				}
				break;
			case 'fist_short':
				// if in the Now Playing div, be the play/pause toggle
				if (sessionVars.gesture_control_menu_focus === 'NP_container') {
					$('#AB_pageContainer_home_MP3_PAUSE').click();
				}
				else {
					// otherwise, the general "enter" gesture
					if (sessionVars.gesture_control_menus_on === true) {
						var selectedDiv = $('.BUTTON_AB_HL').prop('id');
						//console.log(selectedDiv);
						$('#'+selectedDiv).click();
					}
				}
				break;
		}
		if($('#gestureIcon_bg').is(':animated')) {
			$('#gestureIcon_bg').stop().animate({opacity:'100'});
		}
		else {
			$('#gestureIcon_bg').show();
		}
		var gestureTimeout = setTimeout(function() {
			$('#gestureIcon_bg').fadeOut(2000);
		});
	});

	socket.on('PLAY_CURRENT', function(data) {
		//console.log(data);
		if (checkPaneTop({ paneTarget: 'PANE_AUDIO' }) > 710) {
			$('#PANE_AUDIO').css('top','710px');
		}
		
		var thisFolderArtURL = '';
		var thisFolderArtURLmods = '';
		
		if (data.status.playState === 0) {
			// If "Now playing" mini bar showing, hide the panel
			if (checkPaneTop({ paneTarget: 'PANE_AUDIO' }) === 710) {
				$('#PANE_AUDIO').css('top','870px');
				$('#NOW_PLAYING_container').css('margin-bottom','');
			}
			//$('#NOW_PLAYING_container').css('margin-bottom','0px');

			$('#NP_container .AUDIO_playlist_group').hide();
			$('#NP_container .AUDIO_OFF').show();
			//$('#NP_PLAYLIST').hide();
			delete AB_SCREEN_MATRIX.pageContainer_home[1];
			AB_SCREEN_MATRIX.pageContainer_home[1] = [ 'AB_pageContainer_home_NOAUDIO' ];
			
			$('.BUTTON_mp3_playPause_toggle').data('showing','play').find('img:first').attr('src','images/play.png');
			/*
			if (!$('.BUTTON_mp3_playPause_toggle').hasClass('buttonDisabled')) {
				$('.BUTTON_mp3_playPause_toggle').addClass('buttonDisabled');
			}
			if (!$('.BUTTON_mp3_fwd').hasClass('buttonDisabled')) {
				$('.BUTTON_mp3_fwd').addClass('buttonDisabled');
			}
			if (!$('.BUTTON_mp3_back').hasClass('buttonDisabled')) {
				$('.BUTTON_mp3_back').addClass('buttonDisabled');
			}
			*/
		} else {
			$('#NP_container .AUDIO_playlist_group').hide();
			//$('#NOW_PLAYING_container').css('margin-bottom','160px');
		
			var tempTitleBreak = data.nowplaying_title.substr(0,2);
			if (tempTitleBreak === 'FM') {
				$('#NP_container .AUDIO_playlist_radio').show();
				delete AB_SCREEN_MATRIX.pageContainer_home[1];
				AB_SCREEN_MATRIX.pageContainer_home[1] = [ 'AB_pageContainer_home_FM_PAUSE', 'AB_pageContainer_home_FM_VOLTOG' ];
			} else {
				if (MP3_ALBUM_LIST[data.nowplaying_title]) {
					thisFolderArtURL = MP3_ALBUM_LIST[data.nowplaying_title].folderArtURL;
					if (MP3_ALBUM_LIST[data.nowplaying_title].favorite === true) {
						if ($('#NP_mp3_favtarget .heartIcon').attr('src') !== 'images/heart.png') {
							$('#NP_mp3_favtarget .heartIcon').attr('src','images/heart.png'); 
						}
					} else {
						if ($('#NP_mp3_favtarget .heartIcon').attr('src') !== 'images/heart_empty.png') {
							$('#NP_mp3_favtarget .heartIcon').attr('src','images/heart_empty.png'); 
						}
					}
				} else {
					if (INET_RADIO_LIST[data.nowplaying_title]) {
						thisFolderArtURL = INET_RADIO_LIST[data.nowplaying_title].folderArtURL;
					}
				}
				$('#AUDIO_MAIN_MP3LINK').data('albumtitle',data.nowplaying_title);
				$('#NP_container .AUDIO_playlist_MP3').show();
				
				//$('#NP_PLAYLIST').show();
				
				delete AB_SCREEN_MATRIX.pageContainer_home[1];
				AB_SCREEN_MATRIX.pageContainer_home[1] = [ 'AB_pageContainer_home_MP3_TBACK', 'AB_pageContainer_home_MP3_PAUSE', 'AB_pageContainer_home_MP3_TFWD', 'AB_pageContainer_home_MP3_VOLTOG' ];
			}
			$('.CURRENTLY_PLAYING_TIME').html(moment.duration(data.currenttime, 'seconds').format("m:ss",{ trim: false }));
			$('.CURRENTLY_PLAYING_DURATION').html(moment.duration(data.currenttime-data.duration, 'seconds').format("m:ss",{ trim: false }));
			$('.CURRENTLY_PLAYING_METER_inner').css('width',((data.currenttime/data.duration)*100)+'%');
			
			if ($('#MIN_NowPlaying_URL').find('img:first').attr('src') !== thisFolderArtURL) {
				$('.folderArt').attr('src', thisFolderArtURL);
				
				if (NP_MP3_ALBUM_TITLE !== data.nowplaying_title) {
					// media change, reload the playlist
					$('#NP_PLAYLIST_CONTENTS').html(''); // clear the existing list
					NP_MP3_ALBUM_TITLE = data.nowplaying_title;
					
					if (MP3_ALBUM_LIST[NP_MP3_ALBUM_TITLE]) {
						//console.log(MP3_ALBUM_LIST[NP_MP3_ALBUM_TITLE].mp3List);
						MP3_ALBUM_LIST[NP_MP3_ALBUM_TITLE].mp3List.forEach(function(element, index, array) {
							var newPlaylistEntry = '<div id="NP_'+makeSafeForCSS(element.filename)+'"'+
								' class="row button_PLAYFILE"'+
								' data-playlink="'+element.url+'" data-albumtitle="'+NP_MP3_ALBUM_TITLE+'" data-trackname="'+element.filename+'"'+
								' style="justify-content:space-between; white-space:nowrap;">'+
									'<div class="HC">'+
									element.filename.substr(0,element.filename.length-4)+
									'</div>'+
									'<div class="playGIF">'+
										'<img src="images/audio_playing_white_v2.gif" style="height:1em;">'+
									'</div>'+
								'</div>';
							$('#NP_PLAYLIST_CONTENTS').append(newPlaylistEntry).trigger('create');
						});
						$('#NP_PLAYLIST_CONTENTS').animate({ scrollTop: 0 }, "fast");
					} // end if MP3_ALBUM_LIST[NP_MP3_ALBUM_TITLE] exists
				}
				
				if (NP_MP3_ALBUM_SUBTITLE !== data.nowplaying_subtitle) {
					// track change
					NP_MP3_ALBUM_SUBTITLE = data.nowplaying_subtitle;
					
					$('.AUDIO_title').html(data.nowplaying_title.split(' - ')[0]);
					$('.AUDIO_subtitle').html(data.nowplaying_subtitle.replace('.mp3',''));
					$('.AUDIO_albumtitle').html(data.nowplaying_title.split(' - ')[1]);
					
					$('#NP_PLAYLIST_CONTENTS .row.button_PLAYFILE .playGIF').hide();
					var playlistPlayingDiv = '#NP_'+makeSafeForCSS(data.nowplaying_subtitle);
					$(playlistPlayingDiv+' .playGIF').show();
					//console.log($(playlistPlayingDiv).html());
				}
				
				
				$('#NP_mp3_favtarget').data('thisalbum', data.nowplaying_title);
			}
			
			if (!$('#AUDIO_playlist_controls_MAIN').length) {		
				$('#AUDIO_playlist_container').parent().removeClass('just_LINK');
			}
			
			switch(data.status.playState) {
				case 1:
					// Paused, show play button
					$('.BUTTON_mp3_playPause_toggle, .BUTTON_FM_playPause_toggle').data('showing','pause').find('img:first').attr('src','images/play.png');
					if ($('.BUTTON_mp3_playPause_toggle, .BUTTON_FM_playPause_toggle').hasClass('buttonDisabled')) {
						//$('.BUTTON_mp3_playPause_toggle, .BUTTON_FM_playPause_toggle').removeClass('buttonDisabled').addClass('button');
					}
					if ($('.BUTTON_mp3_fwd').hasClass('buttonDisabled')) {
						if (tempTitleBreak !== 'FM') {
							//$('.BUTTON_mp3_fwd').removeClass('buttonDisabled');
						} else {
							if (!$('.BUTTON_mp3_fwd').hasClass('buttonDisabled')) {
								//$('.BUTTON_mp3_fwd').addClass('buttonDisabled');
							}
						}
					}
					if ($('.BUTTON_mp3_back').hasClass('buttonDisabled')) {
						if (tempTitleBreak !== 'FM') {
							$('.BUTTON_mp3_back').removeClass('buttonDisabled');
						} else {
							if (!$('.BUTTON_mp3_back').hasClass('buttonDisabled')) {
								//$('.BUTTON_mp3_back').addClass('buttonDisabled');
							}
						}
					}
					$('.CURRENTLY_PLAYING_TIME').toggleClass('blinking-time');
					
					// If "Now playing" mini bar showing, hide the panel
					//if (check_audioPane_height() === 710) {
					//	$('#PANE_AUDIO').css('top','870px');
					//}
					break;
				case 2:
					// Playing, show pause button
					$('.BUTTON_mp3_playPause_toggle, .BUTTON_FM_playPause_toggle').data('showing','play').find('img:first').attr('src','images/pause_v8.png');
					if ($('.BUTTON_mp3_playPause_toggle, .BUTTON_FM_playPause_toggle').hasClass('buttonDisabled')) {
						// $('.BUTTON_mp3_playPause_toggle, .BUTTON_FM_playPause_toggle').removeClass('buttonDisabled').addClass('button');
					}
					if ($('.BUTTON_mp3_fwd').hasClass('buttonDisabled')) {
						if (tempTitleBreak !== 'FM') {
							$('.BUTTON_mp3_fwd').removeClass('buttonDisabled');
						} else {
							if (!$('.BUTTON_mp3_fwd').hasClass('buttonDisabled')) {
								// $('.BUTTON_mp3_fwd').addClass('buttonDisabled');
							}
						}
					}
					if ($('.BUTTON_mp3_back').hasClass('buttonDisabled')) {
						if (tempTitleBreak !== 'FM') {
							$('.BUTTON_mp3_back').removeClass('buttonDisabled');
						} else {
							if (!$('.BUTTON_mp3_back').hasClass('buttonDisabled')) {
								// $('.BUTTON_mp3_back').addClass('buttonDisabled');
							}
						}
					}
					$('.CURRENTLY_PLAYING_TIME').removeClass('blinking-time');
					$('#NOW_PLAYING_container').css('margin-bottom','160px');
					break;
			} // end switch(data.playState);

		}
		
		// Toyota (Entune) VOLUME
		// $('#VOLUME_level_blackout').css('height',250-(data.status.volume*250));
		// $('#VOLUME_level_gauge_value').html(Math.round(data.status.volume*100));
		
		//$('.BUTTON_mp3_playPause_toggle').removeClass('buttonDisabled').addClass('button').children(this).attr('src','images/pause_v8.png').data('showing','pause');
		
		// Tesla VOLUME
		var realVol = data.status.volume.toFixed(2);
		if (realVol <= 0) {
			$('#vol_speaker_main').attr('src','images/speaker_off.png');
			setTimeout(function() {
				if (!$('#vol_main_off').is(':visible')) { $('#vol_main_off').show(); }
			}, 10);
		} else {
			switch(true) {
				case (realVol < 0.35):
					if ($('#vol_main_off').is(':visible')) { $('#vol_main_off').hide(); }
					$('#vol_speaker_main').attr('src','images/speaker_low.png');
					break;
				case (realVol > 0.36 && realVol < 0.65):
					if ($('#vol_main_off').is(':visible')) { $('#vol_main_off').hide(); }
					$('#vol_speaker_main').attr('src','images/speaker_mid.png');
					break;
				case (realVol > 0.66):
					if ($('#vol_main_off').is(':visible')) { $('#vol_main_off').hide(); }
					$('#vol_speaker_main').attr('src','images/speaker_high.png');
					break;
			} // end switch(data.volume)
		}
		// end Tesla VOLUME
		
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
					
				} // end switch(data.keypress)
				break; // end case 'AB_press'
		}
	});
	
	socket.on('vehicle_pos_data', function(data) {
		moveMapCenterTo(map, data.VBlat, data.VBlong*(-1));
		$('#cabCG_car_dot').css('transform','rotate('+data.VBheading+'deg)');
	});
	
	socket.emit('mp3_jukebox_enumerate',{});
}

function updateMapAspect(){}

function getMapHW(){
	//$('#MAIN_MAP_IMG').css('width','200%');
	var naturalW = document.querySelector('#NAV_MAP_IMG').naturalWidth;
	var naturalH = document.querySelector('#NAV_MAP_IMG').naturalHeight;
	
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
	$('.mapGPSunderlay').attr('src', mapImgSplit[0]+'_underlay_a.png');		
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
	$('#NAV_MAP_IMG').css('top','-'+(sessionVars['translated_CG_dot_Y'] + dotMarkerOffset_Y) + 'px').css('left','-'+(sessionVars['translated_CG_dot_X'] + dotMarkerOffset_X) + 'px');
	//$('#HOME_MAP_IMG').css('top','-'+(sessionVars['translated_CG_dot_Y'] + dotMarkerOffset_Y) + 'px').css('left','-'+(sessionVars['translated_CG_dot_X'] + dotMarkerOffset_X) + 'px');
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
	$('#mapContainerOuter_ZOOM').css('transform', 'scale('+sessionVars.local_zoom+')').css('-webkit-transform', 'scale('+sessionVars.local_zoom+')');	
}

function connect() {
	socket = io.connect(serverAddress);
	bindSocketEvents();
}


function updateTouchLocation(x, y) {
	//console.log('X: '+x+'; Y: '+y);
	socket.emit('IUI_touchinfo',{ type: 'update', coord_x: x, coord_y: y });
}

function updatePageContainerLoc(pageHashId) {
	socket.emit('IUI_info',{ type: 'update', current_page_hash: pageHashId });
}

/*
// HERE.COM mapping
function moveMapToNADS(map){
  map.setCenter({lat:41.70887, lng:-91.59895});
  console.log('moveMapToNADS called');
}

function moveMapCenterTo(map, newlat, newlng){
  map.setCenter({lat:newlat, lng:newlng});
}

function setMapZoomLvl(map) {
	map.setZoom(zoomLvl);
}

function refreshHEREmap(map) {
	map.setBaseLayer(defaultLayers.normal[HERE_BL_MAPS[sessionVars.DayNight_mode]['normal']]);
}

function enableTrafficInfo(map) {
	// Show traffic tiles
	map.setBaseLayer(defaultLayers.normal[HERE_BL_MAPS[sessionVars.DayNight_mode]['traffic']]);
	// Enable traffic incidents layer
	map.addLayer(defaultLayers.incidents);
	$('.IT_traffic_toggle').data('layertoadd','base');
}

function disableTrafficInfo(map) {
	// Show traffic tiles
	map.setBaseLayer(defaultLayers.normal[HERE_BL_MAPS[sessionVars.DayNight_mode]['normal']]);
	// Enable traffic incidents layer
	map.removeLayer(defaultLayers.incidents);
	$('.IT_traffic_toggle').data('layertoadd','traffic');
}

//Step 1: initialize communication with the platform
var platform = new H.service.Platform({
	app_id: 'avqvbRnoHQ7lav42Ezr', // should end in  "Ezrr"
	app_code: 'zPtY0OUAfUGBwkvLTzosqQ',
	useCIT: true,
	useHTTPS: true
});
var defaultLayers = platform.createDefaultLayers();

//Step 2: initialize a map  - not specificing a location will give a whole world view.
var mapLat = 41.70887;
var mapLng = -91.59895;
var zoomLvl = 16;
var mapContainer = document.getElementById('mapContainerOuter');
map = new H.Map(mapContainer, 
	defaultLayers.normal[HERE_BL_MAPS[sessionVars.DayNight_mode]['normal']],{
	  center: {lat:mapLat, lng:mapLng},
	  zoom: zoomLvl
	});
//  defaultLayers.normal.map);

//Step 3: make the map interactive
// MapEvents enables the event system
// Behavior implements default interactions for pan/zoom (also on mobile touch environments)
//var behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));

// Create the default UI components
var ui = H.ui.UI.createDefault(map, defaultLayers);
ui.removeControl('mapsettings');
ui.removeControl('zoom');


function updateHEREmap(map) {
	map = new H.Map(mapContainer,
	  defaultLayers.normal[HERE_BL_MAPS[sessionVars.DayNight_mode]['normal']],{
	  center: {lat:mapLat, lng:mapLng},
	  zoom: zoomLvl
	});
	console.log('=== HERE UPDATE ===');
}
*/

function preventBrowserContextClicks() {
	window.oncontextmenu = function(event) {
		event.preventDefault();
		event.stopPropagation();
		return false;
	};
}

$(function() { 
	readURLvars();
	
	$('#panelContainer_CONTROLS').popup();
	
	$(window).on("hashchange", function() {
		checkCurrentPageHash();
  	});
	
	// TOUCH TRACKING
	document.addEventListener("touchstart", function(e) {
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
	
	//preventBrowserContextClicks();
	
	bindDOMEvents();
	$('#MM_day').html();
	
	$('#NP_container .AUDIO_playlist_group').hide();
	
	// Now use the map as required...
	//moveMapToNADS(map);
		
	/*
	setInterval(function() {
		mapLat = mapLat+0.00001;
		mapLng = mapLng+0.00001;
		moveMapCenterTo(map, mapLat, mapLng);
	}, 100);
	
		
	var positiveYaw = 0;
	setInterval(function() {
		positiveYaw += 0.1;
		$('#mapContainerInner').css('-webkit-transform','rotate(-'+positiveYaw+'deg)').css('transform','rotate(-'+positiveYaw+'deg)');
	}, 100);
	*/
	
	$.getScript('scripts/dtmf_tones.js', function() {
	});
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