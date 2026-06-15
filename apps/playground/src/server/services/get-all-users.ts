import type { Response, UserProfile } from '../../types'
import { getAllUsers } from '../store'

const getAllUser = async (filterByNickname?: string): Promise<Response<UserProfile[]>> => {
  return { success: true, data: getAllUsers(filterByNickname) }
}

export { getAllUser }
