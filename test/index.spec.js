const AWS_URL = 'https://example.com';
const AWS_REGION = 'eu-west-2';
const SLACK_ERROR_LOG = 'https://example.com';
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
chai.use(sinonChai);
const nock = require('nock')
const AWSUtilities = require('../lib/AWSUtilities');
const AWSIntegrationError = require('../lib/errors/AWSIntegrationError');

describe('AWS Utilities Test', () => {
  beforeEach(function() {
  });

  afterEach(function() {
  });

  it('should create an instance of an AWSIntegrationError', () => {
    const error = new AWSIntegrationError('Error');
    expect(error.message).to.equal('Error');
  });

  it('should create an instance of a AWSUtilities and test correct error is thrown', () => {
    const awsUtilities = new AWSUtilities(AWS_REGION);
    expect(awsUtilities).to.be.instanceOf(AWSUtilities);
    expect(() => {
      awsUtilities.throwError('Message')
    }).to.throw(AWSIntegrationError);
  });

  it('should create an instance of a AWSUtilities', () => {
    const awsUtilities = new AWSUtilities(AWS_REGION, SLACK_ERROR_LOG);
    expect(awsUtilities).to.be.instanceOf(AWSUtilities);

  });

  it('should invoke Lambda', async () => {
    nock(AWS_URL)
        .get(uri => uri.includes('example-path'))
        .reply(200, { response: "aws-response" });

    const awsUtilities = new AWSUtilities('12345');
    const response = await awsUtilities.invokeLambda('/example-path/');
    expect(response.response).to.equal('aws-response');
  });


});
