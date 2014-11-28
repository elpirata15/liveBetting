angular.module('liveBetManager').factory('authService', ['$http', '$rootScope', '$cookieStore', function ($http, $rootScope, $cookieStore) {
    var authService = {};

    var user = function(){
        return $cookieStore.get("liveBetUSer");
    };

    authService.login = function (creds, callback) {
        $http.post('/login', creds).success(function (data) {
            $cookieStore.put("liveBetUser", data);
            $cookieStore.put("liveBetGroup", data.group);
            callback(true);
        }).error(function (data) {
            $rootScope.flash = data;
            callback(false);
        });
    };

    authService.logout = function (callback) {
        $http.post('/logout', null).success(function () {
            user = null;
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
            $cookieStore.put("liveBetUser", data);
            $cookieStore.put("liveBetGroup", data.group);
            callback(true);
        }).error(function (data) {
            $rootScope.flash = data;
            callback(false);
        });
    };

    authService.group = function () {
        return user().group;
    };

    authService.isAuthenticated = function () {
        if(!$cookieStore.get('express:sess')){
            $cookieStore.remove("liveBetUser");
            $cookieStore.remove("liveBetGroup");
        } else {
            return user() != null;
        }

    };

    return authService;
}]);