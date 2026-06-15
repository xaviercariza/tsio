import { randomUUID } from 'node:crypto'
import type { DemoSnapshot, Group, Message, UserProfile } from '../../types'

type StoredUser = UserProfile & {
  password: string
  socketId: string | null
}

type StoredGroup = {
  id: string
  userIds: string[]
  messageIds: string[]
}

const users = new Map<string, StoredUser>()
const usersByNickname = new Map<string, string>()
const groups = new Map<string, StoredGroup>()
const messages = new Map<string, Message>()

const demoUserSeeds: StoredUser[] = [
  {
    id: 'demo-alice',
    nickname: 'Alice',
    password: 'demo',
    socketId: null,
  },
  {
    id: 'demo-bob',
    nickname: 'Bob',
    password: 'demo',
    socketId: null,
  },
]

const demoChatId = 'demo-chat'

function toUserProfile(user: StoredUser): UserProfile {
  return {
    id: user.id,
    nickname: user.nickname,
  }
}

function getStoredUserById(userId: string): StoredUser | null {
  return users.get(userId) ?? null
}

function getStoredUserByNickname(nickname: string): StoredUser | null {
  const userId = usersByNickname.get(nickname)
  return userId ? getStoredUserById(userId) : null
}

function getUserById(userId: string): UserProfile | null {
  const user = getStoredUserById(userId)
  return user ? toUserProfile(user) : null
}

function getUserByNickname(nickname: string): UserProfile | null {
  const user = getStoredUserByNickname(nickname)
  return user ? toUserProfile(user) : null
}

function getUserWithPasswordByNickname(nickname: string): StoredUser | null {
  return getStoredUserByNickname(nickname)
}

function createUser(nickname: string, password: string): UserProfile {
  const user: StoredUser = {
    id: randomUUID(),
    nickname,
    password,
    socketId: null,
  }

  users.set(user.id, user)
  usersByNickname.set(user.nickname, user.id)

  return toUserProfile(user)
}

function upsertUser(user: StoredUser): StoredUser {
  const existingUser = users.get(user.id)
  const nextUser = existingUser ? { ...user, socketId: existingUser.socketId } : user

  users.set(nextUser.id, nextUser)
  usersByNickname.set(nextUser.nickname, nextUser.id)

  return nextUser
}

function getAllUsers(exceptNickname?: string): UserProfile[] {
  return Array.from(users.values())
    .filter(user => user.nickname !== exceptNickname)
    .map(toUserProfile)
}

function searchUsers(search: string, exceptNickname: string): UserProfile[] {
  const normalizedSearch = search.trim().toLowerCase()

  return Array.from(users.values())
    .filter(user => user.nickname !== exceptNickname)
    .filter(user => user.nickname.toLowerCase().includes(normalizedSearch))
    .map(toUserProfile)
}

function connectUser(userId: string, socketId: string): void {
  const user = getStoredUserById(userId)
  if (user) {
    user.socketId = socketId
  }
}

function disconnectUser(userId: string): void {
  const user = getStoredUserById(userId)
  if (user) {
    user.socketId = null
  }
}

function getUserSocketId(userId: string): string | null {
  return getStoredUserById(userId)?.socketId ?? null
}

function findGroupByParticipants(firstUserId: string, secondUserId: string): StoredGroup | null {
  return (
    Array.from(groups.values()).find(
      group => group.userIds.includes(firstUserId) && group.userIds.includes(secondUserId)
    ) ?? null
  )
}

function createGroup(groupId: string, userIds: string[]): StoredGroup {
  const uniqueUserIds = Array.from(new Set(userIds))
  const group: StoredGroup = {
    id: groupId,
    userIds: uniqueUserIds,
    messageIds: [],
  }

  groups.set(group.id, group)

  return group
}

