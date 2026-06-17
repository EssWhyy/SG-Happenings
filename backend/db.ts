// backend/mockDb.ts
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { 
  DeleteCommand,
  DynamoDBDocumentClient, 
  PutCommand,
  QueryCommand, 
  ScanCommand, 
  TransactWriteCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import type {  QueryCommandOutput,
  ScanCommandOutput} from "@aws-sdk/lib-dynamodb";
import type { Listing, User } from '../shared/apiContract';

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
  
  //AP1: Get user by Id
  getUserById: async (userId: string): Promise<any | null> => {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND SK = :sk",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`,
        ":sk": "METADATA",
      },
    });
    const response = await docClient.send(command);
    return response.Items?.[0] || null;
  },

  createUser: async (newUser: User): Promise<User> => {
    const userRecord = {
      PK: `USER#${newUser.id}`,
      SK: "METADATA",
      entityType: "USER",
      ...newUser
    };

    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: userRecord,
    });

    await docClient.send(command);
    return newUser;
  },
  
  updateUser: async (userId: string, updatedData: Partial<User>): Promise<void> => {
    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: "METADATA",
      },
      // Dynamically builds the update expression based on passed fields
      UpdateExpression: "SET #name = :name, email = :email, bookmarks = :bookmarks",
      ExpressionAttributeNames: {
        "#name": "name", // 'name' is a reserved keyword in DynamoDB
      },
      ExpressionAttributeValues: {
        ":name": updatedData.name,
        ":email": updatedData.email,
        ":bookmarks": updatedData.bookmarks || [],
      },
    });

    await docClient.send(command);
  },

  deleteUser: async (userId: string): Promise<void> => {
  const command = new DeleteCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: `USER#${userId}`,
      SK: "METADATA",
    },
  });
  await docClient.send(command);
},

  // AP2: Get and delete standalone listing by ID
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

  deleteListing: async (listingId: string, authorId: string): Promise<void> => {
    const command = new TransactWriteCommand({
      TransactItems: [
        {
          Delete: {
            TableName: TABLE_NAME,
            Key: { PK: `LISTING#${listingId}`, SK: "METADATA" }
          }
        },
        {
          Delete: {
            TableName: TABLE_NAME,
            Key: { PK: `USER#${authorId}`, SK: `LISTING#${listingId}` }
          }
        }
      ]
    });
    await docClient.send(command);
  },

  updateListing: async (updatedListing: Listing): Promise<Listing> => {
    const masterRecord = {
      PK: `LISTING#${updatedListing.id}`,
      SK: "METADATA",
      entityType: "LISTING",
      ...updatedListing
    };

    const userHistoryRecord = {
      PK: `USER#${updatedListing.authorId}`,
      SK: `LISTING#${updatedListing.id}`,
      entityType: "LISTING",
      ...updatedListing
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
  return updatedListing;
},


  // AP3: Get all listings created by a specific user
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

  // Save listing into both required access paths simultaneously
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

  // AP4: Get listings by specific district using DistrictIndex GSI
  getListingsByDistrict: async (district: string): Promise<Listing[]> => {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "DistrictIndex", // GSI Name
      KeyConditionExpression: "district = :district",
      ExpressionAttributeValues: {
        ":district": district,
      },
      ScanIndexForward: false, // Newest First
    });

    const response = await docClient.send(command);
    return (response.Items || []) as unknown as Listing[];
  },

  // AP5: Get listings by specific type using TypeIndex GSI
  getListingsByType: async (type: string): Promise<Listing[]> => {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "TypeIndex", // GSI Name
      KeyConditionExpression: "#t = :type", // 'type' is a DynamoDB reserved keyword
      ExpressionAttributeNames: { "#t": "type" },
      ExpressionAttributeValues: {
        ":type": type,
      },
      ScanIndexForward: false,
    });

    const response = await docClient.send(command);
    return (response.Items || []) as unknown as Listing[];
  },

  // Temporary helper for global feed endpoint until GSIs are built
  debugGetAllMasterListings: async (): Promise<Listing[]> => {
    const command = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "SK = :sk",
      ExpressionAttributeValues: { ":sk": "METADATA" }
    });
    
    const response = (await docClient.send(command)) as ScanCommandOutput;
    return (response.Items || []) as unknown as Listing[];
  },

  // Temporary helper to fetch all users for debugging
  debugGetAllUsers: async (): Promise<User[]> => {
    const command = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "SK = :sk AND entityType = :entityType",
      ExpressionAttributeValues: { 
        ":sk": "METADATA",
        ":entityType": "USER"
      }
    });
    
    const response = (await docClient.send(command)) as ScanCommandOutput;
    return (response.Items || []) as unknown as User[];
  },
};