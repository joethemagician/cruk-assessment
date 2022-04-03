export {}
const aws = require('aws-sdk');
const createDonation = require( '../../lambda/donations/create' ).handler;
const crypto = require('crypto');

const dummyDonation = {
    "email": "test.donation@test.com",
    "amount": 1000
};

jest.spyOn(crypto, 'randomUUID').mockReturnValue('32d7e58f-2e09-4982-b1bd-3d2f9316af27');

jest.mock('aws-sdk', () => {
    // dynamoDB
    const mDocumentClient = { 
        put: jest.fn().mockImplementation(() => {
            return {
              promise() {
                return `Put item 32d7e58f-2e09-4982-b1bd-3d2f9316af27`
              }
            };
        }),
        scan: jest.fn().mockImplementation(() => {
            return {
              promise() {
                return { Count: 2 } 
              }
            };
        })
    };
    const mDynamoDB = { DocumentClient: jest.fn(() => mDocumentClient) };

    // SES
    const mSES = {
      sendEmail: jest.fn().mockReturnThis(),
      promise: jest.fn(),
    };

    return { DynamoDB: mDynamoDB, SES: jest.fn(() => mSES) };
});

const mDynamoDb = new aws.DynamoDB.DocumentClient();
const mSES = new aws.SES();

describe('Test create donation(s)', () => {
    afterAll(() => {
      jest.resetAllMocks();
    });

    it('should create second or more donations and send notification', async () => {             

        const response = await createDonation({ "body": JSON.stringify(dummyDonation)});

        // Create donation
        expect(mDynamoDb.put).toBeCalledWith({
            TableName: 'Donations',
            Item: {
                id: '32d7e58f-2e09-4982-b1bd-3d2f9316af27',
                email: dummyDonation.email,
                amount: 1000
            }
        });
        expect(mDynamoDb.scan).toBeCalledWith({
            TableName: 'Donations',
            IndexName: 'emailIndex',
            FilterExpression: 'email = :email',
            ExpressionAttributeValues: { ':email': dummyDonation.email }
          }, expect.any(Function));
        expect(response.body).toEqual(`\"Put item 32d7e58f-2e09-4982-b1bd-3d2f9316af27\"`);

        // send email
        expect(mSES.sendEmail).toBeCalled();
    });
   
});
