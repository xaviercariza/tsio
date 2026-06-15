import { randomUUID } from 'node:crypto'
import type { Group, Message, UserProfile } from '../../types'

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
  receiverId: string
}): Group {
  const sender = getStoredUserById(input.senderId)
  const receiver = getStoredUserById(input.receiverId)

  if (!sender || !receiver) {
    throw new Error('Sender or receiver not found')
  }

  const group = getOrCreateGroup(input.groupId, [input.senderId, input.receiverId])
  const message: Message = {
    id: randomUUID(),
    text: input.text,
    senderId: input.senderId,
    receiverId: input.receiverId,
    sender: toUserProfile(sender),
    receiver: toUserProfile(receiver),
    createdAt: new Date(),
  }

  messages.set(message.id, message)
  group.messageIds.push(message.id)

  const groupSnapshot = getGroup(group.id)
  if (!groupSnapshot) {
    throw new Error('Message group not found')
  }

  return groupSnapshot
}

export {
  connectUser,
  createMessage,
  createUser,
  disconnectUser,
  getAllUsers,
  getGroup,
  getGroupsForUser,
  getUserById,
  getUserByNickname,
  getUserSocketId,
  getUserWithPasswordByNickname,
  searchUsers,
}
