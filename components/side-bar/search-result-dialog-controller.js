'use strict';

angular.module('cs106q').controller('SearchResultDialogController', ['$scope', '$mdDialog', '$resource', 'keyword',
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

        $scope.tab = null;

        Promise.all([searchForKeyWordHistory(), searchForSuidHistory(), searchForMessageHistory()]).then(function() {
            $scope.$apply(function() {
                var lengths = [$scope.suidSearchResult.length, 
                    $scope.keywordSearchResult.length,
                    $scope.messageSearchResult.length];
                $scope.tab = 0;
                var maxLen = lengths[0];
                for (var i = 1; i < lengths.length; i++) {
                    if (lengths[i] > maxLen) {
                        $scope.tab = i;
                        maxLen = lengths[i];
                    }
                }
            });
        }).catch(function() {
            console.log('Search failed, maybe the search box is empty.');
        });
    }
]);