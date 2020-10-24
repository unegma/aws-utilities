class AWSDBError extends Error {
  constructor (message) {
    super(message);
    this.name = 'AWSDBError';
  }
}

module.exports = AWSDBError;
