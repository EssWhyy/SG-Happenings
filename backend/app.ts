// backend/app.ts
import express from 'express';
import type { Request, Response, NextFunction } from 'express'; 
import cors from 'cors';
import serverlessExpress from '@codegenie/serverless-express';

import { mockDb } from './mockDb';
import type { CreateListingRequest, CreateEditListingResponse, Listing } from '../shared/apiContract';

const app = express();

app.use(cors());
app.use(express.json());

app.use((req: Request, res: Response, next: NextFunction) => {
  if (Buffer.isBuffer(req.body)) {
    try {
      req.body = JSON.parse(req.body.toString('utf-8'));
    } catch (e) {
      console.error("❌ Failed to parse raw body buffer:", e);
    }
  }
  next();
});

// 1. GET ROUTE: Fetch all master listings
app.get('/api/listings', async (req: Request, res: Response) => {
  const listings = await mockDb.debugGetAllMasterListings();
  res.json(listings);
});

// NEW ROUTE: Fetch all listings created by a specific user (AP3)
app.get('/api/users/:userId/listings', async (req: Request, res: Response) => {
  // Cast req.params.userId explicitly as a string
  const userId = req.params.userId as string;
  
  const listings = await mockDb.getListingsByUser(userId);
  res.json(listings);
});

// 2. POST ROUTE: Create a new listing using NoSQL transactional replication pattern
app.post('/api/listings', async (req: Request, res: Response) => {
  try {
    console.log("Incoming Frontend Body:", req.body);

    const body: CreateListingRequest = req.body || {};

    const newListing: Listing = {
      id: `list_${Math.random().toString(36).substring(2, 9)}`,
      type: body.type || "Unknown Type",
      title: body.title || "No Title Provided",
      description: body.description ?? "",
      contact: body.contact || "No Contact Provided",
      authorId: body.authorId || "usr_anonymous",
      image: body.image ?? "",
      // Updated field names to match your standardized Listing interface specs
      latitude: body.latitude || 0,   
      longitude: body.longitude || 0,
      createdAt: new Date().toISOString(), // Vital for NoSQL sort tracking
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    // This creates BOTH main table records under the hood
    const savedListing = await mockDb.saveListing(newListing);

    const responsePayload: CreateEditListingResponse = {
      success: true,
      id: savedListing.id,
      listing: savedListing
    };

    res.status(201).json(responsePayload);
  } catch (error) {
    console.error("Route Error:", error);
    res.status(500).json({ success: false, error: "Failed to create listing" });
  }
});

export const handler = serverlessExpress({ app });