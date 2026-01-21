import express from 'express';
import * as adminController from '../controllers/adminController.js';

const router = express.Router();

// Public sponsor routes (for frontend display)
router.get('/', adminController.getAllSponsors);
router.get('/:id', adminController.getSponsorById);

export default router;