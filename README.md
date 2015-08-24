# ngNavigation

[![Build Status](https://travis-ci.org/davidvuong/ngNavigation.svg?branch=master)](https://travis-ci.org/davidvuong/ngNavigation)
[![Coverage Status](https://coveralls.io/repos/davidvuong/ngNavigation/badge.svg?branch=master&service=github)](https://coveralls.io/github/davidvuong/ngNavigation?branch=master)
[![Code Climate](https://codeclimate.com/github/davidvuong/ngNavigation/badges/gpa.svg)](https://codeclimate.com/github/davidvuong/ngNavigation)
[![npm version](https://badge.fury.io/js/ng-navigation.svg)](http://badge.fury.io/js/ng-navigation)
[![Bower version](https://badge.fury.io/bo/ngNavigation.svg)](http://badge.fury.io/bo/ngNavigation)

ngNavigation a zero dependency AngularJS service that provides a simple way to navigate between different pages within your application.

### Install

```bash
# via bower:
bower install ngNavigation

# via npm:
npm install ng-navigation
```

### Basic usage

Specify `ngNavigation` as a dependency and call `.init` in your `app.config`.

Here's an example:

```js
var app = angular.module('ExampleApp', [
    'ngNavigation'
]);

app.config(function (Navigation) {
    Navigation.init();  // Idempotent operation.
});

app.controller('AppCtrl', function ($scope, Navigation) {
    Navigation.routeTo('/settings?tab=accounts');
});
```

For more information, checkout the [documentation](https://github.com/davidvuong/ngNavigation/wiki/_documentation).

### Development

Clone and install dependencies:

```
git clone git@github.com:davidvuong/ngNavigation.git

cd ngNavigation/
npm install
```

Build, run tests and serve examples:

```
grunt build
grunt test

node app.js && open http://localhost:3000
```
