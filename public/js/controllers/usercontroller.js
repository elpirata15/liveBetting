angular.module('liveBetManager').controller('userController', ['$scope', '$rootScope', 'authService', '$timeout', '$location', function ($scope, $rootScope, authService, $timeout, $location) {

    $scope.user = {};
    $scope.loggedIn = authService.isAuthenticated();

    if($scope.loggedIn) {
        if (authService.group() == "Admins" || authService.group() == "Masters")
            $location.path('/gameMaster');
        else
            $location.path('/startGame');
    }

    $scope.doLogin = function () {
        authService.login({email: $scope.user.email, pass: $scope.user.pass}, function (result) {
            if (result) {
                $scope.loggedIn = true;
                if(authService.group() == "Admins" || authService.group() == "Masters" )
                    $location.path('/gameMaster');
                else
                    $location.path('/startGame');
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
            if (result == true) {
                $scope.loggedIn = true;
                $location.path('/');
            }
        });
    };
}]);