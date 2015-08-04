var mailer = require('nodemailer');
var db = require('./dataAccess.js').instance();

var getNotificationRecipients = function (accounts) {
	var recipients = [];

	accounts.forEach(function (account) {
		var recipient = {
			name: account.name,
			email: account.email
		};

		// Use notification email addresses
		if (account.notifications && account.notifications.email) {
			recipient.email = account.notifications.email;
		}
		recipients.push(recipient);
	});

	return recipients;
};

var getNewNotificationMessage = function (story, req) {
	var message = "Hi. You've been requested to look at a new story on Circle Blvd.\n\n";
	if (story.summary) {
		message += "Summary: " + story.summary + "\n\n";
	}
	if (story.description) {
		message += "Description: " + story.description + "\n\n";	
	}

	var protocol = req.protocol || "http";
	message += "View on Circle Blvd:\n" + 
		protocol + "://" + req.get('Host') + "/#/stories/" + story.id;
	
	return message;
};

var getCommentNotificationMessage = function (comment, story, req) {
	var message = comment.createdBy.name + " writes: ";
	message += comment.text;

	var protocol = req.protocol || "http";
	message += "\n\nView on Circle Blvd:\n" + 
		protocol + "://" + req.get('Host') + "/#/stories/" + story.id;
	
	return message;
};

var getForgotPasswordMessage = function (session, req) {
	var message = "Hi. You asked to reset your password on Circle Blvd.\n\n";
	message += "To do so, please go here: ";

	var protocol = req.protocol || "http";
	message += protocol + "://" + req.get('Host') + "/auth/forgot/" + 
		session._id + "/" + session.secret;
	
	message += "\n\n";
	message += "Thank you for using the site.\n";

	return message;
};

var getInvitationMessage = function (invite, req) {
	var message = "Hi. You've been invited by " + invite.from + " to join ";
	message += invite.circleName;
	message += " on Circle Blvd.\n\n";
	message += "To do so, please go here: ";

	var protocol = req.protocol || "http";
	var baseUrl = protocol + "://" + req.get('Host');
	message +=  baseUrl + "/invite/" + invite._id + "\n\n";
	
	message += "If you're unfamiliar with Circle Blvd, be sure to ";
	message += "check out our tour: ";
	message += baseUrl + "/tour";
	message += "\n\n";
	message += ""
	message += "Thank you.\n";

	return message;
};


var newStory = function (story, sender, req, callback) {
	if (story.isOwnerNotified) {
		var err = new Error("Story owner has already been notified.");
		err.status = 412;
		return callback(error);
	}

	db.users.findByCircleAndName(story.projectId, story.owner, function (err, owner) {
		if (err) {
			return callback(err);
		}
		// Use notification email addresses
		if (sender.notifications && sender.notifications.email) {
			sender.email = sender.notifications.email;
		}
		if (owner.notifications && owner.notifications.email) {
			owner.email = owner.notifications.email;
		}

		var params = {
			story: story,
			sender: sender,
			recipients: [owner],
			message: getNewNotificationMessage(story, req),
			subjectPrefix: "new story: "
		};

		sendStoryNotification(params, function (err, response) {
			if (err) {
				return callback(err);
			}

			var onSuccess = function (savedStory) {
				callback(null, response);
			};

			var onError = function (err) {
				callback(err);
			};

			db.stories.markOwnerNotified(story, onSuccess, onError);
		});
	});
};


