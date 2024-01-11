/**
 *
 * This is an example router, you can delete this file and then update `../pages/api/trpc/[trpc].tsx`
 */

import { observable } from '@trpc/server/observable';
import { EventEmitter } from 'events';
import { z } from 'zod';
import { authedProcedure, publicProcedure, router } from '../../trpc';
import messageModel from 'models/message.model';
import userModel from 'models/user.model';

interface MyEvents {
  add: (data: typeof messageModel) => void;
  isTypingUpdate: () => void;
}
declare interface MyEventEmitter {
  on<TEv extends keyof MyEvents>(event: TEv, listener: MyEvents[TEv]): this;
  off<TEv extends keyof MyEvents>(event: TEv, listener: MyEvents[TEv]): this;
  once<TEv extends keyof MyEvents>(event: TEv, listener: MyEvents[TEv]): this;
  emit<TEv extends keyof MyEvents>(
    event: TEv,
    ...args: Parameters<MyEvents[TEv]>
  ): boolean;
}

class MyEventEmitter extends EventEmitter {}

// In a real app, you'd probably use Redis or something
const ee = new MyEventEmitter();

// who is currently typing, key is `name`
const currentlyTyping: Record<string, { lastTyped: Date }> =
  Object.create(null);

// every 1s, clear old "isTyping"
const interval = setInterval(() => {
  let updated = false;
  const now = Date.now();
  for (const [key, value] of Object.entries(currentlyTyping)) {
    if (now - value.lastTyped.getTime() > 3e3) {
      delete currentlyTyping[key];
      updated = true;
    }
  }
  if (updated) {
    ee.emit('isTypingUpdate');
  }
}, 3e3);
process.on('SIGTERM', () => {
  clearInterval(interval);
});

export const postRouter = router({
  add: authedProcedure
    .input(
      z.object({
        id: z.string().uuid().optional(),
        text: z.string().min(1),
        conversationId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { name } = ctx.user;
      const result = await userModel.findOne({ username: name }).exec();
      const post = await messageModel.create({
        sender: result?._id,
        conversationId: input.conversationId,
        content: input.text,
      });

      ee.emit('add', post);
      delete currentlyTyping[name];
      ee.emit('isTypingUpdate');
      return post;
    }),

  isTyping: authedProcedure
    .input(z.object({ typing: z.boolean() }))
    .mutation(({ input, ctx }) => {
      const { name } = ctx.user;
      if (!input.typing) {
        delete currentlyTyping[name];
      } else {
        currentlyTyping[name] = {
          lastTyped: new Date(),
        };
      }
      ee.emit('isTypingUpdate');
    }),

  infinite: publicProcedure
    .input(
      z.object({
        cursor: z.date().nullish(),
        take: z.number().min(1).max(50).nullish(),
        activeConversation: z.string().min(1),
      }),
    )
    .query(async ({ input }) => {
      const take = input.take ?? 10;

      const items = await messageModel
        .find({ conversationId: input.activeConversation })
        .sort({ timeStamp: 'asc' })
        .limit(take + 1);

      return {
        items,
      };
    }),

  onAdd: publicProcedure.subscription(() => {
    return observable((emit) => {
      const onAdd = (data: typeof messageModel) => {
        emit.next(data);
      };
      ee.on('add', onAdd);
      return () => {
        ee.off('add', onAdd);
      };
    });
  }),

  whoIsTyping: publicProcedure.subscription(() => {
    let prev: string[] | null = null;
    return observable<string[]>((emit) => {
      const onIsTypingUpdate = () => {
        const newData = Object.keys(currentlyTyping);

        if (!prev || prev.toString() !== newData.toString()) {
          emit.next(newData);
        }
        prev = newData;
      };
      ee.on('isTypingUpdate', onIsTypingUpdate);
      return () => {
        ee.off('isTypingUpdate', onIsTypingUpdate);
      };
    });
  }),
});
