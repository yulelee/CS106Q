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

        $scope.mainPageModel.pickBucket = function(bucket_id) {
            var PickBucket = $resource("/pickBucket", {}, {post: {method: "post", isArray: false}});
            console.log(bucket_id);
            PickBucket.post({
                bucket_id: bucket_id
            }, function(sl) {
                console.log(sl);
                $scope.main.curSL = sl;
            }, function(err) {
                console.log(err);
            });
        };

        $scope.mainPageModel.putBackBucket = function(bucket_id) {
            var PutBackBucket = $resource("/putBackBucket", {}, {post: {method: "post", isArray: false}});
            console.log(bucket_id);
            PutBackBucket.post({
                bucket_id: bucket_id
            }, function(sl) {
                console.log(sl);
                $scope.main.curSL = sl;
            }, function(err) {
                console.log(err);
            });
        };

        $scope.mainPageModel.solveBucket = function(bucket_id) {
            var SolveBucket = $resource("/solveBucket", {}, {post: {method: "post", isArray: false}});
            SolveBucket.post({
                bucket_id: bucket_id
            }, function(sl) {
                console.log(sl);
                $scope.main.curSL = sl;
            }, function(err) {
                console.log(err);
            });
        };

    }
]);