// params: story, sender, recipients, message, subjectPrefix
var sendStoryNotification = function (params, callback) {
	var story = params.story;
	var sender = params.sender;
	var recipients = params.recipients;
	var message = params.message;
	var subjectPrefix = params.subjectPrefix;

	db.settings.getAll(function (err, settings) {
		if (err) {
			return callback({
				status: 501,
				message: "Notifcation failed",
				error: err
			});
		}

		var smtpService = settings['smtp-service'];
		var smtpUsername = settings['smtp-login'];
		var smtpPassword = settings['smtp-password'];

		if (!smtpUsername || !smtpPassword || !smtpService) {
			return callback({
				status: 501,
				message: "The server needs SMTP login info before sending notifications. Check the admin page."
			});
		}

		smtpService = smtpService.value;
		smtpUsername = smtpUsername.value;
		smtpPassword = smtpPassword.value;

		var smtp = mailer.createTransport("SMTP", {
			service: smtpService,
			auth: {
				user: smtpUsername,
				pass: smtpPassword
			}
		});

		var toList = function () {
			var result = "";
			recipients.forEach(function (addressee) {
				result += addressee.name + " <" + addressee.email + ">,"
			});
			result = result.slice(0,-1); // remove last comma
			return result;
		}(); // closure;

		var opt = {
			from: sender.name + " via Circle Blvd <" + smtpUsername + ">",
			to: toList,
			replyTo: sender.name + " <" + sender.email + ">",
			subject: subjectPrefix + story.summary,
			text: message
		};

		// For testing:
		// console.log(opt);
		// callback(null, {ok: true});

		smtp.sendMail(opt, function (err, response) {
			smtp.close();
			if (err) {
				callback(err);
			}
			else {
				callback(null, response);
			}
		});
	});
};

var newComment = function (params, req) {
	if (!params || !params.comment || !params.story || !params.user) {
		console.log("Bad call to send-comment notification. Doing nothing.");
		return;
	}

	var comment = params.comment;
	var story = params.story;
	var sender = params.user;
	if (sender.notifications && sender.notifications.email) {
		// Use notification email addresses
		sender.email = sender.notifications.email;
	}

	var participants = {};
	if (story.createdBy) {
		participants[story.createdBy.id] = {
			name: story.createdBy.name
		};
	}

	if (story.comments) {
		story.comments.forEach(function (comment) {
			if (comment.createdBy) {
				participants[comment.createdBy.id] = {
					name: comment.createdBy.name
				};
			}
		});
	}


	db.users.findByCircleAndName(story.projectId, story.owner, function (err, owner) {
		if (story.owner && err) {
			// Log, but we can continue.
			console.log("Comment notification: Cannot find story owner for story: " + story.id);
			console.log(err);
		}
		if (owner) {
			participants[owner._id] = {
				name: owner.name
			};
		}

		// Assert: We have all the participants now
		var recipientAccountIds = [];
		for (var accountId in participants) {
			// Remove the sender from the 'to' list
			if (accountId !== sender._id) {
				recipientAccountIds.push(accountId);
			}
		}

		if (recipientAccountIds.length === 0) {
			// We're done!
			return;
		}

		db.users.findMany(recipientAccountIds, function (err, accounts) {
			var sendParams = {
				story: story,
				sender: sender,
				message: getCommentNotificationMessage(comment, story, req),
				recipients: getNotificationRecipients(accounts),
				subjectPrefix: "new comment: "
			};

			sendStoryNotification(sendParams, function (err, response) {
				if (err) {
					console.log(err);
					return;
				}
				// Do nothing.
			});
		});
	});
};

var forgotPassword = function (params, req, callback) {
	if (!params || !params.user || !params.session) {
		callback("Invalid parameters to notify.forgotPassword");
		return;
	}

	var user    = params.user;
	var session = params.session;
	var message = getForgotPasswordMessage(session, req);

	var params = {
		story: { summary: "" }, // facade hack
		sender: user,
		recipients: [user],
		message: message,
		subjectPrefix: "password reset for " + req.get('Host')
	};

	sendStoryNotification(params, callback);
};

var invitation = function (params, req, callback) {
	if (!params || !params.user || !params.invite) {
		callback("Invalid parameters to notify.invite");
		return;
	}

	var user    = params.user;
	var invite  = params.invite;
	invite.from = user.name;
	var message = getInvitationMessage(invite, req);

	if (!invite.email) {
		callback("params.invite.email not specified in notify.invite");
		return;
	}

	var params = {
		story: { summary: "" }, // facade hack
		sender: user,
		recipients: [{name: invite.name, email: invite.email}],
		message: message,
		subjectPrefix: "circle blvd invitation"
	};

	sendStoryNotification(params, callback);
};

module.exports = function () {
	return {
		newStory: newStory,
		newComment: newComment,
		forgotPassword: forgotPassword,
		invitation: invitation
	};
}(); // closure