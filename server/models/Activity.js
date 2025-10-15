import mongoose from 'mongoose'

const activitySchema = new mongoose.Schema({
  stravaId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  userGoogleId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  sportType: {
    type: String,
    required: true,
    index: true
  },
  startDate: {
    type: Date,
    required: true,
    index: true
  },
  distance: {
    type: Number,
    required: true,
    min: 0
  },
  movingTime: {
    type: Number,
    required: true,
    min: 0
  },
  totalElevationGain: {
    type: Number,
    default: 0,
    min: 0
  },
  averageSpeed: {
    type: Number,
    default: 0,
    min: 0
  },
  maxSpeed: {
    type: Number,
    default: 0,
    min: 0
  },
  location: {
    startLatLng: {
      type: [Number],
      validate: {
        validator: function(v) {
          return !v || (v.length === 2 && v[0] >= -90 && v[0] <= 90 && v[1] >= -180 && v[1] <= 180)
        },
        message: 'Invalid coordinates format'
      }
    },
    endLatLng: {
      type: [Number],
      validate: {
        validator: function(v) {
          return !v || (v.length === 2 && v[0] >= -90 && v[0] <= 90 && v[1] >= -180 && v[1] <= 180)
        },
        message: 'Invalid coordinates format'
      }
    },
    city: String,
    state: String,
    country: String
  },
  gear: {
    kayakType: {
      type: String,
      enum: ['recreational', 'touring', 'whitewater', 'sea-kayak', 'canoe', 'sup', 'other']
    },
    paddleType: {
      type: String,
      enum: ['single-blade', 'double-blade', 'adjustable', 'fixed', 'other']
    },
    equipment: [String]
  },
  weather: {
    temperature: {
      type: Number,
      min: -50,
      max: 50
    },
    windSpeed: {
      type: Number,
      min: 0,
      max: 200
    },
    waterConditions: {
      type: String,
      enum: ['calm', 'choppy', 'rough', 'rapids-class-1', 'rapids-class-2', 'rapids-class-3', 'rapids-class-4', 'rapids-class-5']
    }
  },
  notes: {
    type: String,
    maxlength: 2000
  },
  photos: [String],
  isPublic: {
    type: Boolean,
    default: false
  },
  stravaData: {
    // Store additional Strava data that might be useful
    polyline: String,
    summaryPolyline: String,
    mapId: String,
    timezone: String,
    startDateLocal: Date,
    utcOffset: Number
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Compound indexes for performance
activitySchema.index({ userGoogleId: 1, startDate: -1 })
activitySchema.index({ sportType: 1, startDate: -1 })
activitySchema.index({ 'location.city': 1, 'location.state': 1 })
activitySchema.index({ isPublic: 1, startDate: -1 })

// Virtual for formatted duration
activitySchema.virtual('formattedDuration').get(function() {
  const hours = Math.floor(this.movingTime / 3600)
  const minutes = Math.floor((this.movingTime % 3600) / 60)
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
})

// Virtual for formatted distance
activitySchema.virtual('formattedDistance').get(function() {
  const km = this.distance / 1000
  return `${km.toFixed(2)} km`
})

// Virtual for formatted speed
activitySchema.virtual('formattedAverageSpeed').get(function() {
  const kmh = this.averageSpeed * 3.6
  return `${kmh.toFixed(1)} km/h`
})

// Static method to get paddle activities
activitySchema.statics.getPaddleActivities = function(query = {}) {
  const paddleSportTypes = [
    'Kayaking', 'Canoeing', 'Stand up paddleboarding', 'Paddling', 'SUP'
  ]
  
  return this.find({
    ...query,
    $or: [
      { sportType: { $in: paddleSportTypes } },
      { type: { $in: paddleSportTypes } },
      { name: { $regex: /(kayak|canoe|paddle|sup)/i } }
    ]
  })
}

export default mongoose.model('Activity', activitySchema)