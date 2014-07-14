var couch = require('./couch.js');
couch.circles = require('./couch-circles.js');

module.exports = function () {

	var addCircle = function (circle, callback) {
		var newCircle = {
			name: circle.name,
			createdBy: circle.createdBy
		};

		couch.circles.add(newCircle, function (err, body) {
			if (err) {
				return callback(err);
			}

			newCircle._id = body.id;
			newCircle._rev = body.rev;
			callback(null, newCircle);
		});
	};

	var updateCircle = function (circle, callback) {
		couch.circles.update(circle, callback);
	};

	var count = function countCircles (callback) {
		couch.circles.count(callback);
	};
	
	return {
		add: addCircle,
		count: count,
		getAll: function (callback) {
			couch.circles.getAll(callback);
		},
		findByUser: function (user, callback) {
			couch.circles.findByUser(user, callback);
		},
		update: updateCircle
	};
}(); // closure
