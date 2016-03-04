/**
 * @file Implements the iris logging system.
 */

var initLogger = function () {

  var fs = require('fs');
  var bunyan = require('bunyan');

  var mkdirSync = function (path) {
    try {
      fs.mkdirSync(path);
    } catch (e) {
      if (e.code != 'EEXIST') throw e;
    }
  }

  mkdirSync(iris.sitePath + "/" + "logs");

  var bunyanSettings = {
    name: 'iris',
    streams: [{
      path: iris.sitePath + '/logs/' + "main.log",
  }]
  };

  var logger = bunyan.createLogger(bunyanSettings);

  /**
   * Logs an event.
   *
   * Call server message logging function and hook log.
   *
   * @params {string} type - Type of event, from 'trace', debug', 'info', 'warn', 'error', 'fatal'.
   * @params {string} message - Log message
   */

  _getCallerFile = function () {
    try {
      var err = new Error();
      var callerfile;
      var currentfile;

      Error.prepareStackTrace = function (err, stack) {
        return stack;
      };

      currentfile = err.stack.shift().getFileName();

      while (err.stack.length) {
        callerfile = err.stack.shift().getFileName();

        if (currentfile !== callerfile) return callerfile;
      }
    } catch (err) {}
    return undefined;
  }

  iris.log = function () {

    if (arguments && !arguments[1]) {

      arguments[1] = "Empty log called from " + _getCallerFile();

    }

    // If an exception gets passed in, process it into log messages

    if (arguments && arguments[1] && Array.isArray(arguments[1].stack)) {

      var e = arguments[1];

      // If no error message send the file that called the log

      var errorMessage = '';

      e.stack.forEach(function (error, index) {

        errorMessage += "Error on line " + e.stack[index].getLineNumber() + " of " + e.stack[index].getFileName() + " " + e.message + '\n';

      })

      errorMessage += "Log called from " + _getCallerFile();

      iris.log("fatal", errorMessage);

      // Log was called for each part of the stack; there is nothing left to log on this call

      return false;

    }

    var logLevels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

    var type = arguments[0];

    // Check if type is valid

    if (logLevels.indexOf(type) === -1) {

      iris.log("error", "invalid log type" + type + " changed to info");

      type = "info";

    }

    var message = arguments[1];

    logger[type](message);

    process.send({
      type: "log",
      data: {
        type: arguments[0],
        message: arguments[1]
      }
    })

    if (iris.invokeHook) {

      iris.invokeHook("hook_log", "root", {
        type: type,
        message: message
      })

    }

  }

}();

module.exports = initLogger;
