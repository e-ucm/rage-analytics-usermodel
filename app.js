'use strict';

var path = require('path'),
    logger = require('morgan'),
    express = require('express'),
    bodyParser = require('body-parser');

var app = express();
app.config = require((process.env.NODE_ENV === 'test') ? './config-test' : './config');

// Initialize the document storage
var DocumentStorage = require('./documentStorage/document-storage');
var MongoBackend = require('./documentStorage/mongo-backend');
var backend = new MongoBackend(app.config.mongodb);
var documentStorage = new DocumentStorage(backend);

// Keep a reference to the document storage
app.documentStorage = documentStorage;

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Logging middleware
if (app.get('env') === 'development') {
    app.use(logger('dev'));
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

// Renders the API documentation
app.get('/', function (req, res) {
    res.render('apidoc');
});

// Used to send status 200 messages
app.use(function (req, res, next) {
    res.sendDefaultSuccessMessage = function () {
        res.json({
            message: 'Success.'
        });
    };
    next();
});

app.use(app.config.apiPath + '/storage', require('./routes/gamestorage'));
app.use(app.config.apiPath + '/health', require('./routes/health'));

// Catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// Production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    var info = {
        message: err.message
    };
    info.stack = err.stack;
    res.status(err.status || 500).send(info);
});

module.exports = app;
