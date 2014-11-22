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

            scope.$watch('selectedPlayers', function (newVal, oldVal) {
                if (!newVal.playerName || newVal.teams.length == 0) {
                    scope.selectedPlayer = {0: '', 1: ''};
                }
            });

            scope.setSelectedPlayer = function (name, team, teamIndex) {
                if (scope.selectionCount == 1) {
                    scope.selectedPlayers.playerName = name;
                    scope.selectedPlayers.teamName = team;
                    if (teamIndex == 0) {
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
}).directive('substitutionOptions', function () {
    return {
        restrict: 'E',
        scope: {
            team: '=',
            selectedPlayers: '=ngModel',
            warmingPlayer: '='
        },
        templateUrl: 'js/directives/templates/substitutionoptions.html',
        link: function (scope, element, attrs) {
            scope.setOption = function (playerName) {
                if (scope.selectedPlayers.length == 3) {
                    scope.selectedPlayers.push(playerName);
                    scope.selectedPlayers.splice(0, 1);
                } else {
                    scope.selectedPlayers.push(playerName);
                }
            };
            scope.$watch('warmingPlayer', function(newVal, oldVal){
                if(newVal != oldVal){
                    scope.selectedPlayers = [];
                }
            });
        }
    }
});
