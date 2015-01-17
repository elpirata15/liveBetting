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
                if(location.host === "reporting.alphabetters.co"){
                    window.location = "http://" + location.host + "/#/reports";
                } else {
                    window.location = "http://" + location.host + "/";
                }
            }
        });
    };

    $scope.doLogout = function() {
        authService.logout(function(result) {
            if (result) {
                $scope.loggedIn = false;
                window.location = "http://" + location.host + "/";
            }
        });
    };

    $scope.doRegister = function() {
        authService.register($scope.user, function(result) {
            if (result === true) {
                $scope.loggedIn = true;
                window.location = "http://" + location.host + "/";
            }
        });
    };


    $('input.form-control').keydown(function(el) {
        if (el.which === 13) {
            $scope.doLogin();
        }
    });
}]);