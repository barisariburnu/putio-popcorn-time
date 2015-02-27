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


	var watchState = function (stateModel) {


		if (engine != null) {

			var swarm = engine.swarm;
			var state = 'connecting';

			if ((swarm.downloaded > BUFFERING_SIZE || (swarm.piecesGot * (engine.torrent !== null ? engine.torrent.pieceLength : 0)) > BUFFERING_SIZE)) {
				state = 'ready';
			} else if (swarm.downloaded || swarm.piecesGot > 0) {
				state = 'downloading';
			} else if (swarm.wires.length) {
				state = 'startingDownload';
			}
			if (state === 'ready' && (!hasSubtitles || (hasSubtitles && !downloadedSubtitles))) {
				state = 'waitingForSubtitles';
			}

			stateModel.set('state', state);

			if (state !== 'ready') {
				_.delay(watchState, 100, stateModel);
			}

			// This is way too big, should be fixed but basically
			// We only download subtitle once file is ready (to get path)
			// and when the selected lang or default lang is set
			// subtitleDownloading is needed cos this is called every 300ms

			if (stateModel.get('streamInfo').get('torrent').defaultSubtitle && stateModel.get('streamInfo').get('torrent').defaultSubtitle !== 'none' && hasSubtitles && subtitles != null && engine.files[0] && !downloadedSubtitles && !subtitleDownloading) {
				win.debug('downloading subtitle');
				subtitleDownloading = true;
				App.vent.trigger('subtitle:download', {
					url: subtitles[stateModel.get('streamInfo').get('torrent').defaultSubtitle],
					path: path.join(engine.path, engine.files[0].path)
				});
			}

			// No need to download subtitles
			if (!stateModel.get('streamInfo').get('torrent').defaultSubtitle || stateModel.get('streamInfo').get('torrent').defaultSubtitle === 'none') {
				downloadedSubtitles = true;
			}
		}
	};

	var handleTorrent = function (torrent, stateModel) {

		var tmpFilename = torrent.info.infoHash;
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

		win.debug('Streaming movie to %s', tmpFile);

		engine = peerflix(torrent.info, {
			connections: parseInt(Settings.connectionLimit, 10) || 100, // Max amount of peers to be connected to.
			dht: parseInt(Settings.dhtLimit, 10) || 50,
			port: parseInt(Settings.streamPort, 10) || 0,
			tmp: App.settings.tmpLocation,
			path: tmpFile, // we'll have a different file name for each stream also if it's same torrent in same session
			buffer: (1.5 * 1024 * 1024).toString(), // create a buffer on torrent-stream
			index: torrent.file_index,
			id: torrentPeerId
		});

		engine.swarm.piecesGot = 0;
		engine.on('verify', function (index) {
			engine.swarm.piecesGot += 1;
		});

		var streamInfo = new App.Model.StreamInfo({
			engine: engine
		});

		// Fix for loading modal
		streamInfo.updateStats(engine);
		streamInfo.set('torrent', torrent);
		streamInfo.set('title', torrent.title);
		streamInfo.set('player', torrent.device);

		statsUpdater = setInterval(_.bind(streamInfo.updateStats, streamInfo, engine), 1000);
		stateModel.set('streamInfo', streamInfo);
		stateModel.set('state', 'connecting');
		watchState(stateModel);

		var checkReady = function () {
			if (stateModel.get('state') === 'ready') {

				if (stateModel.get('state') === 'ready' && stateModel.get('streamInfo').get('player') !== 'local') {
					stateModel.set('state', 'playingExternally');
				}
				streamInfo.set(torrent);

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

		engine.server.on('listening', function () {
			if (engine) {
				streamInfo.set('src', 'http://127.0.0.1:' + engine.server.address().port + '/');
				streamInfo.set('type', 'video/mp4');

				// TEST for custom NW
				//streamInfo.set('type', mime.lookup(engine.server.index.name));
				stateModel.on('change:state', checkReady);
				checkReady();
			}
		});

		// not used anymore
		engine.on('ready', function () {});

		engine.on('uninterested', function () {
			if (engine) {
				engine.swarm.pause();
			}

		});

		engine.on('interested', function () {
			if (engine) {
				engine.swarm.resume();
			}
		});

	};


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
			var doTorrent = function (err, torrent) {
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
							auto_play_data: model.get('auto_play_data')
						};

						handleTorrent(torrentInfo, stateModel);
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
			if (typeof (torrentUrl) === 'string' && torrentUrl.substring(0, 7) === 'http://' && !torrentUrl.match('\\.torrent')) {
				return Streamer.startStream(model, torrentUrl, stateModel);
			} else if (!torrent_read) {
				readTorrent(torrentUrl, doTorrent);
			} else {
				doTorrent(null, model.get('torrent'));
			}


		},
		startStream: function (model, url, stateModel) {
			var si = new App.Model.StreamInfo({});
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

})(window.App);
