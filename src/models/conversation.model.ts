import mongoose from '../clients/db';

interface IConversation {
  participants: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const conversationSchema = new mongoose.Schema<IConversation>({
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const conversationModel: mongoose.Model<IConversation> =
  mongoose.models && mongoose.models.Conversation
    ? (mongoose.models.Conversation as mongoose.Model<IConversation>)
    : mongoose.model<IConversation>('Conversation', conversationSchema);

export default conversationModel;
