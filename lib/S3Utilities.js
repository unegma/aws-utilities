const aws = require('aws-sdk');
const s3 = new aws.S3
const { ErrorLogger } = require('@unegma/logger');
const { SlackErrorLogger } = require('@unegma/logger');
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
      this._errorHandler = new SlackErrorLogger(this._errorLogUrl);
    } else {
      this._errorHandler = new ErrorLogger();
    }
  }

  /**
   * Get file from bucket
   *
   * Thanks to this one for the suggestions:
   * https://stackoverflow.com/questions/41783903/append-data-to-an-s3-object#:~:text=Unfortunately%2C%20you%20can't.,have%20an%20%22append%22%20operation.&text=Once%20an%20object%20has%20been,doesn't%20meet%20your%20requirements.
   *
   * @param bucketName
   * @param fileName
   * @param getFileContents
   * @param handleNonExistantFile
   * @returns {Promise<*>}
   */
  getFile = async (bucketName, fileName, getFileContents = false, handleNonExistantFile = false) => {
    try {
      let s3Result = await s3.getObject({
        Bucket: bucketName,
        Key: fileName
      }).promise();

      if (getFileContents) {
        return new Buffer(s3Result.Body).toString("utf8");
      }

      console.log(s3Result);
      return s3Result;
    } catch(error) {
      if (handleNonExistantFile && error.code === 'NoSuchKey') {
        if (getFileContents) {
          return '';
        } else {
          return 'NoFile';
        }
      }

      await this._errorHandler.logError('getFile', 'Error getting file', error);
      throw new AWSS3Error(error.message);
    }
  }

  /**
   * Write to file in bucket
   * Be aware that this will overwrite the previous object
   *
   * @param bucketName
   * @param fileName
   * @param data
   * @param acl
   * @returns {Promise<*>}
   */
  writeFile = async (bucketName, fileName, data, acl = 'private') => {
    try {
      let s3Result = await s3.putObject({
        Bucket: bucketName,
        Key: fileName,
        Body: data,
        ACL: acl
      }).promise();

      console.log(s3Result);
      return s3Result;
    } catch(error) {
      await this._errorHandler.logError('writeFile', 'Error writing file', error);
      throw new AWSS3Error(error.message);
    }
  }

  // used for testing
  throwError() {
    throw new AWSS3Error();
  }
}

module.exports = S3Utilities;
