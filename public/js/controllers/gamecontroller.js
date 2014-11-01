'use strict';
angular.module('liveBetManager').controller('gameController', ['$scope', '$rootScope', '$location', 'PubNub', 'betManagerService', '$timeout', 'localStorageService',
    function ($scope, $rootScope, $location, PubNub, betManagerService, $timeout, localStorageService) {
        $scope.game = {};
        $scope.team1 = "";
        $scope.team2 = "";

        $scope.startGame = function () {
            $scope.game.gameName = $scope.team1 + " vs. " + $scope.team2 + " @ " + $scope.game.location;
            $scope.game.teams = [$scope.team1, $scope.team2];
            $scope.game.timestamp = new Date($scope.date.getFullYear(), $scope.date.getMonth(), $scope.date.getDate(), $scope.time.getHours(), $scope.time.getMinutes());
            betManagerService.gameInit($scope.game).success(function () {
                $location.path("/#/gameMaster");
                alert('game created');
            });
        };


        $scope.managers = betManagerService.getManagers();
    }]);
