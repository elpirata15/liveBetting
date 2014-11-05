angular.module('liveBetManager').controller('eventController',['$scope','$rootScope','PubNub', 'betManagerService', '$timeout', 'localStorageService', 'ModalService',
    function($scope, $rootScope, PubNub, betManagerService,$timeout, localStorageService,ModalService) {
        $scope.connected = false;
        $scope.log = [];
        $scope.game = localStorageService.get('game');
        $scope.betSyntax = [];
        $scope.teamRosters = {};
        $scope.selectedTeamIndex = 0;
        PubNub.ngSubscribe({
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
        });

        $scope.setSyntax = function($event, index){
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

        };
    }]);
