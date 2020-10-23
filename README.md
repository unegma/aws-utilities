# AWS Utilities
Wrapper utility functions for interacting with AWS SDKs and API

## Usage

`npm install @unegma/aws-utilities --save`

```
const {
  SLACK_ERROR_LOG,
  AWS_REGION
} = process.env;
const awsUtilities = new AWSUtilities(AWS_REGION, SLACK_ERROR_LOG); // with slack logging (optional)

...
// invokeLambda
awsUtilities.invokeLambda('functionName', data);
```

## KMS
For live testing, need to use `AWS_PROFILE=my-profile` in environment variables if not using default: 
https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-shared.html

cmd: `aws kms encrypt --profile my-profile --key-id the-id-of-my-key --plaintext "string to encrypt"`
cmd: `aws kms decrypt --ciphertext-blob fileb://<(echo "the-encrypted-string" | base64 -D) --output text --query Plaintext --profile my-profile | base64 -D`
