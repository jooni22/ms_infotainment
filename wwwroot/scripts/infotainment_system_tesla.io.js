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

var CLIENT_CARD_MAXIMIZED;
var CLIENT_CARD_STACK = {
	0	:	{},
	1	:	{}
}

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
	'local_zoom'				: 1,
	'DayNight_mode'				: 'day',
	'MAPS_traffic_on'			: 'false'
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
	
	$(document.body).on('mouseup', '#footer_controls_label', function() {
		$('#panelContainer_CONTROLS').popup('open');
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
		var new_ALBUM_COVER_content = '<img src="'+MP3_ALBUM_LIST[thisAlbumTitle].folderArtURL+'" style="width:288px;">'+
			'<div style="margin-top:8px;">'+
				'<div>'+artistAlbum[1]+'</div>'+
				'<div><span style="opacity:0.5;">'+artistAlbum[0]+'</span></div>'+
			'</div>';
		$('#menu_ALBUM_COVER_cont').html(new_ALBUM_COVER_content);
		
		$('#browseMedia_menu div.lowerLvl').hide();
		$('#menu_ALBUM').show();
	}); 
	
	$(document.body).on('click', '.button_PLAYFILE', function() {
		//$(this).addClass('buttonDOWN');
		var playfileTimeout = setTimeout(function() {
			//$('.tesla_list_row').removeClass('buttonDOWN');
		}, 100);
		//alert(playlink);
	});
	
	$(document.body).on('mouseup', '.button_PLAYFILE', function() {
		var playlink = $(this).data('playlink');
		var thisAlbumTitle = $(this).data('albumtitle');
		var thisTrackName = $(this).data('trackname');
		socket.emit('IUI_command',{ type: 'playMP3', 'playlink':playlink, albumtitle: thisAlbumTitle, trackname: thisTrackName });
	});
	
	$(document.body).on('mouseup', '.button_PLAY_STREAM', function() {
		var playlink = $(this).data('playlink');
		var thisAlbumTitle = $(this).data('albumtitle');
		var thisTrackName = $(this).data('trackname');
		socket.emit('IUI_command',{ type: 'playStream', 'playlink':playlink, albumtitle: thisAlbumTitle, trackname: thisTrackName });
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
	
	/*
	$(document.body).on('click', '.IT_zoom', function() {
		var thisDirection = $(this).data('io');
		switch(thisDirection) {
			case 'in':
				zoomLvl = zoomLvl + 1;
				setMapZoomLvl(map);
				break;
			case 'out':
				zoomLvl = zoomLvl - 1;
				setMapZoomLvl(map);
				break;
		}
	});
	*/
	
	/*
	$(document.body).on('click', '.IT_traffic_toggle', function() {
		var showLayer = $(this).data('layertoadd');
		switch(showLayer) {
			case 'traffic':
				enableTrafficInfo(map);
				break;
			case 'base':
				disableTrafficInfo(map);
				break;
		}
	});
	*/
	
	$(document.body).on('click', '#NP_pulltab', function() {
		if ($(this).data('npopen') === 'no') {
			// NOW PLAYING is currently minimized
			$('#NP_PLAYLIST_CONTROLS').removeClass('np_playcontrols_bigwidth').addClass('np_playcontrols_smallwidth');
			$('#NP_FAVRECENT').show();
			$(this).data('npopen','yes');
			$('#NOW_PLAYING_container').animate({height:655}, {duration:320, easing:'swing'});	
		} else {
			// NOW PLAYING is "full" height
			$('#NP_PLAYLIST_CONTROLS').removeClass('np_playcontrols_smallwidth').addClass('np_playcontrols_bigwidth');
			$('#NP_FAVRECENT').hide();
			$(this).data('npopen','no');
			$('#NOW_PLAYING_container').animate({height:90}, {duration:320, easing:'swing'});	
		}
		$(this).toggleClass('dayBG');
		//$('#NP_container div div img.heartIcon').toggle();
		$('.AUDIO_albumtitle_fav').toggle();
		$('.vertPaddingOpt').toggleClass('np_opt_vertpad');
		$('.vertPaddingOpt_last').toggleClass('np_opt_vertpad_top_big');
		$('.AUDIO_title').toggleClass('smallText');
		$('.AUDIO_albumtitle').toggleClass('smallText');
		$('.CURRENTLY_PLAYING_TIME').toggle();
		$('.CURRENTLY_PLAYING_DURATION').toggle();
		$('#NP_ALBUMART').toggleClass('np_largealbumpic');
	});
	
	// DAY / NIGHT ILLUMINATION
	$(document.body).on('click', '#footer_seatwarmer_driver', function() {
		switch(sessionVars.DayNight_mode) {
			case 'day':
				sessionVars.DayNight_mode = 'night';
				break;
			case 'night':
				sessionVars.DayNight_mode = 'day';
				break;
		}
		// refreshHEREmap(map);
		$('.DARK_TOG').toggleClass('dark');
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
		$('.sub_container_tab').removeClass('tab_selected');
		$('.container_media').hide();
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
	
	$(document.body).on('click', '.button_GROW', function() {
		var thisSource = $(this).parent().parent().parent().attr('id'); // section container ID
		
		var thisSourceProto = $(this).data('sourceproto');
		var sourceHTML = $('#'+thisSource).html();
		//alert(thisSourceProto);
		
		$('#'+thisSource).html('');
		$('#SUB_CONTAINER_FULL').append(sourceHTML);
		
		switch(thisSourceProto) {
			case 'PROTO_NAV':
				$('#PROTO_NAV_MAPCONT').removeClass('halfheight').addClass('fullheight');
				$('#mapContainerOuter').css('height','1554px');
				$('#mapContainerInner').css('top','777px');
				$('#cabCG_car_dot_outer').css('top','727px');
				
				break;
			case 'PROTO_MEDIA':
				$('#cont_BrowseStreaming').css('height','1300px');
				break;
		}
		
		/*
		// HERE mapping
		updateHEREmap(map);
		setTimeout(function() {
			refreshHEREmap(map);
		}, 150);
		*/
		
		$('#'+thisSourceProto).removeClass('halfheight').addClass('fullheight');
		$('#'+thisSourceProto+' .sub_container_front').removeClass('halfheight').addClass('fullheight');
		
		// hide swap button
		$('#'+thisSourceProto+' .sub_container_front .button_SWAP').hide();
		// change grow button to shrink
		$('#'+thisSourceProto+' .sub_container_front .button_GROW').removeClass('button_GROW').addClass('button_SHRINK').data('targetdiv',thisSource);

		$('#SUB_CONTAINER_TOP').hide();
		$('#SUB_CONTAINER_BOTTOM').hide();
		$('#SUB_CONTAINER_FULL').show();	
	});
	
	$(document.body).on('click', '.button_SHRINK', function() {
		var thisTarget = $(this).data('targetdiv');
		var thisSourceProto = $(this).data('sourceproto');
		var sourceHTML = $('#SUB_CONTAINER_FULL').html();
		
		$('#SUB_CONTAINER_FULL').html('');
		$('#'+thisTarget).append(sourceHTML);
		
		switch(thisSourceProto) {
			case 'PROTO_NAV':
				$('#PROTO_NAV_MAPCONT').removeClass('fullheight').addClass('halfheight');
				$('#mapContainerOuter').css('height','770px');
				$('#mapContainerInner').css('top','385px');
				$('#cabCG_car_dot_outer').css('top','335px');
				/*
				updateHEREmap(map);
				setTimeout(function() {
					refreshHEREmap(map);
				}, 150);
				*/
				break;
			case 'PROTO_MEDIA':
				$('#cont_BrowseStreaming').css('height','530px');
				break;
		}
		
		$('#'+thisSourceProto).removeClass('fullheight').addClass('halfheight');
		$('#'+thisSourceProto+' .sub_container_front').removeClass('fullheight').addClass('halfheight');
		
		// hide swap button
		$('#'+thisSourceProto+' .sub_container_front .button_SWAP').show();
		// change grow button to shrink
		$('#'+thisSourceProto+' .sub_container_front .button_SHRINK').removeClass('button_SHRINK').addClass('button_GROW').data('sourcediv',thisTarget);
		
		$('#SUB_CONTAINER_TOP').show();
		$('#SUB_CONTAINER_BOTTOM').show();
		$('#SUB_CONTAINER_FULL').hide();
	});
	
	$(document.body).on('click', '.button_SWAP', function() {
		var sourceHTML_TOP = $('#SUB_CONTAINER_TOP').html();
		var sourceHTML_BOTTOM = $('#SUB_CONTAINER_BOTTOM').html();
		
		$('#SUB_CONTAINER_TOP').html('');
		$('#SUB_CONTAINER_BOTTOM').html('');
		
		setTimeout(function() {
			$('#SUB_CONTAINER_TOP').append(sourceHTML_BOTTOM);
			$('#SUB_CONTAINER_BOTTOM').append(sourceHTML_TOP);
			// refreshHEREmap(map);
		}, 150);
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
		$('.FAVORITES_container').html('');
		var MP3_LIST_COVER_HTML = '';
		var row = 1;
		var thisAlbumNum = 1;
		$.each(data, function(index, value) {
			var splitAlbum = index.split(' - ');
			var thisAlbumFirstTrack = MP3_ALBUM_LIST[index].mp3List[0];
			var thisIsFav = value.favorite;
			var thisDiv =
				'<div class="media_container button_PLAYFILE" data-playlink="'+thisAlbumFirstTrack.url+'" data-albumtitle="'+index+'" data-trackname="'+thisAlbumFirstTrack.filename+'">'+
					'<img class="media_album_cover" src="'+value.folderArtURL+'">'+
					'<div style="width:160px; text-overflow:ellipsis; overflow:hidden;">'+splitAlbum[1]+'</div>'+
				'</div>';
			$('#MP3_album_list_container').append(thisDiv).trigger('create');
			if(thisIsFav) {
				$('.FAVORITES_container').append(thisDiv).trigger('create');
			}
			thisAlbumNum++;
		});
		// end each(data...
	});

	socket.on('PLAY_CURRENT', function(data) {
		//console.log(data);
		var thisFolderArtURL = '';
		var thisFolderArtURLmods = '';
		
		if (data.status.playState === 0) {
			$('#NP_container .AUDIO_playlist_group').hide();
			$('#NP_container .AUDIO_OFF').show();
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
			$('#NP_container .AUDIO_playlist_group').hide();
		
			var tempTitleBreak = data.nowplaying_title.substr(0,2);
			if (tempTitleBreak === 'FM') {
				$('#NP_container .AUDIO_playlist_radio').show();
				delete AB_SCREEN_MATRIX.pageContainer_home[1];
				AB_SCREEN_MATRIX.pageContainer_home[1] = [ 'AB_pageContainer_home_FM_PAUSE', 'AB_pageContainer_home_FM_VOLTOG' ];
			} else {
				if (MP3_ALBUM_LIST[data.nowplaying_title]) {
					thisFolderArtURL = MP3_ALBUM_LIST[data.nowplaying_title].folderArtURL;
				} else {
					if (INET_RADIO_LIST[data.nowplaying_title]) {
						thisFolderArtURL = INET_RADIO_LIST[data.nowplaying_title].folderArtURL;
					}
				}
				$('#AUDIO_MAIN_MP3LINK').data('albumtitle',data.nowplaying_title);
				$('#NP_container .AUDIO_playlist_MP3').show();
				
				if (MP3_ALBUM_LIST[data.nowplaying_title].favorite === true) {
					if ($('#NP_mp3_favtarget .heartIcon').attr('src') !== 'images/heart.png') {
						$('#NP_mp3_favtarget .heartIcon').attr('src','images/heart.png'); 
					}
				} else {
					if ($('#NP_mp3_favtarget .heartIcon').attr('src') !== 'images/heart_empty.png') {
						$('#NP_mp3_favtarget .heartIcon').attr('src','images/heart_empty.png'); 
					}
				}

				delete AB_SCREEN_MATRIX.pageContainer_home[1];
				AB_SCREEN_MATRIX.pageContainer_home[1] = [ 'AB_pageContainer_home_MP3_TBACK', 'AB_pageContainer_home_MP3_PAUSE', 'AB_pageContainer_home_MP3_TFWD', 'AB_pageContainer_home_MP3_VOLTOG' ];
			}
			$('.CURRENTLY_PLAYING_TIME').html(moment.duration(data.currenttime, 'seconds').format("m:ss",{ trim: false }));
			$('.CURRENTLY_PLAYING_DURATION').html(moment.duration(data.currenttime-data.duration, 'seconds').format("m:ss",{ trim: false }));
			$('.CURRENTLY_PLAYING_METER_inner').css('width',((data.currenttime/data.duration)*100)+'%');
			
			if ($('#MIN_NowPlaying_URL').find('img:first').attr('src') !== thisFolderArtURL) {
				$('.folderArt').attr('src', thisFolderArtURL);
				$('.AUDIO_title').html(data.nowplaying_title.split(' - ')[0]);
				$('.AUDIO_subtitle').html(data.nowplaying_subtitle.replace('.mp3',''));
				$('.AUDIO_albumtitle').html(data.nowplaying_title.split(' - ')[1]);
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
	/*
	$('#panelContainer_VOLUME').popup();
	$('#panelContainer_VOLUME').on('popupafteropen',function() {
		VOL_POPUP_SHOWING = true;
	}).on('popupafterclose', function() {
		socket.emit('IUI_command',{ type: 'audio_volume_modal', command: 'close' });
		VOL_POPUP_SHOWING = false;	
	});
	*/
	
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
	
	preventBrowserContextClicks();
	
	bindDOMEvents();
	$('#MM_day').html();
	
	// Now use the map as required...
	//moveMapToNADS(map);
		
	/*
	setInterval(function() {
		mapLat = mapLat+0.00001;
		mapLng = mapLng+0.00001;
		moveMapCenterTo(map, mapLat, mapLng);
	}, 100);
	*/
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