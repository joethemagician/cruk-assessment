# CRUK Node.js Recruitment Assignment

## Overview

This repository contains an application with a single endpoint. This endpoint checks how many donations have been created associated with a particular user (identified by email address) and sends an email notification thanking the user if more than one donation has been received.

## API Spec

The endpoint will output from the 'cdk deploy' command as outlined below - a test version is currently live at [https://hh1gkk2wv6.execute-api.eu-west-1.amazonaws.com/test/donations](https://hh1gkk2wv6.execute-api.eu-west-1.amazonaws.com/test/donations), however due SES being in sandbox mode it is not possible to test the email functionality to an unverified address at this stage. If required an email address can be verified for testing.

The request should be:

```
POST /donations

{
	"email": {valid email},
	"amount": {integer amount in pence}
}

Example:

{
	"email": test@test.com,
	"amount": 1000
}

```

The expected response should be:

```
{
 "message": "Put item 547485f3-3b01-4ce6-89b8-d8764dea0958"
}

```

## Prerequisites

To install / run the application and build to AWS :

- Node 14.x.x installed (with npm for installing packages)
- AWS CDK ^2.17.0 cli for building and deploying the service


## Building the service

The application is built using AWS CDK and can be built and deployed using the command

```
cdk deploy
```

This should create:

- 1 Lambda 
- API gateway with one endpoint
- 1 Dynamodb table (Donations)

A configuration value of 'FROM_EMAIL' will need to be set within the Lamda's environment variables for the email sending to function correctly.

## Testing

The repository contains unit tests written using Jest for the Lambda code (the AWS resources are mocked).  The tests can be run using the following command from the root of the repository:

```
npm run test
```


## Production readiness

Although the application is complete in terms of being an example exercise, there are a number of improvements / adjustments that would likely be needed for the service to be production ready - including, but not limited to:

- There is currently no validation for the endpoint - this should be a priority for any implementation intended for production
- The current implementation uses the email address as the unique identifier for a user - this could be replaced with another primary key from a users table
- The logging currently outputs to the default cloud watch log for the lambda - this is sufficient for this single lamda implementation, but a central log could be used if the application was expanded to use multiple lamdas or other resources

## Scaling

### API Gateway / Lambda

The design of the application using API Gateway and Lambda means that the service is relatively scalable already.  AWS Lamdas are designed to allow high concurrency without the need to specifically address threading etc withing the code.

The default concurrency limit for a Lambda is 1000 per minute per region - this should be increased by creating a request in the AWS support center before going into production.

### DynamoDB

Auto-scaling for DynamoDB can be configured using scaling policy - in this implementation this could be configured directly in the codebase using the cdk stack - see example from the [AWS Docs](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_dynamodb-readme.html#configure-autoscaling-for-your-table), which allows:

- setting the general min / max capacity 
- setting the min / max capacity based on a schedule

```
const readScaling = table.autoScaleReadCapacity({incapacity: 1, maxCapacity: 50});

readScaling.scaleOnUtilization({
 targetUtilizationPercent: 50,
});

readScaling.scaleOnSchedule('ScaleUpInTheMorning', {
 schedule: app scaling. Schedule.cron({hour: '8', minute: '0'}),
 incapacity: 20,
});

readScaling.scaleOnSchedule('ScaleDownAtNight', {
 schedule: app scaling. Schedule.cron({hour: '20', minute: '0'}),
 maxCapacity: 20,
});
```

### Email / SES

As mentioned above the SES would need to be taken out of sandbox mode. It may also be necessary to request an extension of the 24hr sending quota depending on need (the current value for this can be checked in the AWS console).
