/**
 * ngNavigation/js/ngNavigation.js
 *
 * Copyright (c) 2015 David Vuong <david.vuong256@gmail.com>
 * Licensed MIT
 */
(function (app) {

    app.service('Navigation', ['$rootScope', '$window', '$location', function ($rootScope, $window, $location) {
        var self = this;
        var defaultInitOptions = {
            appendSlash: false,
            stripSlash:  false
        };

        // Expose private methods to `_p` so they can be tested.
        self._p = {
            _route: _route,
            _endsWith: _endsWith,
            _overrideDefaults: _overrideDefaults,
            _deconstructUrlPath: _deconstructUrlPath
        };

        function _endsWith(string, suffix) {
            return string.indexOf(suffix, string.length - suffix.length) !== -1;
        }

        function _overrideDefaults(newDefaults) {
            if (!newDefaults) { return; }

            angular.forEach(newDefaults, function (value, key) {
                if (angular.isDefined(value)) {
                    defaultInitOptions[key] = value;
                }
            });
            if (defaultInitOptions.appendSlash && defaultInitOptions.stripSlash) {
                throw 'options.appendSlash and options.stripSlash are mutually exclusive';
            }
        }

        function _deconstructUrlPath(url) {
            var match,
                pl     = /\+/g,  // Regex for replacing addition symbol with a space.
                search = /([^&=]+)=?([^&]*)/g,
                decode = function (s) { return decodeURIComponent(s.replace(pl, ' ')); };

            var splitUrl = url.split(/\?(.+)?/);
            var baseUrl  = splitUrl[0],
                query    = splitUrl.slice(1, -1).join('&');

            var urlParams = {};
            while (match = search.exec(query)) {
                urlParams[decode(match[1])] = decode(match[2]);
            }
            return { url: baseUrl, params: urlParams };
        }

        function _route(url, params) {
            // URL Doesn't contain query params, just call `path`.
            if (!params) {
                return $location.path(url);
            }
            // Ref: https://docs.angularjs.org/api/ng/service/$location
            return $location.path(url).search(params);
        }

        self.init = function (options) {
            if (this._hasInit) { return; }

            _overrideDefaults(options);
            self._hasInit    = true;
            self._isClearing = false;
            self._isRouting  = false;
            self._routeStack = [];

            // Listen to `$routeChangeSuccess` to update `_routeStack` with the previous route.
            //
            // `$routeChangeSuccess` might not be fired if a callback on `$routeChangeStart`
            // calls the `e.preventDefault()` method.
            //
            // See: https://docs.angularjs.org/api/ngRoute/service/$route
            //
            // NOTE: Again, note that the `_routeStack` is ALWAYS one route behind
            // the current route!
            $rootScope.$on('$routeChangeSuccess', function (event, currentRoute, previousRoute) {
                // `self._isClearing` is set when we don't want to update the `_routeStack`
                // after a navigation. It's useful when:
                //  - We've cleared the `_routeStack` and then decide to navigate to R.
                //      When we hit R, we don't want to be able to go back (not a fresh start)
                //  - When we're going back to the previous route
                //      Routing back technically is still a route and we don't want to add
                //      the previous route back because it was the route we just popped!
                //      [A, B] -> [A] (good!) but [A, B] -> [A] -> [A, B]... oh dear!
                if (self._isClearing) {
                    self._isClearing = false;
                    return;
                }

                // No previous route (first session visit) or is already routing.
                if (self._isRouting || !previousRoute) {
                    return;
                }

                // Edge case: A->B->A->B->A->...
                //
                // Since the stack is updated *after* a successful route change
                // with the previous route (not the current), we make sure that the
                // current route isn't directly a previous route.
                //
                // ```
                // (A->B*->A**)  // Bad! We don't clear duplicate back routes
                // (A**->B*)     // Good! Duplicate back routes are popped
                // ```
                //
                // So, we take a look at the stack (before updating) and check if
                // the top of the stack (last previous) is the same as the current.
                // If it is, remove it, otherwise carry on.
                if (currentRoute.originalPath === self.peakRouteStack().url) {
                    self._routeStack.pop();
                }
                self._isRouting = true;
                self.pushToRouteStack(previousRoute.originalPath, previousRoute.params);
                self._isRouting = false;
            });
        };

        self.peakRouteStack = function () {
            return self._routeStack[self._routeStack.length - 1] || {};
        };

        self.pushToRouteStack = function (url, options) {
            options = options || {};

            if (!url) { return; }

            // `url` might contain query params, override `options.params` if so.
            var parsedUrl = _deconstructUrlPath(url);
            if (parsedUrl.params && !angular.equals(parsedUrl.params, {})) {
                url = parsedUrl.url;
                options.params = parsedUrl.params;
            }
            options.params = options.params || {};

            // Append or remove the trailing "/".
            if (defaultInitOptions.appendSlash && !_endsWith(url, '/')) {
                url += '/';
            }
            if (defaultInitOptions.stripSlash && _endsWith(url, '/')) {
                url = url.substring(0, url.length - 1);
            }

            // Don't update `_routeStack` if duplicate route or if I'm just updating params
            //
            // e.g. `/accounts?x=y` => `/accounts?x=w` does not update.
            if (self.peakRouteStack().url === url) {
                return;
            }

            var path = { url: url, params: options.params, label: options.label };
            self._routeStack.push(path);
        };

        self.routeTo = function (url, options) {
            if (self._isRouting) { return; }
            options = options || {};

            self._isRouting = true;
            if (options.clearStack) {
                self.clearRouteStack();
            }
            _route(url, options.params);
            self._isRouting = false;
        };

        self.back = function () {
            if (!self.isBackRouteAvailable()) { return; }

            // Try to use `$window.location.back()` as often as we can.
            var backRoute = self._routeStack.pop();
            self._isClearing = true;

            if ($window.location.referrer === backRoute.url) {
                return $window.location.back();
            }
            return _route(backRoute.url, backRoute.params);
        };

        self.isBackRouteAvailable = function () {
            return !!self._routeStack.length;
        };

        self.clearRouteStack = function () {
            self._routeStack.length = 0;
            self._isClearing = true;
        };

        self.getRouteStack = function () {
            return self._routeStack;
        };

        self.getDefaultOptions = function () {
            return defaultInitOptions;
        };

        /**
         * ngNavigation Plan & Initial Documentation
         *
         * Description
         * ===========
         * ngNavigation's goal is to provide a simple interface to navigate to
         * and from routes. It should support the ability to make explicit calls
         * to JavaScript functions as well as be able to listen to route changes.
         *
         * API
         * ===
         * `.routeTo(url, options)`
         *  Routes the user to `url`, updating the route stack with the current
         *  route (prior to routing). See "Edge Cases" for `options`.
         *
         * `.init(options)`
         *  Initializes the ngNavigation before/after route changes so ngNavigation
         *  is able to easily push/pop entries from the navigation stack.
         *  See "Edge Cases" for `options`.
         *
         * `back(url)`
         *  Goes back to the previous route in the route stack. If a url is provided
         *  then the route stack is cleared (`url` might not be needed).
         *
         * `clearRouteStack()`
         *  Clears the route stack, `_routeStack.length = 0`
         *
         * `isBackRouteAvailable()`
         *  Checks if the route stack is empty.
         *
         * `pushToRouteStack(url, options)`
         *  Pushes to the route stack without routing.
         *
         * Edge Cases
         * ==========
         *
         * 1. Deep route stack (10+ back routes) (partially done, needs testing)
         *  There are a couple things we could do to reduce having a large stack. They include:
         *      - If the `url` in `routeTo` is the same as `_routeStack.peak` then
         *      pop from the `_routeStack` instead of pushing onto it (causing A, B, A, B ...).
         *      - In addition, if `url` in `routeTo` equals `_routeStack.peak` then
         *      do not push to `_routeStack`, just ignore.
         *      - A bit more dangerous solution would be to keep a round robin queue
         *      rather than a stack. After the stack size reaches a certain size, the
         *      first backRoute is removed. We can let the user specify what that limit would
         *      be, default to 10.
         *      - The last solution, a bit more explicit, when the client knows the next `routeTo`
         *      does not care about the back route then `routeTo(url, { clearStack: true })`.
         *
         * 2. Race conditions with watchers and explicit stack push (done)
         *  There might be a case where we're updating the route stack, at the same time we get
         *  signaled that a route is about to happen.
         *      - Until we're experiencing serious issues, have a simple flag that gets set
         *      whenever we're updating the route. If the flag is set, every other stack updates
         *      gets dropped.
         *
         * 3. Routes with hashes/options etc. (done)
         *  AngularJS's $location.path isn't friendly when we have params in the url. For example
         *  `/accounts?tab=payments`.
         *      - The easiest solution is to force `routeTo` to allow a search option in the
         *      `options` object: `options = { search: { tab: 'payments' } }`
         *      - The alternative is we expect it to be in the `url` and we parse it out ourselves.
         *
         * 4. Empty route stack but `back` is called (done)
         *  So ideally we'd use the browser's native `$window.location.back()` so when going back
         *  the browser automatically scrolls to where it left off however it may result in
         *  the browser taking us back, prior to when our site was hit.
         *      - The solution is to just not allow `back` to do anything when the stack is empty
         *      See `rootUrl` for possible additions.
         *
         * 5. Routing to `urlB` where the current `urlA` isn't the back route (not needed)
         *  So, I'm at `urlA` and I route to `urlB` but I don't want to go back to `urlA`
         *  when I call `back()`, instead I want to go to `urlC`.
         *      - In the `routeTo`'s option object, include a `{ backUrl: '/blah' }`.
         *      Just have to make sure that `backUrl` also gets correctly parsed
         *
         * 6. The provided `url` or `backUrl` is not a valid url (done)
         *  It doesn't really matter, the browser won't do anything silly. The only problem is
         *  when the options are invalid `?x==&&&==b`.
         *      - Throw an exception that the provided `search` in url or options is invalid
         *      and could not be parsed.
         *
         * 7. Sporadically changing urls (done)
         *  Let's say you hit `/route-one` and in the controller, it will always either switch
         *  to `/route-two` or `/route-three`. The back route will always be `/route-one`.
         *  Going back to `/route-one` will then route me to `/route-{two,three}` causing
         *  the back route to stop working.
         *      - There's nothing simple I can do here to fix the issue... Have a warning
         *      somewhere in the documentation suggests it should be avoided.
         *      - A temporary solution is to do `routeTo(url, { clearStack: true })` so it
         *      avoids the growing stack. This raises another issue though... (8)
         *
         * 8. Not at the root route and the route stack is empty (done, option 2)
         *  Let's say I've loaded up the page and my root route is `#/home` but I've loaded up
         *  `#/accounts` first. When I try to go back to `#/home`, the `back()` won't work.
         *      - One simple solution is in the `init` call, let clients specify a rootUrl.
         *      Something like `init({ rootUrl: '/home' })`. When `back()` is called and nothing
         *      is present then `back()` will route to `rootUrl` if it's defined.
         *      - Alternatively, the client can be a bit smarter check that if the controller
         *      is hit and the stack is empty, push a back route. This means 2 additional
         *      methods need to be exposed, `isBackRouteAvailable`, `pushBackRoute`
         *
         * 9. Trailing slashes (done)
         *  Some clients might not be configured to support `#/accounts/` and `#/accounts`.
         *      - Add flags to always strip trailing slashes in the `init`. Subsequently
         *      also include flag to append slash. `init({ appendSlash: true, stripSlash: true })`.
         *      Throw an exception if both `appendSlash` and `stripeSlash` are true. Default
         *      both to `false` in the case that clients support both.
         * */
    }]);

})(angular.module('ngNavigation', []));
