'use strict';

var cs106q = angular.module('cs106q', ['ngRoute', 'ngMaterial', 'ngResource', 'ngMessages', 'ngCookies']);

cs106q.config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/', {
		templateUrl: 'components/main-page/main-pageTemplate.html',
		controller: 'MainPageController'
	});
}]);

cs106q.controller('MainController', ['$scope', '$routeParams', '$location', '$resource', '$rootScope', '$http', '$cookies', '$timeout', '$mdSidenav', '$mdDialog',
	function($scope, $routeParams, $location, $resource, $rootScope, $http, $cookies, $timeout, $mdSidenav, $mdDialog) {
		$scope.main = {};
		$scope.main.buckets = undefined;


		var serverPushBackCallback = function () {
			console.log("back!");
			$scope.$apply(function () {
				$rootScope.$broadcast("refreshCurrentList");
			});
		};

		var serverPushBack = new EventSource('/registerClient');
		serverPushBack.addEventListener('message', serverPushBackCallback, false);

		// serverPushBack.onmessage = serverPushBackCallback;
	}
]);