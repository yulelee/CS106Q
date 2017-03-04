'use strict';

cs106q.controller('MainPageController', ['$scope', '$routeParams', '$location', '$resource', '$rootScope', '$cookies',
    function($scope, $routeParams, $location, $resource, $rootScope, $cookies) {

        $scope.mainPageModel = {};

        var mimic = function(a, b) {

            // go through the first list, if the element is not in the second list, remove it from the first list
            for (var i = 0; i < a.length; i++) {
                var seen = false;
                for (var j = 0; j < b.length; j++) {
                    if (a[i]._id === b[j]._id) {
                        seen = true;
                        break;
                    }
                }
                if (!seen) {
                    a.splice(i, 1);
                    i--;
                }
            }
            // do the second pass, loop through the new bucket list, and insert potential new buckets
            for (var k = 0; k < b.length; k++) {
                if (a.length <= k || a[k]._id !== b[k]._id) {
                    a.splice(k, 0, b[k]); // this element has to be at that index
                }
                // it's possible that there are more students in the bucket!
                a[k].students = b[k].students;
                a[k].studentSuids = b[k].studentSuids;
            }

        };

    	var getCurrentList = function (event, callback) {
    	    var GetCurrentList = $resource("/getCurrentList", {}, {get: {method: "get", isArray: false}});
    	    GetCurrentList.get({}, function(buckets) {
                if (!$scope.main.buckets) $scope.main.buckets = buckets;
                else {
                    mimic($scope.main.buckets.waiting, buckets.waiting);
                    mimic($scope.main.buckets.helping, buckets.helping);
                    mimic($scope.main.buckets.solved, buckets.solved);
                }
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

        // export this function to main
        $scope.main.putBackBucket = $scope.mainPageModel.putBackBucket;

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

        // export this function to main
        $scope.main.solveBucket = $scope.mainPageModel.solveBucket;

    }
]);
