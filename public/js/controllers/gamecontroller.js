angular.module('liveBetManager').controller('gameController', ['$scope', '$rootScope', '$location', 'PubNub', 'betManagerService', 'teamsService', 'authService', '$timeout', 'localStorageService',
    function ($scope, $rootScope, $location, PubNub, betManagerService, teamsService, authService, $timeout, localStorageService) {
        $scope.game = {};
        $scope.team1 = "";
        $scope.team2 = "";
        $scope.availableTeams = [];

        teamsService.getAllTeams().success(function (data) {
            $scope.availableTeams = data;
        });

        $scope.startGame = function () {
            //$scope.game.assignedTo = $scope.game.assignedTo._id;
            $scope.game.gameName = $scope.team1.teamName + " vs. " + $scope.team2.teamName;
            $scope.game.teams = [$scope.team1._id,$scope.team2._id];
            //$scope.game.teams.push({teamName: $scope.team1.teamName, teamId: $scope.team1._id}, {teamName: $scope.team2.teamName, teamId: $scope.team2._id});
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
