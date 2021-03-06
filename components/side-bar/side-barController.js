'use strict';

angular.module('cs106q').controller('SideBarController', ['$scope', '$resource', '$rootScope', '$element', '$mdDialog', 'curSL',
    function($scope, $resource, $rootScope, $element, $mdDialog, curSL) {
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
            $scope.newBucket.position = undefined;
    	};

    	clearRegisterForm();

    	$scope.newBucket.doRegister = function() {
            var newBucketRegister;
            if ($scope.newBucket.type === 'Conceptual' && $scope.newBucket.existingPick !== null) {
                newBucketRegister = $resource("/insertNew", {}, {insertNew: {method: "post", isArray: false}});
                newBucketRegister.insertNew({
                    suid: $scope.newBucket.suid, 
                    studentName: $scope.newBucket.firstName + ' ' + $scope.newBucket.lastName,
                    _id: $scope.newBucket.existingPick._id
                }, function(user) {
                    $scope.form.studentRegister.$setPristine();
                    $scope.form.studentRegister.$setUntouched();
                    clearRegisterForm();
                    $rootScope.$broadcast("refreshCurrentList");
                }, function(response) {
                    console.log(response);
                });
            }
            else {
                newBucketRegister = $resource("/putnew", {}, {putnew: {method: "post", isArray: false}});
                newBucketRegister.putnew({
        	    	suid: $scope.newBucket.suid, 
        	    	studentName: $scope.newBucket.firstName + ' ' + $scope.newBucket.lastName,
        	    	description: $scope.newBucket.description,
        	    	class: $scope.newBucket.class,
        	    	type: $scope.newBucket.type,
                    position: $scope.newBucket.position
        	    }, function(user) {
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
            if (bucket.type === 'Conceptual') {
                if ($scope.newBucket.class === undefined) {return true;}
                else {return $scope.newBucket.class === bucket.class;}
            } else {return false;}
        };

        $scope.slLogin = {};
        $scope.slLogin.suid = undefined;
        $scope.slLogin.login = function() { curSL.login($scope.slLogin.suid); };
        $scope.slLogin.logout = function() { curSL.logout(); }; 

        // update the sl list on the side
        $scope.slData = {};
        $scope.slData.curSLs = undefined;
        var getCurSLlist = function() {
            var GetCurSLlist = $resource("/getCurSLlist", {}, {get: {method: "get", isArray: true}});
            GetCurSLlist.get({
            }, function(list) {
                $scope.slData.curSLs = list;
            }, function(res) {
                console.log(res);
            });
        };

        $scope.$on("refreshSLlist", getCurSLlist);

        var getMessageList = function() {
            var GetMessageList = $resource("/getMessageList", {}, {get: {method: "get", isArray: true}});
            GetMessageList.get({
            }, function(list) {
                $scope.main.slMessages = list;
            }, function(res) {
                console.log(res);
            });
        };

        $scope.$on("getMessageList", getMessageList);

        $scope.messageControl = {};

        // show the bucket detail from the message bar
        $scope.messageControl.showBucket = function(bucket) {
            $mdDialog.show({
                template: '<div bucket-card bucket="bucket" show-location="false"></div>',
                clickOutsideToClose: true,
                locals: {bucket: bucket},
                controller: function($scope, bucket) { $scope.bucket = bucket; }
            });
        };

        $scope.messageControl.dismissMessage = function(message_id) {
            var DismissMessage = $resource("/dismissMessage", {}, {post: {method: "post", isArray: false}});
            DismissMessage.post({
                message_id: message_id
            });
        };

        $scope.messageControl.dismissAllMessages = function(message_id) {
            var DismissMessage = $resource("/dismissAllMessages", {}, {post: {method: "post", isArray: false}});
            DismissMessage.post({});
        };

        // add a message out of nowhere
        $scope.messageControl.addMessageOutOfNowhere = function() {
            $mdDialog.show({
                controller: 'AddMessageOutOfNowhereController',
                templateUrl: 'components/side-bar/add-message-out-of-nowhere-dialog.html',
                parent: angular.element(document.body),
                clickOutsideToClose: true
            }).then(function(message) {
                if (message.length > 0) {
                    var AddMessageOutOfNowhere = $resource("/addMessageOutOfNowhere", {}, {post: {method: "post", isArray: false}});
                    AddMessageOutOfNowhere.post({message: message});
                }
            }, function() {
                console.log("No message being entered...");
            });
        };

        $scope.slCurHelpingControl = {};

        var lookAtMapDialogController = function($scope, $mdDialog, position) {
            $scope.lookAtMapDialogControllerModel = {};
            $scope.lookAtMapDialogControllerModel.position = position;
        };

        $scope.slCurHelpingControl.lookAtMap = function(position) {
            $mdDialog.show({
                locals: {position: position},
                controller: lookAtMapDialogController,
                templateUrl: 'components/side-bar/look-at-map-dialog.html',
                parent: angular.element(document.body),
                clickOutsideToClose: true
            });
        };

        // export this functionality to main
        $scope.main.lookAtMap = $scope.slCurHelpingControl.lookAtMap;

        var getCurInfo = function() {
            var GetCurInfo = $resource("/getCurInfo", {}, {get: {method: "get", isArray: false}});
            GetCurInfo.get({
            }, function(info) {
                info.waitingTime = Math.round(info.waitingTime);
                $scope.main.queueInfo = info;
            }, function(res) {
                console.log(res);
            });
        };

        $scope.$on("getCurInfo", getCurInfo);
        getCurInfo(); // execute once at the beginning

        $scope.search = {};
        $scope.search.keyword = undefined;

        $scope.search.submitSearch = function() {
            if ($scope.search.keyword.length === 0) { return; }
            $mdDialog.show({
                locals: { keyword: $scope.search.keyword },
                controller: 'SearchResultDialogController',
                templateUrl: 'components/side-bar/search-result-dialog.html',
                parent: angular.element(document.body),
                clickOutsideToClose: true
            });
        };
    }
]);
