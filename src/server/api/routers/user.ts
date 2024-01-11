import { z } from 'zod';
import userModel from '../../../models/user.model';
import mongoose from '../../../clients/db';

import { router, authedProcedure, publicProcedure } from '../../trpc';

export const userRouter = router({
  search: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ input, ctx }) => {
      const result = await userModel.find({ username: input.username }).exec();
      return result;
    }),
  searchByIds: publicProcedure
    .input(z.array(z.string()))
    .query(async ({ input, ctx }) => {
      console.log(input.map((strId) => new mongoose.Types.ObjectId(strId)));
      const result = await userModel.find({
        _id: { $in: input.map((strId) => new mongoose.Types.ObjectId(strId)) },
      });
      console.log(result);
      return result;
    }),
  getAll: publicProcedure.query(async ({ ctx }) => {
    const result = await userModel.find().exec();
    return result;
  }),
  create: publicProcedure.mutation(async ({ input, ctx }) => {
    await userModel.create({
      username: 'mitgosp',
      email: 'mit.gosp@gmail.com',
      displayName: 'Mitko',
    });
  }),
});
