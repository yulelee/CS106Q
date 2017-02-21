'use strict';

cs106q.controller('MainPageController', ['$scope', '$routeParams', '$location', '$resource', '$rootScope', '$cookies',
    function($scope, $routeParams, $location, $resource, $rootScope, $cookies) {

    	$scope.mainPageModel = {};

    	var getCurrentList = function () {
    	    var UserFavs = $resource("/getCurrentList", {}, {get: {method: "get", isArray: true}});
    	    UserFavs.get({}, function(buckets) {
    	        $scope.mainPageModel.buckets = buckets;
    	        console.log(buckets);
    	    }, function(response) {
    	    	console.log(response);
    	    });
    	};

    	getCurrentList();

    	$scope.$on("refreshCurrentList", getCurrentList);

    }
]);
