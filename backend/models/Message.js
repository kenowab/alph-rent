import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    recipientName: {
      type: String,
      default: '',
      trim: true,
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      default: null,
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    read: {
      type: Boolean,
      default: false,
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
        ret.senderId = idOf(ret.sender)
        ret.senderName = (ret.sender && ret.sender.name) || ret.senderName || ''
        ret.recipientId = idOf(ret.recipient)
        ret.recipientName =
          (ret.recipient && ret.recipient.name) || ret.recipientName || ''
        ret.propertyId = idOf(ret.property)
        ret.propertyTitle = (ret.property && ret.property.title) || ret.propertyTitle || ''
        delete ret.sender
        delete ret.recipient
        delete ret.property
        delete ret._id
        delete ret.__v
        return ret
      },
    },
  },
)

const Message = mongoose.model('Message', messageSchema)
export default Message
