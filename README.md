# ngNavigation

ngNavigation a zero dependency AngularJS service that provides a simple way to navigate between different pages within your application.

### Install and Setup

```bash
npm install ng-navigation --save
```

or

```
bower install ng-navigation --save
```

or

```
bower install git@github.com:davidvuong/ngNavigation.git --save
```

### Basic Usage

There's only 2 steps you need to do before you can start using `ngNavigation`. The first is to include `ngNavigation` in your app's dependency list. The second is to call `.init()`. `.init()` is idempotent so calling it multiple times will have the same effect if you called it just once.

```js
var app = angular.module('ExampleApp', [
    'ngNavigation'
]);

app.config(function (Navigation) {
    Navigation.init();
});

app.controller('AppCtrl', function ($scope, Navigation) {
    Navigation.routeTo('/accounts');
});
```

### Documentation

TODO!

### Contributions

**Clone and install dependencies:**

```bash
git clone git@github.com:davidvuong/ngNavigation.git

cd ngNavigation/
npm install
```

**Build:**

```bash
grunt build
```

**Tests:**

```bash
grunt test
```

**Examples:**

```
grunt serve
open http://localhost:3000
```
