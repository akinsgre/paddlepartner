import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  picture: String,
  stravaAccessToken: String,
  stravaRefreshToken: String,
  stravaTokenExpiry: Date,
  stravaAthleteId: String,
  preferences: {
    units: {
      type: String,
      enum: ['metric', 'imperial'],
      default: 'metric'
    },
    defaultPrivacy: {
      type: String,
      enum: ['public', 'private'],
      default: 'private'
    },
    notifications: {
      email: { type: Boolean, default: true },
      newActivities: { type: Boolean, default: true },
      weeklyDigest: { type: Boolean, default: true }
    },
    dashboard: {
      showStats: { type: Boolean, default: true },
      showMap: { type: Boolean, default: true },
      showWeather: { type: Boolean, default: false }
    }
  },
  stats: {
    totalActivities: { type: Number, default: 0, min: 0 },
    totalDistance: { type: Number, default: 0, min: 0 },
    totalTime: { type: Number, default: 0, min: 0 },
    longestActivity: { type: Number, default: 0, min: 0 },
    favoriteSportType: String,
    favoriteLocation: String,
    lastSyncDate: Date
  },
  lastLoginAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Indexes (removed duplicates)
userSchema.index({ lastLoginAt: -1 })

// Virtual for formatted total distance
userSchema.virtual('formattedTotalDistance').get(function() {
  const km = this.stats.totalDistance / 1000
  return `${km.toFixed(1)} km`
})

// Virtual for formatted total time
userSchema.virtual('formattedTotalTime').get(function() {
  const hours = Math.floor(this.stats.totalTime / 3600)
  const minutes = Math.floor((this.stats.totalTime % 3600) / 60)
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
})

// Method to update stats
userSchema.methods.updateStats = async function(activities) {
  this.stats.totalActivities = activities.length
  this.stats.totalDistance = activities.reduce((sum, activity) => sum + activity.distance, 0)
  this.stats.totalTime = activities.reduce((sum, activity) => sum + activity.movingTime, 0)
  this.stats.longestActivity = Math.max(...activities.map(activity => activity.distance), 0)
  
  // Calculate favorite sport type
  const sportTypeCounts = activities.reduce((counts, activity) => {
    counts[activity.sportType] = (counts[activity.sportType] || 0) + 1
    return counts
  }, {})
  
  this.stats.favoriteSportType = Object.keys(sportTypeCounts).reduce((a, b) => 
    sportTypeCounts[a] > sportTypeCounts[b] ? a : b, ''
  ) || undefined
  
  this.stats.lastSyncDate = new Date()
  return this.save()
}

export default mongoose.model('User', userSchema)