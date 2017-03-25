'use strict';

var cs106q = angular.module('cs106q', ['ngRoute', 'ngMaterial', 'ngResource', 'ngCookies', 'ngAnimate']);

cs106q.controller('MainController', ['$scope', '$resource', '$rootScope', 'curSL',
	function($scope, $resource, $rootScope, curSL) {
		$scope.main = {};

		$scope.main.refreshEverything = function() {
			$rootScope.$broadcast("refreshCurrentList");
			$rootScope.$broadcast("refreshSLlist");
			$rootScope.$broadcast("getMessageList");
			$rootScope.$broadcast("getCurInfo");
			$rootScope.$broadcast("refreshSL");
		};

		$scope.$on("refreshEverything", $scope.main.refreshEverything);

		var serverPushBackCallback = function(event) {
			$scope.$apply(function () {
				if (event.data === 'refresh') { $scope.main.refreshEverything(); }
				if (event.data === 'forceLogout') { curSL.refresh(); }
			});
		};

		var serverPushBack = new EventSource('/registerClient');
		serverPushBack.addEventListener('message', serverPushBackCallback, false);

		// whether this is a section leader
		$scope.main.curSL = undefined;

		// the messages to show on the side bar
		$scope.main.slMessages = undefined;

		// the basic info for the queue
		$scope.main.queueInfo = undefined;

		// if there is a sl in cookie, this means that there is a sl logged-in, therefore automatically log in.
		curSL.initFromCookie().then(function() {
			$scope.main.refreshEverything();
		}).catch(function() {
			console.log('failed initialize the sl from cookie.');
		});

		var refreshSL = function() {
			$scope.main.curSL = curSL.getCurSl();
		};

		$scope.$on("refreshSL", refreshSL);
	}
]);