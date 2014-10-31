'use strict';
angular.module('liveBetManager').controller('gameMasterController', ['$scope', '$rootScope', 'betManagerService', '$cookieStore',
    function ($scope, $rootScope, betManagerService, $cookieStore) {
        $scope.games = [];

        betManagerService.getGames().success(function (data) {
            $scope.games = [];
            for(var i in data){
                if(data[i].status == "Waiting"){
                    $scope.games.push(data[i]);
                }
            }

        });


        $scope.columns = [
            {field: 'gameName', displayName: 'Name'},
            {field: 'timestamp', displayName: 'Date', cellTemplate:'<div class="ngCellText">{{row.getProperty(col.field) | date: "fullDate"}}</div>'},
            {field: 'status', displayName: 'Status'},
            {field: 'assignedTo', displayName: 'Assigned To'}
        ];
        $scope.gridOptions = {
            columnDefs: $scope.columns,
            data: 'games',
            enableRowSelection: true,
            multiSelect: false,
            plugins: [new ngGridFlexibleHeightPlugin()]
        };


    }]);
