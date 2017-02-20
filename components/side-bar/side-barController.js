'use strict';

cs106q.controller('SideBarController', ['$scope', '$routeParams', '$location', '$resource', '$rootScope', '$cookies',
    function($scope, $routeParams, $location, $resource, $rootScope, $cookies) {
    	$scope.form = {};
    	$scope.classes = ['CS106A', 'CS106B', 'CS106X'];
    	$scope.types = ['Debugging', 'Conceptual'];

    	$scope.newBucket = {};

    	var clearRegisterForm = function() {
    		$scope.newBucket.suid = undefined;
    		$scope.newBucket.firstName = undefined;
    		$scope.newBucket.lastName = undefined;
    		$scope.newBucket.description = undefined;
    		$scope.newBucket.class = undefined;
    		$scope.newBucket.type = undefined;
    	}

    	clearRegisterForm();

    	$scope.newBucket.doRegister = function() {
    	    var newBucketRegister = $resource("/putnew", {}, {putnew: {method: "post", isArray: false}});
    	    newBucketRegister.putnew({
    	    	suid: $scope.newBucket.suid, 
    	    	studentName: $scope.newBucket.firstName + $scope.newBucket.lastName,
    	    	description: $scope.newBucket.description,
    	    	class: $scope.newBucket.class,
    	    	type: $scope.newBucket.type
    	    }, function(user) {
    	        console.log(user);
    	        $scope.form.studentRegister.$setPristine();
    	        $scope.form.studentRegister.$setUntouched();
    	        clearRegisterForm();
    	    }, function(response) {
    	        console.log(response);
    	    });
    	};

    }
]);
