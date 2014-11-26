angular.module('liveBetManager').controller('eventController', ['$scope', '$rootScope', 'PubNub', 'betManagerService', 'teamsService', '$timeout', 'localStorageService', 'ModalService',
    function ($scope, $rootScope, PubNub, betManagerService, teamsService, $timeout, localStorageService, ModalService) {
        $scope.connected = false;
        $scope.log = [];
        $scope.game = localStorageService.get('currentGame');
        $scope.eventDescription = {teams: []};
        $scope.selectedOption;
        $scope.currentEvent;

        $scope.events = {
            corner: {
                eventName: 'Corner',
                viewElements: {
                    eventTeamSelector: {selectionCount: '1'}
                },
                toString: function () {
                    return "Corner: " + $scope.eventDescription.playerName + " is kicking for " + $scope.eventDescription.teamName;
                },
                eventOptions: ['Goal', 'Out', 'Corner Again']
            },
            freeKick: {
                eventName: 'Free Kick',
                viewElements: {
                    eventTeamSelector: {selectionCount: '1'},
                    distanceParamInput: true
                },
                toString: function () {
                    return "Free Kick: " + $scope.eventDescription.playerName + " is kicking for " + $scope.eventDescription.teamName + " from " + $scope.eventDescription.distance + "m";
                },
                eventOptions: ['Goal', 'Out', 'Hit the wall']
            },
            foul: {
                eventName: 'Foul',
                viewElements: {
                    eventTeamSelector: {selectionCount: '2'}
                },
                toString: function () {
                    return "Foul: " + (($scope.eventDescription.teams[0]) ? $scope.eventDescription.teams[0].playerName : "undefined") + " from " +
                        (($scope.eventDescription.teams[0]) ? $scope.eventDescription.teams[0].teamName : "undefined") +
                        " made a foul on " + (($scope.eventDescription.teams[1]) ? $scope.eventDescription.teams[1].playerName : "undefined") + " from " +
                        (($scope.eventDescription.teams[1]) ? $scope.eventDescription.teams[1].teamName : "undefined");
                },
                eventOptions: ['Red Card', 'Yellow Card', 'They Will Fight']
            },
            substitution: {
                eventName: 'Substitution',
                viewElements: {
                    eventTeamSelector: {selectionCount: '1'},
                    substitutionOptions: true
                },
                toString: function () {
                    return "Substitution - " + $scope.eventDescription.teamName + ": " + $scope.eventDescription.playerName + " is warming up. Who will he replace?";
                },
                eventOptions: []
            },
            customEvent: {
                alwaysLast: true,
                eventName: 'Custom Event',
                viewElements: {
                    customBet: true
                },
                toString: function () {
                    return $scope.eventDescription.question;
                },
                eventOptions: []
            }
        };

        $scope.teams = $scope.game.teams;

        teamsService.getPlayers($scope.teams[0].teamId).success(function (data) {
            $scope.teams[0].players = [];
            for (var j in data) {
                $scope.teams[0].players.push({playerName: data[j].nickname});
            }
        });

        teamsService.getPlayers($scope.teams[1].teamId).success(function (data) {
            $scope.teams[1].players = [];
            for (var j in data) {
                $scope.teams[1].players.push({playerName: data[j].nickname});
            }
        });

        $scope.bidEntity = {
            gameId: $scope.game._id,
            gameName: $scope.game.gameName,
            bidDescription: ($scope.currentEvent) ? $scope.currentEvent.toString() : "",
            bidType: ($scope.currentEvent) ? $scope.currentEvent.title : "",
            entryAmount: 0
        };

        $scope.$watch('eventDescription', function () {
            $scope.bidEntity.bidDescription = $scope.currentEvent.toString();
        }, true);

        $scope.teamsToPlayers = {};
        $scope.teamsToPlayers[$scope.teams[0].teamName] = $scope.teams[0];
        $scope.teamsToPlayers[$scope.teams[1].teamName] = $scope.teams[1];

        $scope.changeEventTemplate = function (template) {
            $scope.currentEvent = template;
            $scope.eventDescription = {teams: []};
            $scope.bidEntity.bidType = template.eventName;
        };

        $scope.closeGame = function () {
            ModalService.showModal({
                templateUrl: 'modals/yesno.html',
                controller: "ModalController"
            }).then(function (modal) {
                modal.element.modal();
                modal.close.then(function (result) {
                    if (result == "Yes") {
                        betManagerService.closeGame($scope.game).success(function () {
                            alert('Game Closed');
                            window.location = "#/startGame";
                        });
                    }
                });
            });
        };
        $scope.betOpen = false;
        $scope.openBet = function () {
            betManagerService.getNewBidId().success(function (data) {
                $scope.bidEntity.id = data;
                $scope.bidEntity.bidOptions = [];
                for (var i in $scope.currentEvent.eventOptions) {
                    $scope.bidEntity.bidOptions.push({optionDescription: $scope.currentEvent.eventOptions[i]});
                }
                PubNub.ngPublish({
                    channel: $scope.game._id,
                    message: {
                        pn_gcm: $scope.bidEntity,
                        bidEntity: $scope.bidEntity
                    }
                });
                $scope.betOpen = true;
            });
        };
        $scope.showResults = false;

        $scope.closeBet = function () {
            PubNub.ngPublish({
                channel: [$scope.bidEntity.id, $scope.bidEntity.id + 'msg'],
                message: {bidId: $scope.bidEntity.id, close: true}
            });
            $scope.betOpen = false;
            $scope.showResults = true;
        };

        $scope.publishWinningResult = function (optionIndex) {
            PubNub.ngPublish({
                channel: [$scope.bidEntity.id, $scope.bidEntity.id + 'msg'],
                message: {bidId: $scope.bidEntity.id, winningOption: optionIndex}
            });
            $scope.betOpen = false;
            $scope.showResults = true;
        };
        /* CONNECT TO GAME LOGGER

         PubNub.ngSubscribe({
         channel : $scope.game._id+'adminSocket',
         message : function(message, env, channel){
         $scope.log.push(message[0]);
         $scope.$apply();
         },
         error: function(data){
         $scope.log.push(data);
         },
         connect: function(data){
         $scope.$apply(function(){$scope.connected = true;});
         },
         disconnect: function(data){
         $scope.$apply(function(){$scope.connected = false;});
         }
         });*/
    }]);
