var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var indexRouter = require('./routes/index');
var blockchainRouter = require('./routes/blockchain');
const schedule = require('node-schedule');
var agent = require('./agent/computeAndUploadTETV.js');
var app = express();
require('dotenv').config();
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/blockchain', blockchainRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});




var taskFreq5 = '*/1 * * * *'
var taskFreq2 = '*/2 * * * *'

schedule.scheduleJob(taskFreq5, () => {
  agent.runAgent();
});

// var sche30 = schedule.scheduleJob(taskFreq30, () => {
//   console.log('now2 is :' + new Date)
// });


module.exports = app;
