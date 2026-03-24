import { ApiGatewayManagementApi, PostToConnectionCommand, } from "@aws-sdk/client-apigatewaymanagementapi";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, DeleteCommand, } from "@aws-sdk/lib-dynamodb";
// Initialize Clients
const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);
export const handler = async (event) => {
    // Ensure body exists before parsing
    if (!event.body) {
        return { statusCode: 400, body: "Missing request body" };
    }
    const { groupId, message } = JSON.parse(event.body);
    const { domainName, stage } = event.requestContext;
    const apiGw = new ApiGatewayManagementApi({
        endpoint: `https://${domainName}/${stage}`,
    });
    const { Items } = await ddb.send(new QueryCommand({
        TableName: process.env.TABLE_NAME,
        IndexName: "groupId-index",
        KeyConditionExpression: "groupId = :g",
        ExpressionAttributeValues: { ":g": groupId },
    }));
    const connections = Items || [];
    const broadcast = connections.map(async ({ connectionId }) => {
        try {
            await apiGw.send(new PostToConnectionCommand({
                ConnectionId: connectionId,
                Data: JSON.stringify({ message, groupId }),
            }));
        }
        catch (e) {
            if (e.$metadata?.httpStatusCode === 410) {
                await ddb.send(new DeleteCommand({
                    TableName: process.env.TABLE_NAME,
                    Key: { connectionId },
                }));
            }
            else {
                console.error(`Failed to send to ${connectionId}:`, e);
            }
        }
    });
    await Promise.all(broadcast);
    return {
        statusCode: 200,
    };
};
//# sourceMappingURL=sendMessage.js.map