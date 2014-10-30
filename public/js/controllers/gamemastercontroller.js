'use strict';
angular.module('liveBetManager').controller('gameMasterController', ['$scope', '$rootScope', 'betManagerService', '$cookieStore',
function ($scope, $rootScope, betManagerService, $cookieStore) {
    $scope.games = [];

    betManagerService.getGames().success(function(data){
       $scope.games = data;
    });

}]);
