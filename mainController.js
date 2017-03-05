'use strict';

var cs106q = angular.module('cs106q', ['ngRoute', 'ngMaterial', 'ngResource', 'ngMessages', 'ngCookies', 'ngAnimate']);

cs106q.config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/', {
		templateUrl: 'components/main-page/main-pageTemplate.html',
		controller: 'MainPageController'
	});
}]);

cs106q.controller('MainController', ['$scope', '$routeParams', '$location', '$resource', '$rootScope', '$http', '$cookies', '$timeout', '$window',
	function($scope, $routeParams, $location, $resource, $rootScope, $http, $cookies, $timeout, $window) {
		$scope.main = {};
		$scope.main.buckets = undefined;

		var serverPushBackCallback = function () {
			$scope.$apply(function () {
				$rootScope.$broadcast("refreshCurrentList");
				$rootScope.$broadcast("refreshSLlist");
				$rootScope.$broadcast("getMessageList");
			});
		};

		var serverPushBack = new EventSource('/registerClient');
		serverPushBack.addEventListener('message', serverPushBackCallback, false);

		// whether this is a section leader
		$scope.main.curSL = undefined;

		// the messages to show on the side bar
		$scope.main.slMessages = undefined;

		// if there is a sl in cookie, this means that there is a sl logged-in, therefore automatically log in.
		if ($cookies.get('logged_sl__id')) {
			var GetSL = $resource("/getSL", {}, {get: {method: "get", isArray: false}});
			GetSL.get({}, function(sl) {
			    $scope.main.curSL = sl;
			    $rootScope.$broadcast("refreshSLlist");
			}, function(err) {
			    console.log(err);
			});
		}
	}
]);