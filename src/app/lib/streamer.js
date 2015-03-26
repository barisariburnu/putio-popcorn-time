(function (App) {
	'use strict';

	var STREAM_PORT = 21584; // 'PT'!
	var BUFFERING_SIZE = 10 * 1024 * 1024;

	var readTorrent = require('read-torrent');
	var peerflix = require('peerflix');
	var mime = require('mime');
	var path = require('path');
	var crypto = require('crypto');

	var engine = null;
	var preload_engine = null;
	var statsUpdater = null;
	var active = function (wire) {
		return !wire.peerChoking;
	};
	var subtitles = null;
	var hasSubtitles = false;
	var downloadedSubtitles = false;
	var subtitleDownloading = false;

	var putio = (function (App) {
	    'use strict';

	    // Must be installed
	    var fe = require('fs-extra');
	    var fs = require('fs');
	    // Keep to 'Current Stream Transfer ID' in putio
	    var transfer_id = null;
	    // Keep to 'Current Stream File ID' in putio
	    var currentFolderID = null;
	    var isCancelStream = false;

    	/* 
		Parameters
			- parent_id: ID of the folder you’d like to list. This defaults to the root directory (which has ID number 0)
		*/
		function list(parameters, callback){
			request(App.settings['putioAPI'] + 'files/list', {
		        method:'GET',
		        json: true,
		        qs: {
		            oauth_token: App.settings['accessToken'],
		            parent_id: parameters.parent_id ? parameters.parent_id : 0
		        }
		    }, function(err, res, body){
		        if(err){ return callback(err); }

		        callback(null, body.files);
		    });
		}

		/*
		Parameters
			- query: The keyword to search
			- page:	Optional. Defaults to 1. If -1 given, returns all results at a time
		*/
		function search(parameters, callback){
			request(App.settings['putioAPI'] + 'files/search/' + parameters.query + '/page/' + (parameters.page ? parameters.page : '1'), {
		        method:'GET',
		        json: true,
		        qs: {
		            oauth_token: App.settings['accessToken']
		        }
		    }, function(err, res, body){
		        if(err){ return callback(err); }

		        callback(null, body.files);
		    });
		}

		/*
		Parameters
			- name:	Name of the new folder
			- parent_id: Location of the new folder
		*/
		function createFolder(parameters, callback){
			request(App.settings['putioAPI'] + 'files/create-folder', {
		    		method:'POST',
		    		json: true,
		    		qs: {
		    			oauth_token: App.settings['accessToken']
		    		},
		    		formData: {
						"name": parameters.name,
						"parent_id": parameters.parent_id ? parameters.parent_id : 0
		    		}
		   	}, function(err, res, body){
		    		if(err){ return callback(err); }
		    		win.info('file: ' + body.file + ' streamToken: ' + App.settings['streamToken']);
		    		callback(null, body.file);
		   		});
		}

		/*
		Parameters
			- file_ids:	File ids separated by commas. Ex: 1,2,3,4
		*/
		function deleteFile(parameters, callback){
			request(App.settings['putioAPI'] + 'files/delete', {
		    		method:'POST',
		    		json: true,
		    		qs: {
		    			oauth_token: App.settings['accessToken']
		    		},
		    		formData: {
						"file_ids": parameters.file_ids
		    		}
		   	}, function(err, res, body){
		    		if(err){ return callback(err); }

		    		callback(null, body);
		   		});
		}

		/*
		Parameters
			- url:	Magnet url.
			- parent_id: Location of the uploaded file. This defaults to 0 (which means root)
		*/
		function uploadFromURL(parameters, callback){
			request(App.settings['putioAPI'] + 'transfers/add-multi', {
		    		method:'POST',
		    		json: true,
		    		qs: {
		    			oauth_token: App.settings['accessToken']
		    		},
		    		formData: {
		    			urls: JSON.stringify([{
		    				"url": parameters.url,
		    				"email_when_complete": false,
		    				"extract": true,
		    				"save_parent_id": parameters.parent_id ? parameters.parent_id : 0
		    			}])
		    		}
		   	}, function(err, res, body){
		    		if(err || body.errors[0]){ return win.info(JSON.stringify(body)); }

		    		win.info('uploadFromURL: ' + body.transfers[0].transfer.id);

		    		callback(null, body.transfers[0].transfer);
		   		});
		}

		/* 
		Parameters
			- id: Transfer id
		*/
		function getTransfer(parameters, callback){
			request(App.settings['putioAPI'] + 'transfers/' + parameters.id, {
		        method:'GET',
		        json: true,
		        qs: {
		            oauth_token: App.settings['accessToken']
		        }
		    }, function(err, res, body){
		        if(err){ return callback(err); }

		        callback(null, body.transfer);
		    });
		}

		/*
		Cancel Transfer (POST)
			- Deletes the given transfers
		Parameters
			- transfer_ids: Transfer ids separated by commas. Ex: 1,2,3,4
		*/
		function cancelTransfer(parameters, callback){
			request(App.settings['putioAPI'] + 'transfers/cancel', {
		    		method:'POST',
		    		json: true,
		    		qs: {
		    			oauth_token: App.settings['accessToken']
		    		},
		    		formData: {
		    			"transfer_ids": parameters.transfer_ids
		    		}
		   	}, function(err, res, body){
		    		if(err){ return callback(err); }

		    		callback(null, body);
		   		});
		}

		/* 
		List Transfer (GET)
			- Lists active transfers. If transfer is completed, it is removed from the list
		*/
		function listTransfer(parameters, callback){
			request(App.settings['putioAPI'] + 'transfers/list', {
		        method:'GET',
		        json: true,
		        qs: {
		            oauth_token: App.settings['accessToken']
		        }
		    }, function(err, res, body){
		        if(err){ return callback(err); }

		        callback(null, body.transfers);
		    });
		}

		function cancelStream(){

			if (!transfer_id) { return; }

			if (!currentFolderID) {
				cancelTransfer({transfer_ids: transfer_id}, function(err, body){
					if (err) { return win.error('Cancel Stream Error: ' + err); }

					isCancelStream = true;
				});
			}
			else{
				deleteFile({file_ids: currentFolderID},function(err, body){
					if (err) { return win.error('Delete Stream File Error: ' + err); }

					isCancelStream = true;
				});
			}
		}

		function checkTransfer(streamInfo, torrent, stateModel, callback){
			// If Stream stopped, when not check transfer
			if (isCancelStream) { return; }

			stateModel.set('streamInfo', streamInfo);
			stateModel.set('state', 'downloading');

			getTransfer({id: transfer_id}, function(err, body){
				// win.info('Transfer ID: ' + body.id);
    			// win.info('File ID:' + body.file_id);
    			// win.info('up_speed:' + body.up_speed);
    			// win.info('down_speed:' + body.down_speed);
    			win.info('percent_done:' + body.percent_done);
    			// win.info('estimated_time:' + body.estimated_time?body.estimated_time:0);
    			// win.info('peers_connected:' + body.peers_connected);

    			var engine = streamInfo.get('engine');
    			engine.uploadSpeed = body.up_speed;
    			engine.downloadSpeed = body.down_speed;
    			engine.downloaded = body.downloaded;
    			engine.downloadTimeLeft = body.estimated_time?body.estimated_time:0;
    			engine.size = body.size;
    			engine.percent_done = body.percent_done;
    			engine.peers_sending_to_us = body.peers_sending_to_us;
    			engine.peers_connected = body.peers_connected;
    			streamInfo.set('engine', engine);

    			// Fix for loading modal
    			streamInfo.set('quality', torrent.quality);
				streamInfo.updateStats();
				streamInfo.set('torrent', torrent);
				streamInfo.set('title', torrent.title);
				streamInfo.set('player', torrent.device);

    			if (body.file_id) {
    				cancelTransfer({transfer_ids: transfer_id}, function(err, body){
						if (err) { win.error('Cancel Stream Error: ' + err); }
					});

    				list({parent_id: body.file_id}, function(err, files){
    					if (err) { return win.error(err); };

    					currentFolderID = body.file_id;

    					// Shows
    					if (!files) {
    						return callback(null, body.file_id);
    					}

    					// Movies
    					for (var i = 0; i < files.length; i++) {
    						if (files[i].content_type == 'video/mp4' || 
    							files[i].content_type == 'video/x-matroska') {
    							win.info('Content Type: ' +  files[i].content_type);
    							return callback(null, files[i].id);
    						}
    					}
    				});
    			}
    			else{
        			setTimeout(function(){
		       			checkTransfer(streamInfo, torrent, stateModel, callback);
		       		}, 1000);
        		}
       		});
       	}


		/* 
		Parameters
			- next: callback. Shows/Movies ID in Putio
		*/
		function folderConfig(next){

			if (App.settings['rootFolder']) { return next(null, App.settings['rootFolder']); }

			var filePath = App.settings['databaseLocation'] + '/rootFolder.JSON';

			fs.exists(filePath, function(exists) { 
				if (exists) {
					fe.readJson(filePath, function(err, data) {
						App.settings['rootFolder'] = data.rootFolder;
						win.info('data: ' + JSON.stringify(data));
						return next(null, data.rootFolder);
					});
				}

				createFolder({name: 'Popcorn Time vPutIO', parent_id: '0'}, function(err, file) {
					if (err || !file) {
						return;
					}
					
					fe.outputJson(filePath, { rootFolder: file.id }, function(err) {
						if (err) { return win.info(err); } 

						App.settings['rootFolder'] = file.id;
						win.info('Create Folder ID: ' + file.id);
						next(null, file.id);
					});
				});				
			});
		}

		var handleTorrent = function(torrent, stateModel){
			var putioID = null;

			var streamInfo = new App.Model.PutioStreamInfo({
				engine: {
					server: {
						"domain":null,
						"_events":{"connection":[null,null]},
						"_connections":0,
						"connections":0,
						"_handle":null,
						"_usingSlaves":false,
						"_slaves":[],
						"allowHalfOpen":true,
						"httpAllowHalfOpen":false,
						"timeout":120000
					}
				}
			});

			win.info('uploadFromURL parent_id: ' + App.settings['rootFolder']);

			uploadFromURL({url: torrent.magnetUrl, parent_id: App.settings['rootFolder']}, function(err, transfer){
				if(err || transfer == null){
    				return win.error(err);
	    		}

	    		win.info('uploadTorrent: ' + transfer.id);
				
				// If torrent stream started
	    		transfer_id = transfer.id;
	    		isCancelStream = false;

	    		if (transfer.file_id){
	    			return putioID = transfer.file_id;
	    		}

	    		checkTransfer(streamInfo, torrent, stateModel, function(err, file_id){
	    			putioID = file_id;
	    			win.info('Putio ID: ' + file_id);

	    			stateModel.set('streamInfo', streamInfo);
					stateModel.set('state', 'ready');

	    			var checkReady = function () {
						if (stateModel.get('state') === 'ready') {

							if (stateModel.get('state') === 'ready' && stateModel.get('streamInfo').get('player') !== 'local') {
								stateModel.set('state', 'playingExternally');
							}

							// we need subtitle in the player
							streamInfo.set('subtitle', subtitles != null ? subtitles : torrent.subtitle);

							App.vent.trigger('stream:ready', streamInfo);
							stateModel.destroy();
						}
					};

					App.vent.on('subtitle:downloaded', function (sub) {
						if (sub) {
							stateModel.get('streamInfo').set('subFile', sub);
							App.vent.trigger('subtitle:convert', {
								path: sub,
								language: torrent.defaultSubtitle
							}, function (err, res) {
								if (err) {
									win.error('error converting subtitles', err);
									stateModel.get('streamInfo').set('subFile', null);
								} else {
									App.Subtitles.Server.start(res);
								}
							});
						}
						downloadedSubtitles = true;
					});

					win.info('Magnet URL: ' + torrent.magnetUrl);
					win.info('put URL: ' + putioID);

					https://api.put.io/v2/files/281897751/stream
					win.info('Stream SRC: https://api.put.io/v2/files/' + putioID + '/stream?oauth_token=' + App.settings['accessToken']);
					streamInfo.set('src', 'https://api.put.io/v2/files/' + putioID + '/stream?oauth_token=' + App.settings['accessToken']);
					// streamInfo.set('src', 'http://127.0.0.1:' + engine.server.address().port + '/');
					streamInfo.set('type', 'video/mp4');
					// TEST for custom NW
					//streamInfo.set('type', mime.lookup(engine.server.index.name));
					stateModel.on('change:state', checkReady);
					checkReady();
	    		});
			});
		}

	    return {
			folderConfig: folderConfig,
			cancelStream: cancelStream,
			handleTorrent: handleTorrent
		}
	})(window.App);

	var Preload = {
		start: function (model) {

			if (Streamer.currentTorrent && model.get('torrent') === Streamer.currentTorrent.get('torrent')) {
				return;
			}
			this.currentTorrent = model;

			win.debug('Preloading model:', model);
			var torrent_url = model.get('torrent');

			readTorrent(torrent_url, function (err, torrent) {

				win.debug('Preloading torrent:', torrent);
				var tmpFilename = torrent.infoHash;
				tmpFilename = tmpFilename.replace(/([^a-zA-Z0-9-_])/g, '_'); // +'-'+ (new Date()*1);
				var tmpFile = path.join(App.settings.tmpLocation, tmpFilename);
				subtitles = torrent.subtitle;

				var version = require('semver').parse(App.settings.version);
				var torrentVersion = '';
				torrentVersion += version.major;
				torrentVersion += version.minor;
				torrentVersion += version.patch;
				torrentVersion += version.prerelease.length ? version.prerelease[0] : 0;
				var torrentPeerId = '-PT';
				torrentPeerId += torrentVersion;
				torrentPeerId += '-';
				torrentPeerId += crypto.pseudoRandomBytes(6).toString('hex');

				win.debug('Preloading movie to %s', tmpFile);

				preload_engine = peerflix(torrent_url, {
					connections: parseInt(Settings.connectionLimit, 10) || 100, // Max amount of peers to be connected to.
					dht: parseInt(Settings.dhtLimit, 10) || 50,
					port: 0,
					tmp: App.settings.tmpLocation,
					path: tmpFile, // we'll have a different file name for each stream also if it's same torrent in same session
					index: torrent.file_index,
					id: torrentPeerId
				});

			});


		},

		stop: function () {

			if (preload_engine) {
				if (preload_engine.server._handle) {
					preload_engine.server.close();
				}
				preload_engine.destroy();
				win.info('Preloading stopped');
			}

			preload_engine = null;
		}
	};

	var Streamer = {
		start: function (model) {
			var torrentUrl = model.get('torrent');
			var torrent_read = false;
			if (model.get('torrent_read')) {
				torrent_read = true;
			}

			var stateModel = new Backbone.Model({
				state: 'connecting',
				backdrop: model.get('backdrop'),
				title: '',
				player: '',
				show_controls: false
			});
			App.vent.trigger('stream:started', stateModel);

			if (engine) {
				Streamer.stop();
			}

			this.stop_ = false;
			var that = this;
			var doTorrent = function (err, torrent, parent_id) {
				// Return if streaming was cancelled while loading torrent
				if (that.stop_) {
					return;
				}
				if (err) {
					App.vent.trigger('error', err);
					App.vent.trigger('stream:stop');
					App.vent.trigger('player:close');
				} else {
					// did we need to extract subtitle ?
					var extractSubtitle = model.get('extract_subtitle');

					var getSubtitles = function (data) {
						win.debug('Subtitle data request:', data);

						var subtitleProvider = App.Config.getProvider('tvshowsubtitle');

						subtitleProvider.fetch(data).then(function (subs) {
							if (Object.keys(subs).length > 0) {
								subtitles = subs;
								win.info(Object.keys(subs).length + ' subtitles found');
							} else {
								subtitles = null;
								hasSubtitles = true;
								downloadedSubtitles = true;
								win.warn('No subtitles returned');
							}
							hasSubtitles = true;
						}).catch(function (err) {
							subtitles = null;
							hasSubtitles = true;
							downloadedSubtitles = true;
							win.warn(err);
						});
					};

					var handleTorrent_fnc = function () {
						// TODO: We should passe the movie / tvshow imdbid instead
						// and read from the player
						// so from there we can use the previous next etc
						// and use all available function with the right imdb id

						var torrentInfo = {
							info: torrent,
							subtitle: model.get('subtitle'),
							defaultSubtitle: model.get('defaultSubtitle'),
							title: title,
							tvdb_id: model.get('tvdb_id'),
							imdb_id: model.get('imdb_id'),
							episode: model.get('episode'),
							season: model.get('season'),
							file_index: model.get('file_index'),
							quality: model.get('quality'),
							device: model.get('device'),
							cover: model.get('cover'),
							episodes: model.get('episodes'),
							auto_play: model.get('auto_play'),
							auto_id: model.get('auto_id'),
							auto_play_data: model.get('auto_play_data'),
							magnetUrl: torrentUrl,
							parent_id: parent_id
						};

						putio.handleTorrent(torrentInfo, stateModel);
					};

					if (typeof extractSubtitle === 'object') {
						extractSubtitle.filename = torrent.name;

						var subskw = [];
						for (var key in App.Localization.langcodes) {
							if (App.Localization.langcodes[key].keywords !== undefined) {
								subskw[key] = App.Localization.langcodes[key].keywords;
							}
						}
						extractSubtitle.keywords = subskw;

						getSubtitles(extractSubtitle);
					}

					if (model.get('type') === 'movie') {
						hasSubtitles = true;
					}

					//Try get subtitles for custom torrents
					var title = model.get('title');

					var minFiles = 1;
					if (Settings.allowTorrentStorage) {
						minFiles = 0; //Always open FileSelector
					}

					if (!title) { //From ctrl+v magnet or drag torrent
						for (var f in torrent.files) {
							torrent.files[f].index = f;
							if (!torrent.files[f].name.endsWith('.avi') &&
								!torrent.files[f].name.endsWith('.mp4') &&
								!torrent.files[f].name.endsWith('.mkv')) {
								torrent.files[f] = null;
							}
						}
						if (torrent.files && torrent.files.length > minFiles && !model.get('file_index') && model.get('file_index') !== 0) {
							torrent.files = $.grep(torrent.files, function (n) {
								return (n);
							});
							var fileModel = new Backbone.Model({
								torrent: torrent,
								files: torrent.files
							});
							App.vent.trigger('system:openFileSelector', fileModel);
						} else {
							model.set('defaultSubtitle', Settings.subtitle_language);
							var sub_data = {};
							if (torrent.name) { // sometimes magnets don't have names for some reason
								title = $.trim(torrent.name.replace('[rartv]', '').replace('[PublicHD]', '').replace('[ettv]', '').replace('[eztv]', '')).replace(/[\s]/g, '.');
								sub_data.filename = title;
								var se_re = title.match(/(.*)S(\d\d)E(\d\d)/i);
								if (se_re != null) {
									var tvshowname = $.trim(se_re[1].replace(/[\.]/g, ' ')).replace(/[^\w ]+/g, '').replace(/ +/g, '-');
									App.Trakt.show.episodeSummary(tvshowname, se_re[2], se_re[3]).then(function (data) {
										if (!data) {
											win.warn('Unable to fetch data from Trakt.tv');
											getSubtitles(sub_data);
										} else {
											$('.loading-background').css('background-image', 'url(' + data.show.images.fanart + ')');
											sub_data.imdbid = data.show.imdb_id;
											sub_data.season = data.episode.season.toString();
											sub_data.episode = data.episode.number.toString();
											getSubtitles(sub_data);
											model.set('tvdb_id', data.show.tvdb_id);
											model.set('imdb_id', data.show.tvdb_id);
											model.set('episode', sub_data.season);
											model.set('season', sub_data.episode);
											title = data.show.title + ' - ' + i18n.__('Season %s', data.episode.season) + ', ' + i18n.__('Episode %s', data.episode.number) + ' - ' + data.episode.title;
										}
										handleTorrent_fnc();
									}).catch(function (err) {
										win.warn(err);
										getSubtitles(sub_data);
									});
								} else {
									getSubtitles(sub_data);
									handleTorrent_fnc();
								}
							} else {
								hasSubtitles = true;
								handleTorrent_fnc();
							}
						}
					} else {
						handleTorrent_fnc();
					}
				}
			};
			// HACK(xaiki): we need to go through parse torrent
			// if we have a torrent and not an http source, this
			// is fragile as shit.
			putio.folderConfig(function (err, parent_id) {
				if (typeof (torrentUrl) === 'string' && torrentUrl.substring(0, 7) === 'http://' && !torrentUrl.match('\\.torrent')) {
					return Streamer.startStream(model, torrentUrl, stateModel);
				} else if (!torrent_read) {
					readTorrent(torrentUrl, function (err, torrent) {
						doTorrent(err, torrent, parent_id);
					});
				} else {
					doTorrent(null, model.get('torrent'), parent_id);
				}
			});
		},

		startStream: function (model, url, stateModel) {
			var si = new App.Model.PutioStreamInfo({});
			si.set('title', url);
			si.set('subtitle', {});
			si.set('type', 'video/mp4');
			si.set('device', model.get('device'));

			// Test for Custom NW
			//si.set('type', mime.lookup(url));
			si.set('src', [{
				type: 'video/mp4',
				src: url
			}]);
			App.vent.trigger('stream:ready', si);
		},

		stop: function () {
			this.stop_ = true;

			if (engine) {
				if (engine.server._handle) {
					engine.server.close();
				}
				engine.destroy();
			}
			clearInterval(statsUpdater);
			
			statsUpdater = null;
			engine = null;
			subtitles = null; // reset subtitles to make sure they will not be used in next session.
			hasSubtitles = false;
			downloadedSubtitles = false;
			subtitleDownloading = false;
			App.vent.off('subtitle:downloaded');
			win.info('Streaming cancelled');
		}
	};

	App.vent.on('preload:start', Preload.start);
	App.vent.on('preload:stop', Preload.stop);
	App.vent.on('stream:start', Streamer.start);
	App.vent.on('stream:stop', Streamer.stop);
	App.vent.on('stream:stop', putio.cancelStream);

})(window.App);
