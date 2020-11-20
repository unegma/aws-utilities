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

  /** User Functions **/

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

  /**
   * Example createUser function
   *
   * @param email
   * @param name
   * @returns {Promise<*>}
   */
  createUser = async (email, name) => {
    // why does it not matter here adding await or not?
    return await this.createInDB('Users', {Email: email, Name: name});
  }

  /**
   * Example updateUser function
   *
   * @param email
   * @param name
   * @returns {Promise<*>}
   */
  updateUser = async (email, name) => {
    return await this.updateInDB('Users', {'Email': email, 'Name': name});
  }

  /**
   * Example deleteUser function
   *
   * @param email
   * @returns {Promise<*>}
   */
  deleteUser = async (email) => {
    return await this.deleteInDB('Users', 'Email', email);
  }

  /** Event Store Functions **/

  /**
   * Save Event
   *
   * @param fullEvent
   * @param simple
   * @param parseBody
   * @returns {Promise<*>}
   */
  saveEvent = async (fullEvent, simple = true, parseBody = true) => {
    try {
      if (parseBody) {
        fullEvent.body = JSON.parse(fullEvent.body);
      }

      if (simple) {
        return await this.createInDB('Events', {
          TimeStamp: new Date().toISOString(), // pk
          FullEvent: fullEvent
        });

      // this below part is depreciated as it is too specific to one system
      } else {
        let eventPromises = [];
        fullEvent.body.events.forEach(ev => {
          eventPromises.push(this.createInDB('Events', {
            TimeStamp: new Date().toISOString(), // pk
            FullEvent: fullEvent,
            EventTimeStamp: ev.timestamp,
            Event: ev,
            Action: ev.action,
            Subject: ev.subject
          }))
        });
        return await Promise.all(eventPromises);
      }
    } catch(error) { // if databaseResult is error
      await this._errorHandler.handleError('saveEvent', 'ERROR SAVING EVENT', error);
      throw new AWSDBError(error.message);
    }
  }

  /** Low level functions **/

  /**
   * Get All from Database
   * key or index will be null
   * Warning, this function could be costly if there are a lot of records in the table
   * Beware also that using FilterExpressions here will filter AFTER making the database call (may be better
   * to use GSIs)
   *
   * @param table
   * @param filterExpression
   * @param expressionAttributeNames
   * @param expressionAttributeValues
   * @returns {Promise<*>}
   */
  getAllFromDB = async (table, filterExpression, expressionAttributeNames, expressionAttributeValues) => {
    try {
      let databaseResult; let items = [];
      let params = {
        TableName: table,
        FilterExpression: filterExpression, // e.g. "#user_status = :user_status_val",
        ExpressionAttributeNames: expressionAttributeNames, // e.g. { "#user_status": "user_status" },
        ExpressionAttributeValues: expressionAttributeValues // e.g. { ":user_status_val": 'somestatus' }
      }

      do {
        databaseResult = await db.scan(params).promise();
        databaseResult.Items.forEach(res => items.push(res));
        console.log('Database Call Count: ' + databaseResult.Count); // log the count, or may log thousands of rows
        params.ExclusiveStartKey = databaseResult.LastEvaluatedKey;
      } while (typeof databaseResult.LastEvaluatedKey != 'undefined');

      console.log('Total Items: ' + items.length);
      return items;
    } catch(error) { // if databaseResult is error (eg if spike in DynamoDB capacity
      await this._errorHandler.handleError('getAllFromDB', 'Error getting from Database', error);
      throw new AWSDBError(error.message);
    }
  }

  /**
   * Create in Database
   *
   * DYNAMODB AUTOMATICALLY PREVENTS DUPLICATES, BUT ADD HANDLING FOR GIVING INFO ON THIS
   *
   * @param table
   * @param data
   * @returns {Promise<*>}
   */
  createInDB = async (table, data) => {
    try {
      let databaseResult = await db.put({
        TableName: table,
        Item: data // e.g. { Id: uuid(), UserId: userId, CreatedTime: new Date().toISOString()
      }).promise();

      console.log(databaseResult);
      return databaseResult;
    } catch(error) { // if databaseResult is error (eg if spike in DynamoDB capacity
      await this._errorHandler.handleError('createInDB', 'Error creating in Database', error);
      throw new AWSDBError(error.message);
    }
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
   * Update in Database
   *
   * DYNAMODB AUTOMATICALLY PREVENTS DUPLICATES, BUT ADD HANDLING FOR GIVING INFO ON THIS
   * make sure to pass the correct primary key as part of the data
   *
   * @param table
   * @param data
   * @returns {Promise<*>}
   */
  updateInDB = async (table, data) => {
    try {
      let databaseResult = await db.put({
        TableName: table,
        Item: data // e.g. { Id: uuid(), UserId: userId, CreatedTime: new Date().toISOString()
      }).promise();

      console.log(databaseResult);
      return databaseResult;
    } catch(error) { // if databaseResult is error (eg if spike in DynamoDB capacity
      await this._errorHandler.handleError('createInDB', 'Error creating in Database', error);
      throw new AWSDBError(error.message);
    }
  }

  /**
   * Delete in Database
   *
   * make sure to pass the correct primary key as part of the data
   *
   * @param table
   * @param key
   * @param value
   * @param soft
   * @returns {Promise<*>}
   */
  deleteInDB = async (table, key, value, soft = false) => {
    try {
      let keyValue = {};
      let databaseResult;
      keyValue[key] = value;

      if (soft === true) {
        databaseResult = await db.update({
          TableName: table,
          Key: keyValue,
          UpdateExpression: "set #deleted = :true",
          ExpressionAttributeNames: {
            "#deleted": "deleted"
          },
          ExpressionAttributeValues: {
            ":true": true,
          }
        }).promise();
      } else {
        databaseResult = await db.delete({
          TableName: table,
          Key: keyValue // Key: { key: value }
        }).promise();
      }

      console.log(databaseResult);
      return databaseResult;
    } catch(error) { // if databaseResult is error (eg if spike in DynamoDB capacity
      await this._errorHandler.handleError('deleteInDB', 'Error deleting in Database', error);
      throw new AWSDBError(error.message);
    }
  }

  // used for testing
  throwError() {
    throw new AWSIntegrationError();
  }
}

module.exports = DBUtilities;
