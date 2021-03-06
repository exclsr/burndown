CircleBlvd.Services.lib = function ($http) {

    var LabelRegex = /[:;,<> \\\{\[\(\!\?\.\`\'\"\*\)\]\}\/]/;
    var ReplaceLabelRegex = /[#:;,<> \\\{\[\(\!\?\.\`\'\"\*\)\]\}\/]/g;

    var signIn = function (email, password, callback) {
        var user = {
            email: email,
            password: password
        };
        var xsrf = $.param(user);
        var request = {
            method: 'POST',
            url: '/auth/signin',
            data: xsrf,
            headers: {'Content-Type': 'application/x-www-form-urlencoded'}
        };      

        $http(request)
        .success(function (user, status) {
            callback(null, user);
        })
        .error(function (data, status) {
            var err = new Error(data)
            err.status = status;
            callback(err);
        });
    };

    var mindset = function () {
        var mindset = 'detailed';
        return {
            get: function () {
                return mindset;
            },
            set: function (m) {
                mindset = m;
            },
            is: function (m) {
                return m === mindset;
            }
        }
    }();


    // Options:
    //  * profileName: name associated with @@ assignment
    //  * owners: list of acceptable owner names (with @ assignment)
    var parseStory = function (line, options) {
        var story = {};

        line = line.trim();
        // One-character tasks
        if (line.length === 1) {
            story.summary = line;
            return story;
        }
        
        // Parse mileposts
        if (line.indexOf('--') === 0) {
            story.isDeadline = true;
            // Remove all preceding hyphens,
            // so mileposts denoted with '----' 
            // are also possible.
            while (line.indexOf('-') === 0) {
                line = line.substring(1);
            }
            line = line.trim();
        }

        // Parse status
        if (line.indexOf("!!") === line.length-2) {
            story.status = "done"
            line = line.substring(0, line.length-2);
        }
        else if (line.indexOf("!") === line.length-1) {
            story.status = "assigned";
            line = line.substring(0, line.length-1);
        }

        // Parse owners
        if (line.length > 1
            && line.substring(line.length-2, line.length) === "@@") {
            story.owner = options.profileName;
            line = line.substring(0, line.length-2).trim();
        }
        else {
            // TODO: Allow assigning of owners that are not
            // in the owners list.
            var owners = options.owners || [];
            var ownerFound = story.isDeadline || false;
            var lowerCaseLine = line.toLowerCase();
            owners.forEach(function (owner) {
                if (ownerFound) {
                    return;
                }
                var lowerCaseOwner = owner.toLowerCase();
                // owners start with the @ sign and
                // are at the end of the line
                var ownerIndex = lowerCaseLine.indexOf(lowerCaseOwner);
                if (ownerIndex > 0 
                    && line[ownerIndex-1] === '@'
                    && line.length === ownerIndex + owner.length) {
                    ownerFound = true;
                    story.owner = owner;
                    line = line.substring(0, ownerIndex-1).trim();
                }
            });
        }

        // Parse labels
        story.labels = [];
        var words = line.split(LabelRegex);
        words.forEach(function (word) {
            if (word.indexOf('#') === 0) {
                story.labels.push(word.slice(1));
            }
        });

        story.summary = line;
        return story;
    };

    // When passed a block of tasks from the
    // StoryList, what are the 'start' and
    // 'end' tasks in that block?
    function getStartAndEndOfBlock(storyBlock) {
        var idMap = {};
        var nextMap = {};

        storyBlock.forEach(function (story) {
            idMap[story.id] = story;
            nextMap[story.nextId] = story;
        });

        var start;
        var end;

        storyBlock.forEach(function (story) {
            if (!idMap[story.nextId]) {
                end = story;
            }
            if (!nextMap[story.id]) {
                start = story;
            }
        });

        // If the first clipboard element's next story
        // is also in the clipboard, that means the stories
        // are arranged from top to bottom.
        //
        // If not, they're bottom to top
        // if (map[storyBlock[0].nextId]) {
        //  start = storyBlock[0];
        //  end = storyBlock[storyBlock.length-1];
        // }
        // else {
        //  end = storyBlock[0];
        //  start = storyBlock[storyBlock.length-1];
        // }

        return {
            start: start,
            end: end
        };
    };

    return {
        signIn: signIn,
        consts: {
            ReplaceLabelRegex: ReplaceLabelRegex,
            LabelRegex: LabelRegex
        },
        getStartAndEndOfBlock: getStartAndEndOfBlock,
        mindset: mindset,
        parseStory: parseStory
    };
};
CircleBlvd.Services.lib.$inject = ['$http'];

angular.module('CircleBlvd.services')
.factory('lib', CircleBlvd.Services.lib);