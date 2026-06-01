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

// Convert raw AWS Buffers into readable objects before passing to routes
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

// 1. GET ROUTE: Fetch all listings
app.get('/api/listings', async (req: Request, res: Response) => {
  const listings = await mockDb.getAllListings();
  res.json(listings);
});

// 2. POST ROUTE: Create a new listing
app.post('/api/listings', async (req: Request, res: Response) => {
  try {
    // Debug log
    console.log("Incoming Frontend Body:", req.body);

    const body: CreateListingRequest = req.body || {};

    const newListing: Listing = {
      id: `list_${Math.random().toString(36).substring(2, 9)}`,
      
      // fallbacks
      type: body.type || "Unknown Type",
      title: body.title || "No Title Provided",
      description: body.description ?? "",
      contact: body.contact || "No Contact Provided",
      
      authorId: body.authorId || "usr_anonymous",
      image: body.image ?? "",
      x_cood: body.x_cood || 0,
      y_cood: body.y_cood || 0,
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    await mockDb.saveListing(newListing);

    const responsePayload: CreateEditListingResponse = {
      success: true,
      id: newListing.id,
      listing: newListing
    };

    res.status(201).json(responsePayload);
  } catch (error) {
    console.error("Route Error:", error);
    res.status(500).json({ success: false, error: "Failed to create listing" });
  }
});

// This is the bridge that turns your Express app into an AWS Lambda function
export const handler = serverlessExpress({ app });