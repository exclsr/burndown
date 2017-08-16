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
            watch('searchEntry', scope);
            watch('selectedOwner', scope);
            watch('selectedLabels', scope);

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

            scope.$watchCollection('stories', function (newVal, oldVal) {
                if (!newVal || !oldVal) 
                    return;
                // When our Angular parent removes a story from the list,
                // we arrive here. Update our local data based on the 
                // new collection.
                if (newVal.length < oldVal.length && scope.vue) {
                    scope.vue.$data.stories = newVal;
                }
            });

            var isDragging = false;
            scope.$on('spIsDragging', function (e, val) {
                isDragging = val;
            });

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
                        archive: function (story) {
                            scope.$emit('storyArchived', story);
                        },
                        highlight: function (id) {
                            scope.$emit('storyHighlight', id, 'single');
                        },
                        editStory: function (story, editCallback) {
                            // Utility method for dealing with story updates.
                            // It's too clever, so please rewrite it if you 
                            // have the energy.
                            for (var index in this.stories) {
                                var current = this.stories[index];
                                if (current.id === story.id) {
                                    var edited = editCallback(current);
                                    Vue.set(this.stories, index, edited);
                                }
                            }
                        },
                        updateStory: function (newVal) {
                            this.editStory(newVal, function (edit) {
                                return newVal;
                            });
                        },
                        save: function (story) {
                            scope.$emit('storySaved', story);
                        },
                        selectLabel: function (text) {
                            scope.$emit('labelSelected', text);
                        },
                        selectOwner: function (owner) {
                            scope.$emit('ownerSelected', owner);
                        },
                        selectStory: function (story) {
                            if (isDragging || story.isBeingDragged) {
                                // Do nothing. We're dragging. See the note
                                // in 'drag:end' as to why.
                                return;
                            }

                            // Do not refocus stuff if we're already on this story.
                            if (!story.isSelected) {
                                scope.$emit('beforeStorySelected');
                                var selectedStory = null;
                                this.editStory(story, function (edit) {
                                    edit.isSelected = true;
                                    selectedStory = edit;
                                    return edit;
                                });
                                scope.$emit('storySelected', selectedStory);
                            }
                        },
                        deselectStory: function (story) {
                            if (story && story.isSelected) {
                                var editedStory = null;
                                this.editStory(story, function (edit) {
                                    edit.isSelected = false;
                                    editedStory = edit;
                                    return edit;
                                });
                                
                                scope.$emit('storyDeselected', editedStory);
                            }

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