class AWSIntegrationError extends Error {
  constructor (message) {
    super(message);
    this.name = 'AWSIntegrationError';
  }
}

module.exports = AWSIntegrationError;
