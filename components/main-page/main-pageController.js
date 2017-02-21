'use strict';

cs106q.controller('MainPageController', ['$scope', '$routeParams', '$location', '$resource', '$rootScope', '$cookies',
    function($scope, $routeParams, $location, $resource, $rootScope, $cookies) {

        $scope.mainPageModel = {};

    	var getCurrentList = function (event, callback) {
    	    var GetCurrentList = $resource("/getCurrentList", {}, {get: {method: "get", isArray: true}});
    	    GetCurrentList.get({}, function(buckets) {
    	        $scope.main.buckets = buckets;
    	        console.log(buckets);
    	        if (callback) callback();
    	    }, function(response) {
    	    	console.log(response);
    	    });
    	};

    	getCurrentList();

    	$scope.$on("refreshCurrentList", getCurrentList);

        $scope.mainPageModel.removeBucket = function (bucket) {
            var DeleteBucket = $resource("/deleteBucket", {}, {post: {method: "post", isArray: false}});
            console.log(bucket._id);
            DeleteBucket.post({bucketId: bucket._id}, function() {
                console.log("deleted");
            }, function() {
                console.log("error");
            });
        };

    }
]);
