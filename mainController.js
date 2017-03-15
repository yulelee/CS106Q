'use strict';

var cs106q = angular.module('cs106q', ['ngRoute', 'ngMaterial', 'ngResource', 'ngMessages', 'ngCookies', 'ngAnimate', 'vAccordion']);

cs106q.controller('MainController', ['$scope', '$routeParams', '$location', '$resource', '$rootScope', '$http', '$cookies', '$timeout', '$window',
	function($scope, $routeParams, $location, $resource, $rootScope, $http, $cookies, $timeout, $window) {
		$scope.main = {};
		$scope.main.buckets = undefined;

		$scope.main.refreshEverything = function() {
			$rootScope.$broadcast("refreshCurrentList");
			$rootScope.$broadcast("refreshSLlist");
			$rootScope.$broadcast("getMessageList");
			$rootScope.$broadcast("getCurInfo");
			$rootScope.$broadcast("refreshSL");
		};

		var serverPushBackCallback = function () {
			$scope.$apply(function () {
				$scope.main.refreshEverything();
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
		if ($cookies.get('logged_sl__id')) {
			var GetSL = $resource("/getSL", {}, {get: {method: "get", isArray: false}});
			GetSL.get({}, function(sl) {
			    $scope.main.curSL = sl;
			    $scope.main.refreshEverything();
			}, function(err) {
			    console.log(err);
			});
		}

		var refreshSL = function() {
			if ($scope.main.curSL && $cookies.get('logged_sl__id') && $scope.main.curSL._id === $cookies.get('logged_sl__id')) {
				var GetSL = $resource("/getSL", {}, {get: {method: "get", isArray: false}});
				GetSL.get({}, function(sl) {
				    $scope.main.curSL = sl;
				}, function(err) {
				    console.log(err);
				});
			}
		};

		$scope.$on("refreshSL", refreshSL);
	}
]);