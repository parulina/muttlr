// ==UserScript==
// @name           Muttlr
// @description    a tumblr suite that improves the site
//
// @include        https://www.tumblr.com/dashboard*
// @include        https://tumblr.com/dashboard*
// @include        https://www.tumblr.com/tumblelog/*
// @include        https://tumblr.com/tumblelog/*
// @include        https://tumblr.com/likes
// @exclude        https://www.tumblr.com/drafts
// @exclude        https://www.tumblr.com/messages
// @exclude        https://www.tumblr.com/queue
// @exclude        https://tumblr.com/drafts
// @exclude        https://tumblr.com/messages
// @exclude        https://tumblr.com/queue
// @exclude        https://www.tumblr.com/tumblelog/*/drafts
// @exclude        https://www.tumblr.com/tumblelog/*/messages
// @exclude        https://www.tumblr.com/tumblelog/*/queue
// @exclude        https://tumblr.com/tumblelog/*/drafts
// @exclude        https://tumblr.com/tumblelog/*/messages
// @exclude        https://tumblr.com/tumblelog/*/queue
//
// @namespace      http://sqnya.se
// @version        0.1
// @date           2015-12-01
// @creator        parulina
// ==/UserScript==


// http://stackoverflow.com/a/23259289
var timeSince = function(date) {
	if (typeof date !== 'object') {
		date = new Date(date);
	}

	var seconds = Math.floor((new Date() - date) / 1000);
	var intervalType;

	var interval = Math.floor(seconds / 31536000);
	if (interval >= 1) {
		intervalType = 'year';
	} else {
		interval = Math.floor(seconds / 2592000);
		if (interval >= 1) {
			intervalType = 'month';
		} else {
			interval = Math.floor(seconds / 86400);
			if (interval >= 1) {
				intervalType = 'day';
			} else {
				interval = Math.floor(seconds / 3600);
				if (interval >= 1) {
					intervalType = "hour";
				} else {
					interval = Math.floor(seconds / 60);
					if (interval >= 1) {
						intervalType = "minute";
					} else {
						interval = seconds;
						intervalType = "second";
					}
				}
			}
		}
	}

	if (interval > 1 || interval === 0) {
		intervalType += 's';
	}

	return interval + ' ' + intervalType;
};


var Muttlr = new function(){
	var pthis = this;
	this.key = "fuiKNFp9vQFvjLNvx4sUwti4Yb5yGutBN4Xh10LXZhhRKjWlV4";
	this.getPostInfo = function(post, callback){
		if(!post) return null;

		var id = post.getAttribute("data-post-id"),
		blog = post.getAttribute("data-tumblelog-name");

		var blogurl = blog + ".tumblr.com";
		var url = "https://api.tumblr.com/v2/blog/" + blogurl + "/posts?callback=?&api_key=" + pthis.key + "&id=" + id;
		jQuery.getJSON(url, function(e){
			if(e.meta.status == 200) callback(e.response);
		});
	}
	this.setTimestampStorage = function(id, ts){
		var saved_timestamps = {};
		if(localStorage.post_timestamps) {
			saved_timestamps = JSON.parse(localStorage.post_timestamps);
		}
		saved_timestamps[id] = ts;

		var keys = Object.keys(saved_timestamps).sort(),
		limit = 50;
		if(keys.length > limit){
			for(var i = 0; i < (keys.length - limit); i++){
				delete saved_timestamps[keys[0]];
				delete keys[0];
			}
		}
		localStorage.post_timestamps = JSON.stringify(saved_timestamps);
	}
	this.addPostDateHeader = function(post, date){
		if(jQuery(post).hasClass("timestamped")) return;

		var timestr = new Date(date).toISOString().replace("T", " ").replace(/\..*/, "");
		timestr += " -- " + timeSince(date) + " ago";

		var d = jQuery("<div>", {text: timestr, style: "padding:0 20px; font-size:12px;"});
		d.insertBefore(jQuery(post).find(".post_header"));
		jQuery(post).addClass("timestamped");
	}
	this.updatePosts = function(){
		var saved_timestamps = {};
		if(localStorage.post_timestamps) {
			saved_timestamps = JSON.parse(localStorage.post_timestamps);
		}

		jQuery("#posts .post_full:not(.new_post):not(.timestamped)").each(function(k, post){
			var id = post.getAttribute("data-post-id");
			var date = saved_timestamps[id];
			if(!date){
				pthis.getPostInfo(post, function(e){
					if(e.total_posts == 1){
						var p = e.posts[0];
						pthis.setTimestampStorage(p.id, p.timestamp * 1000);
						pthis.addPostDateHeader(post, p.timestamp * 1000);
					}
				});
			}
			if(date) {
				pthis.addPostDateHeader(post, date);
			}
		});
	};
};
window.addEventListener("load", function(){
	Muttlr.updatePosts();
});
jQuery("#posts").on("mouseenter", function(){
	Muttlr.updatePosts();
});
