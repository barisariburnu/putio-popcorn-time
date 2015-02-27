<div class="settings-container">
	<div class="fa fa-times close-icon"></div>
	<div class="success_alert" style="display:none"><%= i18n.__("Saved") %>&nbsp;<span id="checkmark-notify"><div id="stem-notify"></div><div id="kick-notify"></div></span></div>

	<section id="title">
		<div class="title"><%= i18n.__("Settings") %></div>
		<div class="content">
			<span>
				<i class="fa fa-keyboard-o keyboard tooltipped" data-toggle="tooltip" data-placement="bottom" title="<%= i18n.__("Keyboard Shortcuts") %>"></i>
				<i class="fa fa-question-circle help tooltipped" data-toggle="tooltip" data-placement="bottom" title="<%= i18n.__("Help Section") %>"></i>
				<input id="show-advanced-settings" class="settings-checkbox" name="showAdvancedSettings" type="checkbox" <%=(Settings.showAdvancedSettings? "checked":"")%>>
				<label class="settings-label" for="show-advanced-settings"><%= i18n.__("Show advanced settings") %></label>
			</span>
		</div>
	</section>

	<section id="user-interface">
		<div class="title"><%= i18n.__("User Interface") %></div>
		<div class="content">
			<span>
				<div class="dropdown subtitles-language">
					<p><%= i18n.__("Default Language") %>:</p>
					<%
						var langs = "";
						for(var key in App.Localization.allTranslations) {
								key = App.Localization.allTranslations[key];
								if (App.Localization.langcodes[key] !== undefined) {
								langs += "<option "+(Settings.language == key? "selected='selected'":"")+" value='"+key+"'>"+
											App.Localization.langcodes[key].nativeName+"</option>";
							}
						}
					%>
					<select name="language"><%=langs%></select>
					<div class="dropdown-arrow"></div>
				</div>
			</span>

			<span>
				<div class="dropdown pct-theme">
					<p><%= i18n.__("Theme") %>:</p>
					<%
						var themes = "";
						var theme_files = fs.readdirSync('./src/app/themes/');
						for (var i in theme_files) {
							if (theme_files[i].indexOf('_theme') > -1) {
								themes += "<option " + (Settings.theme == theme_files[i].slice(0, -4)? "selected='selected'" : "") + " value='" + theme_files[i].slice(0, -4) + "'>" +
								theme_files[i].slice(0, -10).split('_').join(' '); + "</option>";
							}
						}
					%>
					<select name="theme"><%=themes%></select>
					<div class="dropdown-arrow"></div>
				</div>
			</span>

			<span class="advanced">
				<div class="dropdown start-screen">
					<p><%= i18n.__("Start Screen") %>:</p>
						<%
							var arr_screens = ["Movies","TV Series","Favorites","Anime", "Watchlist", "Last Open"];

							var selct_start_screen = "";
							for(var key in arr_screens) {
								selct_start_screen += "<option "+(Settings.start_screen == arr_screens[key]? "selected='selected'":"")+" value='"+arr_screens[key]+"'>"+i18n.__(arr_screens[key])+"</option>";
							}
						%>
					<select name="start_screen"><%=selct_start_screen%></select>
					<div class="dropdown-arrow"></div>
				</div>
			</span>

			<span class="advanced">
				<input class="settings-checkbox" name="coversShowRating" id="cb3" type="checkbox" <%=(Settings.coversShowRating? "checked='checked'":"")%>>
				<label class="settings-label" for="cb3"><%= i18n.__("Show rating over covers") %></label>
			</span>

			<span class="advanced">
				<input class="settings-checkbox" name="alwaysOnTop" id="cb4" type="checkbox" <%=(Settings.alwaysOnTop? "checked='checked'":"")%>>
				<label class="settings-label" for="cb4"><%= i18n.__("Always On Top") %></label>
			</span>

			<span class="advanced">
				<div class="dropdown watchedCovers">
					<p><%= i18n.__("Watched Items") %>:</p>
						<%
							var watch_type = {
								"none": "Show",
								"fade": "Fade",
								"hide": "Hide"
							};

							var select_watched_cover = "";
							for(var key in watch_type) {
								select_watched_cover += "<option "+(Settings.watchedCovers == key? "selected='selected'":"")+" value='"+key+"'>"+i18n.__(watch_type[key])+"</option>";
							}
						%>
					<select name="watchedCovers"><%=select_watched_cover%></select>
					<div class="dropdown-arrow"></div>
				</div>
			</span>

		</div>
	</section>

	<section id="subtitles">
		<div class="title"><%= i18n.__("Subtitles") %></div>
		<div class="content">
			<span>
				<div class="dropdown subtitles-language-default">
					<p><%= i18n.__("Default Subtitle") %>:</p>
					<%
						var sub_langs = "<option "+(Settings.subtitle_language == "none"? "selected='selected'":"")+" value='none'>" +
											i18n.__("Disabled") + "</option>";

						for(var key in App.Localization.langcodes) {
							if (App.Localization.langcodes[key].subtitle !== undefined && App.Localization.langcodes[key].subtitle == true) {
								sub_langs += "<option "+(Settings.subtitle_language == key? "selected='selected'":"")+" value='"+key+"'>"+
												App.Localization.langcodes[key].nativeName+"</option>";
							}
						}
					%>
					<select name="subtitle_language"><%=sub_langs%></select>
					<div class="dropdown-arrow"></div>
				</div>
            </span>

            <span class="advanced">
				<div class="dropdown subtitles-font">
					<p><%= i18n.__("Font") %>:</p>
					<%
						var arr_fonts = [
							{name:"Deja Vu Sans", id:"dejavusans"},
							{name:"Droid Sans", id:"droidsans"},
							{name:"Comic Sans MS", id:"comic"},
							{name:"Georgia", id:"georgia"},
							{name:"Geneva", id:"geneva"},
							{name:"Helvetica", id:"helvetica"},
							{name:"Lato", id:"lato"},
							{name:"Montserrat", id:"montserrat"},
							{name:"OpenDyslexic", id:"opendyslexic"},
							{name:"Open Sans", id:"opensans"},
							{name:"PT Sans",id:"pts"},
							{name:"Tahoma", id:"tahoma"},
							{name:"Trebuchet MS", id:"trebuc"},
							{name:"Roboto",id:"roboto"},
							{name:"Ubuntu", id:"ubuntu"},
							{name:"Verdana", id:"verdana"},
						];

						var font_folder = path.resolve({
							win32:  "/Windows/fonts",
							darwin: "/Library/Fonts",
							linux:  "/usr/share/fonts/truetype"
						}[process.platform]);

						var all_avail_fonts = fs.readdirSync(font_folder);
					    var avail_fonts = ["Arial"];

						for (var i in arr_fonts) {
							for (var key in all_avail_fonts) {
								var found = all_avail_fonts[key].toLowerCase();
								var toFind = arr_fonts[i].id;
								if (found.indexOf(toFind) != -1) {
									avail_fonts.push(arr_fonts[i].name);
									break;
								}
							}
						}

						var sub_fonts = "";
						for (var key in avail_fonts) {
							sub_fonts += "<option "+(Settings.subtitle_font == avail_fonts[key]? "selected='selected'":"")+" value='"+avail_fonts[key]+",Arial'>"+avail_fonts[key]+"</option>";
						}
					%>
					<select name="subtitle_font"><%=sub_fonts%></select>
					<div class="dropdown-arrow"></div>
				</div>
            </span>

            <span>
				<div class="dropdown subtitles-size">
					<p><%= i18n.__("Size") %>:</p>
					<%
						var arr_sizes = ["24px","26px","28px","30px","32px","34px","36px","38px","48px","50px","52px","54px","56px","58px","60px"];

						var sub_sizes = "";
						for(var key in arr_sizes) {
							sub_sizes += "<option "+(Settings.subtitle_size == arr_sizes[key]? "selected='selected'":"")+" value='"+arr_sizes[key]+"'>"+arr_sizes[key]+"</option>";
						}
					%>
					<select name="subtitle_size"><%=sub_sizes%></select>
					<div class="dropdown-arrow"></div>
				</div>
            </span>

            <span class="advanced">
                <div class="subtitles-custom">
                    <p><%= i18n.__("Color") + ":" %></p>
                    <input class="colorsub" id="subtitles_color" type="color" size="7" name="subtitle_color" value="<%=Settings.subtitle_color%>" list="subs_colors">
                        <datalist id="subs_colors">
                            <option>#ffffff</option>
                            <option>#ffff00</option>
                            <option>#ff0000</option>
                            <option>#ff00ff</option>
                            <option>#00ffff</option>
                            <option>#00ff00</option>
                        </datalist>

                    <input class="settings-checkbox" name="subtitle_shadows" id="subtitle_shadows" type="checkbox" <%=(Settings.subtitle_shadows? "checked='checked'":"")%>>
				    <label class="settings-label" for="subtitle_shadows"><%= i18n.__("With Shadows") %></label>
                </div>
			</span>
		</div>
	</section>

	<section id="quality" class="advanced">
		<div class="title"><%= i18n.__("Quality") %></div>
		<div class="content">
			<span>
				<div class="dropdown movies-quality">
					<p><%= i18n.__("Only list movies in") %>:</p>
					<select name="movies_quality">
						<option <%=(Settings.movies_quality == "all"? "selected='selected'":"") %> value="all"><%= i18n.__("All") %></option>
						<option <%=(Settings.movies_quality == "1080p"? "selected='selected'":"") %> value="1080p">1080p</option>
						<option <%=(Settings.movies_quality == "720p"? "selected='selected'":"") %> value="720p">720p</option>
					</select>
					<div class="dropdown-arrow"></div>
				</div>
			</span>
			<span>
				<input class="settings-checkbox" name="moviesShowQuality" id="cb1" type="checkbox" <%=(Settings.moviesShowQuality? "checked='checked'":"")%>>
				<label class="settings-label" for="cb1"><%= i18n.__("Show movie quality on list") %></label>
			</span>
		</div>
	</section>
	<section id="playback">
		<div class="title"><%= i18n.__("Playback") %></div>
		<div class="content">
			<span class="advanced">
				<input class="settings-checkbox" name="alwaysFullscreen" id="alwaysFullscreen" type="checkbox" <%=(Settings.alwaysFullscreen? "checked='checked'":"")%>>
				<label class="settings-label" for="alwaysFullscreen"><%= i18n.__("Always start playing in fullscreen") %></label>
			</span>
			<span>
				<input class="settings-checkbox" name="playNextEpisodeAuto" id="playNextEpisodeAuto" type="checkbox" <%=(Settings.playNextEpisodeAuto? "checked='checked'":"")%>>
				<label class="settings-label" for="playNextEpisodeAuto"><%= i18n.__("Play next episode automatically") %></label>
			</span>
		</div>
	</section>

	<section id="trakt-tv">
		<div class="title"><%= i18n.__("Trakt.tv") %></div>
		<div class="content">
			<div class="trakt-options<%= App.Trakt.authenticated ? " authenticated" : "" %>">
				<% if(App.Trakt.authenticated) { %>
					<span>
						<%= i18n.__("You are currently authenticated to Trakt.tv as") %> <%= Settings.traktUsername %>.
						<a id="unauthTrakt" class="unauthtext" href="#"><%= i18n.__("Disconnect account") %></a>
					</span>
					<span>
						<div class="btn-settings syncTrakt" id="syncTrakt">
							<i class="fa fa-refresh">&nbsp;&nbsp;</i>
							<%= i18n.__("Sync With Trakt") %>
						</div>
                        <div class="sync-on-start">
                            <input class="settings-checkbox" name="syncOnStart" id="syncOnStart" type="checkbox" <%=(Settings.syncOnStart? "checked='checked'":"")%>>
                            <label class="settings-label" for="syncOnStart"><%= i18n.__("Automatically Sync on Start") %></label>
                        </div>
					</span>
				<% } else { %>
					<span>
						<%= i18n.__("Enter your Trakt.tv details here to automatically 'scrobble' episodes you watch in Popcorn Time") %>
					</span>
					<span>
						<p><%= i18n.__("Username") + ":" %></p>
						<input type="text" size="50" id="traktUsername" name="traktUsername">
							<div class="loading-spinner" style="display: none"></div>
							<div class="valid-tick" style="display: none"></div>
							<div class="invalid-cross" style="display: none"></div>
					</span>
					<span>
						<p><%= i18n.__("Password") + ":" %></p>
						<input type="password" size="50" id="traktPassword" name="traktPassword">
					</span>
					<span>
						<em><%= i18n.__("Popcorn Time stores an encrypted hash of your password in your local database") %></em>
					</span>
				<% } %>
			</div>
		</div>
	</section>

	<section id="vpn">
		<div class="title"><%= i18n.__("VPN") %></div>
		<div class="content">
			<div class="vpn-options">
				<span>
					<input class="settings-checkbox" name="vpnDisabledPerm" id="vpnDisabledPerm" type="checkbox" <%=(Settings.vpnDisabledPerm? "checked='checked'":"")%>>
					<label class="settings-label" for="vpnDisabledPerm"><%= i18n.__("Hide VPN from the filter bar") %></label>
				</span>
			</div>
		</div>
	</section>

	<section id="remote-control" class="advanced">
		<div class="title"><%= i18n.__("Remote Control") %></div>
		<div class="content">
            <span>
                <p><%= i18n.__("Local IP Address") + ":" %></p>
                <input type="text" value="<%= Settings.ipAddress %>" readonly="readonly" size="20" />
            </span>
			<span>
				<p><%= i18n.__("HTTP API Port") + ":" %></p>
				<input id="httpApiPort" type="number" size="5" name="httpApiPort" value="<%=Settings.httpApiPort%>">
			</span>
			<span>
				<p><%= i18n.__("HTTP API Username") + ":" %></p>
				<input id="httpApiUsername" type="text" size="50" name="httpApiUsername" value="<%=Settings.httpApiUsername%>">
			</span>
			<span>
				<p><%= i18n.__("HTTP API Password") + ":" %></p>
				<input id="httpApiPassword" type="text" size="50" name="httpApiPassword" value="<%=Settings.httpApiPassword%>">
			</span>
			<div class="btns advanced database">
				<div class="btn-settings database qr-code">
                    <i class="fa fa-qrcode">&nbsp;&nbsp;</i>
                    <%= i18n.__("Generate Pairing QR code") %>
                </div>
			</div>
			<div id="qrcode-overlay"></div>
			<div id="qrcode-modal">
				<span class="fa-stack fa-1x" id="qrcode-close">
					<i class="fa fa-circle-thin fa-stack-2x" style="margin-top: -2px;"></i>
					<i class="fa fa-times fa-stack-1x" style="margin-top: -2px;"></i>
				</span>
				<canvas id="qrcode" width="200" height="200"></canvas>
			</div><!-- /.modal -->
		</div>
	</section>

	<section id="connection" class="advanced">
		<div class="title"><%= i18n.__("Connection") %></div>
		<div class="content">
			<span>
				<p><%= i18n.__("TV Show API Endpoint") + ":" %></p>
				<input id="tvshowAPI" type="text" size="50" name="tvshowAPI" value="<%=Settings.tvshowAPI.url%>">
			</span>
			<span>
				<p><%= i18n.__("Connection Limit") + ":" %></p>
				<input id="connectionLimit" type="text" size="20" name="connectionLimit" value="<%=Settings.connectionLimit%>"/>
			</span>
			<span>
				<p><%= i18n.__("DHT Limit") + ":" %></p>
				<input type="text" id="dhtLimit" size="20" name="dhtLimit" value="<%=Settings.dhtLimit%>"/>
			</span>
			<span>
				<p><%= i18n.__("Port to stream on") + ":" %></p>
				<input id="streamPort" type="text" size="20" name="streamPort" value="<%=Settings.streamPort%>"/>&nbsp;&nbsp;<em><%= i18n.__("0 = Random") %></em>
			</span>
		</div>
	</section>

	<section id="cache" class="advanced">
		<div class="title"><%= i18n.__("Cache Directory") %></div>
		<div class="content">
			<span>
				<p><%= i18n.__("Cache Directory") %>: </p>
				<input type="text" placeholder="<%= i18n.__("Cache Directory") %>" id="faketmpLocation" value="<%= Settings.tmpLocation %>" readonly="readonly" size="65" />
				<i class="open-tmp-folder fa fa-folder-open-o tooltipped" data-toggle="tooltip" data-placement="auto" title="<%= i18n.__("Open Cache Directory") %>"></i>
				<input type="file" name="tmpLocation" id="tmpLocation" nwdirectory style="display: none;" nwworkingdir="<%= Settings.tmpLocation %>" />
			</span>
			<span>
				<input class="settings-checkbox" name="deleteTmpOnClose" id="cb2" type="checkbox" <%=(Settings.deleteTmpOnClose? "checked='checked'":"")%>>
				<label class="settings-label" for="cb2"><%= i18n.__("Clear Tmp Folder after closing app?") %></label>
			</span>
		</div>
	</section>

	<section id="database" class="advanced">
		<div class="title"><%= i18n.__("Database") %></div>
		<div class="content">
			<span>
				<p><%= i18n.__("Database Directory") %>: </p>
				<input type="text" placeholder="<%= i18n.__("Database Directory") %>" id="fakedatabaseLocation" value="<%= Settings.databaseLocation %>" readonly="readonly" size="65" />
				<i class="open-database-folder fa fa-folder-open-o tooltipped" data-toggle="tooltip" data-placement="auto" title="<%= i18n.__("Open Database Directory") %>"></i>
				<input type="file" name="fakedatabaseLocation" id="fakedatabaseLocation" nwdirectory style="display: none;" nwworkingdir="<%= Settings.databaseLocation %>" />
			</span>
			<div class="btns advanced database">
				<div class="btn-settings database import-database">
                    <i class="fa fa-level-down">&nbsp;&nbsp;</i>
                    <%= i18n.__("Import Database") %>
                </div>
				<div class="btn-settings database export-database">
                    <i class="fa fa-level-up">&nbsp;&nbsp;</i>
                    <%= i18n.__("Export Database") %>
                </div>
			</div>
			<span>
				<input class="settings-checkbox" name="allowTorrentStorage" id="allowTorrentStorage" type="checkbox" <%=(Settings.allowTorrentStorage? "checked='checked'":"")%>>
				<label class="settings-label" for="allowTorrentStorage"><%= i18n.__("Allow torrents to be stored for further use") %></label>
			</span>
		</div>
	</section>
    <section id="miscellaneous" class="advanced">
		<div class="title"><%= i18n.__("Miscellaneous") %></div>
		<div class="content">
			<span >
				<div class="dropdown tv_detail_jump_to">
					<p><%= i18n.__("When Opening TV Series Detail Jump To") %>:</p>
						<%
							var tv_detail_jump_to = {
								"firstUnwatched": "First Unwatched Episode",
								"next": "Next Episode In Series"
							};

							var selected_tv_detail_jump = "";
							for(var key in tv_detail_jump_to) {
								selected_tv_detail_jump += "<option "+(Settings.tv_detail_jump_to == key? "selected='selected'":"")+" value='"+key+"'>"+i18n.__(tv_detail_jump_to[key])+"</option>";
							}
						%>
					<select name="tv_detail_jump_to"><%=selected_tv_detail_jump%></select>
					<div class="dropdown-arrow"></div>
				</div>
			</span>
			<span>
				<input class="settings-checkbox" name="automaticUpdating" id="cb5" type="checkbox" <%=(Settings.automaticUpdating? "checked='checked'":"")%>>
				<label class="settings-label" for="cb5"><%= i18n.__("Activate automatic updating") %></label>
			</span>
			<span>
				<input class="settings-checkbox" name="events" id="cb6" type="checkbox" <%=(Settings.events? "checked='checked'":"")%>>
				<label class="settings-label" for="cb6"><%= i18n.__("Celebrate various events") %></label>
			</span>
		</div>
	</section>
	<div class="btns advanced">
		<div class="btn-settings flush-bookmarks"><%= i18n.__("Flush bookmarks database") %></div>
		<div class="btn-settings flush-subtitles"><%= i18n.__("Flush subtitles cache") %></div>
		<div class="btn-settings flush-databases"><%= i18n.__("Flush all databases") %></div>
		<div class="btn-settings default-settings"><%= i18n.__("Reset to Default Settings") %></div>
	</div>

</div>
