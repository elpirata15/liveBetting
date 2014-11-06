/* jshint ignore:start */
angular.module('liveBetManager').controller('gameMasterController', ['$scope', '$rootScope', 'PubNub', 'betManagerService', 'ModalService', '$timeout', 'dialogs', function ($scope, $rootScope, PubNub, betManagerService, ModalService, $timeout,dialogs) {
    /* jshint ignore:end */
    $scope.selectedGame = null;
    $scope.games = [];

    $scope.gameDate = undefined;
    $scope.gameTime = undefined;
    $scope.team1 = undefined;
    $scope.team2 = undefined;
    $scope.managers = betManagerService.getManagers();

    $scope.startGame = function () {
        $scope.selectedGame.gameName = $scope.team1 + " vs. " + $scope.team2 + " @ " + $scope.selectedGame.location;
        $scope.selectedGame.teams = [$scope.team1, $scope.team2];
        $scope.selectedGame.timestamp = new Date($scope.gameDate.getFullYear(), $scope.gameDate.getMonth(), $scope.gameDate.getDate(), $scope.gameTime.getHours(), $scope.gameTime.getMinutes());
        betManagerService.gameInit($scope.selectedGame).success(function () {
            dialogs.notify("Game Saved", "Game Saved.");
            getData();
        });
    };

    var getData = function () {
        $scope.selectedGame = null;
        betManagerService.getGames().success(function (data) {
            $scope.games = [];
            for (var i in data) {
                if (data[i].status == "Waiting") {
                    $scope.games.push(data[i]);
                }
            }

        });
    };

    getData();

    $scope.columns = [
        {field: 'gameName', displayName: 'Name'},
        {
            field: 'timestamp',
            displayName: 'Date',
            cellTemplate: '<div class="ngCellText">{{row.getProperty(col.field) | date: "EEE, MMM d, y @ HH:mm"}}</div>'
        },
        {field: 'status', displayName: 'Status'},
        {field: 'assignedTo', displayName: 'Assigned To'}
    ];
    $scope.gridOptions = {
        columnDefs: $scope.columns,
        data: 'games',
        enableRowSelection: true,
        multiSelect: false,
        plugins: [new ngGridFlexibleHeightPlugin()],
        afterSelectionChange: function (item, event) {
            $scope.selectedGame = $scope.games[item.rowIndex];
            var date = new Date($scope.selectedGame.timestamp);
            $scope.gameDate = $scope.gameTime = date;
            $scope.team1 = $scope.selectedGame.teams[0];
            $scope.team2 = $scope.selectedGame.teams[1];
        }
    };

    $scope.messages = [];
    var counter = 0;
    PubNub.ngSubscribe({
        channel: 'adminSocket',
        message: function (message) {
            $scope.messages.push({id: counter, text: message[0]});
            counter++;
            $timeout(function () {
                $scope.$apply();
            });
        }
    });

    $scope.reassign = function () {
        ModalService.showModal({
            templateUrl: 'modals/reassign.html',
            controller: "ModalController"
        }).then(function (modal) {
            modal.element.modal();
            modal.close.then(function (result) {
                if (result.toLowerCase() != 'cancel') {
                    betManagerService.assignGame($scope.selectedGame._id, result).success(function () {
                        dialogs.notify("Manager Assigned", "Manager was assigned");
                        getData();
                    }).error(function(data){
                        dialogs.error(data);
                    });
                }
            });
        });
    };

    $scope.closeGame = function () {
        ModalService.showModal({
            templateUrl: 'modals/yesno.html',
            controller: "ModalController"
        }).then(function (modal) {
            modal.element.modal();
            modal.close.then(function (result) {
                if (result == "Yes") {
                    betManagerService.closeGame($scope.selectedGame).success(function () {
                        //alert('Game Closed');
                        getData();
                    });
                }
            });
        });
    };
}]);
