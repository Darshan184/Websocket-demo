import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);
export const handler = async (event) => {
    const connectionId = event.requestContext.connectionId;
    const groupId = event.queryStringParameters?.groupId;
    if (!groupId) {
        return {
            statusCode: 400,
            body: "Missing groupId",
        };
    }
    const params = {
        TableName: process.env.TABLE_NAME,
        Item: {
            connectionId: connectionId,
            groupId: groupId,
        },
    };
    try {
        await ddb.send(new PutCommand(params));
        return {
            statusCode: 200,
            body: "Connected.",
        };
    }
    catch (err) {
        console.error("Connection Error:", err);
        return {
            statusCode: 500,
            body: "Failed to connect:",
        };
    }
};
//# sourceMappingURL=connect.js.map