# ngNavigation
[![Build Status](https://travis-ci.org/davidvuong/ngNavigation.svg?branch=master)](https://travis-ci.org/davidvuong/ngNavigation)

ngNavigation a zero dependency AngularJS service that provides a simple way to navigate between different pages within your application (still under development).

### Setup and install

```
npm install ngNavigation
```

or using bower:

```
bower install ngNavigation
```

### Basic usage

There are 2 steps you need to perform before you can start using `ngNavigation`. The first, is to include `ngNavigation` in your application's dependency list. The second, is to call `Navigation.init()`.

For example:

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

#### `.init(options)`

`.init` Initializes the ngNavigation service, registering a listener to route changes. This should be called before you make other calls to ngNavigation.

Route changes can be with through `href|ng-href` links in the view, `$location.path` calls via Angular, or `routeTo` calls through the `ngNavigation` API.

The `.init` method takes an optional argument, `options` in the form:

```js
{
    appendSlash: false,
    stripSlash: false,
    rootRoute: undefined,
    ignoreRoutes: []
};
```

By default, `appendSlash` and `stripeSlash` are set to `false`. These properties are mutually exclusive, meaning only one can be set to true at any single time. They're also optional.

In addition,

* When `rootRoute` is defined, every route change that directs the client to `rootRoute` will clear the route stack
* After a successful navigation, if the previous route exists in `ignoreRoutes`, it won't be pushed to the route stack

#### `.routeTo(url, options)`

`.routeTo` allows clients to route to a new page in your app. The method takes in 2 arguments. The first is the url to route to and the second is an object in the form:

```js
{ params: {}, clearStack: false };
```

For example:

```js
$scope.routeToHome = function () {
    ngNavigation.routeTo('/home');
};
```

Sometimes you need additional query params when routing, you can do that in two ways:

```js
// The first method is to just have it in the url.
ngNavigation.routeTo('/accounts?tab=payments')

// The other method is to pass it into `params`.
var options = { params: { tab: 'payments' } };
ngNavigation.routeTo('/accounts', options);

// NOTE: `options.params` will override the params in the url.
var options = { params: { tab: 'payments' } };
ngNavigation.routeTo('/accounts?tab=details', options);
```

`.routeTo` can also be called with `options = { clearStack: true }`. This is useful when you want to clear the route history before or after routing.

For example, you have a side-menu that's present throughout the app. The side-menu is the root of your navigation. It does not make much sense to be able to go back after re-routing via the root.

#### `.routeBack(fallbackRoute)`

Routes back to the previous route. `routeBack` calls `$window.history.back()` when a previous route is available, popping from the route stack. When no routes are available, no operations are made.

`.back` also takes in an optional argument, `fallbackRoute` in the form:

```js
{ url: '...', params: {} };
```

Having a `fallbackRoute` ensures that if the route stack is empty, the call to `.routeBack` will fallback to the provided `fallbackRoute`.

The `fallbackRoute` could be useful when you have external deep links to your app (e.g. an email notification).

When a user clicks on the deep link (e.g. `/app/settings/notifications`), the route stack is empty. This means if you have a navigation bar with a back button that hooks onto `ngNavigation.routeBack`, clicking that button won't take you back because the stack is empty. Having a `fallbackUrl` will ensure that navigation after deep links work.

For example:

```js
// navigation.js (navbar controller).
$scope.navigateBack = function () {
    ngNavigation.routeBack({ url: '/settings' });
};
```

#### `.peakRouteStack()`

Peaks at the top of the route stack, returning the most previous route.

#### `.pushToRouteStack(url, options)`

Pushes to the route stack without routing. The `options` argument shares the same properties as those defined in `routeTo` with the exception of `clearStack`.

#### `.isBackRouteAvailable()`

Returns whether or not the route stack is empty.

#### `.clearRouteStack()`

Clears the route stack of all existing routes.

#### `.getRouteStack()`

Returns a reference to the route stack.

#### `.getDefaultOptions()`

Returns the options object. These default options can be updated through the `.init` call.

---

*Please take a look at `ngNavigation/examples/` or read the source for more examples. ngNavigation is an incredibly simple service without much code at all.*

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
