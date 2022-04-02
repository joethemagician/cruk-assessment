import {CfnOutput, Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {AttributeType, ProjectionType, Table} from "aws-cdk-lib/aws-dynamodb";
import {Code, Function, Runtime} from "aws-cdk-lib/aws-lambda";
import {LambdaIntegration, RestApi} from "aws-cdk-lib/aws-apigateway";

export class CrukAssessmentStack extends Stack {
    private userTable: Table;
    private donationTable: Table;
    private usersListLambda: Function;
    private usersFetchLambda: Function;
    private usersUpdateLambda: Function;
    private usersDeleteLambda: Function;
    private donationsCreateLambda: Function;
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
        this.donationTable = new Table(this, 'DonationsTable', {
            tableName: 'Donations',
            partitionKey: {
                name: 'id',
                type: AttributeType.STRING
            },
        });

        this.donationTable.addGlobalSecondaryIndex({
            indexName: 'emailIndex',
            partitionKey: {
                name: 'email', 
                type: AttributeType.STRING
            },
            projectionType: ProjectionType.ALL,
        });
    }

    /*
        Creating lambda function for handling API endpoints
     */
    private createApiLambdas = () => {
        this.donationsCreateLambda = new Function(this, 'Donation-Create-Lambda', {
            code: Code.fromAsset('lambda/donations'),
            handler: "create.handler",
            runtime: Runtime.NODEJS_14_X
        });

        this.donationTable.grantReadWriteData(this.donationsCreateLambda);
                
    }

    /*
        API Gateway integration
     */
    private createApi = () => {
        this.api = new RestApi(this, `DonationsAPI`, {
            description: 'Donations API',
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
        const donations = this.api.root.addResource('donations');
        // const donation = donations.addResource('{id}');

        donations.addMethod('POST', new LambdaIntegration(this.donationsCreateLambda));
    }
}
