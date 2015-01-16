angular.module('liveBetManager').controller('liveGameReportingController', ['$scope', '$rootScope', 'PubNub', 'betManagerService', 'teamsService', 'ModalService', '$timeout', 'dialogs', function ($scope, $rootScope, PubNub, betManagerService, teamsService, ModalService, $timeout, dialogs) {

    $scope.activeLeagues = [];
    $scope.games = {};
    $scope.currentGame = null;
    $scope.leagueIds = {};
    betManagerService.getGames().success(function (data) {
        var gamesByLeague = {};
        for (var i in data) {
            var currentGame = data[i];
            if(currentGame.gameLeague) {
                if (!gamesByLeague[currentGame.gameLeague]) {
                    gamesByLeague[currentGame.gameLeague] = [];
                }

                gamesByLeague[currentGame.gameLeague].push(data[i]);
                if ($scope.activeLeagues.indexOf(currentGame.gameLeague) === -1) {
                    $scope.activeLeagues.push(currentGame.gameLeague);
                    $scope.leagueIds[currentGame.gameLeague] = currentGame.gameLeague.replace(/\s/g, "");
                }
            }
        }
        $scope.games = gamesByLeague;
    });

    $scope.selectGame = function(game){
        $scope.currentGame = game;
    }
}]);
