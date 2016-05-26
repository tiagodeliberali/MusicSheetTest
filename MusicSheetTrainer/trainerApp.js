var trainerApp = angular.module('trainerApp', ['ezfb'])

.config(function (ezfbProvider) {
    ezfbProvider.setLocale('pt_BR');

    ezfbProvider.setInitParams({
        appId: '230685073991478',
        version: 'v2.6'
    });
})

.controller('mainController', ['$scope', 'ezfb', function ($scope, ezfb) {
    $scope.currentTest = 0;

    var tests = new Array();
    tests.push(new Array(0, 1));
    tests.push(new Array(0, 1, 2, 3, 4, 5, 6, 7));
    tests.push(new Array(1, 2, 5, 6, 10));
    tests.push(new Array(0, 4, 6));
    tests.push(new Array(0, 2, 4, 6));

    $scope.currentStep = '';

    var onFinishFunction = function (result) {
        $scope.currentStep = 'result'
        $scope.testResult = result;

        if (result.passed) {
            $scope.currentTest++;
        }

        $scope.isLastTest = $scope.currentTest >= tests.length;
    };

    var trainner = MS$({
        scope: $scope,
        sheetWidth: 700,
        onFinish: onFinishFunction
    });

    updateLoginStatus(updateApiMe);

    $scope.login = function () {
        ezfb.login(function (res) {
            if (res.authResponse) {
                updateLoginStatus(updateApiMe);
            }
        }, {
            scope: 'public_profile,email'
        });
    };

    $scope.logout = function () {
        ezfb.logout(function () {
            updateLoginStatus(updateApiMe);
        });
    };

    $scope.share = function () {
        ezfb.ui(
          {
              method: 'feed',
              name: 'Aprenda a ler partitura com o Music Sheet Trainer',
              picture: 'http://plnkr.co/img/plunker.png',
              link: 'http://musicsheettrainer.azurewebsites.net',
              description: 'Aprenda a ler partitura de forma fácil e divertida!'
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
        createTest(tests[$scope.currentTest]);
    };

    $scope.checkNote = function (note) {
        trainner.checkNote(note);
    }

    function updateLoginStatus(more) {
        ezfb.getLoginStatus(function (res) {
            $scope.loginStatus = res;

            if (res.status === 'connected') {
                $scope.currentStep = 'pre_test';
            }
            else {
                $scope.currentStep = 'not_logged';
            }

            (more || angular.noop)();
        });
    }

    function updateApiMe() {
        ezfb.api('/me', function (res) {
            $scope.apiMe = res;
            console.log(res);
        });
    }

    function createTest(notes) {
        var testInformation = {
            notes: notes,
            passRate: 100,
            passTime: 0,
            timeBetweenNotes: 500,
            timeToKillNote: 3000
        };

        trainner.createTest(testInformation);
    }
}]);