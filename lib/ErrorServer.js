const path              = require('path');
const url               = require('url');

const gutil             = require('gulp-util');
const express           = require('express');
const mustacheExpress   = require('mustache-express');
const extend            = require('extend');

const ErrorList         = require('./ErrorList');


class ErrorServer {
  constructor(options = {}) {
    this.errors = new ErrorList();
    this._listener = false;
    if (options !== false) {
      this._options = extend({}, ErrorServer.DEFAULT_OPTIONS, options);
      this._port = this._options.port;
      this._serverRoot = this._options.serverRoot;
      this._server = this._createServer();
      if (this._options.autostart) {
        this.start();
      }
    }
  }

  start() {
    if (!this._server) {
      if (!this._options.silent) gutil.log(gutil.colors.black.bgRed.bold(' !! Error Server Disabled '));
      return;
    }
    if (this._listener) {
      if (!this._options.silent) gutil.log(gutil.colors.black.bgRed.bold(' !! Error Server already started '));
      return;
    }
    this._listener = this._server.listen(this._port || 4001, () => {
        if (!this._options.silent) gutil.log(gutil.colors.black.bgGreen.bold(' @ Starting Error Server'));
    });
  }

  stop() {
    if (!this._listener) {
      if (!this._options.silent) gutil.log(gutil.colors.black.bgRed.bold(' !! Error Server is not running '));
      return;
    }
    if (!this._options.silent) gutil.log(gutil.colors.black.bgRed.bold(' @ Stopping Error Server'));
    this._listener.close();
    this._listener = false;
  }

  addError(err) {
    const errorId = this.errors.add(err);
    err.serverUrl = this.getErrorLink(errorId);
    return err;
  }

  getErrorLink(errorId) {
    const error = this.errors.getError(errorId);
    if (!this.isUp || !error) return false;
    const urlParts = {
      protocol: 'http',
      hostname: 'localhost',
      port: this._port,
      pathname: errorId
    };
    return url.format(urlParts);
  }

  _createServer() {
    const app = express();
    app.engine('html', mustacheExpress());
    app.set('view engine', 'mustache');
    app.set('views', this._serverRoot);
    app.get('/', (req, res) => {
      res.render('index.html', {
        isSingle: false,
        errors: this.errors.all
      });
    });
    app.get('/:errorId', (req, res, next) => {
        const matchedErrors = this.errors.getError(req.params.errorId);
        if (matchedErrors) {
          res.render('index.html', {
            isSingle: true,
            errors: matchedErrors
          });
        } else {
          next();
        }
    });
    app.use(express.static(this._serverRoot));
    return app;
  }

  get isUp() {
    return !!this._listener;
  }

}

ErrorServer.DEFAULT_OPTIONS = {
  port: 4001,
  serverRoot: path.join(__dirname, '../errorServerRoot'),
  autostart: false,
  silent: false
};

module.exports = ErrorServer;