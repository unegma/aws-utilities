const aws = require('aws-sdk');
const lambda = new aws.Lambda();
const sqs = new aws.SQS();
const { ErrorHandler } = require('@unegma/error-handler');
const { SlackErrorHandler } = require('@unegma/error-handler');
const AWSIntegrationError = require('./errors/AWSIntegrationError');

/**
 * Base Utilities Class
 */
class AWSUtilities {

  /**
   * Base Utilities
   *
   * errorLogPrefix will prefix the start and end of function console logs
   *
   * @param awsRegion
   * @param errorLogUrl
   * @param errorLogPrefix
   */
  constructor(awsRegion, errorLogUrl = "", errorLogPrefix = "## ") {
    aws.config.update({region: awsRegion});
    // lambda.config.update({region: awsRegion}); // todo check ok to do like this (config seems to stay in object)
    this._errorLogUrl = errorLogUrl;
    this._errorLogPrefix = errorLogPrefix;

    // error logging
    if (this._errorLogUrl.includes('slack')) {
      this._errorHandler = new SlackErrorHandler(this._errorLogUrl);
    } else {
      this._errorHandler = new ErrorHandler();
    }

  }

  /**
   * Invoke Lambda function for function name with input
   *
   * @returns {Promise}
   * @param functionName
   * @param input
   * @param wait
   */
   invokeLambda = async (functionName, input, wait = 'Event') => {
    console.log(`${this._errorLogPrefix}Beginning invokeLambda with functionName: ${functionName}`);
    try {
      const type = (wait === true) ? 'RequestResponse' : 'Event';
      let response = await lambda.invoke({
        FunctionName: functionName,
        // Event type (not RequestResponse) means we don't need to wait for the response, just know it has been called
        InvocationType: type,
        Payload: JSON.stringify(input)
      }).promise();

      console.log(`${this._errorLogPrefix}Finished invokeLambda with Response: ${response}`);
      return response; // maybe also handle response.StatusCode !== 202 ??
    } catch (error) {
      // this will be handled separately to a main lambda function instead of bubbling up
      await this._errorHandler.handleError(functionName, 'Invoke Lambda Failed.', error);
      throw new AWSIntegrationError(error.message);
    }
  }

  // used for testing
  throwError() {
    throw new AWSIntegrationError();
  }
}

module.exports = AWSUtilities;
