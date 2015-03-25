<div class="issue-container">
	<div class="fa fa-times close-icon"></div>
	<div class="overlay-content"></div>
	<div class="content">
		<h1><%= i18n.__("Report an issue") %></h1>
		<hr>

		<div class="issue-outer">
			
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

			<div id="issue-search">
				<div class="report-info">
					<%= i18n.__("Step 1: Please look if the issue was already reported") %>
				</div>

				<input id="issue-search-field" size="30" type="text" name="keyword" placeholder="<%= i18n.__('Enter keywords') %>">
				<i class="fa fa-search search-issue"></i>

				<ul id="issue-results"></ul>

				<div class="button found-issue"><%= i18n.__("Already reported") %></div>
				<div class="button notfound-issue"><%= i18n.__("I want to report a new issue") %></div>
			</div>

			<div id="issue-form">
				<div class="report-info">
					<p><%= i18n.__("Step 2: Report a new issue") %></p>
					<em><%= i18n.__("Note: please don't use this form to contact us. It is limited to bug reports only.") %></em>
				</div>

				<h2><%= i18n.__("Title") %></h2>
				<input id="issue-title" size="35" type="text" name="title" placeholder="<%= i18n.__('The title of the issue') %>">

				<h2><%= i18n.__("Description") %></h2>
				<p style="font-size: 12px"><%= i18n.__("200 characters minimum") %></p>
				<textarea id="issue-content" wrap="hard"rows="12" cols="100" name="description" placeholder="<%= i18n.__('A short description of the issue. If suitable, include the steps required to reproduce the bug.') %>"></textarea>

				<div class="button submit-issue"><%= i18n.__("Submit") %></div>
			</div>

			<div id="issue-success">
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