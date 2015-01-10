angular.module('liveBetManager').controller('waitingListController', ['$scope', '$rootScope', '$location', 'PubNub', 'betManagerService', 'teamsService', 'authService', '$timeout', 'localStorageService', 'dialogs',
    function ($scope, $rootScope, $location, PubNub, betManagerService, teamsService, authService, $timeout, localStorageService, dialogs) {
        $scope.game = {};
        $scope.team1 = "";
        $scope.team2 = "";
        $scope.availableTeams = [];
        $scope.tvDelay = 0;
        $scope.games = [];

        betManagerService.getGamesForManager(authService.user).success(function(data){
            if(data.length > 0) {
                $scope.games = data;
            }
        });
        
        $scope.doLogout = function(){
            authService.logout(function (result) {
                if (result) {
                    $location.path('/login');
                }
            });
        };
        
        $scope.initGame = function(gameId){
            betManagerService.initGame(gameId, $scope.tvDelay).success(function(data){
                localStorageService.set('currentGame',data);
                $location.path('/eventManager');
            });
        };

        $scope.startGame = function(gameId){
            var dlg = dialogs.create('/modals/tvdelay.html','startGameModalCtrl',{},'lg');
            dlg.result.then(function(tvDelay){
                $scope.tvDelay = tvDelay;
                $scope.initGame(gameId);
            });
        };

    }]).controller('startGameModalCtrl',function($scope,$modalInstance,data){
    //-- Variables --//

    $scope.tvDelay = 0;

    //-- Methods --//

    $scope.cancel = function(){
        $modalInstance.dismiss('Canceled');
    }; // end cancel

    $scope.save = function(){
        $modalInstance.close($scope.tvDelay);
    }; // end save

    $scope.hitEnter = function(evt){
        if(angular.equals(evt.keyCode,13) && !(angular.equals($scope.user.name,null) || angular.equals($scope.user.name,'')))
            $scope.save();
    };
});
