/**
 * This file contains the root router of your tRPC-backend
 */
import { router, publicProcedure } from '../trpc';
import { postRouter } from './routers/post';
import { userRouter } from './routers/user';
import { conversationRouter } from './routers/conversation';
import { messageRouter } from './routers/message';
import { observable } from '@trpc/server/observable';
import { clearInterval } from 'timers';

export const appRouter = router({
  healthcheck: publicProcedure.query(() => 'yay!'),

  post: postRouter,
  user: userRouter,
  conversation: conversationRouter,
  message: messageRouter,

  randomNumber: publicProcedure.subscription(() => {
    return observable<number>((emit) => {
      const int = setInterval(() => {
        emit.next(Math.random());
      }, 500);
      return () => {
        clearInterval(int);
      };
    });
  }),
});

export type AppRouter = typeof appRouter;
