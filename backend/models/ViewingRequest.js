import mongoose from 'mongoose'

const viewingRequestSchema = new mongoose.Schema(
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
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Please provide a phone number'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    requestedDate: {
      type: String,
      required: [true, 'Please select a preferred viewing date'],
      trim: true,
    },
    requestedTime: {
      type: String,
      required: [true, 'Please select a preferred viewing time'],
      trim: true,
    },
    message: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
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
        ret.tenantId = idOf(ret.tenant)
        ret.ownerId = idOf(ret.owner)
        delete ret._id
        delete ret.__v
        return ret
      },
    },
  },
)

const ViewingRequest = mongoose.model('ViewingRequest', viewingRequestSchema)
export default ViewingRequest
