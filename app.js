/**
 * ngNavigation/app.js
 *
 * Copyright (c) 2015 David Vuong <david.vuong256@gmail.com>
 * Licensed MIT
 */
var express = require('express');
var serveStatic = require('serve-static');

var app = express();

app.use(serveStatic(__dirname + '/examples'));
app.use('/js', serveStatic(__dirname + '/js'));
app.use('/js', serveStatic(__dirname + '/node_modules'));
app.listen(3000);

console.log('Serving ngNavigation/examples/ on http://localhost:3000');
