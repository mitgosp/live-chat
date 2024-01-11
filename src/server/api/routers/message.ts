// This is no longer used in favor of the post router which uses subscribptions

import { z } from 'zod';
import messageModel from '../../../models/message.model';
import mongoose from 'mongoose';

import { router, authedProcedure } from '../../trpc';
import userModel from 'models/user.model';

export const messageRouter = router({
  create: authedProcedure
    .input(
      z.object({
        sender: z.string().refine((val) => {
          return mongoose.Types.ObjectId.isValid(val);
        }),
        conversation: z.custom<mongoose.Types.ObjectId>(),
        content: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userName = ctx.user.name;
      const user = await userModel.findOne({ username: userName }).exec();
      if (!user?._id) {
        throw new Error('Could not retrieve sender');
      }
      const result = await messageModel.create({
        sender: user._id,
        conversationId: input.conversation,
        content: input.content,
      });

      return result;
    }),
  getMessagesConversation: authedProcedure
    .input(
      z.object({
        conversation: z.string().refine((val) => {
          return mongoose.Types.ObjectId.isValid(val);
        }),
      }),
    )
    .query(async () => {
      const result = await messageModel.find().exec();
      return result;
    }),
});
