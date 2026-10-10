import mongoose from 'mongoose'

const propertySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a property title'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a property description'],
      trim: true,
      minlength: [20, 'Description must be at least 20 characters'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    category: {
      type: String,
      enum: ['house', 'apartment', 'villa', 'office', 'land', 'studio', 'shop', 'warehouse', 'room', 'commercial'],
      required: [true, 'Please provide a property category'],
      index: true,
    },
    city: {
      type: String,
      required: [true, 'Please provide a city'],
      trim: true,
      index: true,
    },
    subArea: {
      type: String,
      required: [true, 'Please provide a sub-area / district'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Please provide a street address'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Please provide a monthly price'],
      min: [0, 'Price cannot be negative'],
    },
    bedrooms: {
      type: Number,
      default: 0,
      min: [0, 'Bedrooms cannot be negative'],
    },
    bathrooms: {
      type: Number,
      default: 1,
      min: [0, 'Bathrooms cannot be negative'],
    },
    area: {
      type: Number,
      default: null,
      min: [0, 'Area cannot be negative'],
    },
    furnished: { type: Boolean, default: false },
    parking: { type: Boolean, default: false },
    security: { type: Boolean, default: false },
    waterTank: { type: Boolean, default: false },
    elevator: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['available', 'pending', 'rented', 'unavailable'],
      default: 'available',
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    rejectionReason: {
      type: String,
      default: '',
      trim: true,
      maxlength: [1000, 'Rejection reason cannot exceed 1000 characters'],
    },
    images: {
      type: [String],
      default: [],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    ownerName: { type: String, default: '', trim: true },
    ownerPhone: { type: String, default: '', trim: true },
    ownerEmail: { type: String, default: '', trim: true },
    ownerVerified: { type: Boolean, default: false },
    ownerResponseRate: { type: Number, default: 90 },
    ownerJoinedAt: { type: Date, default: null },
    postedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform(doc, ret) {
        ret.id = ret._id.toString()
        if (ret.owner && ret.owner._id) {
          ret.owner = {
            id: ret.owner._id.toString(),
            name: ret.ownerName || ret.owner.name || '',
            phone: ret.ownerPhone || ret.owner.phone || '',
            email: ret.ownerEmail || ret.owner.email || '',
            verified: ret.ownerVerified,
            responseRate: ret.ownerResponseRate,
            joinedAt: ret.ownerJoinedAt,
          }
        } else {
          ret.owner = {
            id: ret.owner ? ret.owner.toString() : null,
            name: ret.ownerName || '',
            phone: ret.ownerPhone || '',
            email: ret.ownerEmail || '',
            verified: ret.ownerVerified,
            responseRate: ret.ownerResponseRate,
            joinedAt: ret.ownerJoinedAt,
          }
        }
        delete ret.ownerName
        delete ret.ownerPhone
        delete ret.ownerEmail
        delete ret.ownerVerified
        delete ret.ownerResponseRate
        delete ret.ownerJoinedAt
        delete ret._id
        delete ret.__v
        return ret
      },
    },
  },
)

propertySchema.index({ title: 'text', description: 'text', subArea: 'text', address: 'text' })

const Property = mongoose.model('Property', propertySchema)
export default Property
