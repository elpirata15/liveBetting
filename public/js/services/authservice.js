angular.module('liveBetManager').factory('authService', ['$http', '$rootScope', function ($http, $rootScope) {
    var authService = {};

    var currentUser = {};

    authService.login = function (creds) {
        $http.post('/login', creds).success(function (data) {
            currentUser = data;
            return true;
        }).error(function (data) {
            $rootScope.flash = data;
            return false;
        });
    };

    authService.logout = function () {
        $http.post('/logout', null).success(function () {
            currentUser = {};
            return true;
        }).error(function (data) {
            $rootScope.flash = data;
            return false;
        });
    };

    authService.register = function (user) {
        $http.post('/register', user).success(function (data) {
            currentUser = data;
            return true;
        }).error(function (data) {
            $rootScope.flash = data;
            return false;
        });
    };

    authService.group = function () {
        if (currentUser) {
            return currentUser.group;
        }
    };

    authService.isAuthenticated = function () {
        return currentUser != {};
    };

    return authService;
}]);