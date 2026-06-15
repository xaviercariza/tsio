import type { Group, Response } from '../../types'
import { getGroupsForUser, getUserById } from '../store'

const getChats = async (userId: string): Promise<Response<Group[] | null>> => {
  const user = getUserById(userId)

  if (!user) {
    return { success: false, error: 'User not found', code: 404 }
  }

  return { success: true, data: getGroupsForUser(userId) }
}

export { getChats }
