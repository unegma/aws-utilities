const aws = require('aws-sdk');
const kms = new aws.KMS();
const { ErrorHandler } = require('@unegma/error-handler');
const { SlackErrorHandler } = require('@unegma/error-handler');
const AWSIntegrationError = require('./errors/AWSIntegrationError');

/**
 * // todo add tests
 * Base Utilities Class
 */
class EncryptionUtilities {

  /**
   *
   * errorLogPrefix will prefix the start and end of function console logs
   *
   * @param awsRegion
   * @param kmsKeyId
   * @param errorLogUrl
   * @param errorLogPrefix
   */
  constructor(awsRegion, kmsKeyId, errorLogUrl = "", errorLogPrefix = "## ") {
    aws.config.update({region: awsRegion});
    this._kmsKeyId = kmsKeyId;
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
   * // todo work in progress check
   * Encode
   *
   * @param code
   * @param type
   * @param toString
   * @returns {*}
   */
  encode = (code, type = 'base64', toString = true) => {
    console.log('Encoding');
    if (toString) {
      return Buffer.from(code, type).toString();
    } else {
      return Buffer.from(code, type);
    }
  }

  /**
   * // todo work in progress check
   * Decode
   *
   * @param code
   * @param type
   * @param toString
   * @returns {*}
   */
  decode = (code, type = 'base64', toString = true) => {
    console.log('Decoding');
    if (toString) {
      return Buffer.from(code, type).toString();
    } else {
      return Buffer.from(code, type);
    }
  }

  encrypt = async (data) => {
    console.log('Encrypting');
    let encryptResult = await kms.encrypt({
      KeyId: this._kmsKeyId,
      Plaintext: data
    });
    console.log('Encrypted Result:', encryptResult);
    return encryptResult;
  }

  /**
   * KMS Decrypt
   *
   * @param encryptedData
   * @returns {Promise<string>}
   */
  decrypt = async (encryptedData) => {
    console.log('Decrypting');
    let decryptedResult = await kms.decrypt({
      CiphertextBlob: encryptedData
    });
    decryptedResult = decryptedResult.Plaintext.toString('ascii'); // todo needed? (or this maybe should be in decode)
    console.log('Decrypted Result:', decryptedResult);
    return decryptedResult;
  }

  // used for testing
  throwError() {
    throw new AWSIntegrationError();
  }
}

module.exports = EncryptionUtilities;
