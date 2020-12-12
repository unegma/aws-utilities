const aws = require('aws-sdk');
const ses = new aws.SESV2;
const { ErrorLogger } = require('@unegma/logger');
const { SlackErrorLogger } = require('@unegma/logger');
const { AWSSESError } = require('./errors');

/**
 * SES Utilities Class
 */
class SESUtilities {

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
      this._errorHandler = new SlackErrorLogger(this._errorLogUrl);
    } else {
      this._errorHandler = new ErrorLogger();
    }
  }

  /**
   * Send Email
   * @to (array)
   * @from
   * @subject
   * @body
   * @returns {Promise<*>}
   */
  sendEmail = async (to, from, subject, body) => {
    try {
      let sesResult = await ses.sendEmail({
        Content: {
          Simple: {
            Body: {
              Text: {
                Data: body
              }
            },
            Subject: {
              Data: subject
            }
          }
        },
        Destination: {
          ToAddresses: to
        },
        FromEmailAddress: from
      }).promise();

      console.log(sesResult);
      return sesResult;
    } catch(error) {
      await this._errorHandler.logError('sendEmail', 'Error sending email', error);
      throw new AWSSESError(error.message);
    }
  }

  // used for testing
  throwError() {
    throw new AWSSESError();
  }
}

module.exports = SESUtilities;
