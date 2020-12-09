const { Logger } = require('@unegma/logger');
const { ErrorWithLoggerError } = require('@unegma/logger'); // todo check, this may not be working
const S3Utilities = require('./S3Utilities');

/**
 * S3 Logger
 *
 * Could put into @unegma/logger library, but would it create a circular dependency as this library has that library as a dependency..?
 */
class S3Logger extends Logger {

  /**
   * Constructor
   * @param awsRegion
   * @param bucketName
   * @param fileName
   * @param format
   */
  constructor(awsRegion, bucketName, fileName, format) {
    super(format);
    this.awsRegion = awsRegion;
    this.bucketName = bucketName;
    this.fileName = fileName;
  }

  /**
   * Log by writing to S3
   *
   * @param identifier
   * @param details
   * @param writeToS3
   * @param useNewLine
   * @param acl
   * @returns {Promise<*>}
   */
  async log(identifier, details = "", writeToS3 = true, useNewLine = true, acl) {
    super.log(identifier, details);

    try {
      if (writeToS3) {
        console.log('Writing to S3');
        const s3Utilities = new S3Utilities(this.awsRegion); // could add slack error log in here too
        let content = await s3Utilities.getFile(this.bucketName, this.fileName, true);
        content = `${content}${(useNewLine) ? '\n' : ''}${identifier}${details}`;
        return await s3Utilities.writeFile(this.bucketName, this.fileName, content, acl);
      }
    } catch (error) {
      console.log("ERROR WITH LOGGER");
      throw new ErrorWithLoggerError(error.message);
    }
  }
}

module.exports = S3Logger;
