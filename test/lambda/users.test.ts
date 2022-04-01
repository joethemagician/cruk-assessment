export {}
const aws = require('aws-sdk');
const getUsers = require( '../../lambda/users/list' ).handler;
const fetchUser = require( '../../lambda/users/fetch' ).handler;
const updateUser = require( '../../lambda/users/update' ).handler;
const deleteUser = require( '../../lambda/users/delete' ).handler;

const dummyUsers = {
    "Items": [
        {
            "email": "test.user@test.com",
            "id": "1"
        }
    ],
    "Count": 1,
    "ScannedCount": 1
};

const dummyUser = {
    "email": "test.user@test.com",
    "id": "1"
};

jest.mock('aws-sdk', () => {
    const mDocumentClient = { 
        scan: jest.fn().mockImplementation(() => {
            return {
              promise() {
                return Promise.resolve(dummyUsers);
              }
            };
        }),
        get: jest.fn().mockImplementation(() => {
            return {
              promise() {
                return Promise.resolve(dummyUser);
              }
            };
        }),
        put: jest.fn().mockImplementation(() => {
            return {
              promise() {
                return `Put item ${dummyUser.id}`
              }
            };
        }),
        delete: jest.fn().mockImplementation(() => {
            return {
              promise() {
                return `Deleted item ${dummyUser.id}`
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
    
    it('should list users', async () => {
        const response = await getUsers();
        expect(mDynamoDb.scan).toBeCalled();
        expect(response.body).toEqual(JSON.stringify(dummyUsers));
    });

    it('should fetch user', async () => {
        const response = await fetchUser({ "pathParameters": { "id": dummyUser.id } });
        expect(mDynamoDb.get).toBeCalledWith({
            TableName: 'Users',
            Key: {
                id: dummyUser.id
            }
        });
        expect(response.body).toEqual(JSON.stringify(dummyUser));
    });

    it('should create / update user', async () => {
        const response = await updateUser({ "body": JSON.stringify(dummyUser)});
        expect(mDynamoDb.put).toBeCalledWith({
            TableName: 'Users',
            Item: {
                id: dummyUser.id,
                email: dummyUser.email
            }
        });
        expect(response.body).toEqual(`\"Put item ${dummyUser.id}\"`);
    });

    it('should delete user', async () => {
        const response = await deleteUser({ "pathParameters": { "id": dummyUser.id } });
        expect(mDynamoDb.delete).toBeCalledWith({
            TableName: 'Users',
            Key: {
                id: dummyUser.id
            }
        });
        expect(response.body).toEqual(`\"Deleted item ${dummyUser.id}\"`);
    });    
});
