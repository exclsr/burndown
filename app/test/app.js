var async = require('async');
var nano = require('nano')('http://localhost:5984');
var request = require('supertest');

var databaseName = 'a-tmp-db-for-circle-blvd-testing';
var sessionsDatabaseName = databaseName + '-sessions';
process.env.DATABASE_NAME = databaseName;

var unit  = undefined;
var test  = {};

var admin = undefined;
var member = undefined;

var adminEmail = 'admin@test';
var adminPassword = 'Well, what do you think?';
var adminSession = {};

var memberEmail = "member@test";
var memberPassword = 'Members only!';
var memberSession = {};

var finish = function (test) {
	var fn = function (err) {
		test.ifError(err);
		test.done();
	};
	return fn;
};

test['database setup'] = function (test) {
	var app = require('../app.js');
	unit = app.express;
	// CouchDB is not entirely ready when ready is
	// called. So, work around that until we can
	// fix it.
	var halfSecond = 500;
	app.whenReady(function () {
		setTimeout(function () {
			test.done();
		}, halfSecond);	
	});

	// for a persistent session
	admin = request.agent(unit);
	member = request.agent(unit);
};

// Initialize
test['GET / is 302'] = function (test) {
	request(unit)
	.get('/')
	.expect(302)
	.end(finish(test));
};

test['POST /data/initialize is 200'] = function (test) {
	var data = {};
	data.admin = {
		email: adminEmail,
		password: adminPassword
	};

	request(unit)
	.put('/data/initialize')
	.send(data)
	.expect(200)
	.end(finish(test));
};

// Sign in
test['GET /data/user is 401 at first'] = function (test) {
	admin
	.get('/data/user')
	.expect(401)
	.end(finish(test));
};

test['POST /auth/signin is 401 with bad password'] = function (test) {
	admin
	.post('/auth/signin')
	.type("form")
	.send({ email: adminEmail })
	.send({ password: 'invalid password' })
	.expect(401)
	.end(finish(test));
};

test['POST /auth/signin is 401 with unknown id'] = function (test) {
	admin
	.post('/auth/signin')
	.type("form")
	.send({ email: 'unknown id' })
	.send({ password: 'invalid password' })
	.expect(401)
	.end(finish(test));
};

test['POST /auth/signin is 200'] = function (test) {
	admin
	.post('/auth/signin')
	.type("form")
	.send({ email: adminEmail })
	.send({ password: adminPassword })
	.expect(200)
	.end(finish(test));
};

test['GET /data/circles'] = function (test) {
	admin
	.get('/data/circles')
	.expect(200)
	.end(function (err, res) {
		test.ifError(err);
		for (var key in res.body) {
			var circle = res.body[key];
			// save circle id in sessions
			if (!adminSession.circle) {
				adminSession.circle = circle;
				memberSession.circle = circle;
			}
		}
		test.done();
	});
};

test['GET /data/:circleId/groups is 200'] = function (test) {
	admin
	.get('/data/' + adminSession.circle._id + '/groups')
	.expect(200)
	.end(function (err, res) {
		test.ifError(err);
		for (var key in res.body) {
			var group = res.body[key];
			if (!adminSession.group) {
				adminSession.group = group;
			}
		}
		test.done();
	})
};

// Add member
test['POST /data/:circleId/member is 204'] = function (test) {
	// TODO: This API is lame and needs to be redone.
	var memberships = [];
	memberships.push({
		circle: adminSession.circle._id,
		group: adminSession.group._id,
		level: "member"
	});

	admin
	.post('/data/' + adminSession.circle._id + '/member')
	.send({
		name: "Test member",
		email: memberEmail,
		password: memberPassword,
		memberships: memberships,
		isReadOnly: false
	})
	.expect(204)
	.end(finish(test));
};

test['Sign in the non-admin member'] = function (test) {
	member
	.post('/auth/signin')
	.type("form")
	.send({ email: memberEmail })
	.send({ password: memberPassword })
	.expect(200)
	.end(finish(test));
};

