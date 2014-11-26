angular.module('liveBetManager').factory('betManagerService', ['$http', function($http){
    var betManagerService = {};
    var url = 'http://localhost:5000';

    betManagerService.createGame = function(game){
        return $http.post('/createGame', game);
    };

    betManagerService.initGame = function(id){
        return $http.post('/initGame/'+id, null);
    };

    betManagerService.getNewBidId = function(){
      return $http.get('/newBidId');
    };


    betManagerService.closeGame = function(game){
        return $http.post('/closeGame/'+game._id, null);
    };

    betManagerService.getManagers = function(){
        return $http.get('/getUsersByGroup/Managers');
    };

    betManagerService.assignGame = function(gameId, managerId){
        return $http.post('/assignGame/', {gameId: gameId, managerId: managerId});
    };

    betManagerService.getGames = function(){
        return $http.get('/getGames');
    };

    betManagerService.getGamesForManager = function(manager){
        return $http.get('/getWaitingGames/'+manager);
    };
    return betManagerService;
}]);