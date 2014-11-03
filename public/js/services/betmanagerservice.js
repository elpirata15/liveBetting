angular.module('liveBetManager').factory('betManagerService', ['$http', function($http){
    var betManagerService = {};
    var url = 'http://localhost:5000';

    betManagerService.gameInit = function(game){
        return $http.post('/createGame', game);
    };

    betManagerService.closeGame = function(game){
        return $http.post('/closeGame/'+game._id, null);
    };

    betManagerService.getTeamRoster = function(teams){
      // TODO: Add call to service to get teams rosters, for now we use a local json
        return $http.get('/sampleTeams.json');
    };

    betManagerService.getManagers = function(){
      // TODO: Add call to service to get real managing users
        return ["elirankon","fishondor","adi.millis","pilpel"];
    };

    betManagerService.assignGame = function(gameId, managerId){
        return $http.post('/assignGame/', {gameId: gameId, managerId: managerId});
    };

    betManagerService.getGames = function(){
        return $http.get('/getGames');
    };
    return betManagerService;
}]);