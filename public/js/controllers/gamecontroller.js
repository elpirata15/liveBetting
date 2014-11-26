angular.module('liveBetManager').controller('gameController', ['$scope', '$rootScope', '$location', 'PubNub', 'betManagerService', 'teamsService', 'authService', '$timeout', 'localStorageService',
    function ($scope, $rootScope, $location, PubNub, betManagerService, teamsService, authService, $timeout, localStorageService) {
        $scope.game = {};
        $scope.team1 = "";
        $scope.team2 = "";
        $scope.availableTeams = [];

        teamsService.getClubs().success(function (data) {
            $scope.availableTeams = data;
        });

        $scope.startGame = function () {
            $scope.game.assignedTo = $scope.game.assignedTo.email;
            $scope.game.gameName = $scope.team1.name + " vs. " + $scope.team2.name + " @ " + $scope.game.location;
            $scope.game.teams = [];
            $scope.game.teams.push({teamName: $scope.team1.name, teamId: $scope.team1.id}, {teamName: $scope.team2.name, teamId: $scope.team2.id});
            $scope.game.timestamp = new Date($scope.date.getFullYear(), $scope.date.getMonth(), $scope.date.getDate(), $scope.time.getHours(), $scope.time.getMinutes());
            betManagerService.createGame($scope.game).success(function () {
                $location.path("/#/gameMaster");
                alert('game created');
            });
        };



        betManagerService.getManagers().success(function(data){
            $scope.managers = data;
        });
    }]);
