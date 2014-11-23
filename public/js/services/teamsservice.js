angular.module('liveBetManager').factory('teamsService', ['$http', function($http) {
    var teamsService = {};
    var apiKey = "tZUXOOZ8Lf7spqPCBkcSjaRqJzeXyvTk";


    teamsService.getClubs = function(){
      return $http.get('http://worldcup.kimonolabs.com/api/clubs?fields=name,id&apikey='+apiKey+'&limit=500');
    };
    teamsService.getPlayers = function(clubId){
        return $http.get('http://worldcup.kimonolabs.com/api/players?fields=nickname&apikey='+apiKey+'&clubId='+clubId)
    };
    return teamsService;
}]);
