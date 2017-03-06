'use strict';

cs106q.controller('SideBarController', ['$scope', '$routeParams', '$location', '$resource', '$rootScope', '$cookies', '$element', '$mdDialog',
    function($scope, $routeParams, $location, $resource, $rootScope, $cookies, $element, $mdDialog) {
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
        	    	type: $scope.newBucket.type,
                    position: $scope.newBucket.position
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
            }, function(sl) {
                $scope.main.curSL = sl;
                
                // store the login information in cookie
                var expDate = new Date();
                expDate.setMonth(expDate.getYear() + 1);
                $cookies.put("logged_sl__id", sl._id, {expires: expDate});
                $cookies.put("logged_sl_name", sl.name, {expires: expDate});
                $scope.main.refreshEverything();
            }, function(response) {
                console.log(response);
            });
        };

        $scope.slLogin.logout = function() {
            var slLogout = $resource("/slLogout", {}, {slLogout: {method: "post", isArray: false}});
            slLogout.slLogout({
            }, function(user) {
                console.log(user);
                $scope.main.curSL = undefined;
                $cookies.remove("logged_sl__id");
                $cookies.remove("logged_sl_name");
                $scope.slData.curSLs = undefined;
            }, function(res) {
                $scope.main.curSL = undefined;
                $cookies.remove("logged_sl__id");
                $cookies.remove("logged_sl_name");
                console.log(res);
            });
        };

        // update the sl list on the side
        $scope.slData = {};
        $scope.slData.curSLs = undefined;
        var getCurSLlist = function() {
            var GetCurSLlist = $resource("/getCurSLlist", {}, {get: {method: "get", isArray: true}});
            GetCurSLlist.get({
            }, function(list) {
                $scope.slData.curSLs = list;
            }, function(res) {
                $scope.main.curSLsuid = undefined;
                $scope.main.curSLname = undefined;
                $cookies.remove("logged_sl__id");
                $cookies.remove("logged_sl_name");
                console.log(res);
            });
        };

        if ($scope.main.curSLsuid !== undefined) { getCurSLlist(); }

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
                controller: messageShowBucketDetailController,
                templateUrl: 'messageShowBucketDetail.html',
                parent: angular.element(document.body),
                clickOutsideToClose: true,
                locals: {bucket: bucket}
            });
        };

        var messageShowBucketDetailController = function($scope, $mdDialog, bucket) {
            $scope.bucket = bucket;
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
                controller: addMessageOutOfNowhereController,
                templateUrl: 'addMessageOutOfNowhere.html',
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

        var addMessageOutOfNowhereController = function($scope, $mdDialog) {
            $scope.addMessagesDialogModel = {};
            $scope.addMessagesDialogModel.message = '';

            $scope.addMessagesDialogModel.cancel = function() {
                $mdDialog.cancel();
            };

            $scope.addMessagesDialogModel.sendMessage = function(answer) {
                $mdDialog.hide($scope.addMessagesDialogModel.message);
            };
        };

        $scope.slCurHelpingControl = {};
        $scope.slCurHelpingControl.lookAtMap = function(position) {
            $mdDialog.show({
                locals: {position: position},
                controller: lookAtMapDialogController,
                templateUrl: 'lookAtMapDialog.html',
                parent: angular.element(document.body),
                clickOutsideToClose: true
            });
        };

        // export this functionality to main
        $scope.main.lookAtMap = $scope.slCurHelpingControl.lookAtMap;

        var lookAtMapDialogController = function($scope, $mdDialog, position) {
            $scope.lookAtMapDialogControllerModel = {};
            $scope.lookAtMapDialogControllerModel.position = position;
        };
        
    }
]);
