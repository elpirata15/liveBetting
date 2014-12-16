angular.module('liveBetManager').controller('waitingListController', ['$scope', '$rootScope', '$location', 'PubNub', 'betManagerService', 'teamsService', 'authService', '$timeout', 'localStorageService',
    function ($scope, $rootScope, $location, PubNub, betManagerService, teamsService, authService, $timeout, localStorageService) {
        $scope.game = {};
        $scope.team1 = "";
        $scope.team2 = "";
        $scope.availableTeams = [];

        $scope.games = [];

        betManagerService.getGamesForManager(authService.user()._id).success(function(data){
            if(data.length > 0) {
                $scope.games = data;
            }
        });

        $scope.initGame = function(gameId){
            betManagerService.initGame(gameId).success(function(data){
                localStorageService.set('currentGame',data);
                $location.path('/eventManager');
            });
        }

    }]);
