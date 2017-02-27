'use strict';

var cs106q = angular.module('cs106q', ['ngRoute', 'ngMaterial', 'ngResource', 'ngMessages', 'ngCookies']);

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
			});
		};

		var serverPushBack = new EventSource('/registerClient');
		serverPushBack.addEventListener('message', serverPushBackCallback, false);


		// whether this is a section leader
		$scope.main.curSLsuid = undefined;
		$scope.main.curSLname = undefined;

		if ($cookies.get('logged_sl__id')) {
			$scope.main.curSLsuid = $cookies.get('logged_sl__id');
			$scope.main.curSLname = $cookies.get('logged_sl_name');
		}
	}
]);