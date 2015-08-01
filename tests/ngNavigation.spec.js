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
            expect($location.search.calls.any()).toBe(false);
        });

        it('should call $location.path.search with params', function () {
            spyOn($location, 'search');

            Navigation._p._route('/example', { param: '1' });
            expect($location.search.calls.any()).toBe(true);
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
            expect(Navigation._p._overrideDefaults.calls.any()).toBe(false);
        });
    });

});
