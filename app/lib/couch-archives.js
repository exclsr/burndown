var couch = require('./couch.js');
var database = couch.db;

module.exports = function () {

	var addArchives = function(archives, callback) {
		var bulkDoc = {};
		var options = {};
		bulkDoc.docs = [];

		archives.forEach(function (archive) {
			archive.type = "archive";
			bulkDoc.docs.push(archive);
		});
		database.bulk(bulkDoc, options, callback);
	};

	var findArchivesByCircleId = function (circleId, callback) {
		var options = {
			startkey: [circleId, {}],
			endkey: [circleId],
			descending: true
		};
		couch.view("archives/byCircleId", options, function (err, rows) {
			callback(err, rows);
		});
	};

	return {
		add: addArchives,
		findByCircleId: findArchivesByCircleId
	};
}(); // closure