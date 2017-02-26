'use strict';

cs106q.controller('SideBarController', ['$scope', '$routeParams', '$location', '$resource', '$rootScope', '$cookies', '$element',
    function($scope, $routeParams, $location, $resource, $rootScope, $cookies, $element) {
    	$scope.form = {};
    	$scope.classes = ['CS106A', 'CS106B', 'CS106X'];
    	$scope.types = ['Debugging', 'Conceptual'];

    	$scope.newBucket = {};

    	var clearRegisterForm = function() {
    		$scope.newBucket.suid = undefined;
    		$scope.newBucket.firstName = undefined;
    		$scope.newBucket.lastName = undefined;
    		$scope.newBucket.description = undefined;
    		$scope.newBucket.class = 'CS106A';
    		$scope.newBucket.type = 'Debugging';
            $scope.newBucket.existingPick = null;
    	}

    	clearRegisterForm();

    	$scope.newBucket.doRegister = function() {
            if ($scope.newBucket.type === 'Conceptual' && $scope.newBucket.existingPick !== null) {
                var newBucketRegister = $resource("/insertNew", {}, {insertNew: {method: "post", isArray: false}});
                newBucketRegister.insertNew({
                    suid: $scope.newBucket.suid, 
                    studentName: $scope.newBucket.firstName + ' ' + $scope.newBucket.lastName,
                    _id: $scope.newBucket.existingPick._id
                }, function(user) {
                    console.log(user);
                    $scope.form.studentRegister.$setPristine();
                    $scope.form.studentRegister.$setUntouched();
                    clearRegisterForm();
                    $rootScope.$broadcast("refreshCurrentList");
                }, function(response) {
                    console.log(response);
                });
            }
            else {
                var newBucketRegister = $resource("/putnew", {}, {putnew: {method: "post", isArray: false}});
                newBucketRegister.putnew({
        	    	suid: $scope.newBucket.suid, 
        	    	studentName: $scope.newBucket.firstName + ' ' + $scope.newBucket.lastName,
        	    	description: $scope.newBucket.description,
        	    	class: $scope.newBucket.class,
        	    	type: $scope.newBucket.type
        	    }, function(user) {
        	        console.log(user);
        	        $scope.form.studentRegister.$setPristine();
        	        $scope.form.studentRegister.$setUntouched();
        	        clearRegisterForm();
                    $rootScope.$broadcast("refreshCurrentList");
        	    }, function(response) {
        	        console.log(response);
        	    });
            }
    	};

        $scope.filterConceptualBuckets = function(bucket) {
            console.log(bucket);
            if (bucket.type === 'Conceptual') {
                if ($scope.newBucket.class === undefined) {return true;}
                else {return $scope.newBucket.class === bucket.class;}
            } else {return false;}
        };

        $scope.slLogin = {};
        $scope.slLogin.suid = undefined;
        $scope.slLogin.login = function() {
            var slLogin = $resource("/slLogin", {}, {slLogin: {method: "post", isArray: false}});
            slLogin.slLogin({
                suid: $scope.slLogin.suid
            }, function(user) {
                console.log(user);
                // $scope.form.studentRegister.$setPristine();
                // $scope.form.studentRegister.$setUntouched();
                // clearRegisterForm();
                // $rootScope.$broadcast("refreshCurrentList");
            }, function(response) {
                console.log(response);
            });
        };

        $scope.slLogin.logout = function() {
            var slLogout = $resource("/slLogout", {}, {slLogout: {method: "post", isArray: false}});
            slLogout.slLogout({
            }, function(user) {
                console.log(user);
                // $scope.form.studentRegister.$setPristine();
                // $scope.form.studentRegister.$setUntouched();
                // clearRegisterForm();
                // $rootScope.$broadcast("refreshCurrentList");
            }, function(response) {
                console.log(response);
            });
        };
        
    }
]);
