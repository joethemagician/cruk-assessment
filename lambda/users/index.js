const AWS = require("aws-sdk");

const db = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context) => {
    
    let body;
    let statusCode = 200;
    const headers = {
        "Content-Type": "application/json"
    };

    try {
        body = await db.scan({TableName: 'Users'}).promise();
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