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

    it('should do something', function () {
        expect(!!Navigation).toBe(true);
    });
});
