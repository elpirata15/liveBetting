/*global angular*/
angular.module('liveBetManager').controller('gameController', ['$scope', '$rootScope', '$location', 'PubNub', 'betManagerService', 'teamsService', 'authService', '$timeout', 'localStorageService', '$filter',
    function($scope, $rootScope, $location, PubNub, betManagerService, teamsService, authService, $timeout, localStorageService, $filter) {
        $scope.game = {};
        $scope.team1 = "";
        $scope.team2 = "";
        $scope.availableTeams = [];
        $scope.displayTeams = [];
        $scope.leagues = $rootScope.leagues;
        $scope.stadiums = [{
            teamName: 'Arsenal',
            stadiumName: 'Emirates Stadium'
        }, {
            teamName: 'Aston Villa',
            stadiumName: 'Villa Park'
        }, {
            teamName: 'Burnley',
            stadiumName: 'Turf Moor'
        }, {
            teamName: 'Chelsea',
            stadiumName: 'Stamford Bridge'
        }, {
            teamName: 'Crystal Palace',
            stadiumName: 'Selhurst Park'
        }, {
            teamName: 'Everton',
            stadiumName: 'Goodison Park'
        }, {
            teamName: 'Hull City',
            stadiumName: 'KC Stadium'
        }, {
            teamName: 'Leicester City',
            stadiumName: 'King Power Stadium'
        }, {
            teamName: 'Liverpool',
            stadiumName: 'Anfield'
        }, {
            teamName: 'Manchester City',
            stadiumName: 'Etihad Stadium'
        }, {
            teamName: 'Manchester United',
            stadiumName: 'Old Trafford'
        }, {
            teamName: 'Newcastle United',
            stadiumName: 'St. James Park'
        }, {
            teamName: 'Queens Park Rangers',
            stadiumName: 'Loftus Road'
        }, {
            teamName: 'Southampton',
            stadiumName: 'St. Mary\'s Stadium'
        }, {
            teamName: 'Stoke City',
            stadiumName: 'Britannia Stadium'
        }, {
            teamName: 'Sunderland ',
            stadiumName: 'Stadium of Light'
        }, {
            teamName: 'Swansea City',
            stadiumName: 'Liberty Stadium'
        }, {
            teamName: 'Tottenham Hotspur',
            stadiumName: 'White Hart Lane'
        }, {
            teamName: 'West Bromwich Albion',
            stadiumName: 'The Hawthorns'
        }, {
            teamName: 'West Ham United',
            stadiumName: 'Boleyn Ground'
        }, {
            teamName: 'Atalanta',
            stadiumName: 'Stadio Atleti Azzurri d\'Italia'
        }, {
            teamName: 'Cagliari',
            stadiumName: 'Stadio Sant\'Elia'
        }, {
            teamName: 'Cesena',
            stadiumName: 'Stadio Dino Manuzzi'
        }, {
            teamName: 'Chievo',
            stadiumName: 'Stadio Marc\'Antonio Bentegodi'
        }, {
            teamName: 'Empoli',
            stadiumName: 'Stadio Carlo Castellani'
        }, {
            teamName: 'Fiorentina',
            stadiumName: 'Stadio Artemio Franchi'
        }, {
            teamName: 'Genoa',
            stadiumName: 'Stadio Luigi Ferraris'
        }, {
            teamName: 'Internazionale',
            stadiumName: 'San Siro'
        }, {
            teamName: 'Juventus ',
            stadiumName: 'Juventus Stadium'
        }, {
            teamName: 'Lazio',
            stadiumName: 'Stadio Olimpico'
        }, {
            teamName: 'Milan ',
            stadiumName: 'San Siro'
        }, {
            teamName: 'Napoli',
            stadiumName: 'Satdio San Paolo'
        }, {
            teamName: 'Palenzo',
            stadiumName: 'Stadio Renzo Barbera'
        }, {
            teamName: 'Parma',
            stadiumName: 'Stadio Ennio Tardini'
        }, {
            teamName: 'Roma',
            stadiumName: 'Stadio Olimpico'
        }, {
            teamName: 'Sampdoria',
            stadiumName: 'Stadio Luigi Ferraris'
        }, {
            teamName: 'Sassuolo',
            stadiumName: 'Mapei Stadium'
        }, {
            teamName: 'Torino',
            stadiumName: 'Olimpico di Torino'
        }, {
            teamName: 'Udinese',
            stadiumName: 'Stadio Friuli'
        }, {
            teamName: 'Verona ',
            stadiumName: 'Stadio Marc\'Antonio Bentegodi'
        }, {
            teamName: 'Atletico Madrid',
            stadiumName: 'Vicente Calderón'
        }, {
            teamName: 'Real Madrid',
            stadiumName: 'Santiago Bernabéu'
        }, {
            teamName: 'AS Monaco',
            stadiumName: 'Stade Louis II'
        }, {
            teamName: 'Borrusia Dortmund',
            stadiumName: 'Signal Iduna Park'
        }, {
            teamName: 'Bayern Munich',
            stadiumName: 'Allianz Arena'
        }, {
            teamName: 'Barcelona',
            stadiumName: 'Camp Nou'
        }, {
            teamName: 'Chelsea',
            stadiumName: 'Stamford Bridge'
        }, {
            teamName: 'Porto',
            stadiumName: 'Estádio do Dragão'
        }, {
            teamName: 'Juventus',
            stadiumName: 'Juventus Stadium'
        }, {
            teamName: 'Basel',
            stadiumName: 'St. Jakob-Park '
        }, {
            teamName: 'Bayer Leverkusen',
            stadiumName: 'BayArena'
        }, {
            teamName: 'Arsenal',
            stadiumName: 'Emirates Stadium'
        }, {
            teamName: 'Manchester City',
            stadiumName: 'Etihad Stadium'
        }, {
            teamName: 'Paris Saint-Germain',
            stadiumName: 'Parc des Princes'
        }, {
            teamName: 'Schalke 04',
            stadiumName: 'Veltins-Arena'
        }, {
            teamName: 'Sakhtar Donetsk',
            stadiumName: 'Arena Lviv'
        }, {
            teamName: 'Almería',
            stadiumName: 'Juegos Mediterráneos'
        }, {
            teamName: 'Athletic Bilbao',
            stadiumName: 'San Mamés'
        }, {
            teamName: 'Atletico Madrid',
            stadiumName: 'Vicente Calderón'
        }, {
            teamName: 'Barcelona',
            stadiumName: 'Camp Nou'
        }, {
            teamName: 'Celta de Vigo',
            stadiumName: 'Balaídos'
        }, {
            teamName: 'Córdoba',
            stadiumName: 'Nuevo Arcángel'
        }, {
            teamName: 'Deportivo de La Coruña',
            stadiumName: 'Riazor'
        }, {
            teamName: 'Eibar ',
            stadiumName: 'Ipurua'
        }, {
            teamName: 'Elche',
            stadiumName: 'Martinez Valero'
        }, {
            teamName: 'Espanyol',
            stadiumName: 'Cornellà-El Prat'
        }, {
            teamName: 'Getafe',
            stadiumName: 'Coliseum Alfonso Pérez'
        }, {
            teamName: 'Granada',
            stadiumName: 'Nuevo Los Cármenes'
        }, {
            teamName: 'Levante',
            stadiumName: 'Ciutata de Valencia'
        }, {
            teamName: 'Malaga',
            stadiumName: 'La Rosaleda'
        }, {
            teamName: 'Raye Vallecano',
            stadiumName: 'Vallecas'
        }, {
            teamName: 'Real Madrid',
            stadiumName: 'Santiago Bernabéu'
        }, {
            teamName: 'Real Sociedad',
            stadiumName: 'Anoeta'
        }, {
            teamName: 'Sevilla',
            stadiumName: 'Ramón Sánchez Pizjuán'
        }, {
            teamName: 'Valencia',
            stadiumName: 'Mestalla'
        }, {
            teamName: 'Villarreal',
            stadiumName: 'El Madrigal'
        }, {
            teamName: 'FC Augsburg',
            stadiumName: 'SGL arena'
        }, {
            teamName: 'Bayer Leverkusen',
            stadiumName: 'BayArena'
        }, {
            teamName: 'Bayern Munich',
            stadiumName: 'Allianz Arena'
        }, {
            teamName: 'Borrusia Dortmund',
            stadiumName: 'Signal Iduna Park'
        }, {
            teamName: 'Borussia Mönchengladbach',
            stadiumName: 'Stadion im Borrusia-Park'
        }, {
            teamName: 'Eintracht Frankfurt',
            stadiumName: 'Commerzbank-Arena'
        }, {
            teamName: 'SC Freiburg',
            stadiumName: 'Schwarzwald-Stadion'
        }, {
            teamName: 'Hamburger SV',
            stadiumName: 'Imtech Arena'
        }, {
            teamName: 'Hannover 96',
            stadiumName: 'HDI-Arena'
        }, {
            teamName: 'Hertha BSC',
            stadiumName: 'Olympiastadion'
        }, {
            teamName: 'TSG 1899 Hoffenheim',
            stadiumName: 'Rhein-Neckar Arena'
        }, {
            teamName: '1. FC Köln',
            stadiumName: 'RheinEnergieStadion'
        }, {
            teamName: '1. FSV Mainz 05',
            stadiumName: 'Coface Arena'
        }, {
            teamName: 'SC Paderborn 07',
            stadiumName: 'Benteler Arena'
        }, {
            teamName: 'Schalke 04',
            stadiumName: 'Veltins-Arena'
        }, {
            teamName: 'Vfb Stuttgart',
            stadiumName: 'Mercedes-Benz Arena'
        }, {
            teamName: 'Werder Bremen',
            stadiumName: 'Weserstadion'
        }, {
            teamName: 'Vfl Wolfsburg',
            stadiumName: 'Volkswagen Arena'
        }];

        teamsService.getAllTeams().success(function(data) {
            $scope.availableTeams = data;
            $scope.displayTeams = data;
        });

        $scope.startGame = function() {
            //$scope.game.assignedTo = $scope.game.assignedTo._id;
            $scope.game.gameName = $scope.team1.teamName + " vs. " + $scope.team2.teamName;
            $scope.game.teams = [$scope.team1._id, $scope.team2._id];
            //$scope.game.teams.push({teamName: $scope.team1.teamName, teamId: $scope.team1._id}, {teamName: $scope.team2.teamName, teamId: $scope.team2._id});
            $scope.game.timestamp = new Date($scope.date.getFullYear(), $scope.date.getMonth(), $scope.date.getDate(), $scope.time.getHours(), $scope.time.getMinutes());
            betManagerService.createGame($scope.game).success(function() {
                window.location = "/#/";
                alert('game created');
            });
        };

        $scope.filterStadiums = function(value, index){
          return ($scope.team1.teamName.indexOf(value.teamName) > -1 || $scope.team2.teamName.indexOf(value.teamName) > -1);  
        };

        betManagerService.getManagers().success(function(data) {
            $scope.managers = data;
        });
    }
]);
