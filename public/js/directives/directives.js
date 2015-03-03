/*global angular*/
angular.module('liveBetManager').directive('teamSelector', function() {
    return {
        restrict: 'E',
        scope: {
            teams: '=',
            selectedPlayers: '=ngModel',
            selectionCount: '='
        },
        templateUrl: 'js/directives/templates/teamselector.html',
        link: function(scope, element, attrs) {

            scope.$watch('selectedPlayers', function(newVal, oldVal) {
                if (!newVal.playerName || newVal.teams.length == 0) {
                    scope.selectedPlayer = {
                        0: '',
                        1: ''
                    };
                }
            });

            scope.setSelectedPlayer = function(name, team, teamIndex) {
                if (scope.selectionCount == 1) {
                    scope.selectedPlayers.playerName = name;
                    scope.selectedPlayers.teamName = team;
                    if (teamIndex == 0) {
                        scope.selectedPlayer[0] = name;
                        scope.selectedPlayer[1] = "";
                    }
                    else {
                        scope.selectedPlayer[1] = name;
                        scope.selectedPlayer[0] = "";
                    }

                }
                else
                    scope.selectedPlayers.teams[teamIndex] = {
                        playerName: name,
                        teamName: team
                    };
                scope.selectedPlayer[teamIndex] = name;
            };

            scope.selectedPlayer = {
                0: '',
                1: ''
            };
        }
    }
}).directive('singleteamselector', function() {
    return {
        restrict: 'E',
        scope: {
            team: '=',
            selectedPlayer: '='
        },
        templateUrl: 'js/directives/templates/singleteamselector.html',
        link: function (scope, element, attrs) {
            scope.selectPlayer = function (name) {
                scope.selectedPlayer = name;
            }
        }
    }
}).directive('freeKickOptions', function() {
    return {
        restrict: 'E',
        scope: {
            selectedOption:'=ngModel',
            left: '='
        },
        templateUrl: 'js/directives/templates/freekickoptions.html',
        link: function(scope, element, attrs) {
            scope.setOption = function(index) {
                scope.selectedOption = index;
            }
        }
    }
}).directive('betOptions', function() {
    return {
        restrict: 'E',
        scope: {
            options: '=',
            //            selectedOption: '=ngModel',
            publishAction: '=',
            disabled: '=ngDisabled'
        },
        templateUrl: 'js/directives/templates/betoptions.html',
        link: function(scope, element, attrs) {
            scope.setOption = function(index) {
                scope.publishAction(index);
            }
        }
    }
}).directive('substitutionOptions', function() {
    return {
        restrict: 'E',
        scope: {
            team: '=',
            selectedPlayers: '=ngModel',
            warmingPlayer:'='
        },
        templateUrl: 'js/directives/templates/substitutionoptions.html',
        link: function(scope, element, attrs) {
            
            scope.$watch('team', function(newVal){
               if(newVal && newVal.bench){
                   scope.selectedPlayers = angular.copy(newVal.bench);
               } 
            });
            
            scope.setOption = function(playerName) {
                var exists = scope.selectedPlayers.indexOf(playerName);
                if (exists > -1) {
                    scope.selectedPlayers.splice(exists, 1);
                }
                else {
                    scope.selectedPlayers.push(playerName);
                }
            };
        }
    }
}).directive('lineupSelection', function() {
    return {
        restrict: 'E',
        scope: {
            team: '=',
            selectedPlayers: '=ngModel',
            bench: '='
        },
        templateUrl: 'js/directives/templates/lineupselection.html',
        link: function(scope, element, attrs) {
            scope.setOption = function(playerName) {
                if (scope.selectedPlayers.length < 11) {
                    var exists = scope.selectedPlayers.indexOf(playerName);
                    if (exists > -1) {
                        scope.selectedPlayers.splice(exists, 1);
                        scope.bench.push(playerName);
                    }
                    else {
                        scope.selectedPlayers.push(playerName);
                        scope.bench.splice(exists, 1);
                    }
                }
            };
        }
    }
}).directive('customBet', function() {
    return {
        restrict: 'E',
        scope: {
            question: '=',
            time: '=',
            betOptions: '=ngModel'
        },
        templateUrl: 'js/directives/templates/custombet.html',
        link: function(scope, element, attrs) {
            scope.setOption = function(index) {
                scope.selectedOption = index;
            };
            scope.eventType = null;
            scope.betTypes = ['Long', 'Short'];
            scope.setType = function(type) {
                scope.eventType = type;
            };

            scope.betValuesCounter = 0;

            scope.addBetValue = function() {
                scope.betValues[scope.betValuesCounter] = {
                    id: scope.betValuesCounter,
                    text: ""
                };
                scope.betValuesCounter++;
            };
            scope.removeBetValue = function(index) {
                delete scope.betValues[index];
            };
            scope.betValues = {};
            scope.$watch('betValues', function(newVal) {
                if (newVal) {
                    scope.betOptions = [];
                    for (var i in newVal) {
                        scope.betOptions.push(newVal[i].text);
                    }
                }
            }, true);
        }
    }
});
