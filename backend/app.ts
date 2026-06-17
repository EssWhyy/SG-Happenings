// backend/app.ts
import express from 'express';
import type { Request, Response, NextFunction } from 'express'; 
import cors from 'cors';
import serverlessExpress from '@codegenie/serverless-express';

import { mockDb } from './db';
import type { CreateListingRequest, CreateEditListingResponse, Listing, User } from '../shared/apiContract';

const app = express();

app.use(cors());
app.use(express.json());

// Main request handler
app.use((req: Request, res: Response, next: NextFunction) => {
  if (Buffer.isBuffer(req.body)) {
    try {
      req.body = JSON.parse(req.body.toString('utf-8'));
    } catch (e) {
      console.error("Failed to parse raw body buffer:", e);
    }
  }
  next();
});


// GET ROUTE: Fetch all users or master listings
app.get('/api/debug/users', async (req: Request, res: Response) => {
  try {
    const users = await mockDb.debugGetAllUsers();
    res.json(users);
  } catch (error) {
    console.error("Debug Get All Users Error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch users" });
  }
});

app.get('/api/listings', async (req: Request, res: Response) => {
  const listings = await mockDb.debugGetAllMasterListings();
  res.json(listings);
});

// AP1: Get, Update and Delete User by Id
app.get('/api/users/:userId', async (req: Request, res: Response) => {
  const userId = req.params.userId as string;
  const user = await mockDb.getUserById(userId);

  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

app.put('/api/users/:userId', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    await mockDb.updateUser(userId, req.body);
    res.json({ success: true, message: "User updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to update user" });
  }
});

app.delete('/api/users/:userId', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    await mockDb.deleteUser(userId);
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete User Error:", error);
    res.status(500).json({ success: false, error: "Failed to delete user" });
  }
});

app.post('/api/users', async (req: Request, res: Response) => {
  try {
    console.log("Incoming Create User Body:", req.body);
    const body = req.body || {};

    // Validate email and name presence
    if (!body.email || !body.name) {
      return res.status(400).json({ success: false, error: "Name and Email are required" });
    }

    // Build user object strictly adhering to your User interface
    const newUser: User = {
      id: body.id || `usr_${Math.random().toString(36).substring(2, 9)}`,
      name: body.name,
      email: body.email,
      accountCreationDate: new Date().toISOString(),
      createdListings: [],
      bookmarks: [],
      isAdmin: body.isAdmin || false
    };

    const savedUser = await mockDb.createUser(newUser);

    res.status(201).json({
      success: true,
      id: savedUser.id,
      user: savedUser
    });
  } catch (error) {
    console.error("Create User Route Error:", error);
    res.status(500).json({ success: false, error: "Failed to create user" });
  }
});

// AP2: Create, Update, and Delete Listing 
// POST: Create new listing using NoSQL transactional replication pattern

app.get('/api/listings/:listingId', async (req: Request, res: Response) => {
  try {
    const listingId = req.params.listingId as string;
    const listing = await mockDb.getListingById(listingId);

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }
    res.json(listing);
  } catch (error) {
    console.error("Get Listing Error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch listing" });
  }
});



app.put('/api/listings/:listingId', async (req: Request, res: Response) => {
  try {
    const { listingId } = req.params;
    const body = req.body;

    // Ensure we are targeted at the correct listing ID
    const updatedListing: Listing = {
      ...body,
      id: listingId, 
      // Keep original timestamp if passed, or fallback to current
      createdAt: body.createdAt || new Date().toISOString() 
    };

    const savedListing = await mockDb.updateListing(updatedListing);

    res.json({
      success: true,
      id: savedListing.id,
      listing: savedListing
    });
  } catch (error) {
    console.error("Update Route Error:", error);
    res.status(500).json({ success: false, error: "Failed to update listing" });
  }
});

app.delete('/api/listings/:listingId', async (req: Request, res: Response) => {
  try {
    const { authorId } = req.body; // The frontend must provide who is deleting it to clean up the user history record
    const listingId = req.params.listingId as string;

    if (!authorId) return res.status(400).json({ error: "authorId is required to delete" });

    await mockDb.deleteListing(listingId, authorId);
    res.json({ success: true, id: req.params.listingId });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to delete listing" });
  }
});


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
      latitude: body.latitude || 0,   
      longitude: body.longitude || 0,
      district: body.district || "",
      createdAt: new Date().toISOString(), // Ensure Uniqueness of NoSQL records
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
// AP3: Fetch all listings created by a specific user
app.get('/api/users/:userId/listings', async (req: Request, res: Response) => {
  const userId = req.params.userId as string;
  
  const listings = await mockDb.getListingsByUser(userId);
  res.json(listings);
});

// AP4: Get Listings by District
app.get('/api/listings/district/:district', async (req: Request, res: Response) => {
  const districtId = req.params.district as string;
  const listings = await mockDb.getListingsByDistrict(districtId);
  res.json(listings);
});

// AP5: Get Listings by Type
app.get('/api/listings/type/:type', async (req: Request, res: Response) => {
  const typeId = req.params.type as string;
  const listings = await mockDb.getListingsByType(typeId);
  res.json(listings);
});


export const handler = serverlessExpress({ app });