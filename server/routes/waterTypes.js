import express from 'express'
import WaterType from '../models/WaterType.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// @desc    Get all water types
// @route   GET /api/water-types
// @access  Public
router.get('/', asyncHandler(async (req, res) => {
  const waterTypes = await WaterType.find().lean()
  res.status(200).json({ success: true, waterTypes })
}))

export default router
