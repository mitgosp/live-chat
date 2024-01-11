import { api } from '../utils/trpc';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { signOut, useSession } from 'next-auth/react';
import Head from 'next/head';
import { useCallback, useEffect, useState } from 'react';
import mongoose from 'mongoose';
import { MultiSelect } from 'primereact/multiselect';
import InputTextField from '../components/InputTextField';
import 'primeicons/primeicons.css';
import 'primereact/resources/themes/saga-blue/theme.css';
import 'primereact/resources/primereact.css';

export default function IndexPage() {
  const { data: session } = useSession();
  const userName = session?.user?.name;
  const { data: allUsers } = api.user.getAll.useQuery();
  const [selectedUsers, setSelectedUsers] = useState([]);
  const { data: allConversations, refetch } =
    api.conversation.getAll.useQuery();
  const [activeConversation, setActiveConversation] =
    useState<mongoose.Types.ObjectId>();
  const mutateConversation = api.conversation.create.useMutation();

  const userIdsInConversations = [
    ...new Set(
      allConversations
        ?.map((conversation) => conversation.participants)
        .flat()
        .map((userId) => userId.toString()),
    ),
  ];
  const { data: participantUsers } = api.user.searchByIds.useQuery(
    userIdsInConversations,
  );

  const createConversation = async () => {
    await mutateConversation.mutateAsync(selectedUsers);
    refetch();
  };
  // We are checking if activeConversation is at least 1 letter
  const postsQuery = api.post.infinite.useInfiniteQuery({
    activeConversation: activeConversation?.toString() || '',
    take: 10,
  });
  const utils = api.useUtils();

  const [messages, setMessages] = useState(() => {
    const msgs = postsQuery.data?.pages.map((page) => page.items).flat();
    return msgs;
  });
  type Message = NonNullable<typeof messages>[number];

  const addMessages = useCallback((incoming?: Message[]) => {
    setMessages((current) => {
      return [...(current || []), ...(incoming || [])];
    });
  }, []);

  useEffect(() => {
    refetch();
    const msgs = postsQuery.data?.pages.map((page) => page.items).flat();
    setMessages(msgs);
  }, [postsQuery.data?.pages, addMessages]);

  api.post.onAdd.useSubscription(undefined, {
    onData(post: Message) {
      addMessages([post]);
    },
    onError(err) {
      console.error('Subscription error:', err);
      // we might have missed a message - invalidate cache
      utils.post.infinite.invalidate();
    },
  });

  const [currentlyTyping, setCurrentlyTyping] = useState<string[]>([]);
  api.post.whoIsTyping.useSubscription(undefined, {
    onData(data) {
      setCurrentlyTyping(data);
    },
  });

  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex h-screen flex-col md:flex-row">
        <section className="flex w-full flex-col bg-gray-800 md:w-72">
          <div className="flex-1 overflow-y-hidden">
            <div className="flex h-full flex-col divide-y divide-gray-700">
              <div className="hidden flex-1 space-y-6 overflow-y-auto p-4 text-gray-400 md:block">
                {userName && (
                  <div>
                    <h2 className="text-lg text-gray-200">User information</h2>
                    <ul className="space-y-2">
                      <li className="text-lg">
                        You are{' '}
                        <input
                          id="name"
                          name="name"
                          type="text"
                          disabled
                          className="bg-transparent"
                          value={userName}
                        />
                      </li>
                      <li>
                        <button onClick={() => signOut()}>Sign Out</button>
                      </li>
                    </ul>
                    <h2 className="mb-4 text-xl font-semibold">
                      Conversations
                    </h2>
                    <div className="mb-4 flex">
                      <MultiSelect
                        value={selectedUsers}
                        onChange={(e) => setSelectedUsers(e.value)}
                        options={allUsers}
                        optionLabel="displayName"
                        optionValue="_id"
                        placeholder="Select User"
                        maxSelectedLabels={3}
                        className="md:w-20rem w-full bg-gray-100"
                      />
                      <button
                        onClick={createConversation}
                        className="ml-4 rounded bg-indigo-500 p-3 text-white"
                      >
                        Message
                      </button>
                    </div>
                    {allConversations && (
                      <ul>
                        {allConversations?.map((conversation, outerIndex) => (
                          <li
                            className={
                              conversation?._id === activeConversation
                                ? 'cursor-pointer rounded border-y bg-gray-900 p-3 hover:bg-gray-700'
                                : 'cursor-pointer rounded border-y p-3 hover:bg-gray-700'
                            }
                            key={outerIndex}
                            onClick={() =>
                              setActiveConversation(conversation._id)
                            }
                          >
                            <div>
                              {conversation?.participants?.map(
                                (participant, innerIndex) => (
                                  <span className="ml-2" key={innerIndex}>
                                    {
                                      participantUsers?.find(
                                        (user) => user._id === participant,
                                      )?.displayName
                                    }
                                  </span>
                                ),
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
        <div className="flex-1 overflow-y-hidden md:h-screen">
          <section className="flex h-full flex-col justify-end space-y-4 bg-gray-700 p-4">
            <div className="space-y-4 overflow-y-auto">
              <div className="space-y-4">
                {messages?.map((item) => (
                  <div key={item.id} className=" text-gray-50">
                    <header className="flex space-x-2 text-sm">
                      <h3 className="text-base">
                        {item.sender
                          ? participantUsers?.find(
                              (user) => user._id === item.sender,
                            )?.displayName
                          : ''}
                      </h3>
                      <span className="text-gray-500">
                        {new Intl.DateTimeFormat('en-GB', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        }).format(new Date(item.timestamp))}
                      </span>
                    </header>
                    <p className="whitespace-pre-line text-xl leading-tight">
                      {item.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-full">
              <InputTextField
                conversationId={activeConversation?.toString() || ''}
              />
              <p className="h-2 italic text-gray-400">
                {currentlyTyping.length
                  ? `${currentlyTyping.join(', ')} typing...`
                  : ''}
              </p>
            </div>

            {process.env.NODE_ENV !== 'production' && (
              <div className="hidden md:block">
                <ReactQueryDevtools initialIsOpen={false} />
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
