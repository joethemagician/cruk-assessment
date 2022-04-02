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
        // create the donation
        console.log('create',event.body);
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

        // check if second or later donation
        let params = {
            TableName: 'Donations',
            IndexName: 'emailIndex',
            FilterExpression: 'email = :email',
            ExpressionAttributeValues: { ':email': requestJSON.email} 
        }
        console.log(params);
        await db.scan(params, function(err, data) {
            if (err) {
                console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
            } else {
                console.log(data);
                if(data.Count >= 2){
                    console.log('Thanks!!!!');
                }
            }
        }).promise();
    

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