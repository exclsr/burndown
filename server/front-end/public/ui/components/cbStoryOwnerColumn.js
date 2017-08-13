Vue.component('cb-story-owner-column', {
    props: {
        id: String,
        isAfterNextMeeting: Boolean,
        owner: String
    },
    data: function () {
        return {
            isScreenXs: false // TODO ...
        }
    },
    computed: {
        isAfterClass: function () {
            return this.isAfterNextMeeting ? "after" : "";
        }
    },
    methods: {},
    template: "" + 
    '<div v-if="!isScreenXs" class="backlog-owner hidden-xs col-sm-2 debug no-select hide-mindset-roadmap" :class="isAfterClass">' +
        '<span class="owner-name">{{owner}}</span><span class="show-status-new">?</span>' +
        // TODO: Notification ...
    '</div>'
});

// Old template, for reference:
//
// <div class="backlog-owner hidden-xs col-sm-2 debug no-select hide-mindset-roadmap" 
//     ng-if="::!isScreenXs"
//     ng-class="{'after': story.isAfterNextMeeting}"
//     ng-dblclick="select(story)">
//     <span class="owner-name" ng-mousedown="selectOwner(story.owner)">{{story.owner}}</span><span class="show-status-new">?</span>
//     <div 
//         class="notify" 
//         ng-if="::isNotificationEnabled()"
//         ng-class="{ notified: story.isOwnerNotified }"
//         ng-show="isOwnerInCircle(story.owner) && isStoryNew(story)"
//         title="notify owner"><i class="glyphicon glyphicon-envelope" ng-click="notify(story, $event)"></i>
//         <span ng-show="story.isNotifying">o</span>
//         <i ng-show="story.isOwnerNotified" title="ok!" class="glyphicon glyphicon-ok"></i>
//     </div>
// </div>
