const AWS = require("aws-sdk");

const db = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context) => {
    
    let body;
    let statusCode = 200;
    const headers = {
        "Content-Type": "application/json"
    };

    try {
        console.log('fetch',event.body);
        let requestJSON = JSON.parse(event.body);
        await db.put({
                TableName: 'Users',
                Item: {
                    id: requestJSON.id,
                    email: requestJSON.email
                }
            }).promise();
        body = `Put item ${requestJSON.id}`;
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