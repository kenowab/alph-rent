import mongoose from 'mongoose'

const rentalRequestSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
      index: true,
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true,
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Please provide a phone number'],
      trim: true,
      maxlength: [30, 'Phone cannot exceed 30 characters'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
    },
    moveInDate: {
      type: String,
      trim: true,
      default: '',
    },
    startDate: {
      type: String,
      trim: true,
      default: '',
    },
    endDate: {
      type: String,
      trim: true,
      default: '',
    },
    occupation: {
      type: String,
      trim: true,
      default: '',
    },
    monthlyIncome: {
      type: String,
      trim: true,
      default: '',
    },
    employmentStatus: {
      type: String,
      trim: true,
      default: '',
    },
    message: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'contacted', 'cancelled'],
      default: 'pending',
      index: true,
    },
    rejectionReason: {
      type: String,
      default: '',
      trim: true,
      maxlength: [1000, 'Rejection reason cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform(doc, ret) {
        const idOf = (ref) =>
          ref
            ? ref._id
              ? ref._id.toString()
              : ref.id
                ? ref.id.toString()
                : String(ref)
            : null
        ret.id = ret._id.toString()
        ret.propertyId = idOf(ret.property)
        ret.propertyTitle = (ret.property && ret.property.title) || ret.propertyTitle || ''
        ret.propertyPrice = ret.property?.price ?? null
        ret.propertySubArea = ret.property?.subArea || ''
        ret.propertyCity = ret.property?.city || ''
        ret.propertyStatus = ret.property?.status || ''
        ret.propertyCategory = ret.property?.category || ''
        ret.propertyImage =
          (ret.property && ret.property.images && ret.property.images[0]) || ''
        ret.userId = idOf(ret.tenant)
        ret.tenantName = ret.tenant?.name || ret.name || ''
        ret.tenantEmail = ret.tenant?.email || ret.email || ''
        ret.tenantPhone = ret.tenant?.phone || ret.phone || ''
        ret.ownerId = idOf(ret.owner)
        ret.ownerName = ret.owner?.name || ''
        ret.ownerEmail = ret.owner?.email || ''
        ret.ownerPhone = ret.owner?.phone || ''
        ret.rejectionReason = ret.rejectionReason || ''
        delete ret.property
        delete ret.tenant
        delete ret.owner
        delete ret._id
        delete ret.__v
        return ret
      },
    },
  },
)

const RentalRequest = mongoose.model('RentalRequest', rentalRequestSchema)
export default RentalRequest
