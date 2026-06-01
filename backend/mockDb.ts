// backend/mockDb.ts
import type { Listing } from '../shared/apiContract';

// This array acts as your fake DynamoDB table while your server runs
const listingsDatabase: Listing[] = [
  {
    id: "list_001",
    type: "Sale",
    title: "Second-hand Bicycle",
    description: "Good condition, barely used.",
    authorId: "user_99",
    contact: "555-1234",
    x_cood: 1.3521,
    y_cood: 103.8198,
    expiryDate: "2026-07-01T00:00:00Z"
  }
];

export const mockDb = {
  // Mock operation to get all listings
  getAllListings: async (): Promise<Listing[]> => {
    return listingsDatabase;
  },

  // Mock operation to save a new listing
  saveListing: async (newListing: Listing): Promise<Listing> => {
    listingsDatabase.push(newListing);
    return newListing;
  }
};