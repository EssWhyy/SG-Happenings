// backend/mockDb.ts
import type { Listing } from '../shared/apiContract';

export interface DynamoDBItem {
  PK: string;
  SK: string;
  entityType: string; // 'USER' | 'LISTING' | 'BOOKMARK', make enum?
  [key: string]: any;
}

// Mock single-table database
const mainTable: DynamoDBItem[] = [
  // 1. The master listing record
  {
    PK: "LISTING#list_001",
    SK: "METADATA",
    entityType: "LISTING",
    id: "list_001",
    typeAttribute: "Sale",
    title: "Second-hand Bicycle",
    description: "Good condition, barely used.",
    authorId: "user_99",
    contact: "555-1234",
    latitude: 1.3521,
    longitude: 103.8198,
    createdAt: "2026-06-01T00:00:00Z",
    expiryDate: "2026-07-01T00:00:00Z"
  },
  // 2. The user-history record duplicated for AP3 (Get all listings by a user)
  {
    PK: "USER#user_99",
    SK: "LISTING#list_001",
    entityType: "LISTING",
    id: "list_001",
    typeAttribute: "Sale",
    title: "Second-hand Bicycle",
    description: "Good condition, barely used.",
    authorId: "user_99",
    contact: "555-1234",
    latitude: 1.3521,
    longitude: 103.8198,
    createdAt: "2026-06-01T00:00:00Z",
    expiryDate: "2026-07-01T00:00:00Z"
  }
];

export const mockDb = {
  // Query operations imitating key condition fetches
  
  // Implements: Get standalone listing by ID (AP2)
  getListingById: async (listingId: string): Promise<Listing | null> => {
    const item = mainTable.find(row => row.PK === `LISTING#${listingId}` && row.SK === "METADATA");
    return item ? (item as unknown as Listing) : null;
  },

  // Implements: Get all listings created by a specific user (AP3)
  // NoSQL equivalent: Query where PK = USER#userId and SK begins_with(LISTING#)
  getListingsByUser: async (userId: string): Promise<Listing[]> => {
    const listings = mainTable.filter(
      row => row.PK === `USER#${userId}` && row.SK.startsWith("LISTING#")
    );
    // Sort by newest first natively using javascript
    return listings.sort((a, b) => b.createdAt.localeCompare(a.createdAt)) as unknown as Listing[];
  },

  // Implements: Save listing into both required access paths simultaneously
  // In real DynamoDB, this uses a "TransactWriteItems" operation
  saveListing: async (newListing: Listing): Promise<Listing> => {
    const timestamp = new Date().toISOString();
    const cleanListing = { ...newListing, createdAt: timestamp };

    // Row A: The main lookup item
    const masterRecord: DynamoDBItem = {
      PK: `LISTING#${cleanListing.id}`,
      SK: "METADATA",
      entityType: "LISTING",
      ...cleanListing
    };

    // Row B: The user mapping item (enables fast user-profile historical queries)
    const userHistoryRecord: DynamoDBItem = {
      PK: `USER#${cleanListing.authorId}`,
      SK: `LISTING#${cleanListing.id}`,
      entityType: "LISTING",
      ...cleanListing
    };

    mainTable.push(masterRecord);
    mainTable.push(userHistoryRecord);

    return cleanListing;
  },

  // Temporary helper for your global feed endpoint until we build GSIs next
  debugGetAllMasterListings: async (): Promise<Listing[]> => {
    const items = mainTable.filter(row => row.PK.startsWith("LISTING#") && row.SK === "METADATA");
    return items as unknown as Listing[];
  }
};