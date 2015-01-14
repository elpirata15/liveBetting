/* global angular */
angular.module('liveBetManager').controller('teamController', ['$scope', '$rootScope', '$routeParams', 'teamsService', 'ModalService', '$timeout', 'dialogs', function($scope, $rootScope, $routeParams, teamsService, ModalService, $timeout, dialogs) {

    $scope.team = {};
    if($routeParams.id){
        teamsService.getTeam($routeParams.id).success(function(data){
            $scope.team = data;
            var teamLeaguesString = $scope.team.teamLeagues.join(',');
            $scope.team.teamLeagues = teamLeaguesString;
        });
    }
    
    $scope.removePlayer = function(index){
        $scope.team.players.splice(index, 1);  
    };
    
    $scope.addPlayer = function(){
        if(!$scope.team.players){
            $scope.team.players = [];   
        }
        $scope.team.players.push({number:"", name:""});
    };
    
    $scope.save = function(){
        var teamsArray = [];
        var leaguesArray = $scope.team.teamLeagues.split(',');
        for(var i in leaguesArray){
            teamsArray.push(leaguesArray[i].trim());
        }
        $scope.team.teamLeagues = teamsArray;
        teamsService.updateTeam($scope.team).success(function(data){
            $scope.team = data; 
        });
    };
}]);