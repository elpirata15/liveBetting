angular.module('liveBetManager').factory('betManagerService', ['$http', function($http){
    var betManagerService = {};
    var url = 'http://localhost:5000';

    betManagerService.createGame = function(game){
        return $http.post('/createGame', game);
    };

    betManagerService.initGame = function(id, params){
        return $http.post('/initGame/'+id, {preGameParams: params});
    };

    betManagerService.getNewBidId = function(){
      return $http.get('/newBidId');
    };

    betManagerService.updateScore = function(gameId, gameScore){
        return $http.post('/setGameScore', {id: gameId, gameScore:gameScore});
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
    
    betManagerService.getGame = function(gameId){
        return $http.get('/getGame/'+gameId);
    };
    
    betManagerService.getActiveGamesId = function(){
        return $http.get('/getActiveGamesId');
    };

    betManagerService.getGamesForManager = function(manager){
        return $http.get('/getWaitingGames/'+manager);
    };

    betManagerService.getGamesReport = function(reportReq){
        return $http.post('/getGamesMap', {filter: reportReq});
    };
    return betManagerService;
}]);