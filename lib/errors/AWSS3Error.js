class AWSS3Error extends Error {
  constructor (message) {
    super(message);
    this.name = 'AWSS3Error';
  }
}

module.exports = AWSS3Error;
