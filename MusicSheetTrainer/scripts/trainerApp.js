var trainerApp = angular.module('trainerApp', ['ezfb', 'backand', 'ngRoute'])

.config(function (ezfbProvider) {
    ezfbProvider.setLocale('pt_BR');

    ezfbProvider.setInitParams({
        appId: '230685073991478',
        version: 'v2.6'
    });
})

.config(function (BackandProvider) {
    BackandProvider.setAppName('musicsheettrainer');
    BackandProvider.setSignUpToken('fd820533-b969-4877-a59b-f1f9c9d59850');
    BackandProvider.setAnonymousToken('62e58aa7-6bf4-47a6-8177-ef6ff18aa69d');
})

.config(function ($routeProvider) {

    $routeProvider

    .when('/', {
        templateUrl: 'pages/login.html',
        controller: 'mainController'
    })

    .when('/login', {
        templateUrl: 'pages/login.html',
        controller: 'mainController'
    })

    .when('/start', {
        templateUrl: 'pages/start.html',
        controller: 'mainController'
    })

    .when('/result', {
        templateUrl: 'pages/result.html',
        controller: 'resultController'
    })

    .when('/test/:testId', {
        templateUrl: 'pages/test.html',
        controller: 'testController'
    })

})

.service('userService', ['ezfb', '$q', 'dataService', function (ezfb, $q, dataService) {
    this.currentUser = undefined;
    this.apiMe = undefined;
    this.testResult = undefined;

    var _self = this;

    this.login = function () {
        var deferred = $q.defer();

        ezfb.login(function (res) {
            if (res.authResponse) {
                updateLoginStatus(deferred.resolve);
            }
        }, {
            scope: 'public_profile,email'
        });

        return deferred.promise;
    };

    this.logout = function () {
        var deferred = $q.defer();

        ezfb.logout(function () {
            _self.currentUser = undefined;
            _self.apiMe = undefined;

            updateLoginStatus(deferred.resolve);
        });

        return deferred.promise;
    };

    this.loginStatus = function () {
        var deferred = $q.defer();

        updateLoginStatus(deferred.resolve);

        return deferred.promise;
    };

    this.updateApiMe = function () {
        var deferred = $q.defer();

        ezfb.api('/me', function (res) {
            deferred.resolve(res);
        });

        return deferred.promise;
    };

    this.share = function (name, link, description) {
        var deferred = $q.defer();

        ezfb.ui(
          {
              method: 'feed',
              name: name,
              picture: 'http://musicsheettrainer.azurewebsites.net/logo_squared.png',
              link: link,
              description: description
          },
          function (res) {
              // res: FB.ui response
              deferred.resolve(res);
          }
        );

        return deferred.promise;
    };

    function updateLoginStatus(action) {
        ezfb.getLoginStatus(function (res) {
            if (res.status === 'connected') {
                _self.updateApiMe().then(function (user) {
                    _self.apiMe = user;
                    getUserInformation(user, action);
                });
            }
            else {
                action();
            }
        });
    }

    function getUserInformation(user, action) {
        dataService.getUser(user.id).then(function (getUserResult) {
            if (getUserResult.data.length === 0) {
                dataService.createUser(_self.apiMe.id, _self.apiMe.name)
                    .then(function (createUserResult) {
                        _self.currentUser = createUserResult.data;
                        action();
                    }, function (result) {
                        console.log(result);
                        action();
                    });;
            }
            else {
                _self.currentUser = getUserResult.data[0];
                action();
            }

        }, function (result) {
            console.log(result);
            action();
        });
    }
}])

.service('dataService', ['Backand', '$http', function (Backand, $http) {
    this.createUser = function (facebookId, name) {
        return $http({
            method: 'POST',
            url: Backand.getApiUrl() + '/1/objects/users?returnObject=true',
            data: {
                facebook_id: facebookId,
                name: name,
                currentLevel: '0'
            }
        });
    }

    this.getUser = function (facebookId) {
        return $http({
            method: 'GET',
            url: Backand.getApiUrl() + '/1/query/data/current_user',
            params: {
                parameters: {
                    facebook_id: facebookId
                }
            }
        });
    }

    this.updateUserLevel = function (userId, level) {
        return $http({
            method: 'PUT',
            url: Backand.getApiUrl() + '/1/objects/users/' + userId + '?returnObject=true',
            data: {
                currentLevel: level
            }
        });
    }
}])

.controller('resultController', ['$scope', '$location', 'userService', function ($scope, $location, userService) {
    var currentLevel = userService.currentUser.currentLevel;
    var tests = getTests();

    $scope.testResult = userService.testResult;

    $scope.hasAccessToLevel = function (level) {
        return userService.currentUser != undefined && userService.currentUser.currentLevel >= level;
    }

    $scope.startChoosenTest = function (level) {
        currentLevel = level;
        $scope.startTest();
    };

    $scope.startTest = function () {
        $location.url("/test/" + currentLevel);
    };

    $scope.isLastTest = function () {
        return currentLevel < tests.length;
    };
}])

