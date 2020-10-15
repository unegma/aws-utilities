const aws = require('aws-sdk'); // todo check this won't cause issues as lambda functions using this library will also have an aws object with a region set
const lambda = new aws.Lambda(); // todo have to set the region for this separately if updating in constructor. Maybe move this and aws into constructor?
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
    aws.config.update({region: awsRegion}); // needed especially for tests, although maybe don't now that stubbing. todo check not necessary in live too
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

  /**
   * Post to SQS Queue
   *
   * @param queueUrl
   * @param data
   * @param messageGroupId
   * @returns {Promise<(SQS.SendMessageResult & {$response: Response<SQS.SendMessageResult, AWSError>})|*>}
   */
   postToSQS = async (queueUrl, data, messageGroupId = "") => {
    console.log(`${this._errorLogPrefix}Beginning postToSQS with data: ${data}`);
    try {
      const response = await sqs.sendMessage({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(data),
        MessageGroupId: messageGroupId
      }).promise();

      console.log(`${this._errorLogPrefix}Finished postToSQS with response ${response}`);
      return response;
    } catch (error) {
      await this._errorHandler.handleError('postToSQS', `awsIntegrations failed.`, error);
      throw new AWSIntegrationError(error.message);
    }
  }

  /**
   * Get from SQS Queue
   *
   * @param queueUrl
   * @returns {Promise<*|PromiseResult<unknown, unknown>>}
   */
   getFromSQS = async (queueUrl, maxMessages = 1) => {
    console.log(`${this._errorLogPrefix}Beginning getFromSQS`);
    try {
      const response = await sqs.receiveMessage({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: maxMessages // this 10 is a variable set by amazon maxed out at 10
      }).promise();

      console.log(`${this._errorLogPrefix}Finished getFromSQS with response ${response}`);
      return response;
    } catch (error) {
      await this._errorHandler.handleError('getFromSQS', `awsIntegrations failed.`, error);
      throw new AWSIntegrationError(error.message);
    }
  }

  /**
   * Delete from SQS Queue
   *
   * @param queueUrl
   * @param receiptHandle
   * @returns {Promise<*>}
   */
   deleteFromSQS = async (queueUrl, receiptHandle) => {
    console.log(`${this._errorLogPrefix}Beginning deleteFromSQS with ReceiptHandle: ${receiptHandle}`);
    try {
      const response = await sqs.deleteMessage({
        QueueUrl: queueUrl,
        ReceiptHandle: receiptHandle
      }).promise();

      console.log(`${this._errorLogPrefix}Finished deleteFromSQS`);
      return response;
    } catch (error) {
      await this._errorHandler.handleError('deleteFromSQS', `awsIntegrations failed.`, error);
      throw new AWSIntegrationError(error.message);
    }
  }

  // used for testing
  throwError() {
    throw new AWSIntegrationError();
  }
}

module.exports = AWSUtilities;
