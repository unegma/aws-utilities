const fetch = require('node-fetch');
const { ErrorHandler } = require('@unegma/error-handler');
const { SlackErrorHandler } = require('@unegma/error-handler');

/**
 * Base Utilities Class
 */
class AWSUtilities {

  /**
   * Base Utilities
   *
   * errorLogPrefix will prefix the start and end of function console logs
   *
   * @param errorLogUrl
   * @param errorLogPrefix
   */
  constructor(errorLogUrl = "", errorLogPrefix = "## ") {
    this._errorLogUrl = errorLogUrl;
    this._errorLogPrefix = errorLogPrefix;

    // error logging
    if (this._errorLogUrl.includes('slack')) {
      this._errorHandler = new SlackErrorHandler(this._errorLogUrl);
    } else {
      this._errorHandler = new ErrorHandler();
    }

  }
}
