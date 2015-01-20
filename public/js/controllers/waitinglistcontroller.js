angular.module('liveBetManager').controller('waitingListController', ['$scope', '$rootScope', '$location', 'PubNub', 'betManagerService', 'teamsService', 'authService', '$timeout', 'localStorageService', 'dialogs',
    function($scope, $rootScope, $location, PubNub, betManagerService, teamsService, authService, $timeout, localStorageService, dialogs) {
        $scope.game = {};
        $scope.team1 = "";
        $scope.team2 = "";
        $scope.availableTeams = [];
        $scope.tvDelay = 0;
        $scope.games = [];

        betManagerService.getGamesForManager(authService.user()._id).success(function(data) {
            if (data.length > 0) {
                $scope.games = data;
            }
        });



        $scope.doLogout = function() {
            authService.logout(function(result) {
                if (result) {
                    $location.path('/login');
                }
            });
        };

        $scope.initGame = function(gameId) {
            betManagerService.initGame(gameId, $scope.preGameParams).success(function(data) {
                localStorageService.set('currentGame', data);
                $location.path('/event');
            });
        };

        $scope.startGame = function(gameId) {
            teamsService.getGameTeams(gameId).success(function(data) {
                var dlg = dialogs.create('/modals/tvdelay.html', 'startGameModalCtrl', {teams:data}, 'lg');
                dlg.result.then(function(data) {
                    $scope.preGameParams = data;
                    $scope.initGame(gameId);
                });
            })

        };

    }
]).controller('startGameModalCtrl', function($scope, teamsService, $modalInstance, data) {
    //-- Variables --//

    $scope.tvDelay = 0;
    
    teamsService.getTeam(data.teams[0]).success(function(data){
        $scope.team1 = data;
        $scope.team1.lineup = [];
        $scope.team1.bench = data.players.map(function(el){
            return el.playerName;
        });
    });
    
    teamsService.getTeam(data.teams[1]).success(function(data){
        $scope.team2 = data;
        $scope.team2.lineup = [];
        $scope.team2.bench = data.players.map(function(el){
            return el.playerName;
        });
    })
    

    //-- Methods --//

    $scope.cancel = function() {
        $modalInstance.dismiss('Canceled');
    }; // end cancel

    $scope.save = function() {
        $modalInstance.close({tvDelay: $scope.tvDelay, team1: {lineup: $scope.team1.lineup, bench: $scope.team1.bench, teamName: $scope.team1.teamName} , team2: {lineup: $scope.team2.lineup, bench: $scope.team2.bench, teamName: $scope.team2.teamName}});
    }; // end save

    $scope.hitEnter = function(evt) {
        if (angular.equals(evt.keyCode, 13) && !(angular.equals($scope.user.name, null) || angular.equals($scope.user.name, '')))
            $scope.save();
    };
});
