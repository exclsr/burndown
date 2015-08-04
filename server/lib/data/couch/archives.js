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

	var findArchivesByCircleId = function (circleId, params, callback) {
		var options = {
			startkey: [circleId, {}],
			endkey: [circleId],
			descending: true
		};

		if (params) {
			if (params.limit) {
				options.limit = params.limit;				
			}
			if (params.startkey) {
				options.startkey = [circleId, params.startkey];
			}
		}

		couch.view("archives/byCircleId", options, function (err, rows) {
			callback(err, rows);
		});
	};

	var countArchivesByCircleId = function (circleId, callback) {
		couch.findOneByKey("archives/countByCircleId", circleId, function (err, count) {
			count = count || 0;
			callback(err, count);
		});
	};

	// This is intended for mainframe reports -- to get
	// stats on all the archives.
	var getArchiveStats = function (callback) {
		var options = {
			group_level: 1,
			returnKeys: true
		};
		couch.view("archives/stats", options, callback);
	};

	return {
		add: addArchives,
		findByCircleId: findArchivesByCircleId,
		countByCircleId: countArchivesByCircleId,
		stats: getArchiveStats
	};
}(); // closure