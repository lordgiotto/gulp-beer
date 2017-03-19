const uniqid               = require('uniqid');
const moment               = require('moment');
const stripAnsi            = require('strip-ansi');

class ErrorList {

  constructor() {
    this._errors = [];
  }

  add(err) {
    const errorId = uniqid();
    this._errors.unshift({
        errorId: errorId,
        date: moment().format('MM-DD-YYYY HH:mm:ss'),
        message: stripAnsi(err.message || ''),
        stack: stripAnsi(err.stack || '')
    });
    return errorId;
  }

  getError(errorId) {
    const matchedErrors = this._errors.filter((error) => {
        return error.errorId === errorId;
    });
    return matchedErrors.length > 0 ? matchedErrors[0] : false;
  }

  get all() {
    return this._errors;
  }
}

module.exports = ErrorList;