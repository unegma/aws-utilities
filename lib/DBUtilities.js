const aws = require('aws-sdk');
const db = new aws.DynamoDB.DocumentClient();
const { ErrorHandler } = require('@unegma/error-handler');
const { SlackErrorHandler } = require('@unegma/error-handler');
const { AWSDBError, AWSIntegrationError } = require('./errors');

/**
 * // todo add tests
 * DynamoDB Utilities Class
 */
class DBUtilities {

  /**
   * TODO CONVERT CONFIG PARAMETER TO AN OBJECT?
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
   * Get all users from users table
   *
   * @returns {Promise<*>}
   */
  getUsers = async () => {
    return await this.getAllFromDB('Users');
  }

  /**
   * Example getUser function
   *
   * @param email
   * @returns {Promise<*>}
   */
  getUser = async (email) => {
    // why does it not matter here adding await or not?
    return await this.getFromDB('Users', 'Email', null, email);
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
    try {
      let databaseResult;
      if (!index) {
        let keyValue = {}
        keyValue[key] = value;

        databaseResult = await db.get({
          TableName: table,
          Key: keyValue // Key: { key: value }
        }).promise();
      } else {
        databaseResult = await db.get({
          TableName: table,
          IndexName: `${index}-index`,
          KeyConditionExpression: `${index} = :value`,
          ExpressionAttributeValues: {
            ':value': value
          }
        }).promise();
      }

      if (databaseResult && databaseResult.Count > 0) {
        console.log(databaseResult.Items);
        return databaseResult.Items;
      } else if (databaseResult && databaseResult.Item) {
        console.log(databaseResult.Item);
        return databaseResult.Item;
      }
      console.log('Nothing Found');
    } catch(error) { // if databaseResult is error (eg if spike in DynamoDB capacity
      await this._errorHandler.handleError('getFromDB', 'Error getting from Database', error);
      throw new AWSDBError(error.message);
    }
  }

  /**
   * Get All from Database
   * key or index will be null
   *
   * @param table
   * @returns {Promise<*>}
   */
  getAllFromDB = async (table) => {
    try {
      let databaseResult;
      databaseResult = await db.scan({
        TableName: table
      }).promise();

      if (databaseResult && databaseResult.Count > 0) {
        console.log(databaseResult.Items);
        return databaseResult.Items;
      } else if (databaseResult && databaseResult.Item) {
        console.log(databaseResult.Item);
        return databaseResult.Item;
      }
      console.log('Nothing Found');
    } catch(error) { // if databaseResult is error (eg if spike in DynamoDB capacity
      await this._errorHandler.handleError('getAllFromDB', 'Error getting from Database', error);
      throw new AWSDBError(error.message);
    }
  }

  // todo update function
  // todo delete function

  // used for testing
  throwError() {
    throw new AWSIntegrationError();
  }
}

module.exports = DBUtilities;
