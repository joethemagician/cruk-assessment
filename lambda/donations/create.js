const AWS = require("aws-sdk");
const crypto = require('crypto');

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
        let uuid = crypto.randomUUID();
        await db.put({
                TableName: 'Donations',
                Item: {
                    id: uuid,
                    email: requestJSON.email,
                    amount: requestJSON.amount
                }
            }).promise();
        body = `Put item ${uuid}`;
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