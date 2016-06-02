var trainerApp = angular.module('trainerApp', ['ezfb', 'backand'])

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

.service('loginService', ['ezfb', '$q', function (ezfb, $q) {
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
            action(res);
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

.controller('mainController', ['$scope', 'loginService', 'dataService', function ($scope, loginService, dataService) {
    $scope.currentStep = '';
    $scope.currentLevel = 0;

    var tests = new Array();
    tests.push({
        name: 'Inicio - primeiras notas',
        timeBetweenNotes: 1500,
        timeToKillNote: 6000,
        passRate: 100,
        noteQuantity: 10,
        notes: new Array(0, 1, 2)
    });

    tests.push({
        name: 'Inicio - meio do pentagrama',
        timeBetweenNotes: 1200,
        timeToKillNote: 6000,
        passRate: 100,
        noteQuantity: 13,
        notes: new Array(3, 4, 5, 6)
    });

    tests.push({
        name: 'Inicio - escala toda',
        timeBetweenNotes: 1200,
        timeToKillNote: 6000,
        passRate: 100,
        noteQuantity: 20,
        notes: new Array(1, 2, 3, 4, 5, 6)
    });

    tests.push({
        name: 'Inicio - nova escala',
        timeBetweenNotes: 1000,
        timeToKillNote: 6000,
        passRate: 100,
        noteQuantity: 20,
        notes: new Array(7, 8, 9, 10, 11, 12, 13)
    });

    tests.push({
        name: 'Inicio - duas escalas',
        timeBetweenNotes: 1000,
        timeToKillNote: 4500,
        passRate: 100,
        noteQuantity: 30,
        notes: new Array(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13)
    });

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

    $scope.allTests = angular.copy(tests);

    loginService.loginStatus().then(function (res) {
        updateLoginStatus(res);
    });

    $scope.login = function () {
        loginService.login().then(function (res) {
            updateLoginStatus(res);
        });
    };

    $scope.logout = function () {
        loginService.logout().then(function (res) {
            updateLoginStatus(res);
            trainner.clear();
            $scope.currentUser = undefined;
        });
    };

    function updateLoginStatus(res) {
        $scope.loginStatus = res;

        if (res.status === 'connected') {
            $scope.currentStep = 'pre_test';

            loginService.updateApiMe().then(function (res) {
                $scope.apiMe = res;
                getUserInformation(res)
            });
        }
        else {
            $scope.currentStep = 'not_logged';
        }
    }

    function getUserInformation(res) {
        dataService.getUser(res.id).then(function (getUserResult) {
            if (getUserResult.data.length === 0) {
                dataService.createUser($scope.apiMe.id, $scope.apiMe.name)
                    .then(function (createUserResult) {
                        $scope.currentUser = createUserResult.data;
                        $scope.currentLevel = $scope.currentUser.currentLevel;
                    }, function (result) {
                        console.log(result);
                    });;
            }
            else {
                $scope.currentUser = getUserResult.data[0];
                $scope.currentLevel = $scope.currentUser.currentLevel;
            }

        }, function (result) {
            console.log(result);
        });
    }

    $scope.share = function () {
        loginService.share(
            'Vamos treinar leitura de partitura?',
            'http://musicsheettrainer.azurewebsites.net',
            'Exercite a leitura de partitura de forma fácil e divertida!');
    };

    var onFinishFunction = function (result) {
        $scope.currentStep = 'result'
        $scope.testResult = result;

        if (result.passed) {
            $scope.currentLevel++;

            if ($scope.currentLevel > $scope.currentUser.currentLevel) {
                $scope.currentUser.currentLevel = $scope.currentLevel;
                dataService.updateUserLevel($scope.currentUser.id, $scope.currentUser.currentLevel);
            }
        }

        $scope.isLastTest = $scope.currentUser.currentLevel >= tests.length;
    };

    var trainner = MS$({
        scope: $scope,
        sheetWidth: 700,
        onFinish: onFinishFunction
    });

    $scope.isCurrentStep = function (step) {
        return $scope.currentStep == step
    };

    $scope.startChoosenTest = function (level) {
        $scope.currentLevel = level;
        $scope.startTest();
    };

    $scope.startTest = function () {
        $scope.currentStep = 'test';
        createTest(tests[$scope.currentLevel]);
    };

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
}]);