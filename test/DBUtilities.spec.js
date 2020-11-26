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
describe('DB Utilities Test', () => {

  afterEach(() => {
    sinon.restore();
  });

  it('should create an instance of an AWSIntegrationError', () => {
    const error = new AWSIntegrationError('Error');
    expect(error.message).to.equal('Error');
  });


  it('should configure aws', async () => {
    sinon.stub(aws.config, 'update');
    const documentClient = {
      promise: sinon.stub()
    };
    // try: sinon.stub(aws, 'Kinesis').returns({ putRecord: sinon.stub().callsArgWith(1, null, true) })
    sinon.stub(aws.DynamoDB, 'DocumentClient').callsFake(() => documentClient);

    const DBUtilities = require('../index').DBUtilities;
    const dbUtilities = new DBUtilities(AWS_REGION);

    sinon.assert.calledWith(aws.config.update, {region: AWS_REGION});
  });

  it('should delete from DynamoDB', async () => {
    sinon.stub(aws.config, 'update');

    const documentClient = {
      update: sinon.stub().returnsThis(),
      promise: sinon.stub()
    };
    // try: sinon.stub(aws, 'Kinesis').returns({ putRecord: sinon.stub().callsArgWith(1, null, true) })
    sinon.stub(aws.DynamoDB, 'DocumentClient').callsFake(() => documentClient);

    // these use the above stubbed version of aws
    const DBUtilities = require('../index').DBUtilities;
    const dbUtilities = new DBUtilities(AWS_REGION);
    const response = await dbUtilities.deleteInDB('Table', 'ID', 123, true);

    sinon.assert.calledWith(aws.config.update, { region: AWS_REGION });
    sinon.assert.calledWith(documentClient.update, {
      "ExpressionAttributeNames": {"#deleted": "deleted"},
      "ExpressionAttributeValues": {":true": true},
      "Key": { ID: 123 },
      "TableName": "Table",
      "UpdateExpression": "set #deleted = :true"
    });

    const response2 = await dbUtilities.deleteInDB('Table', ['ID', 'SortKey'], [123, 456], true);

    sinon.assert.calledWith(aws.config.update, { region: AWS_REGION });
    sinon.assert.calledWith(documentClient.update, {
      "ExpressionAttributeNames": {"#deleted": "deleted"},
      "ExpressionAttributeValues": {":true": true},
      "Key": { ID: 123, SortKey: 456 },
      "TableName": "Table",
      "UpdateExpression": "set #deleted = :true"
    });

  });

});
