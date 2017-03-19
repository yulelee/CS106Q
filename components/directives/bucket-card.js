'use strict';

cs106q.directive('bucketCard', function () {
    return {
        templateUrl: './components/directives/bucket-card.html',
        scope: { 
        	bucket: '=', 
        	showLocation: '=',
        	lookAtMapFunction: '&',
        	showControl: '=',
        	curSl: '=',
        	pickBucketFunction: '&'
        }
    };
});