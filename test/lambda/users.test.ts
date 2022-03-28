const aws = require('aws-sdk');
const getUsers = require( '../../lambda/users/index' ).handler;

const dummyUsers = {
    "Items": [
        {
            "email": "joe.stone@bbc.co.uk",
            "id": "2"
        }
    ],
    "Count": 1,
    "ScannedCount": 1
};

jest.mock('aws-sdk', () => {
    const mDocumentClient = { 
        scan: jest.fn().mockImplementation(() => {
            return {
              promise() {
                return Promise.resolve(dummyUsers);
              }
            };
        })
    };
    const mDynamoDB = { DocumentClient: jest.fn(() => mDocumentClient) };
    return { DynamoDB: mDynamoDB };
});


const mDynamoDb = new aws.DynamoDB.DocumentClient();

describe('Test get users', () => {
    afterAll(() => {
      jest.resetAllMocks();
    });
    it('should get users', async () => {
        const response = await getUsers();
        expect(mDynamoDb.scan).toBeCalled();
        expect(response.body).toEqual(JSON.stringify(dummyUsers));
    });

});