class AWSSESError extends Error {
  constructor (message) {
    super(message);
    this.name = 'AWSSESError';
  }
}

module.exports = AWSSESError;
