
angular.module('liveBetManager').controller('reportingController', ['$scope', '$rootScope', '$route', '$routeParams', 'PubNub', 'betManagerService', 'teamsService', 'ModalService', '$timeout', 'dialogs', function ($scope, $rootScope, $route,$routeParams, PubNub, betManagerService, teamsService, ModalService, $timeout,dialogs) {
    $scope.currentView = $routeParams.currentView || "home";
    $scope.changeView = function(view){
      location.href=view;

    };
    $scope.includes = {
        liveGame: '/partials/reporting/livegame.html',
        revenue: '/partials/reporting/revenue.html'
    }
}]);
