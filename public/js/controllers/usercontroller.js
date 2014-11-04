angular.module('liveBetManager').controller('userController', ['$scope', '$rootScope', 'authService', '$timeout', '$location', function ($scope, $rootScope, authService, $timeout, $location) {

    $scope.user = {};
    $scope.loggedIn = false;

    $scope.doLogin = function () {
        authService.login({email: $scope.user.email, pass: $scope.user.pass}, function (result) {
            if (result) {
                $scope.loggedIn = true;
                if(authService.group() == "Admins" || authService.group() == "Managers" )
                    $location.path('/gameMaster');
                else
                    $location.path('/eventManager');
            }
        });
    };

    $scope.doLogout = function () {
        authService.logout(function (result) {
            if (result) {
                $scope.loggedIn = false;
                $location.path('/');
            }
        });
    };

    $scope.doRegister = function () {
        authService.register($scope.user, function (result) {
            if (result)
                $scope.loggedIn = true;
                $location.path('/');
        });
    };
}]);