function getOrCreateGroup(groupId: string, userIds: string[]): StoredGroup {
  const [firstUserId, secondUserId] = userIds
  if (firstUserId && secondUserId) {
    const existingGroup = findGroupByParticipants(firstUserId, secondUserId)
    if (existingGroup) {
      return existingGroup
    }
  }

  const existingGroup = groups.get(groupId)
  return existingGroup ?? createGroup(groupId, userIds)
}

function getGroup(groupId: string): Group | null {
  const group = groups.get(groupId)
  if (!group) {
    return null
  }

  const groupUsers: UserProfile[] = []
  for (const userId of group.userIds) {
    const user = getUserById(userId)
    if (user) {
      groupUsers.push(user)
    }
  }

  const groupMessages: Message[] = []
  for (const messageId of group.messageIds) {
    const message = messages.get(messageId)
    if (message) {
      groupMessages.push(message)
    }
  }

  return {
    id: group.id,
    users: groupUsers,
    messages: groupMessages,
  }
}

function getGroupsForUser(userId: string): Group[] {
  const userGroups: Group[] = []

  for (const group of groups.values()) {
    if (!group.userIds.includes(userId)) {
      continue
    }

    const groupSnapshot = getGroup(group.id)
    if (groupSnapshot) {
      userGroups.push(groupSnapshot)
    }
  }

  return userGroups
}

function createMessage(input: {
  groupId: string
  text: string
  senderId: string
  receiverId?: string
}): Group {
  const sender = getStoredUserById(input.senderId)
  let group = groups.get(input.groupId)

  if (!sender) {
    throw new Error('Sender not found')
  }

  if (!group) {
    if (!input.receiverId) {
      throw new Error('Chat not found')
    }

    group = getOrCreateGroup(input.groupId, [input.senderId, input.receiverId])
  }

  if (!group.userIds.includes(input.senderId)) {
    throw new Error('Sender does not belong to this chat')
  }

  const receiverId = input.receiverId ?? group.userIds.find(userId => userId !== input.senderId)
  const receiver = receiverId ? getStoredUserById(receiverId) : null

  if (!receiver) {
    throw new Error('Receiver not found')
  }

  const message: Message = {
    id: randomUUID(),
    text: input.text,
    senderId: input.senderId,
    receiverId: receiver.id,
    sender: toUserProfile(sender),
    receiver: toUserProfile(receiver),
    createdAt: new Date().toISOString(),
  }

  messages.set(message.id, message)
  group.messageIds.push(message.id)

  const groupSnapshot = getGroup(group.id)
  if (!groupSnapshot) {
    throw new Error('Message group not found')
  }

  return groupSnapshot
}

function seedDemoData(): DemoSnapshot {
  for (const user of demoUserSeeds) {
    upsertUser(user)
  }

  const alice = demoUserSeeds[0]
  const bob = demoUserSeeds[1]

  if (!alice || !bob) {
    throw new Error('Demo users could not be created')
  }

  const group = getOrCreateGroup(demoChatId, [alice.id, bob.id])

  if (!group.messageIds.length) {
    createMessage({
      groupId: demoChatId,
      senderId: alice.id,
      text: 'This message came from the seeded in-memory store.',
    })
    createMessage({
      groupId: demoChatId,
      senderId: bob.id,
      text: 'Send a new message to watch the typed action and event flow.',
    })
  }

  const chat = getGroup(demoChatId)
  if (!chat) {
    throw new Error('Demo chat could not be created')
  }

  return {
    users: demoUserSeeds.map(toUserProfile),
    chat,
  }
}

function getDemoSnapshot(): DemoSnapshot {
  return seedDemoData()
}

export {
  connectUser,
  createMessage,
  createUser,
  disconnectUser,
  getAllUsers,
  getDemoSnapshot,
  getGroup,
  getGroupsForUser,
  getUserById,
  getUserByNickname,
  getUserSocketId,
  getUserWithPasswordByNickname,
  searchUsers,
  seedDemoData,
}
