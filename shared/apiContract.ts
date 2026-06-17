// shared/apiContract.ts

// ==========================================
// BASE OBJECT STRUCTURES
// ==========================================

export interface User {
  id: string;
  name: string;
  email: string;
  accountCreationDate: string; //ISO DateTime String
  createdListings: string[]; //own listing ids
  bookmarks: string[]; //other user listing ids that are bookmarked
  isAdmin: boolean;
}
export interface Listing {
  id: string;
  type: string;
  title: string;
  description?: string;
  authorId: string; // user who made the listing
  image?: string; // id or string linked to S3 item
  contact?: string;
  link?: string;
  latitude: number;
  longitude: number;
  district: string; // which GRC is the listing in on the map
  createdAt: string; //ISO DateTime String
  expiryDate: string; //ISO DateTime String
}

// ==========================================
// REQUEST PAYLOADS (What the frontend sends)
// ==========================================

export interface CreateListingRequest {
  type: string;
  title: string;
  description?: string;
  authorId: string; 
  image?: string;
  contact: string;
  latitude: number;
  longitude: number;
  district: string;
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