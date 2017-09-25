var CONTROL_SERVER_URL = 'http://localhost:7470';
	
function twoDigits(d) {
	if(0 <= d && d < 10) return "0" + d.toString();
	if(-10 < d && d < 0) return "-0" + (-1*d).toString();
	return d.toString();
}

Date.prototype.toOSDformat = function() {
	return twoDigits(1 + this.getMonth()) + "/" + twoDigits(this.getDate()) + "/" + this.getFullYear() + "&nbsp;&nbsp;" + this.toLocaleTimeString();
};

var min_w = 300; // minimum video width allowed
var vid_w_orig;  // original video dimensions
var vid_h_orig;

var socket = null,
	clientId = null,
	nickname = null,
	serverAddress = CONTROL_SERVER_URL; 

function bindDOMEvents() {
	$('#button_launchChromeWindows').on('click', function() {
		socket.emit('control_request_nmc', { type: 'launch' });
	});
	
	$('#button_closeChromeWindows').on('click', function() {
		socket.emit('control_request_nmc', { type: 'close' });
	});
	
	$('#button_video_play').on('click', function() {
		socket.emit('control_request_nmc', { type: 'play' });
	});
	
	$('#button_video_pause').on('click', function() {
		socket.emit('control_request_nmc', { type: 'pause' });
	});
	
	$('#button_video_rewind').on('click', function() {
		socket.emit('control_request_nmc', { type: 'rewind' });
	});
	
	$('#button_NMC_debug_hide').on('click', function() {
		socket.emit('control_request_nmc', { type: 'hide_debug' });
	});
	
	$('#button_NMC_debug_show').on('click', function() {
		socket.emit('control_request_nmc', { type: 'show_debug' });
	});
	
	$('#vidGroup').on('change', function() {
		var selectedGroup = $(this).val();
		socket.emit('control_request_nmc', { type: 'load', vidgroup: selectedGroup });
	});
	
	connect();
}
	
function bindSocketEvents(){
	socket.on('connect', function(){
		socket.emit('node_announce', { client:'Control Panel', type: "controlpanel" });
	});
	
	socket.on('connect_error', function(){
		$('#debug').html('Connection issues');
	});
	
	socket.on('disconnect', function(){
		$('#debug').html('Disconnected from host');
	});
	
	socket.on('ready', function(data){
		$('#debug').html('Connected');
		//alert('ready');
	});
}

function connect(){
	socket = io.connect(serverAddress);
	bindSocketEvents();
}


$(function() { 
    vid_w_orig = parseInt(jQuery('video').attr('width'));
    vid_h_orig = parseInt(jQuery('video').attr('height'));
    $('#debug').append("<p>DOM loaded</p>");
    
    $(window).resize(function () { resizeToCover(); });
    $(window).trigger('resize');
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