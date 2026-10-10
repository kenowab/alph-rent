import mongoose from 'mongoose'

const rentalAgreementSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RentalRequest',
      default: null,
    },
    monthlyRent: {
      type: Number,
      required: true,
      min: 0,
    },
    startDate: {
      type: String,
      required: true,
      default: () => new Date().toISOString().split('T')[0],
    },
    endDate: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'completed', 'cancelled'],
      default: 'active',
      index: true,
    },
    terms: {
      type: String,
      default: 'Standard AlphaRent Ethiopia lease agreement terms apply. Monthly rent payable by 1st of each month.',
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
        ret.ownerId = idOf(ret.owner)
        ret.tenantId = idOf(ret.tenant)
        delete ret._id
        delete ret.__v
        return ret
      },
    },
  },
)

const RentalAgreement = mongoose.model('RentalAgreement', rentalAgreementSchema)
export default RentalAgreement