test['GET /data/user is 200 after signin'] = function (test) {
	member
	.get('/data/user')
	.expect(200)
	.end(finish(test));
};

// Add story
test['POST /data/story/ is 200'] = function (test) {
	var story = {
		summary: "A test story",
		projectId: memberSession.circle._id
	};

	member
	.post('/data/story/')
	.send(story)
	.expect(200)
	.end(function (err, res) {
		test.ifError(err);
		memberSession.story = res.body;
		test.equal(memberSession.story.summary, story.summary);
		test.done();
	});
};

test['GET /data/story/:storyId is 200'] = function (test) {
	member.get('/data/story/' + memberSession.story._id)
	.expect(200)
	.expect(function (res) {
		var story = res.body;
		test.equal(story._id, memberSession.story._id);
	})
	.end(finish(test));
};

test['GET /data/:circleId/stories is 200'] = function (test) {
	member.get('/data/' + memberSession.circle._id + '/stories')
	.expect(200)
	.expect(function (res) {
		var stories = res.body;
		var containsNewStory = false;
		for (var key in stories) {
			if (memberSession.story._id === stories[key].id) {
				containsNewStory = true;
			}
		}
		test.ok(containsNewStory, "contains new story");
	})
	.end(finish(test));
};

// Create circle
test['POST /data/circle is 200'] = function (test) {
	var data = {
		name: "Test circle"
	};
	member.post('/data/circle')
	.send(data)
	.expect(200)
	.expect(function (res) {
		var circle = res.body;
		memberSession.circle = circle;
		test.ok(circle._id, "circle id");
	})
	.end(finish(test));
};

test['New circle has some stories in it'] = function (test) {
	member.get('/data/' + memberSession.circle._id + '/stories')
	.expect(200)
	.expect(function (res) {
		var stories = res.body;
		memberSession.stories = stories;
		var storyCount = 0;
		for (var key in stories) {
			storyCount++;
			test.ok(stories[key].id, "story " + key + "has id property");
		}
		test.ok(storyCount > 0, "has some stories")
	})
	.end(finish(test));
};

test['New circle has a first story'] = function (test) {
	member.get('/data/' + memberSession.circle._id + '/first-story')
	.expect(200)
	.expect(function (res) {
		var story = res.body;
		memberSession.firstStory = story;
		test.ok(story.id, "first story has id");
		test.ok(story.isFirstStory, "first story is first story");
	})
	.end(finish(test));
};

var checkFirstStory = function (oldFirstStory, test) {
	var fn = function (err) {
		test.ifError(err);

		member.get('/data/' + memberSession.circle._id + '/first-story')
		.expect(200)
		.expect(function (res) {
			var firstStory = res.body;
			test.ok(firstStory.isFirstStory, "first story is first story");
			test.notEqual(firstStory.id, oldFirstStory.id, "first story is different");
			memberSession.firstStory = firstStory;
		})
		.end(finish(test));
	}
	return fn;
}

// Move story
test["Move story is 200"] = function (test) {
	var data = {
		story: memberSession.firstStory,
		newNextId: "last-" + memberSession.circle._id
	};

	member.put('/data/story/move')
	.send(data)
	.expect(200)
	.end(getStories);

	function getStories(err) {
		test.ifError(err);

		member.get('/data/' + memberSession.circle._id + '/stories')
		.expect(200)
		.expect(function (res) {
			var stories = res.body;
			var movedStory = stories[data.story.id];
			test.equal(movedStory.nextId, data.newNextId, "next id updated");
			test.ok(!movedStory.isFirstStory, "moved story no longer first");
		})
		.end(checkFirstStory(data.story, test));
	}
};

// Remove story
test["Remove story is 204"] = function (test) {
	member.put('/data/story/remove')
	.send(memberSession.firstStory)
	.expect(204)
	.end(checkFirstStory(memberSession.firstStory, test));
};

