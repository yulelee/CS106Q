cs106q.controller('SearchResultDialogController', ['$scope', '$mdDialog', '$resource', 'keyword',
    function($scope, $mdDialog, $resource, keyword) {

        $scope.keyword = keyword;
        $scope.keywordSearchResult = undefined;
        $scope.suidSearchResult = undefined;
        $scope.messageSearchResult = undefined;

        var searchForKeyWordHistory = function() {
            return new Promise(function(resolve, reject) {
                if ($scope.keyword.length === 0) { reject(); }
                var SearchDescriptionKeyWordsHistory = $resource("/searchDescriptionKeyWordsHistory", {}, {get: {method: "get", isArray: true}});
                SearchDescriptionKeyWordsHistory.get({
                    keyword: $scope.keyword
                }, function(result) {
                    $scope.keywordSearchResult = result;
                    resolve();
                }, function(response) {
                    reject();
                });
            });
        };

        var searchForSuidHistory = function() {
            return new Promise(function(resolve, reject) {
                if ($scope.keyword.length === 0) { reject(); }
                var SearchSuidHistory = $resource("/searchSuidHistory", {}, {get: {method: "get", isArray: true}});
                SearchSuidHistory.get({
                    suid: $scope.keyword
                }, function(result) {
                    $scope.suidSearchResult = result;
                    resolve();
                }, function(response) {
                    reject();
                });
            });
        };

        var searchForMessageHistory = function() {
            return new Promise(function(resolve, reject) {
                if ($scope.keyword.length === 0) { reject(); }
                var SearchMessageHistory = $resource("/searchMessageKeyWordsHistory", {}, {get: {method: "get", isArray: true}});
                SearchMessageHistory.get({
                    keyword: $scope.keyword
                }, function(result) {
                    $scope.messageSearchResult = result;
                    resolve();
                }, function(response) {
                    reject();
                });
            });
        };

        Promise.all([searchForKeyWordHistory(), searchForSuidHistory(), searchForMessageHistory()]).then(function() {
            if ($scope.keywordSearchResult.length > $scope.suidSearchResult.length) $scope.accordion.expand('search-result-accordion-keyword-pane');
            else if ($scope.keywordSearchResult.length < $scope.suidSearchResult.length) $scope.accordion.expand('search-result-accordion-suid-pane');
            if ($scope.messageSearchResult.length > 0) $scope.accordion.expand('search-result-accordion-message-pane');
        }).catch(function() {
            console.log('Search failed, maybe the search box is empty.');
        });
    }
]);