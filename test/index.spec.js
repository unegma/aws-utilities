const awsSDK = require('aws-sdk');
const AWS_REGION = 'eu-west-2';
const SLACK_ERROR_LOG = 'https://example.com';
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
  let aws; let lambda; let AWSUtilities;
  before(function() {
    lambda = { invoke: sinon.stub().returnsThis(), promise: sinon.stub() };
    aws = sinon.stub(awsSDK, 'Lambda').callsFake(() => lambda);
    aws.returns(lambda);
    AWSUtilities = require('../lib/AWSUtilities'); // uses the above stubbed version of aws
  });

  after(function() {
    aws.restore();
  });

  beforeEach(() => {
  })

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
    const awsUtilities = new AWSUtilities(AWS_REGION);
    const response = await awsUtilities.invokeLambda('functionName');
    expect(lambda.invoke).to.have.been.calledOnce;
  });


});
