angular.module('liveBetManager').controller('userController', ['$scope', '$rootScope', 'authService', '$timeout', '$location', function ($scope, $rootScope, authService, $timeout, $location) {

    $scope.user = {};

    $scope.doLogin = function () {
        if (authService.login({email:$scope.user.email, pass:$scope.user.pass})) {
            alert('success');
            $location.path($rootScope.returnUrl);
        }
    };

    $scope.doRegister = function () {
        if (authService.register($scope.user)) {
            $location.path('/');
        }
    };

}]);