'use strict';

(function() {
	var curSlService = function($cookies, $resource, $rootScope) {
		var _curSL;

		var getSlFromServer = function(sucessCallback, failCallback) {
			var GetSL = $resource("/getSL", {}, {get: {method: "get", isArray: false}});
			GetSL.get({}, function(sl) {
			    _curSL = sl;
			    sucessCallback();
			}, function(err) {
			    if (failCallback) { failCallback(); }
			});
		};

		var clear = function() {
			_curSL = undefined;
			$cookies.remove("logged_sl__id");
			$cookies.remove("logged_sl_name");
			$rootScope.$broadcast("refreshSL");
		};

		this.getCurSl = function() {
			return _curSL;
		};

		this.setCurSl = function(sl) {
			_curSL = sl;
		};

		this.refresh = function() {
			if (_curSL && $cookies.get('logged_sl__id') && _curSL._id === $cookies.get('logged_sl__id')) {
				getSlFromServer(function() {
					$rootScope.$broadcast("refreshSL");
				});
			}
		};

		this.initFromCookie = function() {
			return new Promise(function(resolve, reject) {
				if ($cookies.get('logged_sl__id')) {
					getSlFromServer(resolve, reject);
				} else { resolve(); } // nothing failed, we just have nothing to do...
			});
		};

		this.login = function(suid) {
			var SlLogin = $resource("/slLogin", {}, {slLogin: {method: "post", isArray: false}});
			SlLogin.slLogin({
			    suid: suid
			}, function(sl) {
				_curSL = sl;
			    var expDate = new Date(); // store the login information in cookie
			    expDate.setMonth(expDate.getYear() + 1);
			    $cookies.put("logged_sl__id", sl._id, {expires: expDate});
			    $cookies.put("logged_sl_name", sl.name, {expires: expDate});
			    $rootScope.$broadcast("refreshEverything");
			}, function(response) {
			    console.log(response);
			});
		};

		this.logout = function() {
			var SlLogout = $resource("/slLogout", {}, {slLogout: {method: "post", isArray: false}});
			SlLogout.slLogout({
			}, function(user) {
			    clear();
			}, function(res) {
			    clear();
			    console.log(res);
			});
		};
	};

	curSlService.$inject = ['$cookies', '$resource', '$rootScope'];

	angular.module('cs106q').service('curSL', curSlService);
}());
