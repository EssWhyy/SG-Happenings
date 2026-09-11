// backend/app.ts
import 'dotenv/config';
import express from 'express';
import type { Request, Response, NextFunction } from 'express'; 
import cors from 'cors';
import serverlessExpress from '@codegenie/serverless-express';

import { Db } from './db';
import type { CreateListingRequest, CreateEditListingResponse, Listing, User } from '../shared/apiContract';

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'ap-southeast-1' });
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'sg-happenings-s3';
const rawCdnUrl = process.env.CLOUDFRONT_URL || 'https://d2yx0dms1vpwng.cloudfront.net';
const CLOUDFRONT_URL = rawCdnUrl.replace(/\/+$/, '');

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
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
    const users = await Db.debugGetAllUsers();
    res.json(users);
  } catch (error) {
    console.error("Debug Get All Users Error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch users" });
  }
});

app.get('/api/listings', async (req: Request, res: Response) => {
  const listings = await Db.debugGetAllMasterListings();
  res.json(listings);
});

// AP1: Get, Update and Delete User by Id
app.get('/api/users/:userId', async (req: Request, res: Response) => {
  const userId = req.params.userId as string;
  const user = await Db.getUserById(userId);

  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

app.put('/api/users/:userId', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    await Db.updateUser(userId, req.body);
    res.json({ success: true, message: "User updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to update user" });
  }
});

app.delete('/api/users/:userId', async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    await Db.deleteUser(userId);
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

    if (!body.email || !body.name) {
      return res.status(400).json({ success: false, error: "Name and Email are required" });
    }

    const newUser: User = {
      id: body.id || `usr_${Math.random().toString(36).substring(2, 9)}`,
      name: body.name,
      email: body.email,
      accountCreationDate: new Date().toISOString(),
      createdListings: [],
      bookmarks: [],
      isAdmin: body.isAdmin || false
    };

    const savedUser = await Db.createUser(newUser);

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
app.get('/api/listings/:listingId', async (req: Request, res: Response) => {
  try {
    const listingId = req.params.listingId as string;
    const listing = await Db.getListingById(listingId);

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

    const updatedListing: Listing = {
      ...body,
      id: listingId,
      image: body.image ?? "",
      emoji: body.emoji || "📍",
      createdAt: body.createdAt || new Date().toISOString() 
    };

    const savedListing = await Db.updateListing(updatedListing);
    res.json({ success: true, id: savedListing.id, listing: savedListing });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to update listing" });
  }
});

app.delete('/api/listings/:listingId', async (req: Request, res: Response) => {
  try {
    const { authorId } = req.body;
    const listingId = req.params.listingId as string;

    if (!authorId) return res.status(400).json({ error: "authorId is required to delete" });

    await Db.deleteListing(listingId, authorId);
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
      emoji: body.emoji || "📍",
      description: body.description ?? "",
      contact: body.contact || "No Contact Provided",
      authorId: body.authorId || "usr_anonymous",
      image: body.image ?? "",
      latitude: body.latitude || 0,   
      longitude: body.longitude || 0,
      district: body.district || "",
      createdAt: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    const savedListing = await Db.saveListing(newListing);

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
  const listings = await Db.getListingsByUser(userId);
  res.json(listings);
});

// AP4: Get Listings by District
app.get('/api/listings/district/:district', async (req: Request, res: Response) => {
  const districtId = req.params.district as string;
  const listings = await Db.getListingsByDistrict(districtId);
  res.json(listings);
});

// AP5: Get Listings by Type
app.get('/api/listings/type/:type', async (req: Request, res: Response) => {
  const typeId = req.params.type as string;
  const listings = await Db.getListingsByType(typeId);
  res.json(listings);
});

// S3 Upload Presigned URL Generator
app.post('/api/s3/presigned-url', async (req: Request, res: Response) => {
  try {
    const { fileType } = req.body;
    if (!fileType || !fileType.startsWith('image/')) {
      return res.status(400).json({ error: 'Only image files are allowed.' });
    }

    const extension = fileType.split('/')[1] || 'jpeg';
    const key = `listings/img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
    const cdnUrl = `${CLOUDFRONT_URL}/${key}`;

    res.json({ uploadUrl, cdnUrl });
  } catch (err) {
    console.error('Presigned URL generation error:', err);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});


app.get('/api/listings/search', async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string;
    if (!q) {
      return res.json([]);
    }
    const listings = await Db.searchListings(q);
    res.json(listings);
  } catch (error) {
    console.error("Search Listings Error:", error);
    res.status(500).json({ success: false, error: "Failed to search listings" });
  }
});



export const handler = serverlessExpress({ app });