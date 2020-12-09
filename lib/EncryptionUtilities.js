const aws = require('aws-sdk');
const kms = new aws.KMS();
const { ErrorHandler } = require('@unegma/error-handler'); // todo depreciated, replace with logger
const { SlackErrorHandler } = require('@unegma/error-handler'); // todo depreciated, replace with logger
const { AWSKMSFailureError, AWSIntegrationError } = require('./errors');

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
   * Decode originalData and return it
   *
   * @param code
   * @param decode
   * @param decodeType
   * @returns {*}
   */
  decode = (code, decode = 'double', decodeType = 'base64') => {
    console.log('Decoding');
    if (decode === 'double') {
      let encodedData = Buffer.from(code, decodeType).toString();
      let originalData = Buffer.from(encodedData, decodeType);
      return originalData;
    } else if (decode === 'single') {
      let originalData = Buffer.from(code, decodeType);
      return originalData;
    } else {
      return code;
    }
  }

  /**
   * Encode data and return it
   *
   * @param data
   * @param encode
   * @param encodeType
   * @returns {*}
   */
  encode = (data, encode = 'double', encodeType = 'base64') => {
    console.log('Encoding');
    if (encode === 'double') {
      let encodedData = data.toString(encodeType);
      let code = Buffer.from(encodedData).toString(encodeType);
      return code;
    } else if (encode === 'single') {
      return data.toString(encodeType);
    } else {
      return data;
    }
  }

  /**
   * KMS Encrypt
   *
   * @param data
   * @param encode
   * @param encodeType
   * @returns {Promise<any>}
   */
  encrypt = async (data, encode = 'double', encodeType = 'base64') => {
    try {
      console.log('Encrypting');
      let encryptResult = await kms.encrypt({
        KeyId: this._kmsKeyId,
        Plaintext: data
      }).promise();

      if (!encryptResult.CiphertextBlob) {
        throw new AWSKMSFailureError('No CiphertextBlob');
      }

      let encodeResult;
      if (encode) {
        encodeResult = this.encode(encryptResult.CiphertextBlob, encode, encodeType);
      } else {
        encodeResult = encryptResult.CiphertextBlob;
      }

      console.log(`Encrypt and Encode Result: ${encodeResult}`);
      return encodeResult;
    } catch (error) {
      await this._errorHandler.handleError('encrypt', 'Error Encrypting', error);
      throw new AWSKMSFailureError(error.message);
    }
  }

  /**
   * KMS Decrypt
   *
   * @param data
   * @param decode
   * @param decodeType
   * @returns {Promise<string>}
   */
  decrypt = async (data, decode = 'double', decodeType = 'base64') => {
    try {
      console.log('Decrypting');

      if (decode) {
        data = this.decode(data, decode, decodeType);
      }

      let decryptResult = await kms.decrypt({
        CiphertextBlob: data
      }).promise();

      if (!decryptResult.Plaintext) {
        throw new AWSKMSFailureError('No Text');
      }

      console.log(`Decrypted Result: ${decryptResult.Plaintext.toString('ascii')}`);
      return decryptResult.Plaintext.toString('ascii');
    } catch (error) {
      await this._errorHandler.handleError('decrypt', 'Error Decrypting', error);
      throw new AWSKMSFailureError(error.message);
    }
  }

  // used for testing
  throwError() {
    throw new AWSIntegrationError();
  }
}

module.exports = EncryptionUtilities;
