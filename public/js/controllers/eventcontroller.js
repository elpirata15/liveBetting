angular.module('liveBetManager').controller('eventController', ['$scope', '$rootScope', '$location', 'PubNub', 'betManagerService', 'teamsService', 'authService', '$timeout', '$interval', 'localStorageService', 'dialogs',
    function ($scope, $rootScope, $location, PubNub, betManagerService, teamsService, authService, $timeout, $interval, localStorageService, dialogs) {
        $scope.connected = false;
        $scope.log = [];
        $scope.game = localStorageService.get('currentGame');
        $scope.eventDescription = {teams: []};
        $scope.selectedOption;
        $scope.currentEvent;
        $scope.longBets = {};
        $scope.longBetsLength = 0;
        $scope.amounts = [10, 25, 50, 100];

        $scope.doLogout = function(){
            authService.logout(function (result) {
                if (result) {
                    $location.path('/login');
                }
            });
        };

        $scope.events = {
            corner: {
                eventName: 'Corner',
                viewElements: {
                    eventTeamSelector: {selectionCount: '1'}
                },
                toString: function () {
                    return "Corner: " + $scope.eventDescription.playerName + " is kicking for " + $scope.eventDescription.teamName;
                },
                eventOptions: ['Goal', 'Out', 'Corner Again','Foul','Block']
            },
            penalty: {
                eventName: 'Penalty',
                viewElements: {
                    eventTeamSelector: {selectionCount: '1'}
                },
                toString: function () {
                    return "Penalty: " + $scope.eventDescription.playerName + " is kicking for " + $scope.eventDescription.teamName;
                },
                eventOptions: ['Goal', 'Out', 'Goalkeeper saves']
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
                eventOptions: ['Goal', 'Out', 'Block']
            },
            /*foul: {
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
            },*/
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
                eventOptions: [],
                time: 0
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

        $scope.bidEntityTemplate = {
            gameId: $scope.game._id,
            gameName: $scope.game.gameName,
            bidDescription: ($scope.currentEvent) ? $scope.currentEvent.toString() : "",
            bidType: ($scope.currentEvent) ? $scope.currentEvent.title : "",
            entryAmount: 0
        };

        $scope.bidEntity = angular.copy($scope.bidEntityTemplate);

        $scope.$watch('eventDescription', function () {
            $scope.bidEntity.bidDescription = ($scope.currentEvent) ? $scope.currentEvent.toString() : "";

        }, true);

        $scope.teamsToPlayers = {};
        $scope.teamsToPlayers[$scope.teams[0].teamName] = $scope.teams[0];
        $scope.teamsToPlayers[$scope.teams[1].teamName] = $scope.teams[1];

        $scope.changeEventTemplate = function (template) {
            $scope.currentEvent = angular.copy(template);
            $scope.eventDescription = {teams: []};
            $scope.bidEntity = angular.copy($scope.bidEntityTemplate);
            $scope.bidEntity.bidType = template.eventName;
            $scope.showResults = false;
        };

        $scope.closeGame = function () {
            var dlg = dialogs.confirm("Close Game?", "This action will close the game and sign you off!<br/>Are you sure?");
            dlg.result.then(function () {
                //$scope.confirmed = 'You confirmed "Yes."';
                betManagerService.closeGame($scope.game).success(function () {
                    alert('Game Closed');
                    // Publish to server
                    $scope.doLogout();
                });
            });
        };

        $scope.setEntryAmount = function (amount) {
            $scope.bidEntity.entryAmount = amount;
        };

        $scope.betOpen = false;
        $scope.openBet = function () {
            betManagerService.getNewBidId().success(function (data) {
                $scope.bidEntity.id = data;
                $scope.bidEntity.bidOptions = {};
                for (var i in $scope.currentEvent.eventOptions) {
                    $scope.bidEntity.bidOptions[i] = {optionDescription: $scope.currentEvent.eventOptions[i]};
                }
                // publish to server
                PubNub.ngPublish({
                    channel: 'bids',
                    message: {
                        pn_gcm: $scope.bidEntity,
                        bidEntity: $scope.bidEntity
                    }
                });
                // publish to clients
                PubNub.ngPublish({
                    channel: $scope.game._id,
                    message: {
                        pn_gcm: $scope.bidEntity,
                        bidEntity: $scope.bidEntity
                    }
                });
                if (!$scope.currentEvent.time || $scope.currentEvent.time == 0)
                    $scope.betOpen = true;
                else
                    $scope.openLongBet($scope.currentEvent.time);
            });
        };
        $scope.showResults = false;

        $scope.closeBet = function () {

            // Publish to server
            PubNub.ngPublish({
                channel: 'requests',
                message: {bidId: $scope.bidEntity.id, close: true}
            });

            // Publish to game channel, in case player got the bid and didn't enter
            PubNub.ngPublish({
                channel: $scope.game._id,
                message: {bidId: $scope.bidEntity.id, close: true}
            });

            // Notify all clients
            PubNub.ngPublish({
                channel: $scope.bidEntity.id + '_msg',
                message: {bidId: $scope.bidEntity.id, close: true}
            });

            $scope.betOpen = false;
            $scope.showResults = true;
        };

        $scope.publishWinningResult = function (optionIndex) {

            // publish to server
            PubNub.ngPublish({
                channel: 'requests',
                message: {bidId: $scope.bidEntity.id, winningOption: optionIndex}
            });

            // publish to clients
            PubNub.ngPublish({
                channel: $scope.bidEntity.id + '_msg',
                message: {bidId: $scope.bidEntity.id, winningOption: optionIndex}
            });
            $scope.betOpen = false;
            $scope.showResults = false;
        };

        $scope.openLongBet = function (time) {
            var longBet = {bidEntity: angular.copy($scope.bidEntity), ttl: time};
            $scope.longBets[$scope.bidEntity.id] = longBet;

            // Set modal window to pop up 30 sec before time is up
            $timeout(function () {
                $scope.showLongBetModal(longBet.bidEntity);
            }, (time - 0.5) * 60000);

            // Subtract time every 30 seconds.
            $interval(function () {
                if ($scope.longBets[longBet.bidEntity.id].ttl)
                    $scope.longBets[longBet.bidEntity.id].ttl -= 0.5;
                else {
                    delete $scope.longBets[longBet.bidEntity.id];
                    $scope.longBetsLength--;
                }
            }, 30000, $scope.longBets[longBet.bidEntity.id].ttl / 0.5 + 1, true);

            dialogs.notify("Long bet added", "Long bet " + longBet.bidEntity.bidDescription + " was added");
            $scope.changeEventTemplate($scope.events.corner);
            $scope.longBetsLength++;
            $timeout(function () {
                $scope.$apply();
            });
        };

        $scope.showLongBetModal = function (bid) {
            var dlg = dialogs.create('/modals/longbetresolution.html', 'bidModalCtrl', bid, 'lg');
            dlg.result.then(function (complete) {
                if (complete) {
                    delete $scope.longBets[bid.id];
                    $scope.longBetsLength--;
                }
            });
        };

    }]).controller('bidModalCtrl', function ($scope, $modalInstance, data, PubNub) {
    //-- Variables --//

    $scope.bidEntity = data;
    $scope.bidOptions = $scope.bidEntity.bidOptions.map(function (el) {
        return el.optionDescription;
    });
    //-- Methods --//

    $scope.completed = false;

    $scope.cancel = function () {
        $modalInstance.dismiss(false);
    }; // end cancel

    $scope.betOpen = true;

    $scope.hitEnter = function (evt) {
        if (angular.equals(evt.keyCode, 13) && !(angular.equals($scope.user.name, null) || angular.equals($scope.user.name, '')))
            $scope.save();
    };

    $scope.closeBet = function () {

        // Publish to server
        PubNub.ngPublish({
            channel: 'requests',
            message: {bidId: $scope.bidEntity.id, close: true}
        });

        // Notify all clients
        PubNub.ngPublish({
            channel: $scope.bidEntity.id + '_msg',
            message: {bidId: $scope.bidEntity.id, close: true}
        });

        $scope.betOpen = false;
    };

    $scope.publishWinningResult = function (optionIndex) {
        PubNub.ngPublish({
            channel: 'requests',
            message: {bidId: $scope.bidEntity.id, winningOption: optionIndex}
        });

        PubNub.ngPublish({
            channel: $scope.bidEntity.id + '_msg',
            message: {bidId: $scope.bidEntity.id, winningOption: optionIndex}
        });

        $scope.completed = true;
        $modalInstance.close(true);
    };

});
