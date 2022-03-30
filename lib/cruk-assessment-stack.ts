import {CfnOutput, Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {AttributeType, Table} from "aws-cdk-lib/aws-dynamodb";
import {Code, Function, Runtime} from "aws-cdk-lib/aws-lambda";
import {LambdaIntegration, RestApi} from "aws-cdk-lib/aws-apigateway";

export class CrukAssessmentStack extends Stack {
    private userTable: Table;
    private donationTable: Table;
    private usersListLambda: Function;
    private usersFetchLambda: Function;
    private usersUpdateLambda: Function;
    private usersDeleteLambda: Function;
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
        this.usersListLambda = new Function(this, 'User-List-Lambda', {
            code: Code.fromAsset('lambda/users'),
            handler: "list.handler",
            runtime: Runtime.NODEJS_14_X
        });
        this.usersFetchLambda = new Function(this, 'User-Fetch-Lambda', {
            code: Code.fromAsset('lambda/users'),
            handler: "fetch.handler",
            runtime: Runtime.NODEJS_14_X
        });
        this.usersUpdateLambda = new Function(this, 'User-Update-Lambda', {
            code: Code.fromAsset('lambda/users'),
            handler: "update.handler",
            runtime: Runtime.NODEJS_14_X
        });
        this.usersDeleteLambda = new Function(this, 'User-Delete-Lambda', {
            code: Code.fromAsset('lambda/users'),
            handler: "delete.handler",
            runtime: Runtime.NODEJS_14_X
        });

        this.userTable.grantReadWriteData(this.usersListLambda);
        this.userTable.grantReadWriteData(this.usersFetchLambda);
        this.userTable.grantReadWriteData(this.usersUpdateLambda);
        this.userTable.grantReadWriteData(this.usersDeleteLambda);
                
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

        // const donations = this.api.root.addResource('donations');
        // const donation = donations.addResource('{id}');

        users.addMethod('GET', new LambdaIntegration(this.usersListLambda));
        users.addMethod('PUT', new LambdaIntegration(this.usersUpdateLambda));
        user.addMethod('GET', new LambdaIntegration(this.usersFetchLambda));
        user.addMethod('DELETE', new LambdaIntegration(this.usersDeleteLambda));

        // donations.addMethod('GET', new LambdaIntegration(this.donationsLambda));
        // donations.addMethod('PUT', new LambdaIntegration(this.donationsLambda));
        // donation.addMethod('GET', new LambdaIntegration(this.donationsLambda));
        // donation.addMethod('DELETE', new LambdaIntegration(this.donationsLambda));
    }
}
