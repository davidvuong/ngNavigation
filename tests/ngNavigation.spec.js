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
        it('should be true if ends up suffix', function () {
            expect(Navigation._p._endsWith('hello, world/', '/')).toBe(true);
        });

        it('should be false if not ends up suffix', function () {
            expect(Navigation._p._endsWith('hello, world/', 'x')).toBe(false);
        });

        it('should be false when the string is empty', function () {
            expect(Navigation._p._endsWith('', '/')).toBe(false);
        });
    });

    describe('Auxiliary, p._route', function () {
        var $location;
        beforeEach(inject(function (_$location_) {
            $location = _$location_;
        }));

        it('should call $location.path without params', function () {
            spyOn($location, 'search');

            Navigation._p._route('/example');
            expect($location.search).not.toHaveBeenCalled();
        });

        it('should call $location.path.search with params', function () {
            spyOn($location, 'search');

            Navigation._p._route('/example', { param: '1' });
            expect($location.search).toHaveBeenCalled();
        });
    });

    describe('Auxiliary, p._overridesDefaults', function () {
        it('should not override with undefined values', function () {
            Navigation._p._overrideDefaults({ appendSlash: undefined });
            expect(Navigation.getDefaultOptions().appendSlash).toBe(false);
        });

        it('should override with defined values', function () {
            Navigation._p._overrideDefaults({ stripSlash: true });
            expect(Navigation.getDefaultOptions().stripSlash).toBe(true);
        });

        it('should throw exception if stripSlash and appendSlash are true', function () {
            expect(function () {
                Navigation._p._overrideDefaults({ stripSlash: true, appendSlash: true });
            }).toThrow();
        });

        it('should not override with no values at all', function () {
            var copy = {};
            angular.copy(Navigation.getDefaultOptions(), copy);
            Navigation._p._overrideDefaults({});
            expect(copy).toEqual(Navigation.getDefaultOptions());
        });
    });

    describe('Auxiliary, p._deconstructUrlPath', function () {
        it('should separate the url and params if both exists', function () {
            var parsed = Navigation._p._deconstructUrlPath('/example?hello=world&x=y');
            expect(parsed).toEqual({ url: '/example', params: { hello: 'world', x: 'y' }});
        });

        it('should not give me params if no query params in url', function () {
            var parsed = Navigation._p._deconstructUrlPath('/example');
            expect(parsed).toEqual({ url: '/example', params: {}});
        });
    });

    describe('Core, self.init', function () {
        it('should initialize instance variables on self', function () {
            Navigation.init();

            expect(Navigation._hasInit).toBeDefined();
            expect(Navigation._isClearing).toBeDefined();
            expect(Navigation._isRouting).toBeDefined();
            expect(Navigation._routeStack).toBeDefined();
        });

        it('should be idempotent', function () {
            Navigation.init();
            expect(Navigation._hasInit).toBe(true);

            spyOn(Navigation._p, '_overrideDefaults');
            Navigation.init();

            expect(Navigation._hasInit).toBe(true);
            expect(Navigation._p._overrideDefaults).not.toHaveBeenCalled();
        });

        it('should start listening on route changes', function () {
            inject(function ($rootScope) {
                spyOn($rootScope, '$on');
                Navigation.init();
                expect($rootScope.$on).toHaveBeenCalled();
            });
        });

        it('should not update stack if no previous route exists', function () {
            inject(function ($rootScope) {
                Navigation.init();
                expect(Navigation._routeStack.length).toBe(0);

                $rootScope.$broadcast('$routeChangeSuccess', {
                    originalPath: '/test', params: {} }, undefined
                );
                expect(Navigation._routeStack.length).toBe(0);
            });
        });

        it('should update stack if previous route exists', function () {
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

        it('should not update if isRouting=true', function () {
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

        it('should pop stack if A->B [A] then B->A, giving [A, B] instead of [A]', function () {
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
        it('should return an empty object if stack is empty', function () {
            Navigation.init();
            expect(Navigation._routeStack.length).toBe(0);
            expect(Navigation.peakRouteStack()).toEqual({});
        });

        it('should return the most recent previous route', function () {
            inject(function ($rootScope) {
                Navigation.init();

                var pathA = {originalPath: '/test-a', params: {}};
                var pathB = {originalPath: '/test-b', params: {}};

                $rootScope.$broadcast('$routeChangeSuccess', pathB, pathA);

                var pathA_ = {url: '/test-a', params: {}, label: undefined};
                expect(Navigation.peakRouteStack()).toEqual(pathA_);
            });
        });
    });

    describe('Core, self.isBackRouteAvailable', function () {
        it('should be true if not empty', function () {
            Navigation.init();
            Navigation._routeStack.push({url: '/test-a', params: {}, label: undefined});
            expect(Navigation.isBackRouteAvailable()).toBe(true);
        });

        it('should be false if empty', function () {
            Navigation.init();
            expect(Navigation.isBackRouteAvailable()).toBe(false);
        });
    });

    describe('Core, self.clearRouteStack', function () {
        it('should clear route stack', function () {
            Navigation.init();
            Navigation._routeStack.push({url: '/test-a', params: {}, label: undefined});
            Navigation.clearRouteStack();
            expect(Navigation._routeStack.length).toBe(0);
        });

        it('should not populate route stack with any new routes', function () {
            Navigation.init();
            Navigation.clearRouteStack();
            expect(Navigation._routeStack.length).toBe(0);
        });

        it('should set isClearing=true', function () {
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

        it('should not push to route stack if duplicate', function () {
            Navigation.init();
            Navigation.pushToRouteStack('/accounts');
            Navigation.pushToRouteStack('/accounts');
            Navigation.pushToRouteStack('/accounts', { params: { x: 1 }});

            expect(Navigation._routeStack.length).toBe(1);
        });

        it('should label the route if label exists', function () {
            Navigation.init();
            Navigation.pushToRouteStack('/accounts', { label: 'Back' });

            var path = { url: '/accounts', params: {}, label: 'Back' };
            expect(Navigation._routeStack[0]).toEqual(path);
        });

        it('should parse query params from url if exists', function () {
            Navigation.init();
            Navigation.pushToRouteStack('/accounts?x=y&a=b&d=d');

            var path = { url: '/accounts', params: { x: 'y', a: 'b', d: 'd' }, label: undefined };
            expect(Navigation._routeStack[0]).toEqual(path);
        });

        it('should override params if query params in url', function () {
            Navigation.init();
            Navigation.pushToRouteStack('/accounts?x=y', { params: { a: 'b' } });

            var path = { url: '/accounts', params: { x: 'y' }, label: undefined };
            expect(Navigation._routeStack[0]).toEqual(path);
        });

        it('should push with options.params if exists', function () {
            Navigation.init();
            Navigation.pushToRouteStack('/accounts/10', { params: { a: 'b'} });

            var path = { url: '/accounts/10', params: { a: 'b' }, label: undefined };
            expect(Navigation._routeStack[0]).toEqual(path);
        });

        it('should not push if url does not exist', function () {
            Navigation.init();
            Navigation.pushToRouteStack();
            expect(Navigation._routeStack.length).toBe(0);
        });

        it('should not push if url does not exist', function () {
            Navigation.init();
            Navigation.pushToRouteStack();
            expect(Navigation._routeStack.length).toBe(0);
        });

        it('should add trailing slash if not exists', function () {
            Navigation.init({ appendSlash: true });
            Navigation.pushToRouteStack('/accounts');

            var path = { url: '/accounts/', params: {}, label: undefined };
            expect(Navigation._routeStack[0]).toEqual(path);
        });

        it('should add trailing slash if not exists with query params', function () {
            Navigation.init({ appendSlash: true });
            Navigation.pushToRouteStack('/accounts?x=y');

            var path = { url: '/accounts/', params: { x: 'y' }, label: undefined };
            expect(Navigation._routeStack[0]).toEqual(path);
        });

        it('should not append slash if already exists', function () {
            Navigation.init({ appendSlash: true });
            Navigation.pushToRouteStack('/accounts/');

            var path = { url: '/accounts/', params: {}, label: undefined };
            expect(Navigation._routeStack[0]).toEqual(path);
        });

        it('should should strip slash if exists', function () {
            Navigation.init({ stripSlash: true });
            Navigation.pushToRouteStack('/accounts/');

            var path = { url: '/accounts', params: {}, label: undefined };
            expect(Navigation._routeStack[0]).toEqual(path);
        });

        it('should should strip slash if exists with query params', function () {
            Navigation.init({ stripSlash: true });
            Navigation.pushToRouteStack('/accounts/?x=y');

            var path = { url: '/accounts', params: { x: 'y' }, label: undefined };
            expect(Navigation._routeStack[0]).toEqual(path);
        });

        it('should should not strip slash if not exists', function () {
            Navigation.init({ stripSlash: true });
            Navigation.pushToRouteStack('/accounts');

            var path = { url: '/accounts', params: {}, label: undefined };
            expect(Navigation._routeStack[0]).toEqual(path);
        });
    });

    describe('Core, self.routeTo', function () {
        it('should not route when isRouting=true', function () {
            Navigation.init();

            spyOn(Navigation._p, '_route');
            Navigation._isRouting = true;
            Navigation.routeTo('/accounts');
            expect(Navigation._p._route).not.toHaveBeenCalled();
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

            spyOn(Navigation._p, '_route');
            Navigation.routeTo('/accounts');
            expect(Navigation._p._route).toHaveBeenCalled();
        });
    });

    describe('Core, self.back', function () {
        it('should not pop stack if stack is empty', function () {
            Navigation.init();

            spyOn(Navigation._routeStack, 'pop');
            Navigation.back();
            expect(Navigation._routeStack.pop).not.toHaveBeenCalled();
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
                Navigation.back();
                expect(Navigation._routeStack.length).toBe(0);
            });
        });
    });
});
