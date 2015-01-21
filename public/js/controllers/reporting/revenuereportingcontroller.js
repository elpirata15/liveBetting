angular.module('liveBetManager').controller('revenueReportingController', ['$scope', '$rootScope', '$route', '$routeParams', 'PubNub', 'betManagerService', 'teamsService', 'ModalService', '$timeout', 'dialogs', function ($scope, $rootScope, $route,$routeParams, PubNub, betManagerService, teamsService, ModalService, $timeout,dialogs) {

    $scope.reportReq = {gameLeague: null, timestamp: null};
    $scope.reportData = null;
    $scope.bids = {};
    $scope.leagues = ["All"].concat($rootScope.leagues);
    $scope.getReport = function(){
        var endOfDayDate = new Date(new Date($scope.reportReq.timestamp.to).setHours(23,59));
        var dateFilter = {$gte: $scope.reportReq.timestamp.from, $lte: endOfDayDate};
        var reportReq = angular.copy($scope.reportReq);
        reportReq.timestamp = dateFilter;
        if(reportReq.gameLeague === "All")
            delete reportReq.gameLeague;
        betManagerService.getGamesReport(reportReq).success(function(data){
            $scope.reportData = {};
            $scope.reportData.entities = data;
            var totalMoney = 0;
            var totalParticipants = 0;
            var totalGames = Object.keys(data).length;
            var totalBids = 0;
            for(var i in data){
                totalMoney += data[i].totalPools;
                totalParticipants += data[i].totalParticipants;
                totalBids += data[i].bidNumber;
            }
            $scope.reportData.totals = {money: totalMoney, games: totalGames, participants: totalParticipants, bids: totalBids};
        });
    };

    $scope.getGame = function(gameId){
        if(!$scope.bids[gameId]) {
            betManagerService.getGame(gameId).success(function (data) {
                var bids = [];
                for (var i in data.bids) {
                    var participants = 0;
                    for (var j in data.bids[i].bidOptions) {
                        participants += data.bids[i].bidOptions[j].participants.length;
                    }
                    bids.push({
                        bidDescription: data.bids[i].bidDescription,
                        totalPoolAmount: data.bids[i].totalPoolAmount,
                        entryAmount: data.bids[i].entryAmount,
                        participants: participants,
                        timestamp: new Date(Math.abs(new Date(data.bids[i].timestamp) - new Date(data.timestamp)))
                    });
                }
                $scope.bids[gameId] = bids;
            });
        }
    }

}]);
