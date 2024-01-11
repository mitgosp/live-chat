import mongoose from '../clients/db';

interface IMessage {
  conversationId: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  content: string;
  timestamp: Date;
  read: Boolean;
}

const messageSchema = new mongoose.Schema<IMessage>({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  read: {
    type: Boolean,
    default: false,
    required: true,
  },
});

const messageModel: mongoose.Model<IMessage> =
  mongoose.models && mongoose.models.Message
    ? (mongoose.models.Message as mongoose.Model<IMessage>)
    : mongoose.model<IMessage>('Message', messageSchema);

export default messageModel;
