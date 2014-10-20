'use strict';
angular.module('liveBetManager').controller('gameController',['$scope','$rootScope','PubNub', 'betManagerService', '$timeout', 'localStorageService',
    function($scope, $rootScope, PubNub, betManagerService,$timeout, localStorageService) {
    $scope.game = {};
    $scope.team1 = "";
    $scope.team2 = "";

    $scope.startGame = function(){
        $scope.game.teams = [$scope.team1, $scope.team2];
        betManagerService.gameInit($scope.game).success(function(data){
            $scope.game = data;
            localStorageService.set('game', data);
            window.location = "#/eventManager";
            alert('game opened');
        });
    };
}]).controller('ModalController', function($scope, close) {

    $scope.close = function(result) {
        close(result, 500); // close, but give 500ms for bootstrap to animate
    };

});
