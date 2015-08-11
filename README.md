# ngNavigation
[![Build Status](https://travis-ci.org/davidvuong/ngNavigation.svg?branch=master)](https://travis-ci.org/davidvuong/ngNavigation)

ngNavigation a zero dependency AngularJS service that provides a simple way to navigate between different pages within your application.

### Setup and install

```
bower install ngNavigation
```

### Basic usage

Getting started is easy, just specify `ngNavigation` as a dependency and call `.init`.

Here's an example:

```js
var app = angular.module('ExampleApp', [
    'ngNavigation'
]);

app.config(function (Navigation) {
    Navigation.init();  // Idempotent operation.
});

app.controller('AppCtrl', function ($scope, Navigation) {
    Navigation.routeTo('/accounts');
});
```

For more information, checkout the [documentation](https://github.com/davidvuong/ngNavigation/wiki/_documentation).

### Documentation

The documentation can be found [here](https://github.com/davidvuong/ngNavigation/wiki/_documentation).

### Contributions

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
