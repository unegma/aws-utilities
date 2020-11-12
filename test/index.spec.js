const KMS_KEY_ID = '12345';
const SLACK_ERROR_LOG = 'https://example.com';
const AWS_REGION = 'eu-west-2';

const awsSDK = require('aws-sdk');
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
  let aws; let lambda; let sqs; let AWSUtilities; let EncryptionUtilities; let DBUtilities;

  before(function() {
    lambda = { invoke: sinon.stub().returnsThis(), promise: sinon.stub() };
    sqs = { sendMessage: sinon.stub().returnsThis(),
            receiveMessage: sinon.stub().returnsThis(),
            deleteMessage: sinon.stub().returnsThis(),
            promise: sinon.stub()};
    aws = sinon.stub(awsSDK, 'Lambda').callsFake(() => lambda);
    aws = sinon.stub(awsSDK, 'SQS').callsFake(() => lambda);
    aws.returns(lambda);
    aws.returns(sqs);
    AWSUtilities = require('../index').AWSUtilities; // uses the above stubbed version of aws
    EncryptionUtilities = require('../index').EncryptionUtilities; // uses the above stubbed version of aws
    DBUtilities = require('../index').DBUtilities; // uses the above stubbed version of aws
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

  it('should add to SQS', async () => {
    const awsUtilities = new AWSUtilities(AWS_REGION);
    const response = await awsUtilities.postToSQS('https://example.com', { id: 1}, 'chicken');
    expect(sqs.sendMessage).to.have.been.calledOnce;
  });

  it('should get from SQS', async () => {
    const awsUtilities = new AWSUtilities(AWS_REGION);
    const response = await awsUtilities.getFromSQS('https://example.com');
    expect(sqs.receiveMessage).to.have.been.calledOnce;
  });

  it('should delete from SQS', async () => {
    const awsUtilities = new AWSUtilities(AWS_REGION);
    const response = await awsUtilities.deleteFromSQS('https://example.com', '12345');
    expect(sqs.deleteMessage).to.have.been.calledOnce;
  });

});
