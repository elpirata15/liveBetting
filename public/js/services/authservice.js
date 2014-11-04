angular.module('liveBetManager').factory('authService', ['$http', '$rootScope', '$cookieStore', function ($http, $rootScope, $cookieStore) {
    var authService = {};

    authService.login = function (creds, callback) {
        $http.post('/login', creds).success(function (data) {
            $cookieStore.put("liveBetUser", data._id);
            $cookieStore.put("liveBetGroup", data.group);
            callback(true);
        }).error(function (data) {
            $rootScope.flash = data;
            callback(false);
        });
    };

    authService.logout = function (callback) {
        $http.post('/logout', null).success(function () {
            $cookieStore.remove("liveBetUser");
            $cookieStore.remove("liveBetGroup");
            callback(true);
        }).error(function (data) {
            $rootScope.flash = data;
            callback(false);
        });
    };

    authService.register = function (user, callback) {
        $http.post('/register', user).success(function (data) {
            $cookieStore.put("liveBetUser", data._id);
            $cookieStore.put("liveBetGroup", data.group);
            callback(true);
        }).error(function (data) {
            $rootScope.flash = data;
            callback(false);
        });
    };

    authService.group = function () {
        return $cookieStore.get("liveBetGroup");
    };

    authService.isAuthenticated = function () {
        return $cookieStore.get("liveBetUser");
    };

    return authService;
}]);