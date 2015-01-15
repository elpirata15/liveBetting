/*global angular*/
angular.module('liveBetManager').controller('userController', ['$scope', '$rootScope', 'authService', '$timeout', '$location', function($scope, $rootScope, authService, $timeout, $location) {

    $scope.user = {};
    $scope.loggedIn = authService.isAuthenticated();

    $scope.doLogin = function() {
        authService.login({
            email: $scope.user.email,
            pass: $scope.user.pass
        }, function(result) {
            if (result) {
                $scope.loggedIn = true;
                if ($rootScope.returnUrl) {
                    window.location = "/" + $rootScope.returnUrl;
                }
            }
        });
    };

    $scope.doLogout = function() {
        authService.logout(function(result) {
            if (result) {
                $scope.loggedIn = false;
                $location.path('/');
            }
        });
    };

    $scope.doRegister = function() {
        authService.register($scope.user, function(result) {
            if (result === true) {
                $scope.loggedIn = true;
                $location.path('/');
            }
        });
    };


    $('input.form-control').keydown(function(el) {
        if (el.which === 13) {
            $scope.doLogin();
        }
    });
}]);