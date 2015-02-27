(function (App) {
	'use strict';

	var About = Backbone.Marionette.ItemView.extend({
		template: '#about-tpl',
		className: 'about',

		ui: {
			success_alert: '.success_alert'
		},

		events: {
			'click .close-icon': 'closeAbout',
			'click .links': 'links',
			'click #changelog': 'showChangelog'
		},

		onShow: function () {
			$('.filter-bar').hide();
			$('#header').addClass('header-shadow');

			Mousetrap.bind(['esc', 'backspace'], function (e) {
				App.vent.trigger('about:close');
			});
			$('.links,#changelog').tooltip();
			win.info('Show about');
			$('#movie-detail').hide();
		},

		onClose: function () {
			Mousetrap.unbind(['esc', 'backspace']);
			$('.filter-bar').show();
			$('#header').removeClass('header-shadow');
			$('#movie-detail').show();
		},

		closeAbout: function () {
			if ($('.changelog-overlay').css('display') === 'block') {
				this.closeChangelog();
			} else {
				App.vent.trigger('about:close');
			}
		},

		links: function (e) {
			e.preventDefault();
			gui.Shell.openExternal($(e.currentTarget).attr('href'));
		},

		showChangelog: function () {
			fs.readFile('./CHANGELOG.md', 'utf-8', function (err, contents) {
				if (!err) {
					$('.changelog-text').html(contents.replace(/\n/g, '<br />'));
					$('.changelog-overlay').show();
				} else {
					gui.Shell.openExternal('https://git.popcorntime.io/popcorntime/desktop/blob/master/CHANGELOG.md');
				}
			});
		},

		closeChangelog: function () {
			$('.changelog-overlay').hide();
		}

	});

	App.View.About = About;
})(window.App);
