// backend/routes/debug.ts
import { Router } from 'express';
import type { Request, Response } from 'express';
import { Db } from '../infrastructure/db';

const router = Router();

// DELETE /api/debug/listings - Bulk delete all listings to reset data
router.delete('/listings', async (req: Request, res: Response) => {
  try {
    const listings = await Db.debugGetAllMasterListings();
    
    // Loop through and delete each listing using your existing transactional delete logic
    for (const listing of listings) {
      await Db.deleteListing(listing.id, listing.authorId);
    }

    res.json({ 
      success: true, 
      message: `Successfully reset data. Deleted ${listings.length} listings.` 
    });
  } catch (error) {
    console.error("Bulk Reset Listings Error:", error);
    res.status(500).json({ success: false, error: "Failed to reset listings" });
  }
});

export const debugRouter = router;