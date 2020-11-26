const SLACK_ERROR_LOG = 'https://example.com';
const AWS_REGION = 'eu-west-2';

const aws = require('aws-sdk');
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
chai.use(sinonChai);
const AWSIntegrationError = require('../lib/errors/AWSIntegrationError');

// These help:
// https://stackoverflow.com/questions/26243647/sinon-stub-in-node-with-aws-sdk
// https://stackoverflow.com/questions/61516053/sinon-stub-for-lambda-using-promises
describe('AWS Utilities Test', () => {

  afterEach(() => {
    sinon.restore();
  });

  it('should create an instance of an AWSIntegrationError', () => {
    const error = new AWSIntegrationError('Error');
    expect(error.message).to.equal('Error');
  });


  it('should configure aws', async () => {
    sinon.stub(aws.config, 'update');

    // these use the above stubbed version of aws
    const DBUtilities = require('../index').DBUtilities;
    const dbUtilities = new DBUtilities(AWS_REGION);

    sinon.assert.calledWith(aws.config.update, {region: AWS_REGION});
  });

});
