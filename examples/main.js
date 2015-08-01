/**
 * ngNavigation/examples/main.js
 *
 * Copyright (c) 2015 David Vuong <david.vuong256@gmail.com>
 * Licensed MIT
 */
(function () {
    'use strict';

    var app = angular.module('ngNavigationTest', [
        'ngRoute',
        'ngNavigation'
    ]);

    function config($routeProvider) {
        // NOTE: You don't have to use ngRoute, ui-router works too.
        $routeProvider.when('/example1', {
            templateUrl: 'templates/route1.tpl.html',
            controller: 'RouteExampleCtrl1'
        }).
        when('/example2', {
            templateUrl: 'templates/route2.tpl.html',
            controller: 'RouteExampleCtrl2'
        }).
        when('/example3', {
            templateUrl: 'templates/route3.tpl.html',
            controller: 'RouteExampleCtrl3'
        }).
        when('/example4', {
            templateUrl: 'templates/route4.tpl.html',
            controller: 'RouteExampleCtrl4'
        }).otherwise({
            redirectTo: '/example1'
        });
    }

    function run(Navigation) {
        Navigation.init();
    }

    app
        .config(config)
        .run(run)
        .controller('AppCtrl', function () { });

    /* Example route controllers. */
    app.controller('RouteExampleCtrl1', function ($scope, Navigation) {
        $scope.routeToExample4 = function () {
            Navigation.routeTo('/example4');
        };

        $scope.back = Navigation.back;
        $scope.stack = Navigation.getRouteStack();
    });
    app.controller('RouteExampleCtrl2', function ($scope, Navigation) {
        $scope.back = Navigation.back;
        $scope.stack = Navigation.getRouteStack();
    });
    app.controller('RouteExampleCtrl3', function ($scope, Navigation) {
        $scope.back = Navigation.back;
        $scope.stack = Navigation.getRouteStack();
    });
    app.controller('RouteExampleCtrl4', function ($scope, Navigation) {
        $scope.back = Navigation.back;
        $scope.stack = Navigation.getRouteStack();
    });

})();
