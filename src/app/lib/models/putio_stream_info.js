(function (App) {
	'use strict';

	var PutioStreamInfo = Backbone.Model.extend({
		initialize: function () {
			this.set('buffer_percent', null);
		},

		updateStats: function () {
			var active = function (wire) {
				return !wire.peerChoking;
			};

			var BUFFERING_SIZE = 10 * 1024 * 1024;
			var converted_speed = 0;
			var converted_downloaded = 0;
			var buffer_percent = 0;
			var engine = this.get('engine');

			//win.info('Engine: ' + JSON.stringify(engine));

			var upload_speed = engine.uploadSpeed; // upload speed
			var final_upload_speed = '0 B/s';
			if (!isNaN(upload_speed) && upload_speed !== 0) {
				converted_speed = Math.floor(Math.log(upload_speed) / Math.log(1024));
				final_upload_speed = (upload_speed / Math.pow(1024, converted_speed)).toFixed(2) + ' ' + ['B', 'KB', 'MB', 'GB', 'TB'][converted_speed] + '/s';
			}

			var download_speed = engine.downloadSpeed; // download speed
			var final_download_speed = '0 B/s';
			if (!isNaN(download_speed) && download_speed !== 0) {
				converted_speed = Math.floor(Math.log(download_speed) / Math.log(1024));
				final_download_speed = (download_speed / Math.pow(1024, converted_speed)).toFixed(2) + ' ' + ['B', 'KB', 'MB', 'GB', 'TB'][converted_speed] + '/s';
			}

			var downloaded = engine.downloaded || 0; // downloaded
			var final_downloaded = '0 B';
			if (downloaded !== 0) {
				converted_downloaded = Math.floor(Math.log(downloaded) / Math.log(1024));
				final_downloaded = (downloaded / Math.pow(1024, converted_downloaded)).toFixed(2) + ' ' + ['B', 'KB', 'MB', 'GB', 'TB'][converted_downloaded];
			}

			var final_downloaded_percent = 100 / engine.size * downloaded;

			if (final_downloaded_percent >= 100) {
				final_downloaded_percent = 100;
			}

			var downloadTimeLeft = Math.round((engine.size - downloaded) / download_speed); // time to wait before download complete
			if (isNaN(downloadTimeLeft) || downloadTimeLeft < 0) {
				downloadTimeLeft = 0;
			}

			this.set('downloaded', downloaded);
			this.set('active_peers', engine.peers_sending_to_us);
			this.set('total_peers', engine.peers_connected);
			this.set('quality', engine.quality);
			this.set('uploadSpeed', final_upload_speed); // variable for Upload Speed
			this.set('downloadSpeed', final_download_speed); // variable for Download Speed
			this.set('downloadedFormatted', final_downloaded); // variable for Downloaded
			this.set('downloadedPercent', final_downloaded_percent); // variable for Downloaded percentage
			this.set('time_left', downloadTimeLeft); // variable for time left before 100% downloaded
			this.set('buffer_percent', engine.percent_done);
		}
	});

	App.Model.PutioStreamInfo = PutioStreamInfo;
})(window.App);
