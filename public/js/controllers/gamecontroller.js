/*global angular*/
angular.module('liveBetManager').controller('gameController', ['$scope', '$rootScope', '$location', 'PubNub', 'betManagerService', 'teamsService', 'authService', '$timeout', 'localStorageService', '$filter',
    function ($scope, $rootScope, $location, PubNub, betManagerService, teamsService, authService, $timeout, localStorageService, $filter) {
        $scope.game = {};
        $scope.team1 = "";
        $scope.team2 = "";
        $scope.availableTeams = [];
        $scope.displayTeams = [];
        $scope.leagues = ["UEFA Champions League", "Premier League", "Serie A", "Bundesliga", "La Liga"];
        teamsService.getAllTeams().success(function (data) {
            $scope.availableTeams = data;
            $scope.displayTeams = data;
        });
        
        $scope.startGame = function () {
            //$scope.game.assignedTo = $scope.game.assignedTo._id;
            $scope.game.gameName = $scope.team1.teamName + " vs. " + $scope.team2.teamName;
            $scope.game.teams = [$scope.team1._id,$scope.team2._id];
            //$scope.game.teams.push({teamName: $scope.team1.teamName, teamId: $scope.team1._id}, {teamName: $scope.team2.teamName, teamId: $scope.team2._id});
            $scope.game.timestamp = new Date($scope.date.getFullYear(), $scope.date.getMonth(), $scope.date.getDate(), $scope.time.getHours(), $scope.time.getMinutes());
            betManagerService.createGame($scope.game).success(function () {
                window.location = "/#/";
                alert('game created');
            });
        };



        betManagerService.getManagers().success(function(data){
            $scope.managers = data;
        });
    }]);
