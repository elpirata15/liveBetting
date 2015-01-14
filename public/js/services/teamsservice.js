angular.module('liveBetManager').factory('teamsService', ['$http', function($http) {
    var teamsService = {};
    var apiKey = "tZUXOOZ8Lf7spqPCBkcSjaRqJzeXyvTk";


    teamsService.getGameTeams = function(gameId){
        return $http.get('/getGameTeams/'+gameId);
    }
    
    teamsService.getLeagues = function(){
        return $http.get('/getLeagues');
    };
    
    teamsService.getAllTeams = function(){
        return $http.get('/getTeams');  
    };
    
    teamsService.getClubs2 = function(league){
         return $http.get('/getTeams/'+league);   
    };
    
    teamsService.getPlayers2 = function(teamId){
        return $http.get('/getTeamPlayers/'+teamId);
    };
    
    teamsService.updateTeam = function(team){
        return $http.post('/createOrUpdateTeam', team);
    };
    
    teamsService.removeTeam = function(teamId){
        return $http.get('/removeTeam/'+teamId);
    };
    
    teamsService.getTeam = function(teamId){
        return $http.get('/getTeam/'+teamId);   
    };
    
    return teamsService;
    
    
}]);
