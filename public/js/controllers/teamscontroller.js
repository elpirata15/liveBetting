/* global angular */
angular.module('liveBetManager').controller('teamsController', ['$scope', '$rootScope', '$routeParams', 'teamsService', 'ModalService', '$timeout', 'dialogs', function($scope, $rootScope, $routeParams, teamsService, ModalService, $timeout, dialogs) {

    $scope.teams = [];

    var getData = function() {
        $scope.selectedGame = null;
        teamsService.getAllTeams().success(function(data) {
            $scope.teams = data;
        });
    };

    getData();

    $scope.columns = [{
        field: 'teamName',
        displayName: 'Name',
        cellTemplate: '<div class="ngCellText"><a ng-href="/#/team/{{row.getProperty(\'_id\')}}">{{row.getProperty(col.field)}}</a></div>'
        
    }, {
        field: 'teamLeagues',
        displayName: 'LEagues',
        cellTemplate: '<div class="ngCellText">{{row.getProperty(col.field).join(", ")}}</div>'
    }, {
        field: 'teamCountry',
        displayName: 'Country'
    }, {
        field: '_id',
        displayName: 'Actions',
        cellTemplate: '<div class="ngCellText"><button type="button" class="btn btn-primary" ng-click="removeTeam(row.getProperty(\'_id\'))"><span class="glyphicon glyphicon-remove"></span> Remove</div>'
    }];
    $scope.gridOptions = {
        columnDefs: $scope.columns,
        data: 'teams',
        enableRowSelection: true,
        multiSelect: false,
        plugins: [new ngGridFlexibleHeightPlugin()]
    };
    
    $scope.removeTeam = function(id){
        teamsService.removeTeam(id).success(function(){
           getData(); 
        });
    };
}]);