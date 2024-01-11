import mongoose from 'mongoose';
import { env } from '../env';

const connectionString = env.MONGODB_URI;

if (!mongoose.connection.readyState) {
  mongoose.connect(connectionString);
}

export default mongoose;
