# AWS Utilities
Utility functions for interacting with AWS APIs

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

