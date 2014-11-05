angular.module('liveBetManager').controller('serverCtrl',['$scope','$rootScope','PubNub', function($scope, $rootScope, PubNub){
    $scope.connected = false;
    $scope.messages = [];


    $scope.publish = function(){
        PubNub.ngPublish({channel:"adminSocket", message: "gaga"});
    };

    PubNub.ngSubscribe({
       channel:'adminSocket',
        connect: function(){
            return $scope.$apply(function(){
                $scope.connected = true;
            });
        },
        message: function(message){
          return $scope.$apply(function(){
              $scope.messages.push({id: message[1][1], text: message[0]});
          });
        }
    });
//    $scope.message = function(){
//      console.log(arguments);
//    };
//    $rootScope.$on(PubNub.ngMsgEv('adminSocket'), function(event, payload) {
//       return $scope.$apply(function(){
//           // payload contains message, channel, env...
//           console.log('got a message event:', payload);
//       });
//    });

}]);
