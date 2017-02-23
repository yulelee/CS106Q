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
    	};

        $scope.filterConceptualBuckets = function(bucket) {
            console.log(bucket);
            if (bucket.type === 'Conceptual') {
                if ($scope.newBucket.class === undefined) {return true;}
                else {return $scope.newBucket.class === bucket.class;}
            } else {return false;}
        };

        $scope.searchTerm;

        $scope.clearSearchTerm = function() {
            $scope.searchTerm = '';
        };
        // The md-select directive eats keydown events for some quick select
        // logic. Since we have a search input here, we don't need that logic.
        $element.find('input').on('keydown', function(ev) {
            ev.stopPropagation();
        });

    }
]);
