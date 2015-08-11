/**
 * ngNavigation/tests/ngNavigation.spec.js
 *
 * Copyright (c) 2015 David Vuong
 * Licensed MIT
 */
'use strict';

describe('ngNavigation', function () {
    beforeEach(module('ngNavigation'));

    var Navigation;
    beforeEach(inject(function (_Navigation_) {
        Navigation = _Navigation_;
    }));

    describe('Auxiliary, p._endsWith', function () {
        it('should be true when str ends with suffix', function () {
            expect(Navigation._endsWith('hello, world/', '/')).toBe(true);
        });

        it('should be false when str does not end suffix', function () {
            expect(Navigation._endsWith('hello, world/', 'x')).toBe(false);
        });

        it('should be false when the string is empty', function () {
            expect(Navigation._endsWith('', '/')).toBe(false);
        });
    });

    describe('Auxiliary, p._route', function () {
        var $location;
        beforeEach(inject(function (_$location_) {
            $location = _$location_;
        }));

        it('should call $location.path when no params provided', function () {
            spyOn($location, 'search');

            Navigation._route('/example');
            expect($location.search).not.toHaveBeenCalled();
        });

        it('should call $location.path.search when params provided', function () {
            spyOn($location, 'search');

            Navigation._route('/example', { x: 'y' });
            expect($location.search).toHaveBeenCalledWith({ x: 'y' });
        });
    });

    describe('Auxiliary, p._overridesDefaults', function () {
        it('should not override when values are undefined', function () {
            Navigation._overrideDefaults({ appendSlash: undefined });
            expect(Navigation.getDefaultOptions().appendSlash).toBe(false);
        });

        it('should override when values are defined', function () {
            Navigation._overrideDefaults({ stripSlash: true });
            expect(Navigation.getDefaultOptions().stripSlash).toBe(true);
        });

        it('should throw exception when stripSlash and appendSlash are true', function () {
            expect(function () {
                Navigation._overrideDefaults({ stripSlash: true, appendSlash: true });
            }).toThrow();
        });

        it('should not override when no values provided at all', function () {
            var copy = {};
            angular.copy(Navigation.getDefaultOptions(), copy);
            Navigation._overrideDefaults({});
            expect(copy).toEqual(Navigation.getDefaultOptions());
        });
    });

    describe('Auxiliary, p._deconstructUrlPath', function () {
        it('should separate the url and params when both exists', function () {
            var parsed = Navigation._deconstructUrlPath('/example?hello=world&x=y');
            expect(parsed).toEqual({ url: '/example', params: { hello: 'world', x: 'y' }});
        });

        it('should not give me params when no query params in url', function () {
            var parsed = Navigation._deconstructUrlPath('/example');
            expect(parsed).toEqual({ url: '/example', params: {}});
        });
    });

    describe('Core, self.init', function () {
        it('should initialize instance variables on self when init is called', function () {
            Navigation.init();

            expect(Navigation._hasInit).toBeDefined();
            expect(Navigation._isClearing).toBeDefined();
            expect(Navigation._isRouting).toBeDefined();
            expect(Navigation._routeStack).toBeDefined();
        });

        it('should be idempotent when called init called multiple times', function () {
            Navigation.init();
            expect(Navigation._hasInit).toBe(true);

            spyOn(Navigation, '_overrideDefaults');
            Navigation.init();

            expect(Navigation._hasInit).toBe(true);
            expect(Navigation._overrideDefaults).not.toHaveBeenCalled();
        });

        it('should start listening on route changes when init is called', function () {
            inject(function ($rootScope) {
                spyOn($rootScope, '$on');
                Navigation.init();
                expect($rootScope.$on).toHaveBeenCalled();
            });
        });

        it('should not update stack when no previous route exists', function () {
            inject(function ($rootScope) {
                Navigation.init();
                expect(Navigation._routeStack.length).toBe(0);

                $rootScope.$broadcast('$routeChangeSuccess', {
                    originalPath: '/test', params: {} }, undefined
                );
                expect(Navigation._routeStack.length).toBe(0);
            });
        });

        it('should update stack when previous route exists', function () {
            inject(function ($rootScope) {
                Navigation.init();
                expect(Navigation._routeStack.length).toBe(0);

                var pathA = { originalPath: '/test-a', params: {} };
                var pathB = { originalPath: '/test-b', params: {} };

                // event, currentPath, previousPath...
                $rootScope.$broadcast('$routeChangeSuccess', pathA, undefined);
                $rootScope.$broadcast('$routeChangeSuccess', pathB, pathA);
                expect(Navigation._routeStack.length).toBe(1);

                var pathA_ = { url: '/test-a', params: {}, label: undefined };
                expect(Navigation._routeStack[0]).toEqual(pathA_);
            });
        });

        it('should not update when isRouting=true', function () {
            inject(function ($rootScope) {
                Navigation.init();
                expect(Navigation._routeStack.length).toBe(0);

                Navigation._isRouting = true;
                spyOn(Navigation, 'pushToRouteStack');

                var pathA = { originalPath: '/test-a', params: {} };
                var pathB = { originalPath: '/test-b', params: {} };
                $rootScope.$broadcast('$routeChangeSuccess', pathB, pathA);

                expect(Navigation.pushToRouteStack).not.toHaveBeenCalled();
            });
        });

        it('should not update when isClearing=true', function () {
            inject(function ($rootScope) {
                Navigation.init();
                expect(Navigation._routeStack.length).toBe(0);

                Navigation._isClearing = true;
                spyOn(Navigation, 'pushToRouteStack');

                var pathA = { originalPath: '/test-a', params: {} };
                var pathB = { originalPath: '/test-b', params: {} };
                $rootScope.$broadcast('$routeChangeSuccess', pathB, pathA);

                expect(Navigation.pushToRouteStack).not.toHaveBeenCalled();
            });
        });

        it('should keep route stack empty when isClearing=true', function () {
            inject(function ($rootScope) {
                Navigation.init();
                expect(Navigation._routeStack.length).toBe(0);

                // Successfully added a new "previous" route to the stack.
                var pathA = { originalPath: '/test-a', params: {} };
                var pathB = { originalPath: '/test-b', params: {} };
                $rootScope.$broadcast('$routeChangeSuccess', pathB, pathA);
                expect(Navigation._routeStack.length).toBe(1);

                // Clear the stack and set it to not be added in the next route.
                Navigation._routeStack.length = 0;
                Navigation._isClearing = true;
                expect(Navigation._routeStack.length).toBe(0);

                // Cause another route, expect it to remain empty.
                $rootScope.$broadcast('$routeChangeSuccess', pathB, pathA);
                expect(Navigation._routeStack.length).toBe(0);
            });
        });

        it('should pop stack when A->B [A] then B->A, giving [A, B] instead of [A]', function () {
            inject(function ($rootScope) {
                Navigation.init();
                expect(Navigation._routeStack.length).toBe(0);

                var pathA = { originalPath: '/test-a', params: {} };
                var pathB = { originalPath: '/test-b', params: {} };

                // I'm at /test-b, was at /test-a.
                $rootScope.$broadcast('$routeChangeSuccess', pathB, pathA);
                expect(Navigation._routeStack.length).toBe(1);

                // I'm at going to /test-a was at test-b/
                $rootScope.$broadcast('$routeChangeSuccess', pathA, pathB);
                expect(Navigation._routeStack.length).toBe(1);

                var pathB_ = { url: '/test-b', params: {}, label: undefined };
                expect(Navigation._routeStack[0]).toEqual(pathB_);
            });
        });
    });

    describe('Core, self.peakRouteStack', function () {
        it('should return an empty object when stack is empty', function () {
            Navigation.init();
            expect(Navigation._routeStack.length).toBe(0);
            expect(Navigation.peakRouteStack()).toEqual({});
        });

        it('should return the most recent previous route when stack is not empty', function () {
            inject(function ($rootScope) {
                Navigation.init();

                var pathA = { originalPath: '/test-a', params: {} };
                var pathB = { originalPath: '/test-b', params: {} };

                $rootScope.$broadcast('$routeChangeSuccess', pathB, pathA);

                var pathA_ = {url: '/test-a', params: {}, label: undefined};
                expect(Navigation.peakRouteStack()).toEqual(pathA_);
            });
        });
    });

    describe('Core, self.isBackRouteAvailable', function () {
        it('should be true when not empty', function () {
            Navigation.init();
            Navigation._routeStack.push({url: '/test-a', params: {}, label: undefined});
            expect(Navigation.isBackRouteAvailable()).toBe(true);
        });

        it('should be false when empty', function () {
            Navigation.init();
            expect(Navigation.isBackRouteAvailable()).toBe(false);
        });
    });

    describe('Core, self.clearRouteStack', function () {
        it('should clear route stack when called', function () {
            Navigation.init();
            Navigation._routeStack.push({url: '/test-a', params: {}, label: undefined});
            Navigation.clearRouteStack();
            expect(Navigation._routeStack.length).toBe(0);
        });

        it('should not populate route stack with any new routes when called', function () {
            Navigation.init();
            Navigation.clearRouteStack();
            expect(Navigation._routeStack.length).toBe(0);
        });

        it('should set isClearing=true when called', function () {
            Navigation.init();
            Navigation.clearRouteStack();
            expect(Navigation._isClearing).toBe(true);
        });
    });

    describe('Core, self.pushToRouteStack', function () {
        it('should push to route stack', function () {
            Navigation.init();
            Navigation.pushToRouteStack('/accounts');

            var path = { url: '/accounts', params: {}, label: undefined };
            expect(Navigation._routeStack[0]).toEqual(path);
        });

        it('should not push to route stack when duplicate routes are provided', function () {
            Navigation.init();
            Navigation.pushToRouteStack('/accounts');
            Navigation.pushToRouteStack('/accounts');
            Navigation.pushToRouteStack('/accounts', { params: { x: 1 }});

            expect(Navigation._routeStack.length).toBe(1);
        });

        it('should label the route when the label exists', function () {
            Navigation.init();
            Navigation.pushToRouteStack('/accounts', { label: 'Back' });

            var path = { url: '/accounts', params: {}, label: 'Back' };
            expect(Navigation._routeStack[0]).toEqual(path);
        });

        it('should parse query params from url when query params exist', function () {
            Navigation.init();
            Navigation.pushToRouteStack('/accounts?x=y&a=b&d=d');

            var path = { url: '/accounts', params: { x: 'y', a: 'b', d: 'd' }, label: undefined };
            expect(Navigation._routeStack[0]).toEqual(path);
        });

        it('should override params when query params in url', function () {
            Navigation.init();
            Navigation.pushToRouteStack('/accounts?x=y', { params: { a: 'b' } });

            var path = { url: '/accounts', params: { x: 'y' }, label: undefined };
            expect(Navigation._routeStack[0]).toEqual(path);
        });

        it('should push with options.params when params exists', function () {
            Navigation.init();
            Navigation.pushToRouteStack('/accounts/10', { params: { a: 'b'} });

            var path = { url: '/accounts/10', params: { a: 'b' }, label: undefined };
            expect(Navigation._routeStack[0]).toEqual(path);
        });

        it('should not push when url does not exist', function () {
            Navigation.init();
            Navigation.pushToRouteStack();
            expect(Navigation._routeStack.length).toBe(0);
        });

        it('should not push when url does not exist', function () {
            Navigation.init();
            Navigation.pushToRouteStack();
            expect(Navigation._routeStack.length).toBe(0);
        });

        it('should add trailing slash when slash does not exist', function () {
            Navigation.init({ appendSlash: true });
            Navigation.pushToRouteStack('/accounts');

            var path = { url: '/accounts/', params: {}, label: undefined };
            expect(Navigation._routeStack[0]).toEqual(path);
        });

        it('should add trailing slash when slash does not exist with query params', function () {
            Navigation.init({ appendSlash: true });
            Navigation.pushToRouteStack('/accounts?x=y');

            var path = { url: '/accounts/', params: { x: 'y' }, label: undefined };
            expect(Navigation._routeStack[0]).toEqual(path);
        });

        it('should not append slash when already exists', function () {
            Navigation.init({ appendSlash: true });
            Navigation.pushToRouteStack('/accounts/');

            var path = { url: '/accounts/', params: {}, label: undefined };
            expect(Navigation._routeStack[0]).toEqual(path);
        });

        it('should should strip slash when slash exists', function () {
            Navigation.init({ stripSlash: true });
            Navigation.pushToRouteStack('/accounts/');

            var path = { url: '/accounts', params: {}, label: undefined };
            expect(Navigation._routeStack[0]).toEqual(path);
        });

        it('should should strip slash when slash exists with query params', function () {
            Navigation.init({ stripSlash: true });
            Navigation.pushToRouteStack('/accounts/?x=y');

            var path = { url: '/accounts', params: { x: 'y' }, label: undefined };
            expect(Navigation._routeStack[0]).toEqual(path);
        });

        it('should should not strip slash when slash does not exist', function () {
            Navigation.init({ stripSlash: true });
            Navigation.pushToRouteStack('/accounts');

            var path = { url: '/accounts', params: {}, label: undefined };
            expect(Navigation._routeStack[0]).toEqual(path);
        });
    });

    describe('Core, self.routeTo', function () {
        it('should not route when isRouting=true', function () {
            Navigation.init();

            spyOn(Navigation, '_route');
            Navigation._isRouting = true;
            Navigation.routeTo('/accounts');
            expect(Navigation._route).not.toHaveBeenCalled();
        });

        it('should ignore the previous route when route in ignore list', function () {
            inject(function ($rootScope) {
                Navigation.init({ ignoreRoutes: ['/test-b'] });

                var pathA = { originalPath: '/test-a', params: {} };
                var pathB = { originalPath: '/test-b', params: {} };
                $rootScope.$broadcast('$routeChangeSuccess', pathB, pathA);
                expect(Navigation._routeStack.length).toBe(1);

                var pathC = { originalPath: '/test-c', params: {} };
                $rootScope.$broadcast('$routeChangeSuccess', pathC, pathB);
                expect(Navigation._routeStack.length).toBe(1);
            });
        });

        it('should clear the routeStack when routing to the root', function () {
            inject(function ($rootScope) {
                Navigation.init({ rootRoute: '/root' });

                var pathA = { originalPath: '/test-a', params: {} };
                var pathB = { originalPath: '/test-b', params: {} };
                $rootScope.$broadcast('$routeChangeSuccess', pathB, pathA);
                expect(Navigation._routeStack.length).toBe(1);

                var rootPath = { originalPath: '/root', params: {} };
                $rootScope.$broadcast('$routeChangeSuccess', rootPath, pathA);
                expect(Navigation._routeStack.length).toBe(0);
                expect(Navigation._isClearing).toBe(true);
            });
        });

        it('should override query params in url when params is provided', function () {
            Navigation.init();

            spyOn(Navigation, '_route');

            var options = { params: { tab: 'personal-details' } };
            Navigation.routeTo('/accounts?tab=payments', options);
            expect(Navigation._route).toHaveBeenCalledWith('/accounts', options.params);
        });

        it('should clear stack when clearStack=true', function () {
            Navigation.init();

            spyOn(Navigation, 'clearRouteStack');
            Navigation.routeTo('/accounts', { clearStack: true });
            expect(Navigation.clearRouteStack).toHaveBeenCalled();
        });

        it('should not clear stack when clearStack is not set', function () {
            Navigation.init();

            spyOn(Navigation, 'clearRouteStack');
            Navigation.routeTo('/accounts');
            expect(Navigation.clearRouteStack).not.toHaveBeenCalled();
        });

        it('should route when routeTo is called', function () {
            Navigation.init();

            spyOn(Navigation, '_route');
            Navigation.routeTo('/accounts');
            expect(Navigation._route).toHaveBeenCalled();
        });
    });

    describe('Core, self.routeBack', function () {
        it('should not pop stack when stack is empty', function () {
            Navigation.init();

            spyOn(Navigation._routeStack, 'pop');
            Navigation.routeBack();
            expect(Navigation._routeStack.pop).not.toHaveBeenCalled();
        });

        it('should use fallback stack when stack is empty', function () {
            Navigation.init();

            spyOn(Navigation._routeStack, 'pop');
            spyOn(Navigation, '_route');
            Navigation.routeBack({ url: '/accounts', params: { x: 'y' } });

            expect(Navigation._routeStack.pop).not.toHaveBeenCalled();
            expect(Navigation._route).toHaveBeenCalled();
            expect(Navigation._isClearing).toBe(true);
        });

        it('should use fallback stack when stack is empty (only url)', function () {
            Navigation.init();

            spyOn(Navigation._routeStack, 'pop');
            spyOn(Navigation, '_route');
            Navigation.routeBack({ url: '/accounts' });

            expect(Navigation._routeStack.pop).not.toHaveBeenCalled();
            expect(Navigation._route).toHaveBeenCalledWith('/accounts', {});
        });

        it('should pop stack when going back to previous page', function () {
            inject(function ($rootScope, $window) {
                Navigation.init();

                var pathA = { originalPath: '/test-a', params: {} };
                var pathB = { originalPath: '/test-b', params: {} };
                $rootScope.$broadcast('$routeChangeSuccess', pathB, pathA);
                expect(Navigation._routeStack.length).toBe(1);

                // Stub out `$window.history.back` to avoid karma errors.
                spyOn($window.history, 'back');
                Navigation.routeBack();
                expect(Navigation._routeStack.length).toBe(0);
            });
        });
    });
});
