cs106q.controller('AddMessageOutOfNowhereController', ['$scope', '$mdDialog',
    function($scope, $mdDialog) {
    	$scope.addMessagesDialogModel = {};
    	$scope.addMessagesDialogModel.message = '';

    	$scope.addMessagesDialogModel.cancel = function() {
    	    $mdDialog.cancel();
    	};

    	$scope.addMessagesDialogModel.sendMessage = function(answer) {
    	    $mdDialog.hide($scope.addMessagesDialogModel.message);
    	};
    }
]);