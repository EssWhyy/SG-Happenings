// shared/apiContract.ts

export interface User {
  id: string;
  name: string;
  email: string;
  accountCreationDate: string; //ISO DateTime String
  createdListings: string[]; //own listing ids
  bookmarks: string[]; //other user listing ids that are bookmarked
}

// What the frontend must send to create a task
export interface Listing {
  id: string;
  type: string;
  title: string;
  description?: string;
  authorId: string; // user who made the listing
  image?: string; //id or string linked to S3 item
  contact: string;
  x_cood: number;
  y_cood: number;
  expiryDate: string; //ISO DateTime String
}

// ==========================================
// REQUEST PAYLOADS (What the frontend sends)
// ==========================================

// When creating a listing, the frontend doesn't know the ID or backend dates yet
export interface CreateListingRequest {
  type: string;
  title: string;
  description?: string;
  authorId: string; 
  image?: string;
  contact: string;
  x_cood: number;
  y_cood: number;
}

// ==========================================
// RESPONSE PAYLOADS (What the backend sends)
// ==========================================

export interface CreateEditListingResponse {
  success: boolean;
  id: string;
  listing: Listing;
}

export interface DeleteListingResponse {
  success: boolean;
  id: string;
}