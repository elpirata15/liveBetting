angular.module('liveBetManager', [
    'ngCookies',
    'ngRoute',
    'ngSanitize',
    'LocalStorageModule',
    'angularModalService',
    'pubnub.angular.service',
    'ngGrid',
    'dialogs.main',
    'ui.bootstrap'
]).config(['$routeProvider', 'localStorageServiceProvider', function($routeProvider, localStorageServiceProvider){
    //$routeProvider.when('/', {templateUrl: 'partials/home.html', controller:'homeController'});
    $routeProvider.when('/gameMaster', {templateUrl: 'partials/gamemaster.html', controller:'gameMasterController', restrict:['Masters']});
    $routeProvider.when('/gameMaster/newGame', {templateUrl: 'partials/startgame.html', controller:'gameController', restrict:['Masters']});
    $routeProvider.when('/startGame', {templateUrl: 'partials/gamewaitinglist.html', controller:'waitingListController', restrict:['Managers','Masters']});
    $routeProvider.when('/eventManager', {templateUrl: 'partials/eventmanager.html', controller:'eventController', restrict:['Managers','Masters']});
    $routeProvider.when('/login', {templateUrl: 'partials/user/login.html', controller:'userController'});
    $routeProvider.when('/register', {templateUrl: 'partials/user/register.html', controller:'userController'});
    $routeProvider.otherwise('/login');

    localStorageServiceProvider.setPrefix('liveBetManager');
}]).run(function($rootScope,PubNub, authService, $location){
    $rootScope.activeGame = {};
    $rootScope.uuid = 'console' + Math.random();
    var keys = {
        publish_key   : 'pub-c-d9e96f7d-2b88-4081-b25e-8f74aa7e9151',
        subscribe_key : 'sub-c-9f28fbce-55f5-11e4-8cbc-02ee2ddab7fe',
        uuid: $rootScope.uuid
    };
    PubNub.init(keys);

    $rootScope.$on('$routeChangeStart', function(event, next, current) {
        $rootScope.flash = "";
        if(authService.group() != "Admins"){
            if(next.restrict && next.restrict.indexOf(authService.group()) < 0  && !authService.isAuthenticated()){
                $rootScope.returnUrl = current;
                $location.path('/login');
            }
        }
    });
}).controller('ModalController', function($scope, close,betManagerService) {

    $scope.chosenName = undefined;

    betManagerService.getManagers().success(function(data){
        $scope.managers = data;
    });

    $scope.close = function(result) {
        result = result || $scope.chosenName;
        close(result, 500); // close, but give 500ms for bootstrap to animate
    };

});
