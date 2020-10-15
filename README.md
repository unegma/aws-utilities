# AWS Utilities
Utility functions for interacting with AWS APIs

## Usage

`npm install @unegma/aws-utilities --save`

```
const {
  SLACK_ERROR_LOG
} = process.env;
const tCLib = new AWSUtilities(SLACK_ERROR_LOG); // with slack logging

...

```

