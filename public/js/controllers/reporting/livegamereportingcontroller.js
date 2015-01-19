angular.module('liveBetManager').controller('liveGameReportingController', ['$scope', '$rootScope', 'PubNub', 'betManagerService', 'teamsService', 'ModalService', '$timeout', 'dialogs', function ($scope, $rootScope, PubNub, betManagerService, teamsService, ModalService, $timeout, dialogs) {
    PubNub.init($rootScope.keys);
    $scope.activeLeagues = [];
    $scope.games = {};
    $scope.currentGame = null;
    $scope.activeBids = {};
    $scope.leagueIds = {};
    $scope.totalGameMoney = 0;
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
    $scope.$on('$destroy', function(){
        if($scope.currentGame){
            PubNub.unsubscribe({channel: $scope.currentGame._id});
            for(var i in $scope.activeBids){
                PubNub.unsubscribe({
                    channel: i + "_msg,"+i+"_status"
                });
            }
        }
    });

    $scope.selectGame = function(game){
        if($scope.currentGame){
            PubNub.unsubscribe({channel: $scope.currentGame._id});
            for(var i in $scope.activeBids){
                PubNub.unsubscribe({
                    channel: i + "_msg,"+i+"_status"
                });
            }
            $scope.activeBids = {};
        }
        $scope.currentGame = game;
        for(var i in game.bids){
            $scope.totalGameMoney += parseInt(game.bids[i].totalPoolAmount, 10);
        }
            PubNub.subscribe({
                channel: game._id,
                message: $scope.addBid(message)
            })
    };

    $scope.addBid = function(message){
        if(!$scope.game.bids){
            $scope.game.bids = [];
        }

       $scope.activeBids[message.bidEntity.id] = message.bidEntity;

        PubNub.subscribe({
            channel: message.bidEntity.id + "_msg",
            message: $scope.updateBid(message)
        });

        PubNub.subscribe({
            channel: message.bidEntity.id + "_msg",
            message: $scope.updateStatus(message, env, channel)
        });
    };

    $scope.updateBid = function(message){
        if(message.close){
            $scope.activeBids[message.bidId].status = "Inactive";
        } else if (message.hasOwnProperty("winningOption")) {
            $scope.activeBids[message.bidId].winningOption = message.winningOption;
            $scope.currentGame.bids.push($scope.activeBids[message.bidId]);
            delete $scope.activeBids[message.bidId];
            PubNub.unsubscribe({
                channel: message.bidId + "_msg,"+message.bidId+"_status"
            });
        }
    };

    $scope.updateStatus = function(message,env,channel){
        var bidId = channel.split('_status')[0];
        if(bidId !== ''){
            $scope.totalGameMoney += parseInt(message.totalPoolAmount, 10);
            $scope.activeBids[message.bidId].totalPoolAmount = parseInt($scope.activeBids[message.bidId].totalPoolAmount, 10) + parseInt(message.totalPoolAmount, 10);
            for(var i in message.options){
                $scope.activeBids[message.bidId].options[i].participants = message.options[i];
            }

        }
    };

}]);
