# chat-app

This project aims to create a live chat application.

The project with the following three commands

```
npm run dev-next
npm run dev-wss
docker-compose up -d
```

This starts the websockets server as well as the next project.

Mongodb is run using docker-compose and its volume has been included, so that several preinserted users can be used directly for testing.
There are four users populated, and you need to enter one of their usernames to be allowed to sign in: mitko, david, peter, cambell.

The must have features have been implemented, in addition to the first should have one.

# Requirements

## Must have

- Login (basic login so different users can quickly be tested)
- Basic Chat functionality
- Be able to select different users which you can message
- Be able to be in a conversation with any number of people
- Show latest 10 messages with a user (For performance considerations we want to load only the latest 10 messages with a given user and be able to load older ones)

## Should have

- Implement web sockets ( Real time chats should be using web sockets, so that reuses the same connection so less resources are utilized and there is less latency )
- Be able to load older messages (we can consider archiving really old messages in s3 buckets in the future)
- Be able to see if the message has been read
- Indication of user presence

## Could have

- Be able to see if the message has been sent
- Push notifications to alert users about new messages or mentions.
- Search functionality to find specific messages
- Support for multiple platforms

## Nice to have

- Upload a photo to your avatar
- Support for emojis and reactions to messages
- Ability to edit or delete sent messages.
- End-to-end encryption for enhanced security
- Usage analytics to understand user behavior

## Known issues

- Cannot view more than 10 results
- When opening the dropdown, the checkboxes are not visible

# Notes

Do we only want functionality where a user can send a message to only one other user or do we want to be able to create group chats? (The implementation here allows to select however many users you want including just yourself to create a new conversation)

Mongodb documents:
Use capped collection to say 1 year and research an automated mechanism to store older messages to s3 glacier buckets (if we do not want to lose any data)

For speed, I have used mongodb id for selecting a user as it's guaranteed to be unique. To not expose it to users, could create a public id with nanoid - shorter than uuid or enforce username to be unique.

Discuss Distributed System for a large chat application
