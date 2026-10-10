import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['message', 'request', 'viewing', 'agreement', 'property'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [120, 'Notification title cannot exceed 120 characters'],
    },
    body: {
      type: String,
      required: [true, 'Notification body is required'],
      trim: true,
      maxlength: [500, 'Notification body cannot exceed 500 characters'],
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      default: null,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    read: {
      type: Boolean,
      default: false,
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
        ret.propertyTitle = (ret.property && ret.property.title) || ''
        ret.actorId = idOf(ret.actor)
        ret.actorName = (ret.actor && ret.actor.name) || ''
        delete ret.user
        delete ret.property
        delete ret.actor
        delete ret._id
        delete ret.__v
        return ret
      },
    },
  },
)

notificationSchema.index({ user: 1, read: 1 })

const Notification = mongoose.model('Notification', notificationSchema)
export default Notification
