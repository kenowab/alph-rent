import mongoose from 'mongoose'

const favoriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform(doc, ret) {
        ret.id = ret._id.toString()
        ret.propertyId = ret.property
          ? ret.property._id
            ? ret.property._id.toString()
            : ret.property.toString()
          : null
        ret.propertyTitle =
          (ret.property && ret.property.title) || ret.propertyTitle || ''
        delete ret.property
        delete ret.user
        delete ret._id
        delete ret.__v
        return ret
      },
    },
  },
)

favoriteSchema.index({ user: 1, property: 1 }, { unique: true })

const Favorite = mongoose.model('Favorite', favoriteSchema)
export default Favorite