.controller('testController', ['$scope', '$location', '$routeParams', 'userService', function ($scope, $location, $routeParams, userService) {
    var tests = getTests();

    $scope.allTests = angular.copy(tests);

    var onFinishFunction = function (result) {
        $location.url("/result");
        trainner.clear();

        userService.testResult = result;

        if (result.passed) {
            currentLevel++;

            if (userService.currentUser.currentLevel < level) {
                userService.currentUser.currentLevel = currentLevel;
                dataService.updateUserLevel(userService.currentUser.id, userService.currentUser.currentLevel);
            }
        }
    };

    var trainner = MS$({
        scope: $scope,
        sheetWidth: 700,
        onFinish: onFinishFunction
    });

    trainner.clear();

    createTest(tests[$routeParams.testId]);

    $scope.checkNote = function (note) {
        trainner.checkNote(note);
    }

    $scope.keyPressed = function (key) {
        switch (key.keyCode) {
            case 49:
            case 97:
                trainner.checkNote(0);
                break;

            case 50:
            case 98:
                trainner.checkNote(1);
                break;

            case 51:
            case 99:
                trainner.checkNote(2);
                break;

            case 52:
            case 100:
                trainner.checkNote(3);
                break;

            case 53:
            case 101:
                trainner.checkNote(4);
                break;

            case 54:
            case 102:
                trainner.checkNote(5);
                break;

            case 55:
            case 103:
                trainner.checkNote(6);
                break;
        }
    }

    function createTest(test) {
        var notes = new Array();

        for (var i = 0; i < test.noteQuantity; i++) {
            var position = Math.floor(Math.random() * test.notes.length);
            notes.push(test.notes[position]);
        }

        var testInformation = {
            notes: notes,
            passRate: test.passRate,
            passTime: 0,
            timeBetweenNotes: test.timeBetweenNotes,
            timeToKillNote: test.timeToKillNote
        };

        trainner.createTest(testInformation);
    }
}])

.controller('mainController', ['$scope', '$location', 'userService', 'dataService', function ($scope, $location, userService, dataService) {
    var currentLevel = 0;

    var tests = getTests();

    $scope.allTests = angular.copy(tests);

    userService.loginStatus().then(function (res) {
        updateLoginStatus(res);
    });

    $scope.login = function () {
        userService.login().then(function (res) {
            updateLoginStatus(res);
        });
    };

    $scope.logout = function () {
        userService.logout().then(function (res) {
            updateLoginStatus(res);
        });
    };

    function updateLoginStatus(res) {
        if (userService.currentUser == undefined) {
            $location.url("/login");
        }
        else {
            $location.url("/start");
            currentLevel = userService.currentUser.currentLevel;
            $scope.name = userService.currentUser.name;
        }
    }

    $scope.share = function () {
        userService.share(
            'Vamos treinar leitura de partitura?',
            'http://musicsheettrainer.azurewebsites.net',
            'Exercite a leitura de partitura de forma fácil e divertida!');
    };

    $scope.isCurrentUserLoaded = function () {
        return userService.currentUser != undefined;
    }

    $scope.hasAccessToLevel = function (level) {
        return $scope.isCurrentUserLoaded() && userService.currentUser.currentLevel >= level;
    }

    $scope.startChoosenTest = function (level) {
        currentLevel = level;
        $scope.startTest();
    };

    $scope.startTest = function () {
        $location.url("/test/" + currentLevel);
    };
}]);


function getTests() {
    var tests = new Array();
    tests.push({
        name: 'Primeiras notas',
        description: 'Em baixa velocidade, vamos estudar a posição do Dó, Ré e Mi.',
        timeBetweenNotes: 1500,
        timeToKillNote: 6000,
        passRate: 100,
        noteQuantity: 10,
        notes: new Array(0, 1, 2)
    });

    tests.push({
        name: 'Meio do pentagrama',
        description: 'Seguindo nosso estudo, vamos para o meio do pentagrama da clave de Sol com o Fá, Sol, Lá e Si.',
        timeBetweenNotes: 1200,
        timeToKillNote: 6000,
        passRate: 100,
        noteQuantity: 13,
        notes: new Array(3, 4, 5, 6)
    });

    tests.push({
        name: 'Escala toda',
        description: 'Agora, para praticar, vamos pegar a escala toda, com um pouco mais de velocidade.',
        timeBetweenNotes: 1200,
        timeToKillNote: 6000,
        passRate: 100,
        noteQuantity: 20,
        notes: new Array(1, 2, 3, 4, 5, 6)
    });

    tests.push({
        name: 'Nova escala',
        description: 'Vamos subir para a próxima escala, com todas as notas do Dó ao Si.',
        timeBetweenNotes: 1000,
        timeToKillNote: 6000,
        passRate: 100,
        noteQuantity: 20,
        notes: new Array(7, 8, 9, 10, 11, 12, 13)
    });

    tests.push({
        name: 'Duas escalas',
        description: 'Para finalizar o estudo da clave de Sol, vamos aumentar a velocidade e encarar notas nas duas escalas.',
        timeBetweenNotes: 1000,
        timeToKillNote: 4500,
        passRate: 100,
        noteQuantity: 30,
        notes: new Array(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13)
    });

    return tests;
}