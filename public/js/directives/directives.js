angular.module('liveBetManager').directive('teamSelector', function () {
    return {
        restrict: 'E',
        scope: {
            teams: '=',
            selectedPlayers: '=ngModel',
            selectionCount: '='
        },
        templateUrl: 'js/directives/templates/teamselector.html',
        link: function (scope, element, attrs) {

            scope.$watch('selectedPlayers', function(newVal, oldVal){
               if(!newVal.playerName || newVal.teams.length == 0){
                   scope.selectedPlayer = {0: '', 1: ''};
               }
            });

            scope.setSelectedPlayer = function (name, team, teamIndex) {
                if(scope.selectionCount == 1) {
                    scope.selectedPlayers.playerName = name;
                    scope.selectedPlayers.teamName = team;
                    if(teamIndex == 0){
                        scope.selectedPlayer[0] = name;
                        scope.selectedPlayer[1] = "";
                    } else {
                        scope.selectedPlayer[1] = name;
                        scope.selectedPlayer[0] = "";
                    }

                }
                else
                    scope.selectedPlayers.teams[teamIndex] = {playerName: name, teamName: team};
                    scope.selectedPlayer[teamIndex] = name;
            };

            scope.selectedPlayer = {0: '', 1: ''};
        }
    }
}).directive('betOptions', function () {
    return {
        restrict: 'E',
        scope: {
            options: '=',
            selectedOption: '=ngModel'
        },
        templateUrl: 'js/directives/templates/betoptions.html',
        link: function (scope, element, attrs) {
            scope.setOption = function (index) {
                scope.selectedOption = index;
            }
        }
    }
});
