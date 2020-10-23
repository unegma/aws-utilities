class AWSKMSFailureError extends Error {
  constructor (message) {
    super(message);
    this.name = 'AWSKMSFailureError';
  }
}

module.exports = AWSKMSFailureError;
