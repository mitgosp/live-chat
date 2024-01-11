import mongoose from '../clients/db';

interface IUser {
  username: string;
  email: string;
  displayName?: string;
}

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  displayName: {
    type: String,
  },
});

const userModel: mongoose.Model<IUser> =
  mongoose.models && mongoose.models.User
    ? (mongoose.models.User as mongoose.Model<IUser>)
    : mongoose.model<IUser>('User', userSchema);

export default userModel;
