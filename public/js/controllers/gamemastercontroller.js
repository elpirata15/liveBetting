'use strict';
angular.module('liveBetManager').controller('gameMasterController', ['$scope', '$rootScope', 'betManagerService', 'ModalService', function ($scope, $rootScope, betManagerService, ModalService) {
    $scope.selectedGame;
    $scope.games = [];

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
        }
    };

    $scope.reassign = function(){
        ModalService.showModal({
            templateUrl: 'modals/reassign.html',
            controller: "ModalController"
        }).then(function(modal) {
            modal.element.modal();
            modal.close.then(function(result) {
                if(result){
                    betManagerService.assignGame($scope.selectedGame._id, result).success(function(){
                        alert('Game assigned');
                        getData();
                    });
                }
            });
        });
    };

    $scope.closeGame = function(){
        ModalService.showModal({
            templateUrl: 'modals/yesno.html',
            controller: "ModalController"
        }).then(function(modal) {
            modal.element.modal();
            modal.close.then(function(result) {
                if(result == "Yes"){
                    betManagerService.closeGame($scope.selectedGame).success(function(){
                        alert('Game Closed');
                        getData();
                    });
                }
            });
        });

    };
}]);
