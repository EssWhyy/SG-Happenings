// backend/mockDb.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { 
  DynamoDBDocumentClient, 
  QueryCommand, 
  ScanCommand, 
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import type {  QueryCommandOutput,
  ScanCommandOutput} from "@aws-sdk/lib-dynamodb";
import type { Listing } from '../shared/apiContract';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "backend-listings-dev";

export interface DynamoDBItem {
  PK: string;
  SK: string;
  entityType: string;
  [key: string]: any;
}

export const mockDb = {
  
  // Implements: Get standalone listing by ID (AP2)
  getListingById: async (listingId: string): Promise<Listing | null> => {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND SK = :sk",
      ExpressionAttributeValues: {
        ":pk": `LISTING#${listingId}`,
        ":sk": "METADATA",
      },
    });

    const response = (await docClient.send(command)) as QueryCommandOutput;
    if (!response.Items || response.Items.length === 0) return null;
    
    return response.Items[0] as unknown as Listing;
  },

  // Implements: Get all listings created by a specific user (AP3)
  getListingsByUser: async (userId: string): Promise<Listing[]> => {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`,
        ":skPrefix": "LISTING#",
      },
    });

    const response = (await docClient.send(command)) as QueryCommandOutput;
    const items = (response.Items || []) as unknown as Listing[];
    
    return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  // Implements: Save listing into both required access paths simultaneously
  saveListing: async (newListing: Listing): Promise<Listing> => {
    const timestamp = new Date().toISOString();
    const cleanListing = { ...newListing, createdAt: timestamp };

    const masterRecord: DynamoDBItem = {
      PK: `LISTING#${cleanListing.id}`,
      SK: "METADATA",
      entityType: "LISTING",
      ...cleanListing
    };

    const userHistoryRecord: DynamoDBItem = {
      PK: `USER#${cleanListing.authorId}`,
      SK: `LISTING#${cleanListing.id}`,
      entityType: "LISTING",
      ...cleanListing
    };

    const command = new TransactWriteCommand({
      TransactItems: [
        {
          Put: {
            TableName: TABLE_NAME,
            Item: masterRecord,
          },
        },
        {
          Put: {
            TableName: TABLE_NAME,
            Item: userHistoryRecord,
          },
        },
      ],
    });

    await docClient.send(command);
    return cleanListing;
  },

  // Temporary helper for your global feed endpoint until GSIs are built
  debugGetAllMasterListings: async (): Promise<Listing[]> => {
    const command = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "SK = :sk",
      ExpressionAttributeValues: { ":sk": "METADATA" }
    });
    
    const response = (await docClient.send(command)) as ScanCommandOutput;
    return (response.Items || []) as unknown as Listing[];
  }
};