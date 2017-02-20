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
        
    }
]);