// Archive story
test["Archive story is 204"] = function (test) {
	member.put('/data/story/archive')
	.send(memberSession.firstStory)
	.expect(204)
	.end(checkArchive);

	function checkArchive(err) {
		test.ifError(err);

		member.get('/data/' + memberSession.circle._id + '/archives')
		.expect(200)
		.expect(function (res) {
			var archives = res.body;
			var newArchiveFound = false;
			var storyId = memberSession.firstStory.id;
			for (var index in archives) {
				if (storyId === archives[index].storyId) {
					newArchiveFound = true;
				}
			}
			test.ok(newArchiveFound, "new archive found");
		})
		.end(checkFirstStory(memberSession.firstStory, test));
	}
};

// Update story
test["Update story is 200"] = function (test) {
	var story = memberSession.firstStory;
	story.summary += " summary!";
	story.description += " description!";
	story.owner += " owner!";
	story.newComment = "new comment!";

	member.put('/data/story/')
	.send(story)
	.expect(200)
	.end(checkStory);

	function checkStory(err) {
		test.ifError(err);

		member.get('/data/story/' + story.id)
		.expect(200)
		.expect(function (res) {
			var saved = res.body;
			test.equal(saved.summary, story.summary, "story summary");
			test.equal(saved.description, story.description, "story description");
			test.equal(saved.owner, story.owner, "story owner");
			var commentFound = false;
			for(var key in saved.comments) {
				if (saved.comments[key].text === story.newComment) {
					commentFound = true;
				}
			}
			test.ok(commentFound, "comment found");
			memberSession.firstStory = saved;
		})
		.end(finish(test));
	}
};

// Add comment
test["Save comment is 200"] = function (test) {
	var data = {
		circleId: memberSession.circle._id,
		storyId: memberSession.firstStory.id,
		comment: "comment for testing"
	};

	member.put('/data/story/comment')
	.send(data)
	.expect(200)
	.end(checkStory);

	function checkStory(err) {
		test.ifError(err);

		member.get('/data/story/' + data.storyId)
		.expect(200)
		.expect(function (res) {
			var saved = res.body;
			var commentFound = false;
			for (var key in saved.comments) {
				if (saved.comments[key].text === data.comment) {
					commentFound = true;
				}
			}
			test.ok(commentFound, "comment found");
			memberSession.firstStory = saved;
		})
		.end(finish(test));
	}
};

// Remove member
test["Remove member is 204"] = function (test) {
	var memberToRemove = undefined;
	var storiesUrl = '/data/' + adminSession.circle._id + '/stories';

	member.get('/data/user')
	.expect(200)
	.end(function (err, res) {
		test.ifError(err);
		memberToRemove = res.body;
		getStoriesBefore();
	});

	function getStoriesBefore() {
		member.get(storiesUrl)
		.expect(200)
		.end(removeMember)
	}

	function removeMember(err) {
		test.ifError(err);
		admin
		.put('/data/' + adminSession.circle._id + '/member/remove')
		.send(memberToRemove)
		.expect(204)
		.end(getStoriesAfter);
	}

	function getStoriesAfter(err) {
		test.ifError(err);
		member
		.get(storiesUrl)
		.expect(403)
		.end(finish(test));
	}
};


// Update profile
// Change password

// Subscribe
// Unsubscribe
// Donate

// Paging archives
// Mainframe: Update setting
// Check list integrity

test['database tear down'] = function (test) {
	var destroyTestDatabase = function (callback) {
		nano.db.destroy(databaseName, callback);
	};
	var destroyTestSessionsDb = function (callback) {
		nano.db.destroy(sessionsDatabaseName, callback);
	};

	var destroy = [destroyTestDatabase, destroyTestSessionsDb];
	async.series(destroy, function (err, results) {
		test.ifError(err);
		test.done();
	});
};

exports[''] = test;
