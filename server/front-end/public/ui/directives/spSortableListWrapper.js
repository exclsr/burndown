'use strict';
angular.module('CircleBlvd.directives').
directive('spSortableListWrapper', [ 
function () {
    // We're a wrapper around a Vue component.

    var elementId = "#sortableList";
    var watch = function (prop, scope) {
        scope.$watch(prop, function (newVal) {
            if (scope.vue) {
                scope.vue.$data[prop] = scope[prop];
            }
        });
    };

    return {
        require: '^^cbHighlightedStories',
        restrict: 'A',
        link: function (scope, element, attr, highlightedStories) {
            scope.$watch('stories', function (newVal, oldVal) {
                if (newVal && newVal.length) {
                    if (scope.vue) {
                        scope.vue.$data.stories = scope.stories;
                    }
                    else {
                       mount();
                    }
                }
            });

            watch('searchEntry', scope);
            watch('selectedOwner', scope);
            watch('selectedLabels', scope);

            function mount() {
                scope.vue = new Vue({
                    el: elementId,
                    data: {
                        stories: scope.stories,
                        searchEntry: scope.searchEntry,
                        selectedOwner: scope.selectedOwner,
                        selectedLabels: scope.selectedLabels
                    },
                    methods: {
                        archive: function (id) {
                            // TODO: This works, but then our list is not updated.
                            scope.$emit('storyArchived', { id: id });
                        },
                        highlight: function (id) {
                            scope.$emit('storyHighlight', id, 'single');
                        },
                        updateStory: function (newVal) {
                            for (var index in this.stories) {
                                var story = this.stories[index];
                                if (story.id === newVal.id) {
                                    Vue.set(this.stories, index, newVal);
                                }
                            }
                        },
                        selectLabel: function (text) {
                            scope.$emit('labelSelected', text);
                        },
                        selectOwner: function (owner) {
                            scope.$emit('ownerSelected', owner);
                        },
                        shouldHide: function (story) {
                            var selectedOwner = this.selectedOwner;
                            var searchEntry = this.searchEntry;
                            var selectedLabels = this.selectedLabels;

                            var shouldHide = false;

                            // Always show deadlines and next meeting, 
                            // so that people have context for the tasks
                            if (story.isDeadline || story.isNextMeeting) {
                                return false;
                            }

                            // Search
                            if (searchEntry && searchEntry.length > 0) {
                                for (index in searchEntry) {
                                    if (story.summary.toLowerCase().indexOf(searchEntry[index]) < 0) {
                                        if (story.owner && story.owner.toLowerCase().indexOf(searchEntry[index]) >= 0) {
                                            // Stay cool.
                                        }
                                        else {
                                            shouldHide = true;
                                        }
                                    }
                                }
                            }

                            // Labels
                            if (selectedLabels.length > 0) {
                                if (!story.labels || story.labels.length <= 0) {
                                    shouldHide = true;
                                }
                                else {
                                    for (var selectedLabelIndex in selectedLabels) {
                                        var selectedLabel = selectedLabels[selectedLabelIndex];
                                        if (story.labels.indexOf(selectedLabel) < 0) {
                                            shouldHide = true;
                                            break;
                                        }
                                    }   
                                }
                            }

                            // Owner filter
                            if (selectedOwner) {
                                if (story.owner !== selectedOwner) {
                                    shouldHide = true;
                                }
                            }

                            return shouldHide;
                        }
                    },
                    created: function () {
                        var self = this;
                        scope.$on('storyHighlighted', function (e, story) {
                            self.updateStory(story);
                        });
                        scope.$on('storyUnhighlighted', function (e, story) {
                            self.updateStory(story);
                        });
                        scope.$on('storyOrderUpdated', function () {
                            for (var index in scope.stories) {
                                Vue.set(self.stories, index, scope.stories[index]);
                            }
                        });


                    }
                });

            }
        }
    }
}]);