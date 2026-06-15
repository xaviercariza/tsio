import type { Response, UserProfile } from '../../types'
import { searchUsers } from '../store'

const searchUserChats = async (
  search: string,
  userNickname: string
): Promise<Response<UserProfile[]>> => {
  return { success: true, data: searchUsers(search, userNickname) }
}

export { searchUserChats }
