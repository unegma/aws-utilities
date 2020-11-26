const KMS_KEY_ID = '12345';
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
describe('Lambda Tests', () => {

  afterEach(() => {
    sinon.restore();
  });

  it('should create an instance of an AWSIntegrationError', () => {
    const error = new AWSIntegrationError('Error');
    expect(error.message).to.equal('Error');
  });

  it('should create an instance of a AWSUtilities and test correct error is thrown', () => {
    sinon.stub(aws.config, 'update');
    const AWSUtilities = require('../index').AWSUtilities;
    const awsUtilities = new AWSUtilities(AWS_REGION);

    sinon.assert.calledWith(aws.config.update, {region: AWS_REGION});
    expect(awsUtilities).to.be.instanceOf(AWSUtilities);
    expect(() => {
      awsUtilities.throwError('Message')
    }).to.throw(AWSIntegrationError);
  });

  it('should create an instance of a AWSUtilities', () => {
    sinon.stub(aws.config, 'update');
    const AWSUtilities = require('../index').AWSUtilities;
    const awsUtilities = new AWSUtilities(AWS_REGION, SLACK_ERROR_LOG);

    sinon.assert.calledWith(aws.config.update, {region: AWS_REGION});
    expect(awsUtilities).to.be.instanceOf(AWSUtilities);
  });

  it('should invoke Lambda', async () => {
    sinon.stub(aws.config, 'update');

    const lambda = {
      invoke: sinon.stub().returnsThis(),
      promise: sinon.stub()
      // try: sandbox.stub().returns({ promise: () => Promise.resolve({}) })
    };
    // try: sinon.stub(aws, 'Kinesis').returns({ putRecord: sinon.stub().callsArgWith(1, null, true) })
    sinon.stub(aws, 'Lambda').callsFake(() => lambda);

    // for actual lambda functions:
    // const { handler } = require('./');
    // await handler();

    // these use the above stubbed version of aws
    const AWSUtilities = require('../index').AWSUtilities;
    const awsUtilities = new AWSUtilities(AWS_REGION);
    const response = await awsUtilities.invokeLambda('functionName');

    // expect(lambda.invoke).to.have.been.calledOnce;
    sinon.assert.calledOnce(aws.Lambda);
    sinon.assert.calledWith(lambda.invoke, { FunctionName: "functionName", InvocationType: "Event", Payload: undefined });
  });


});
