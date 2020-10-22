const aws = require('aws-sdk');
const db = new aws.DynamoDB.DocumentClient();
const { ErrorHandler } = require('@unegma/error-handler');
const { SlackErrorHandler } = require('@unegma/error-handler');
const AWSIntegrationError = require('./errors/AWSIntegrationError');

/**
 * // todo add tests
 * DynamoDB Utilities Class
 */
class DBUtilities {

  /**
   *
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

  /**
   * Example getUser function
   *
   * @param email
   * @returns {Promise<*>}
   */
  getUser = async (email) => {
    return this.getFromDB('Users', null, 'Email', email);
  }

  // todo check for duplicates function

  /**
   * Create in Database
   *
   * @param table
   * @param data
   * @returns {Promise<*>}
   */
  createInDB = async (table, data) => {
    let databaseResult = await db.put({
      TableName: table,
      Item: data // e.g. { Id: uuid(), UserId: userId, CreatedTime: new Date().toISOString()
    });
    console.log(databaseResult);
    // todo error check
    return databaseResult;
  }

  /**
   * // todo work in progress
   * Get from Database
   * key or index will be null
   *
   * @param table
   * @param key
   * @param index
   * @param value
   * @returns {Promise<*>}
   */
  getFromDB = async (table, key, index = null, value) => {
    let databaseResult;
    if (!index) {
      databaseResult = await db.get({
        TableName: table,
        Key: {
          key: value
        }
      });
    } else {
      databaseResult = await db.get({
        TableName: table,
        IndexName: `${index}-index`,
        KeyConditionExpression: `${index} = :value`,
        ExpressionAttributeValues: {
          ':value': value
        }
      });
    }

    // todo handle if databaseResult is error (eg if spike in DynamoDB capacity

    if (databaseResult && databaseResult.Count > 0) {
      console.log(databaseResult.Item);
      return databaseResult.Items;
    } else if (databaseResult && databaseResult.Item) {
      console.log(databaseResult.Item);
      return databaseResult.Item;
    }
    console.log('Nothing Found');
  }

  // todo update function

  // todo delete function

  // used for testing
  throwError() {
    throw new AWSIntegrationError();
  }
}

module.exports = DBUtilities;
