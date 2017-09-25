var CONTROL_SERVER_URL = 'http://90.0.0.30:80';
var CLIENT_URL_VARS;

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
			//connect();
		} else {
			//connect();
		}
	} else {
		//connect();
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

function arrayObjectIndexOf(myArray, searchTerm, property) {
    for(var i = 0, len = myArray.length; i < len; i++) {
        if (myArray[i][property] === searchTerm) return i;
    }
    return -1;
}

function bindDOMEvents() {
	// Swipes for alerts/control panel
	$( document ).on( "swiperight swipeleft", "#MFD_TOUCH_COVER", function( e ) {
		if ( $.mobile.activePage.jqmData( "panel" ) !== "open" ) {
			/*
			if ( e.type === "swiperight" ) {
				if (ACTIVEPAGE === 1) {
					$( "#mscMainPanel" ).panel( "open" );
				}
				else {
					var newPageNum = ACTIVEPAGE-1;
					changeToPage(newPageNum);
				}
			}
			*/
			if ( e.type === "swipeleft" ) {
				$( "#MFD_CONTROL_PANEL" ).panel( "open" );
				/*
				if (ACTIVEPAGE < 2) {
					var newPageNum = ACTIVEPAGE+1;
					changeToPage(newPageNum);
				}
				*/
			}
		}
	});
	
	$(document.body).on('click', '.MFD_load_page', function() {
		var targetURL = $(this).data('targeturl');
		alert(targetURL);
		$('#MFD_pageContainer_home').empty().pagecontainer( "load", 'http://'+targetURL, { type:"get", reload:true, showLoadingMsg:true, role:"page" } );
	});
}


function bindSocketEvents(){}

function connect(){
	socket = io.connect(serverAddress);
	bindSocketEvents();
}


$(function() { 
	$(window).resize(function () { resizeToCover(); });
    $(window).trigger('resize');
	readURLvars();
	
	$('#MFD_pageContainer_home').pagecontainer();
	$('#MFD_CONTROL_PANEL').panel();
	$('#MFD_CONTROL_PANEL ul').listview();
	
	bindDOMEvents();
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
