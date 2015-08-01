# ngNavigation

ngNavigation a zero dependency AngularJS service that provides a simple way to navigate between different pages within your application.

### Setup and install

```bash
npm install ng-navigation --save
```

or using bower:

```
bower install ng-navigation --save
```

### Basic Usage

There are 2 steps you need to perform before you can start using `ngNavigation`. The first, is to include `ngNavigation` in your app's dependency list. The second, is to call `Navigation.init()`. For example:

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

### Documentation

TODO!

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
