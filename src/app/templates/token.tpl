<div class="token-container">
	<div class="fa fa-times close-icon"></div>
	<div class="overlay-content"></div>
	<div class="content">
		<h1><%= i18n.__("Report an token") %></h1>
		<hr>

		<div class="token">
			
			<div id="issue-auth">
				<div class="report-info">
					<%= i18n.__("Log in into your GitLab account") %>
				</div>
				<input id="issue-email" type="text" name="gitusername" placeholder="<%= i18n.__('Email') %>">
				<br>
				<input id="issue-pw" type="password" name="gitpassword" placeholder="<%= i18n.__('Password') %>">
				<br>
				<div class="button login-issue"><%= i18n.__("Log in") %></div>
				<div class="button anonymous-issue"><%= i18n.__("Report anonymously") %></div>
				<p>
					<%= i18n.__("Note regarding anonymous reports:") %><br>
					<span class="note"><%= i18n.__("You will not be able to edit or delete your report once sent.") %></span><br>
					<span class="note"><%= i18n.__("If any additionnal information is required, the report might be closed, as you won't be able to provide them.") %></span>
				</p>
			</div>

			<div id="token-success">
				<div class="report-info">
					<%= i18n.__("Step 3: Thank you !") %>
				</div>

				<h2><%= i18n.__("Success") %></h2>
				<p><%= i18n.__("Your issue has been reported.") %></p>
				<p><a href="#" class="links" id="issue-url"></a></p>
			</div>
		</div>
	</div>
</div>