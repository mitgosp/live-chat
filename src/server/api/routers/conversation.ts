import { z } from 'zod';
import conversationModel from 'models/conversation.model';

import { router, authedProcedure, publicProcedure } from '../../trpc';
import userModel from 'models/user.model';

export const conversationRouter = router({
  create: authedProcedure
    .input(z.array(z.string()))
    .mutation(async ({ input, ctx }) => {
      const userName = ctx.user.name;
      const user = await userModel.findOne({ username: userName }).exec();
      if (!user?._id) {
        throw new Error('Could not retrieve active user');
      }
      const result = await conversationModel.create({
        participants: [...new Set([...input, user._id])],
      });

      return result;
    }),
  getAll: authedProcedure.query(async ({ ctx }) => {
    const userName = ctx.user.name;
    const user = await userModel.findOne({ username: userName }).exec();
    const result = await conversationModel
      .find({ participants: { $in: user?._id } })
      .exec();
    return result;
  }),
});
