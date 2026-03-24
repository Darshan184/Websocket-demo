import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";
const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);
export const handler = async (event) => {
    const connectionId = event.requestContext.connectionId;
    const params = {
        TableName: process.env.TABLE_NAME,
        Key: {
            connectionId: connectionId,
        },
    };
    try {
        await ddb.send(new DeleteCommand(params));
        console.log(`Successfully disconnected and removed: ${connectionId}`);
        return {
            statusCode: 200,
            body: "Disconnected.",
        };
    }
    catch (error) {
        console.error("Error during disconnect:", error);
        return {
            statusCode: 500,
            body: "Failed to remove connection record.",
        };
    }
};
//# sourceMappingURL=disconnect.js.map