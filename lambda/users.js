const AWS = require("aws-sdk");

const dB = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context) => {
    const TABLE = 'Users';
    let body;
    let statusCode = 200;
    const headers = {
        "Content-Type": "application/json"
    };

    let path = event.resource;
    let httpMethod = event.httpMethod;
    let route = httpMethod.concat(' ').concat(path);

    try {
        switch (route) {
            case "GET /users":
                body = await dB.scan({TableName: TABLE}).promise();
                break;
            case "GET /users/{id}":
                body = await dB
                    .get({
                        TableName: TABLE,
                        Key: {
                            id: event.pathParameters.id
                        }
                    })
                    .promise();
                break;
            case "PUT /users":
                let requestJSON = JSON.parse(event.body);
                await dB
                    .put({
                        TableName: TABLE,
                        Item: {
                            id: requestJSON.id,
                            email: requestJSON.email
                        }
                    })
                    .promise();
                body = `Put item ${requestJSON.id}`;
                break;
            case "DELETE /users/{id}":
                await dB
                    .delete({
                        TableName: TABLE,
                        Key: {
                            id: event.pathParameters.id
                        }
                    })
                    .promise();
                body = `Deleted item ${event.pathParameters.id}`;
                break;

            default:
                throw new Error(`Unsupported route: "${route}"`);
        }
    } catch (err) {
        console.log(err)
        statusCode = 400;
        body = err.message;
    } finally {
        console.log(body)
        body = JSON.stringify(body);
    }

    return {
        statusCode,
        body,
        headers
    };
};