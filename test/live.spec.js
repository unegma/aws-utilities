require('dotenv').config();
const KMS_KEY_ID = process.env.KMS_KEY_ID;
const SLACK_ERROR_LOG = process.env.SLACK_ERROR_LOG;
const AWS_REGION = process.env.AWS_REGION;

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

  // currently a live KMS test
  it('should encrypt using KMS and single encoding', async () => {
    const encryptionUtilities = new EncryptionUtilities(AWS_REGION, KMS_KEY_ID, SLACK_ERROR_LOG);
    const response = await encryptionUtilities.encrypt("something", 'single');
    console.log(response);
  });

  // currently a live KMS test
  it('should decrypt using KMS and single decoding', async () => {
    const encryptionUtilities = new EncryptionUtilities(AWS_REGION, KMS_KEY_ID, SLACK_ERROR_LOG);
    const response = await encryptionUtilities.decrypt(process.env.SINGLE_KMS_ENCRYPTED_STRING, 'single');
    expect(response).to.equal("something");
  });

  // currently a live KMS test
  it('should encrypt using KMS and double encoding', async () => {
    const encryptionUtilities = new EncryptionUtilities(AWS_REGION, KMS_KEY_ID, SLACK_ERROR_LOG);
    const response = await encryptionUtilities.encrypt("something");
    console.log(response);
  });

  // currently a live KMS test
  it('should decrypt using KMS and double decoding', async () => {
    const encryptionUtilities = new EncryptionUtilities(AWS_REGION, KMS_KEY_ID, SLACK_ERROR_LOG);
    const response = await encryptionUtilities.decrypt(process.env.DOUBLE_KMS_ENCRYPTED_STRING);
    expect(response).to.equal("something");
  });


  // currently a live AWS test
  it('should get a user from a dynamodb database', async () => {
    const dbUtilities = new DBUtilities(AWS_REGION, SLACK_ERROR_LOG);
    const response = await dbUtilities.getUser('user@example.com');
    expect(response.Name).to.equal("User");
  });

  // currently a live AWS test
  it('should get all users from a dynamodb database', async () => {
    const dbUtilities = new DBUtilities(AWS_REGION, SLACK_ERROR_LOG);
    const response = await dbUtilities.getUsers();
    expect(response[0].Name).to.equal("User2");
    expect(response[1].Name).to.equal("User");
  });

  // currently a live AWS test
  it('should create a user in the database', async () => {
    const dbUtilities = new DBUtilities(AWS_REGION, SLACK_ERROR_LOG);
    let now = Date.now();
    const response = await dbUtilities.createUser(`user${now}@example.com`, `User${now}`);
    // expect(response.Name).to.equal("User");
    // todo add correct expectation
  });

  // currently a live AWS test
  it('should update a user in the database', async () => {
    const dbUtilities = new DBUtilities(AWS_REGION, SLACK_ERROR_LOG);
    let now = Date.now();
    const response = await dbUtilities.updateUser(`user2@example.com`, `User${now}`);
    // expect(response.Name).to.equal("User");
    // todo add correct expectation
  });

  // currently a live AWS test
  it('should delete a user in the database', async () => {
    const dbUtilities = new DBUtilities(AWS_REGION, SLACK_ERROR_LOG);
    const response = await dbUtilities.deleteUser(`user2@example.com`);
    // expect(response.Name).to.equal("User");
    // todo add correct expectation
  });

});
