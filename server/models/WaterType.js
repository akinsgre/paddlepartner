import mongoose from 'mongoose'

const waterTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['whitewater', 'moving water', 'flat water', 'erg']
  },
  description: String
})

export default mongoose.model('WaterType', waterTypeSchema)
