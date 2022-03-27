import {CfnOutput, Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {AttributeType, Table} from "aws-cdk-lib/aws-dynamodb";
import {Code, Function, Runtime} from "aws-cdk-lib/aws-lambda";
import {Policy, PolicyStatement} from "aws-cdk-lib/aws-iam";
import {LambdaIntegration, RestApi} from "aws-cdk-lib/aws-apigateway";

export class CrukAssessmentStack extends Stack {
    private userTable: Table;
    private donationTable: Table;
    private usersLambda: Function;
    private donationsLambda: Function;
    private api: RestApi;

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        this.createTables();

        this.createApiLambdas();

        this.createApi();
    }

    /*
        Creating a DynamoDB table for storing User data
     */
    private createTables = () => {
        this.userTable = new Table(this, 'UsersTable', {
            tableName: 'Users',
            partitionKey: {
                name: 'id',
                type: AttributeType.STRING
            },
        });

        this.donationTable = new Table(this, 'DonationsTable', {
            tableName: 'Donations',
            partitionKey: {
                name: 'id',
                type: AttributeType.STRING
            },
        });
    }

    /*
        Creating lambda function for handling API endpoints
     */
    private createApiLambdas = () => {
        this.usersLambda = new Function(this, 'User-Lambda', {
            code: Code.fromAsset('lambda'),
            handler: "users.handler",
            runtime: Runtime.NODEJS_14_X
        });

        this.donationsLambda = new Function(this, 'Donation-Lambda', {
            code: Code.fromAsset('lambda'),
            handler: "donations.handler",
            runtime: Runtime.NODEJS_14_X
        });

        //Required permissions for Lambda function to interact with User table
        const tablePermissionPolicy = new PolicyStatement({
            actions: [
                "dynamodb:BatchGetItem",
                "dynamodb:GetItem",
                "dynamodb:Scan",
                "dynamodb:Query",
                "dynamodb:BatchWriteItem",
                "dynamodb:PutItem",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem"
            ],
            resources: [this.userTable.tableArn, this.donationTable.tableArn]
        });

        //Attaching an inline policy to the role
        this.usersLambda.role?.attachInlinePolicy(
            new Policy(this, `UserTablePermissions`, {
                statements: [tablePermissionPolicy],
            }),
        );

        this.donationsLambda.role?.attachInlinePolicy(
            new Policy(this, `DonationsTablePermissions`, {
                statements: [tablePermissionPolicy],
            }),
        );
    }

    /*
        API Gateway integration
     */
    private createApi = () => {
        this.api = new RestApi(this, `UsersDonationsAPI`, {
            description: 'Users & Donations API',
            deployOptions: {
                stageName: 'test'
            },
            defaultCorsPreflightOptions: {
                allowHeaders: [
                    'Content-Type',
                    'X-Amz-Date',
                    'Authorization',
                    'X-Api-Key',
                ],
                allowMethods: ['OPTIONS', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
                allowCredentials: true,
                allowOrigins: ['http://localhost:3000'],
            },
        });
        new CfnOutput(this, 'apiUrl', {value: this.api.url});

        this.addApiResources();
    }

    private addApiResources = () => {
        const users = this.api.root.addResource('users');
        const user = users.addResource('{id}');

        const donations = this.api.root.addResource('donations');
        const donation = donations.addResource('{id}');

        users.addMethod('GET', new LambdaIntegration(this.usersLambda));
        users.addMethod('PUT', new LambdaIntegration(this.usersLambda));
        user.addMethod('GET', new LambdaIntegration(this.usersLambda));
        user.addMethod('DELETE', new LambdaIntegration(this.usersLambda));

        donations.addMethod('GET', new LambdaIntegration(this.donationsLambda));
        donations.addMethod('PUT', new LambdaIntegration(this.donationsLambda));
        donation.addMethod('GET', new LambdaIntegration(this.donationsLambda));
        donation.addMethod('DELETE', new LambdaIntegration(this.donationsLambda));
    }
}
