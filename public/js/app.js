'use strict';

angular.module('liveBetManager', [
    'ngCookies',
    'ngRoute',
    'LocalStorageModule',
    'angularModalService',
    'pubnub.angular.service'
]).config(['$routeProvider', 'localStorageServiceProvider', function($routeProvider, localStorageServiceProvider){
    $routeProvider.when('/', {templateUrl: 'partials/home.html', controller:'homeController'});
    $routeProvider.when('/startGame', {templateUrl: 'partials/startgame.html', controller:'gameController'});
    $routeProvider.when('/eventManager', {templateUrl: 'partials/eventmanager.html', controller:'eventController'});
    $routeProvider.otherwise('/');

    localStorageServiceProvider.setPrefix('liveBetManager');
}]).run(function($rootScope,PubNub){
    $rootScope.activeGame = {};
    $rootScope.uuid = 'console' + Math.random();
    var keys = {
        publish_key   : 'pub-c-d9e96f7d-2b88-4081-b25e-8f74aa7e9151',
        subscribe_key : 'sub-c-9f28fbce-55f5-11e4-8cbc-02ee2ddab7fe',
        uuid: $rootScope.uuid
    };

    PubNub.init(keys);
});
