const SLACK_ERROR_LOG = 'https://example.com';
const AWS_REGION = 'eu-west-2';

const aws = require('aws-sdk');
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
chai.use(sinonChai);

// These help:
// https://stackoverflow.com/questions/26243647/sinon-stub-in-node-with-aws-sdk
// https://stackoverflow.com/questions/61516053/sinon-stub-for-lambda-using-promises
describe('SQS Utilities Test', () => {

  afterEach(() => {
    sinon.restore();
  });

  it('should add to SQS', async () => {
    sinon.stub(aws.config, 'update');

    const sqs = {
      sendMessage: sinon.stub().returnsThis(),
      promise: sinon.stub()
    };
    // try: sinon.stub(aws, 'Kinesis').returns({ putRecord: sinon.stub().callsArgWith(1, null, true) })
    sinon.stub(aws, 'SQS').callsFake(() => sqs);

    // these use the above stubbed version of aws
    const AWSUtilities = require('../index').AWSUtilities;
    const awsUtilities = new AWSUtilities(AWS_REGION);
    const response = await awsUtilities.postToSQS('https://example.com', { id: 1}, 'chicken');

    expect(sqs.sendMessage).to.have.been.calledOnce;
  });

  it('should get from SQS', async () => {
    sinon.stub(aws.config, 'update');

    const sqs = {
      receiveMessage: sinon.stub().returnsThis(),
      promise: sinon.stub()
    };
    // try: sinon.stub(aws, 'Kinesis').returns({ putRecord: sinon.stub().callsArgWith(1, null, true) })
    sinon.stub(aws, 'SQS').callsFake(() => sqs);

    // these use the above stubbed version of aws
    const AWSUtilities = require('../index').AWSUtilities;
    const awsUtilities = new AWSUtilities(AWS_REGION);

    const response = await awsUtilities.getFromSQS('https://example.com');
    expect(sqs.receiveMessage).to.have.been.calledOnce;
  });

  it('should delete from SQS', async () => {
    sinon.stub(aws.config, 'update');
    const sqs = {
      deleteMessage: sinon.stub().returnsThis(),
      promise: sinon.stub()
    };
    // try: sinon.stub(aws, 'Kinesis').returns({ putRecord: sinon.stub().callsArgWith(1, null, true) })
    sinon.stub(aws, 'SQS').callsFake(() => sqs);

    // these use the above stubbed version of aws
    const AWSUtilities = require('../index').AWSUtilities;
    const awsUtilities = new AWSUtilities(AWS_REGION);
    const response = await awsUtilities.deleteFromSQS('https://example.com', '12345');

    expect(sqs.deleteMessage).to.have.been.calledOnce;
  });


});
