angular.module('liveBetManager').controller('homeController', ['$scope', '$rootScope', '$cookieStore','$location',
function ($scope, $rootScope, $cookieStore, $location) {

    $scope.userName = "";
    $scope.loginRole = "";

    $scope.doLogin = function () {
        if ($scope.userName && $scope.loginRole) {
            $cookieStore.put("liveBet_user", {userName: $scope.userName, loginRole: $scope.loginRole});
            if ($scope.loginRole == "Master")
                $location.path("#/gameMaster");
            else
                $location.path("#/initGame");
        }
    };


}]);
