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

        it('should pop stack if A->B [A] then B->A, giving [B] instead of [A, (B), A]', function () {
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
});
