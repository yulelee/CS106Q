'use strict';

cs106q.controller('MainPageController', ['$scope', '$routeParams', '$location', '$resource', '$rootScope', '$cookies',
    function($scope, $routeParams, $location, $resource, $rootScope, $cookies) {

    	var getCurrentList = function (event, callback) {
    		console.log(callback);
    	    var UserFavs = $resource("/getCurrentList", {}, {get: {method: "get", isArray: true}});
    	    UserFavs.get({}, function(buckets) {
    	        $scope.main.buckets = buckets;
    	        console.log(buckets);
    	        if (callback) callback();
    	    }, function(response) {
    	    	console.log(response);
    	    });
    	};

    	getCurrentList();

    	$scope.$on("refreshCurrentList", getCurrentList);

    }
]);
