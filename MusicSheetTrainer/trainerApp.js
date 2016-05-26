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

.controller('mainController', ['$scope', 'ezfb', 'Backand', '$http', function ($scope, ezfb, Backand, $http) {
    $scope.currentStep = '';

    var tests = new Array();
    tests.push(new Array(0, 1));
    tests.push(new Array(0, 1, 2, 3, 4, 5, 6, 7));
    tests.push(new Array(1, 2, 5, 6, 10));
    tests.push(new Array(0, 4, 6));
    tests.push(new Array(0, 2, 4, 6));

    var onFinishFunction = function (result) {
        $scope.currentStep = 'result'
        $scope.testResult = result;

        if (result.passed) {
            $scope.currentUser.currentLevel++;
            updateUserLevel($scope.currentUser.id, $scope.currentUser.currentLevel);
        }

        $scope.isLastTest = $scope.currentUser.currentLevel >= tests.length;
    };

    var trainner = MS$({
        scope: $scope,
        sheetWidth: 700,
        onFinish: onFinishFunction
    });

    updateLoginStatus();

    $scope.login = function () {
        ezfb.login(function (res) {
            if (res.authResponse) {
                updateLoginStatus();
            }
        }, {
            scope: 'public_profile,email'
        });
    };

    $scope.logout = function () {
        ezfb.logout(function () {
            updateLoginStatus();
        });
        trainner.clear();
    };

    $scope.share = function () {
        ezfb.ui(
          {
              method: 'feed',
              name: 'Vamos treinar leitura de partitura?',
              picture: 'http://plnkr.co/img/plunker.png',
              link: 'http://musicsheettrainer.azurewebsites.net',
              description: 'Exercite a leitura de partitura de forma fácil e divertida!'
          },
          function (res) {
              // res: FB.ui response
          }
        );
    };

    $scope.isCurrentStep = function (step) {
        return $scope.currentStep == step
    };

    $scope.startTest = function () {
        $scope.currentStep = 'test';
        createTest(tests[$scope.currentUser.currentLevel]);
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

    function updateLoginStatus() {
        ezfb.getLoginStatus(function (res) {
            $scope.loginStatus = res;

            if (res.status === 'connected') {
                $scope.currentStep = 'pre_test';

                updateApiMe();
            }
            else {
                $scope.currentStep = 'not_logged';
            }
        });
    }

    function updateApiMe() {
        ezfb.api('/me', function (res) {
            $scope.apiMe = res;
            console.log(res);

            getUser(res.id)
                .then(function (getUserResult) {
                    if (getUserResult.data.length === 0) {
                        createUser($scope.apiMe.id, $scope.apiMe.name)
                            .then(function (createUserResult) {
                                $scope.currentUser = createUserResult.data;
                            }, function (result) {
                                console.log(result);
                            });;
                    }
                    else {
                        $scope.currentUser = getUserResult.data[0];
                    }

                }, function (result) {
                    console.log(result);
                });
        });
    }

    function createTest(notes) {
        var testInformation = {
            notes: notes,
            passRate: 100,
            passTime: 0,
            timeBetweenNotes: 1000,
            timeToKillNote: 6000
        };

        trainner.createTest(testInformation);
    }

    function createUser(facebookId, name) {
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

    function getUser(facebookId) {
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

    function updateUserLevel(userId, level) {
        return $http({
            method: 'PUT',
            url: Backand.getApiUrl() + '/1/objects/users/' + userId + '?returnObject=true',
            data: {
                currentLevel: level
            }
        });
    }
}]);