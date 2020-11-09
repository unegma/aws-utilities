const aws = require('aws-sdk');
const s3 = new aws.S3
const { ErrorHandler } = require('@unegma/error-handler');
const { SlackErrorHandler } = require('@unegma/error-handler');
const { AWSS3Error, AWSIntegrationError } = require('./errors');


/**
 * S3 Utilities Class
 */
class S3Utilities {

  /**
   * errorLogPrefix will prefix the start and end of function console logs
   *
   * @param awsRegion
   * @param errorLogUrl
   * @param errorLogPrefix
   */
  constructor(awsRegion, errorLogUrl = "", errorLogPrefix = "## ") {
    aws.config.update({region: awsRegion});
    this._errorLogUrl = errorLogUrl;
    this._errorLogPrefix = errorLogPrefix;

    // error logging
    if (this._errorLogUrl.includes('slack')) {
      this._errorHandler = new SlackErrorHandler(this._errorLogUrl);
    } else {
      this._errorHandler = new ErrorHandler();
    }
  }

  // used for testing
  throwError() {
    throw new AWSS3Error();
  }
}

module.exports = S3Utilities;
