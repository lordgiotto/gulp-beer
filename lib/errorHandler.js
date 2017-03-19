const path                 = require('path');
const extend               = require('extend');
const gutil                = require('gulp-util');
const notifier             = require('node-notifier');
const opn                  = require('opn');

const ErrorServer          = require('./ErrorServer');

const defaultConsoleError = (err) => {
  const errorElements = ['plugin', 'file', 'fileName', 'line', 'lineNumber'];
  gutil.log('*********************************************');
  gutil.log(gutil.colors.bgRed.white('Compilation error.'));
  errorElements.forEach((el) => {
    if (err.hasOwnProperty(el)) {
      console.log('\n' + gutil.colors.red.bold(el.toUpperCase() + ': ', err[el]));
    }
  });
  console.log ('\n' + gutil.colors.red(err.message || err.stack));
  if (err.serverUrl) {
    console.log ('\n🍺  ' + err.serverUrl + '\n');
  }
  gutil.log('*********************************************');
};

const DEFAULT_OPTIONS = {
  consoleError: defaultConsoleError,
  title: 'Compile Error',
  sound: true,
  icon: path.join(__dirname, '../assets/beer.png'),
  server: {
    port: 4001
  },
};

function errorHandlerFactory(options) {
  const handlerOptions = extend(true, {}, DEFAULT_OPTIONS, options || {});

  const server = new ErrorServer(handlerOptions.server);

  const errorHandler = function(err) {
    const savedError = server.addError(err);

    handlerOptions.consoleError(err);

    notifier.notify({
      'title': handlerOptions.title,
      'subtitle': path.basename(err.file || ''),
      'message': err.message,
      'sound': handlerOptions.sound,
      'icon': handlerOptions.icon,
      'closeLabel': !!savedError.serverUrl ? 'Hide': void 0,
      'actions': !!savedError.serverUrl ? 'View': void 0,
      'timeout': !!savedError.serverUrl ? 10 : void 0,
      'wait': !!savedError.serverUrl,
      'sender': Date.now()
    }, (err, response) => {
      if (err || !savedError.serverUrl) return;
      const proceed = (response.indexOf('clicked') !== -1) ||
                      (response.indexOf('activate') !== -1);
      if (proceed) opn(savedError.serverUrl);
    });
  };

  errorHandler.server = server;

  return errorHandler;
}

module.exports = errorHandlerFactory;