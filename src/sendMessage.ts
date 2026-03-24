import {
  ApiGatewayManagementApi,
  PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import type {
  APIGatewayProxyWebsocketEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";

// Initialize Clients
const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

interface ConnectionItem {
  connectionId: string;
  groupId: string;
}

export const handler = async (
  event: APIGatewayProxyWebsocketEventV2,
): Promise<APIGatewayProxyResultV2> => {
  // Ensure body exists before parsing
  if (!event.body) {
    return { statusCode: 400, body: "Missing request body" };
  }

  const { groupId, message } = JSON.parse(event.body) as {
    groupId: string;
    message: string;
  };
  const { domainName, stage } = event.requestContext;

  const apiGw = new ApiGatewayManagementApi({
    endpoint: `https://${domainName}/${stage}`,
  });

  const { Items } = await ddb.send(
    new QueryCommand({
      TableName: process.env.TABLE_NAME,
      IndexName: "groupId-index",
      KeyConditionExpression: "groupId = :g",
      ExpressionAttributeValues: { ":g": groupId },
    }),
  );

  const connections = (Items as ConnectionItem[]) || [];
  const broadcast = connections.map(async ({ connectionId }) => {
    try {
      await apiGw.send(
        new PostToConnectionCommand({
          ConnectionId: connectionId,
          Data: JSON.stringify({ message, groupId }),
        }),
      );
    } catch (e: any) {
      if (e.$metadata?.httpStatusCode === 410) {
        await ddb.send(
          new DeleteCommand({
            TableName: process.env.TABLE_NAME,
            Key: { connectionId },
          }),
        );
      } else {
        console.error(`Failed to send to ${connectionId}:`, e);
      }
    }
  });

  await Promise.all(broadcast);

  return {
    statusCode: 200,
  };
};
