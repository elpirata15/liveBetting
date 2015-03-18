angular.module('liveBetManager').controller('liveGameReportingController', ['$scope', '$rootScope', 'PubNub', 'betManagerService', 'teamsService', 'ModalService', '$timeout', 'dialogs', function($scope, $rootScope, PubNub, betManagerService, teamsService, ModalService, $timeout, dialogs) {
    PubNub.init($rootScope.keys);
    $scope.activeLeagues = [];
    $scope.games = {};
    $scope.currentGame = null;
    $scope.activeBids = {};
    $scope.leagueIds = {};
    $scope.subscribedStatus = {};
    $scope.totalGameMoney = 0;
    betManagerService.getActiveGamesId().success(function(data) {
        var gamesByLeague = {};
        for (var i in data) {
            var currentGame = data[i];
            if (currentGame.gameLeague) {
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
    $scope.$on('$destroy', function() {
        if ($scope.currentGame) {
            PubNub.ngUnsubscribe({
                channel: $scope.currentGame._id
            });
            for (var i in $scope.activeBids) {
                PubNub.ngUnsubscribe({
                    channel: i + "_msg," + i + "_status"
                });
            }
        }
    });

    $scope.selectGame = function(gameId) {
        if ($scope.currentGame) {
            PubNub.ngUnsubscribe({
                channel: $scope.currentGame._id
            });
            for (var i in $scope.activeBids) {
                PubNub.ngUnsubscribe({
                    channel: i + "_msg," + i + "_status"
                });
            }
            $scope.activeBids = {};
        }
        betManagerService.getGame(gameId).success(function(data) {
            $scope.currentGame = data;
            for (var i in data.bids) {
                $scope.totalGameMoney += parseInt(data.bids[i].totalPoolAmount, 10);
            }
            PubNub.ngSubscribe({
                channel: data._id,
                message: $scope.addBid
            });
        });
    };

    $scope.addBid = function(message) {
        
        if(message[0].score){
            $scope.currentGame.gameScore = message[0].score;
            return;
        }
        
        if(message[0].close){
            $scope.activeBids[message[0].bidId].status = "Inactive";
            return;
        }
        
        if (!$scope.currentGame.bids) {
            $scope.currentGame.bids = [];
        }

        $scope.activeBids[message[0].bidEntity.id] = message[0].bidEntity;

        PubNub.ngSubscribe({
            channel: message[0].bidEntity.id + "_msg",
            message: $scope.updateBid
        });


    };

    $scope.subscribeStatus = function(id) {
        if ($scope.subscribedStatus) {
            delete $scope.subscribedStatus[id];
            PubNub.ngUnsubscribe({
                channel: id + "_status"
            });
        }
        else {
            $scope.subscribedStatus[id] = true;
            PubNub.ngSubscribe({
                channel: id + "_status",
                message: $scope.updateStatus
            });
        }
    };

    $scope.updateBid = function(message) {
        if (message.close) {
            $scope.activeBids[message[0].bidId].status = "Inactive";
        }
        else if (message[0].hasOwnProperty("winningOption")) {
            $scope.activeBids[message[0].bidId].winningOption = message[0].winningOption;
            $scope.currentGame.bids.push($scope.activeBids[message[0].bidId]);
            delete $scope.activeBids[message[0].bidId];
            PubNub.ngUnsubscribe({
                channel: message[0].bidId + "_msg," + message[0].bidId + "_status"
            });
        }
    };

    $scope.updateStatus = function(message, env, channel) {
        var bidId = channel.split('_status')[0];
        if (bidId !== '') {
            $scope.totalGameMoney += parseInt(message.totalPoolAmount, 10);
            $scope.activeBids[message.bidId].totalPoolAmount = parseInt($scope.activeBids[message.bidId].totalPoolAmount, 10) + parseInt(message.totalPoolAmount, 10);
            for (var i in message.options) {
                $scope.activeBids[message.bidId].options[i].participants = message.options[i];
            }

        }
    };

}]);
