angular.module('liveBetManager').controller('eventController',['$scope','$rootScope','PubNub', 'betManagerService', '$timeout', 'localStorageService', 'ModalService',
    function($scope, $rootScope, PubNub, betManagerService,$timeout, localStorageService,ModalService) {
        $scope.log = [];
        $scope.game = localStorageService.get('game');
        PubNub.ngSubscribe({
            channel : $scope.game.gameName.replace(/\s/gi,'_'),
            message : function(message){

            },
            error: function(data){
                $scope.log.push(game.gameName+": "+data);
            },
            connect: function(data){
                $scope.log.push(game.gameName+": "+data);
            },
            disconnect: function(data){
                $scope.log.push(game.gameName+": "+data);
            }
        });

        $scope.closeGame = function(){
            ModalService.showModal({
                templateUrl: 'modals/yesno.html',
                controller: "ModalController"
            }).then(function(modal) {
                modal.element.modal();
                modal.close.then(function(result) {
                    if(result == "Yes"){
                        betManagerService.closeGame($rootScope.activeGame).success(function(){
                            alert('Game Closed');
                        });
                    }
                });
            });

        }
    }]);
