angular.module('liveBetManager').directive('teamSelector', function () {
    return {
        restrict: 'E',
        scope: {
            teams: '=',
            selectedPlayer: '=ngModel',
            selectionCount: '='
        },
        templateUrl: 'js/directives/templates/teamselector.html',
        link: function (scope, element, attrs) {
            scope.setSelectedPlayer = function (name, team, teamIndex) {
                if(scope.selectionCount == 1)
                    scope.selectedPlayer = {playerName: name, teamName: team};
                else
                    scope.selectedPlayer[teamIndex] = {playerName: name, teamName: team};
            }
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
