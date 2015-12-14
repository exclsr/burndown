'use strict';

/* Directives */
var entityMap = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': '&quot;',
	"'": '&#39;',
	"/": '&#x2F;'
};

function escapeHtml(string) {
	return String(string).replace(/[&<>"'\/]/g, function (s) {
		return entityMap[s];
	});
}


angular.module('myApp.directives', []).
directive('appendLinky', ['$filter', function ($filter) {
	return {
		restrict: 'A',
		replace: true,
		scope: { ngModel: '=ngModel' },
		link: function (scope, element, attrs, controller) {
			scope.$watch('ngModel', function (value) {
				value = $filter('linky')(value);
				element.html(element.html() + value);
			});
		}
	};
}]).
directive('spStorySummary', function () {
	return {
		restrict: 'E',
		templateUrl: 'ui/views/storySummary.html',
		controller: StorySummaryCtrl
	};
}).
directive('spStory', function () {
	return {
		restrict: 'E',
		templateUrl: 'ui/views/story.html',
		controller: StoryCtrl
	};
}).
directive('spRoadmapMilepost', function () {
	return {
		restrict: 'E',
		templateUrl: 'ui/views/roadmapMilepost.html',
		controller: RoadmapMilepostCtrl
	};
}).
directive('spStoryList', function () {
	return {
		restrict: 'E',
		templateUrl: 'ui/views/storyList.html',
		controller: StoryListCtrl,
		scope: {
			data: '=',
			accountName: '=',
			owners: '=',
			enableAltMode: '=',
			mindset: '=',
			isFacade: '=',
			isChecklist: '=',
			keyboard: '=',
			mouse: '='
		}
	}
}).
directive('autosize', ['$timeout', function ($timeout) {
	return {
		restrict: 'A',
		link: function(scope, elem, attr, ctrl) {
			// Uses: https://github.com/jackmoore/autosize
			// If this isn't in a timeout block then it
			// gets fired before things are ready to be
			// resized.
			$timeout(function () {
				var isOneRow = attr.rows === "1";
				// This allows us to have the comments area
				// stay at 1 row until people click on it.
				if (isOneRow) {
					elem.focus(function () {
						elem.autosize();
					})
				}

				// For elements that are initially hidden,
				// do not run autosize right now. Also do not
				// run autosize on elements that are meant to be
				// one row to begin with.
				if (!angular.isDefined(attr.showModel) && !isOneRow) {
					elem.autosize();
				}

				// Trigger a resize when the model value is
				// changed to "" or something equivalent.
				scope.$watch(attr.ngModel, function (newVal) {
					if (!newVal) {
						elem.trigger('autosize.resize');
					}
				});

				// showModel is a variable that is set to true when
				// the textarea is to be shown. We need this if we 
				// want to resize elements that are initially hidden.
				scope.$watch(attr.showModel, function (newVal, oldVal) {
					if (!oldVal && newVal) {
						$timeout(function () {
							elem.autosize();
						});
					}
				});
			});
		}
	};
}]).
directive('typeaheadOwners', function () {
	return {
		restrict: 'A',
		link: function(scope, elem, attr, ctrl) {
			// Uses: https://github.com/twitter/typeahead.js
			var array = scope.owners; 
			var sourceFunction = function (query, callback) {
				if (!query || query === "") {
					return callback(array);
				}
				// HACK: This is a quick hack to migrate
				// from Bootstrap 2 to 3. Actual work should
				// be done on this.
				var matches = [];
				var lowerCaseQuery = query.toLowerCase();
				angular.forEach(array, function (owner) {
					var lowerCaseOwner = owner.toLowerCase();
					if (lowerCaseOwner.slice(0, query.length) === lowerCaseQuery) {
						matches.push(owner);
					}
				});
				callback(matches);
			};

			var displayKeyFunction = function (obj) {
				return obj;
			};

			var options = {
				hint: true,
				highlight: true,
				minLength: 0
			};
			var dataset = {
				source: sourceFunction,
				displayKey: displayKeyFunction
			};

			elem.typeahead(options, dataset);

			var hack = {
				isKeypressed: false,
				openedVal: undefined
			};

			elem.keypress(function () {
				hack.isKeypressed = true;
			});

			elem.on("typeahead:selected", function (jQuery, suggestion, datasetName) {
				elem.trigger('input');
			});

			elem.on("typeahead:closed", function () {
				// HACK: Why we need this, I have no idea.
				// Otherwise elem.val() is the empty string.
				if (!hack.isKeypressed) {
					elem.val(hack.openedVal);	
				}
			});
			elem.on("typeahead:opened", function () {
				hack.openedVal = elem.val();
			});

			
			elem.on("typeahead:cursorchanged", function (jQuery, suggestion, datasetName) {
				// This messes up the selection highlight.
				// elem.trigger('input');
			});

			elem.on("typeahead:autocompleted", function (jQuery, suggestion, datasetName) {
				elem.trigger('input');				
			});
		}
	};
});
