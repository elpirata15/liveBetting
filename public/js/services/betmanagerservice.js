angular.module('liveBetManager').service('betManagerService', ['$http', function($http){
    var betManagerService = {};
    var url = 'http://localhost:5000';

    betManagerService.gameInit = function(game){
        return $http.post('/initGame', game);
    };

    betManagerService.closeGame = function(game){
        return $http.post('/closeGame/'+game._id, null);
    };
    return betManagerService;
}]);