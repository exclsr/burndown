'use strict';

function AdminCtrl(session, $scope, $http) {

	var defaultProjectId = "1";

	var addUserSuccess = function() {
		$scope.userName = "";
		$scope.userEmail = "";
		$scope.userPassword = "";
		
		getLatestUserData();
	};

	var addUserFailure = function() {
		console.log("Sad inside add user. :(");
	};

	$scope.addUser = function(userName, userEmail, userPassword) {
		var data = {
			name: userName,
			email: userEmail,
			password: userPassword
		};

		$http.put('/data/users/add', data)
		.success(addUserSuccess)
		.error(addUserFailure);
	};

	$scope.removeUser = function (user) {
		var data = user;

		$http.put('/data/users/remove', data)
		.success(function() {
			getLatestUserData();
		})
		.error(function (data) {
			console.log(data);
		});
	};

	var getUsersSuccess = function(data, status, headers, config) {
		if (data === {}) {
			// do nothing. 
		}
		else {
			$scope.users = data;
		}
	};

	var getUsersFailure = function(data, status, headers, config) { 
		if (status === 401 && $scope.isSignedIn()) {
			// && is admin ...
			$scope.signOut();
			console.log("The server was restarted. Please sign in again.");
		}
	};

	var getLatestUserData = function() {
		$http.get('/data/users')
		.success(getUsersSuccess)
		.error(getUsersFailure);
	};


	var getGroupsSuccess = function(data, status, headers, config) {
		if (data === {}) {
			// do nothing. 
		}
		else {
			$scope.groups = data;
		}
	};

	var getLatestGroupData = function() {
		$http.get('/data/' + defaultProjectId + '/groups')
		.success(getGroupsSuccess)
		.error(function (data, status) {
			console.log(data);
			console.log(status);
		});
	};

	var addGroupSuccess = function() {
		$scope.groupName = "";
		getLatestGroupData();
	};

	var addGroupFailure = function(things, status) {
		console.log(things);
		console.log(status);
		console.log("Sad inside add group. :(");
	};

	$scope.addGroup = function (groupName) {
		var data = {
			name: groupName,
			projectId: defaultProjectId // TODO: Notion of projects inside groups, yes?
		};

		$http.post('/data/group', data)
		.success(addGroupSuccess)
		.error(addGroupFailure);
	};


	var init = function () {
		getLatestUserData();
		getLatestGroupData();
	}

	init();
}
AdminCtrl.$inject = ['session', '$scope', '$http'];
