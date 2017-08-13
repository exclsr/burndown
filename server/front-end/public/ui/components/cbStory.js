Vue.component('cb-story', {
    props: {
        id: String,
        isSelected: Boolean,

        isFirstStory: Boolean,
        isFirstAtLoad: Boolean,

        isDeadline: Boolean,
        isHighlighted: Boolean,
        isNextMeeting: Boolean,
        isAfterNextMeeting: Boolean,

        summary: String, 
        status: String
    }, 
    data: function () {
        return {
            isScreenXs: false
        };
    },
    computed: {
        cssClass: function () {
            var isClipboardActive = false;
            return ['story', 'col-xs-12', 'debug', 'no-select', {
                selected: this.isSelected,
                'not-selected': !this.isSelected,

                first: this.isFirstStory,
                'first-at-load': this.isFirstAtLoad,

                deadline: this.isDeadline,
                highlighted: this.isHighlighted && !isClipboardActive,
                'next-meeting': this.isNextMeeting,
                'after-meeting': this.isAfterNextMeeting
            }];
        },
        isStoryMineClass: function () {
            return "";
        }
    },
    methods: {
        highlight: function () {
            this.$emit('highlight', this.id);
        }
    },
    template: "" + 
    '<div v-bind:class="cssClass" @click="highlight" @mousedown="highlight">' +
        // TODO: Get the id, for scrolling
        '<div class="row no-select hidden-xs">' +
            '<div class="col-sm-10 paddy">' +
                '<div class="summary" :class="isStoryMineClass">' +
                    '{{summary}}' +
                '</div>' +
            '</div>' +
            '<div class="col-sm-1 paddy details icon">' +
    //         <div class="pull-right" ng-show="story.isOver" ng-click="select(story)">
    //             <span class="glyphicon glyphicon-option-horizontal"></span>
    //         </div>
            '</div>' +
            '<div class="col-sm-1 grippy">' +
                '<div class="pull-right grippy-viz">' +
                    '<span class="grippy-bar top"></span>' +
                    '<span class="grippy-bar"></span>' +
                    '<div class="row">' +
                         '<div class="col-sm-offset-5">' +
                            '<div class="glyphicon glyphicon-move">&nbsp;</div>' +
                         '</div>' +
                    '</div>' +
                    '<span class="grippy-bar top"></span>' +
                    '<span class="grippy-bar"></span>' +
                '</div>' +
            '</div>' +
            // TODO: bumpy
        '</div>' +
    '</div>'
});

// Old template, for reference:
//
// <div ng-if="::!isScreenXs" class="row no-select hidden-xs" ng-show="!story.isSelected" id="story-{{$index}}">
//     <div class="col-sm-10 paddy">
//         <div class="summary" ng-class="{mine: isStoryMine(story)}">
//             <sp-story-summary/>
//         </div>
//     </div>
//     <div class="col-sm-1 paddy details-icon">
//         <div class="pull-right" ng-show="story.isOver" ng-click="select(story)">
//             <span class="glyphicon glyphicon-option-horizontal"></span>
//         </div>
//     </div>
//     <div ng-if="(!isMindset('bump') && !isStoryDone(story)) || !story.isAfterNextMeeting || isMindset('roadmap')" 
//         class="col-sm-1 grippy">
//         <div class="pull-right grippy-viz">
//             <span class="grippy-bar top"></span>
//             <span class="grippy-bar"></span>
//             <div class="row">
//                 <div class="col-sm-offset-5">
//                     <div class="glyphicon glyphicon-move">&nbsp;</div>
//                 </div>
//             </div>
//             <span class="grippy-bar top"></span>
//             <span class="grippy-bar"></span>
//         </div>
//     </div>

//     <div ng-if="(isMindset('bump') || isStoryDone(story)) && story.isAfterNextMeeting && !isMindset('roadmap')" 
//         class="col-sm-1 bumpy"
//         ng-mousedown="beforeMoveToTop($event, story)"
//         ng-click="moveToTop($event, story)">
//         <div class="pull-right bumpy-viz">
//             <div ng-hide="story.isFirstStory" 
//             class="glyphicon glyphicon-chevron-up">&nbsp;</div>
//         </div>
//     </div>
// </div>

// Old ng-class block:
//
// <div class="story col-xs-12 debug no-select" ng-class="{ 
//         'col-sm-12': isMindset('roadmap'),
//         'col-sm-8': !isMindset('roadmap'),
//         selected: story.isSelected, 
//         'not-selected': !story.isSelected,
//         first: story.isFirstStory,
//         'first-at-load': story.isFirstAtLoad,
//         deadline: story.isDeadline,
//         'next-meeting': story.isNextMeeting,
//         'after-meeting': story.isAfterNextMeeting,
//         highlighted: story.isHighlighted && !isClipboardActive,
//         'team-highlighted': isStoryHighlightedByTeam(story),
//         inClipboard: story.isInClipboard,
//         mine: isStoryMine(story)
//     }"
//     ng-style="{ 'background-color': 
//         !story.isAfterNextMeeting && !story.isDeadline && !story.isSelected ? 'rgba(255,231,176,' + (1 - $index * 0.12) + ')' : ''}"
//     ng-dblclick="select(story)" 
//     ng-click="handleSingleClicks(story)"
//     ng-mousedown="highlight(story)"
//     ng-mouseenter="mouseEnter(story)"
//     ng-mouseleave="mouseLeave(story)">



