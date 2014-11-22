angular.module('liveBetManager').controller('eventController', ['$scope', '$rootScope', 'PubNub', 'betManagerService', '$timeout', 'localStorageService', 'ModalService',
    function ($scope, $rootScope, PubNub, betManagerService, $timeout, localStorageService, ModalService) {
        $scope.connected = false;
        $scope.log = [];
        //console.log("herh ehrer");
        //    $scope.game = localStorageService.get('game');//this contains following array
        $scope.eventDescription = {teams: []};

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
            offside: {
                eventName: 'Offside',
                viewElements: {
                    eventTeamSelector: {selectionCount: '1'}
                },
                toString: function () {
                    return "Offside by " + $scope.eventDescription.playerName + " of " + $scope.eventDescription.teamName;
                },
                eventOptions: ['Goal', 'Out', 'Potato']
            },
            substitution: {
                eventName: 'Substitution',
                viewElements: {
                    eventTeamSelector: {selectionCount: '1'},
                    substitutionOptions: true
                },
                toString: function () {
                    return "Substitution - "+$scope.eventDescription.teamName+": " + $scope.eventDescription.playerName + " is warming up. Who will he replace?";
                },
                eventOptions: []
            }
        };


        //$scope.events = [{'eventName':'Foul','eventTemplate':'foul.html'},
        //				{'eventName':'Free Kick','eventTemplate':'Free_Kick.html', toString: function(player){
        //					return "Free Kick: " + player.playerName + " is kicking for " + player.teamName;
        //				}},
        //				{'eventName':'Corner','eventTemplate':'Corner.html'},
        //				{'eventName':'Out','eventTemplate':'out.html'},
        //				{'eventName':'Offside','eventTemplate':'Offside.html'},
        //				{'eventName':'Penalty','eventTemplate':'Penalty.html'},
        //				{'eventName':'Substitution','eventTemplate':'Substitution.html'},
        //               {'eventName': 'Custom Event', 'eventTemplate': 'custom.html'}];
        //comes from game.teams
        $scope.teams = [{
            'teamName': "macabi tel-aviv", 'players': [
                {'playerName': "Messi"},
                {'playerName': "Ronaldo"},
                {'playerName': "Neymar"},
                {'playerName': "Haim"},
                {'playerName': "yafyoofi"},
                {'playerName': "mooshon"},
                {'playerName': "eliran"},
                {'playerName': "adiel"},
                {'playerName': "uziel"},
                {'playerName': "yerachmiel"},
                {'playerName': "tzidki"}],
            'active': false
        },
            {
                'teamName': "beytar jerusalem", 'players': [
                {'playerName': "Messi1"},
                {'playerName': "Ronaldo1"},
                {'playerName': "Neymar1"},
                {'playerName': "Haim1"},
                {'playerName': "yafyoofi1"},
                {'playerName': "mooshon1"},
                {'playerName': "eliran1"},
                {'playerName': "adiel1"},
                {'playerName': "uziel1"},
                {'playerName': "yerachmiel1"},
                {'playerName': "tzidki1"}],
                'active': false
            }
        ];

        $scope.teamsToPlayers = {
            "macabi tel-aviv": $scope.teams[0],
            "beytar jerusalem": $scope.teams[1]
        };

        /*
         $scope.theteam = '?';
         $scope.setTeam = function(teamName) {
         console.log('in teams'+teamName);
         $scope.theteam = teamName;
         for (var i=0; i<$scope.teams.length; I++){
         $scope.theteam[i]
         }
         $scope.kicker = '?';
         };

         $scope.kicker = '?';
         $scope.setPlayer = function(playerName) {
         console.log('in players'+playerName);
         $scope.kicker = playerName;
         };*/
        $scope.disableOpen = true;
        $scope.disableClose = true;
        $scope.disableOutcomes = true;


        $scope.betArray = {betDescription: '', betOptions: ['blah', 'blooh', 'bliiigggg']};
        $scope.selectedOption;
        $scope.disableTheRest = function () {
            for (var i = 0; i < $scope.teams.length; i++) {
                $scope.teams[i].active = false;
            }
            $scope.betArray.betDescription = null;
        }
        $scope.allowBet = function () {
            console.log('say is==' + $scope.betArray.betDescription);
            console.log('say is==' + $scope.betArray.betOptions);
            $scope.disableOpen = false;
        }
        $scope.openBet = function () {
            //do somthing here to send betarray to the server
            $scope.disableClose = false;
            $scope.disableOpen = true;
        }
        $scope.openSubmitOutcomes = function () {
            $scope.disableOpen = true;
            $scope.disableClose = true;
            $scope.disableOutcomes = false;
        }

        $scope.templateroot = 'partials/eventstemplates/';
        $scope.currentEvent;

        $scope.changeEventTemplate = function (template) {
            $scope.currentEvent = template;
            $scope.eventDescription = {teams: []};
        };


        /*    $scope.betSyntax = [];
         $scope.teamRosters = {};
         $scope.selectedTeamIndex = 0;*/
        /*    PubNub.ngSubscribe({
         channel : $scope.game._id,
         message : function(message){

         },
         error: function(data){
         $scope.log.push($scope.game.gameName+": "+data);
         },
         connect: function(data){
         $scope.$apply(function(){$scope.connected = true;});
         },
         disconnect: function(data){
         $scope.$apply(function(){$scope.connected = false;});
         }
         });*/

        /*    $scope.setSyntax = function($event, index){
         $scope.betSyntax[index] = $event.currentTarget.innerHTML;
         };

         $scope.selectTeamName = function($event, index){
         $scope.setSyntax($event, 1);
         $scope.selectTeamIndex = index;
         betManagerService.getTeamRoster($scope.game.teams).success(function(data){
         $scope.teamRosters = data;
         });
         };

         $scope.closeGame = function(){
         ModalService.showModal({
         templateUrl: 'modals/yesno.html',
         controller: "ModalController"
         }).then(function(modal) {
         modal.element.modal();
         modal.close.then(function(result) {
         if(result == "Yes"){
         betManagerService.closeGame($scope.game).success(function(){
         alert('Game Closed');
         window.location = "#/startGame";
         });
         }
         });
         });

         };*/
    }]);
