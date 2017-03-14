/*
 * Copyright (c) 2017 by Three Pawns, Inc. All rights reserved.
 */

'use strict';

/* global angular */
/* global window */

const app = angular.module('reinierApp', ['ngRoute']);

app.config(($routeProvider) => {
  $routeProvider.when('/login', {
    templateUrl: 'view-login.html',
    controller: 'loginController',
  })
  .otherwise({
    redirectTo: '/login',
  });
});

app.factory('loginService', ['$rootScope', '$http', '$q', ($rootScope, $http, $q) => {
  let authenticated = false;
  const service = {
    isAuthenticated: () => authenticated,
    login: (user) => {
      const credentials = window.btoa(`${user.username}:${user.password}`);
      const deferred = $q.defer();

      $http.get('/login', {
        headers: {
          Authorization: `Form ${credentials}`,
        },
      })
      .then((response) => {
        authenticated = true;
        const token = response.data.token;
        $http.defaults.headers.common.Authorization = `Bearer ${token}`;
        deferred.resolve(response);
      },
      (response) => {
        deferred.reject(response);
      });

      return deferred.promise;
    },
  };

  return service;
}]);

app.controller('loginController', ['$scope', '$location', '$routeParams', 'loginService',
  function scope($scope, $location, $routeParams, loginService) {
    $scope.login = function login() {
      loginService.login($scope.user)
      .then(() => {
        $scope.error = '';
      },
      (response) => {
        $scope.error = response.data.message;
      });
    };
  },
]);
