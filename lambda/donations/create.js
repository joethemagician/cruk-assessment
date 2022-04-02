const AWS = require("aws-sdk");
const crypto = require("crypto");

const db = new AWS.DynamoDB.DocumentClient();
const ses = new AWS.SES({"region": "eu-west-1"});

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
        const scanResponse = await db.scan(params, function(err, data) {
            console.log(data);
            if (err) {
                console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
            }
        }).promise();

        console.log(scanResponse);

        if(scanResponse.Count >= 2){
            let params = {
                Destination: {
                  ToAddresses: [requestJSON.email],
                },
                Message: {
                  Body: {
                    Text: { Data: "Test" },
                  },
            
                  Subject: { Data: "Test Email" },
                },
                Source: "test@test.com",
              };             
              return ses.sendEmail(params).promise()
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