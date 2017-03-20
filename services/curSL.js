(function() {
	var curSlService = function($cookies, $resource) {
		var _curSL = undefined;

		var getSlFromServer = function(sucessCallback, failCallback) {
			var GetSL = $resource("/getSL", {}, {get: {method: "get", isArray: false}});
			GetSL.get({}, function(sl) {
			    _curSL = sl;
			    sucessCallback();
			}, function(err) {
			    failCallback();
			});
		};

		this.getCurSl = function() {
			return _curSL;
		};

		this.setCurSl = function(sl) {
			_curSL = s;
		};

		this.refresh = function() {
			return new Promise(function(resolve, reject) {
				if (_curSL && $cookies.get('logged_sl__id') && _curSL._id === $cookies.get('logged_sl__id')) {
					getSlFromServer(resolve, reject);
				} else { resolve(); } // nothing failed, we just have nothing to do...
			});
		};

		this.initFromCookie = function() {
			return new Promise(function(resolve, reject) {
				if ($cookies.get('logged_sl__id')) {
					getSlFromServer(resolve, reject);
				} else { resolve(); } // nothing failed, we just have nothing to do...
			});
		}
	}

	curSlService.$inject = ['$cookies', '$resource'];

	cs106q.service('curSL', curSlService);
}());
