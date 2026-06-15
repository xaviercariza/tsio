import type { Response, UserProfile } from '../../types'
import { getUserByNickname } from '../store'

const getUser = async (nickname: string): Promise<Response<UserProfile | null>> => {
  const user = getUserByNickname(nickname)

  if (!user) {
    return { success: false, error: 'User not found', code: 404 }
  }

  return { success: true, data: user }
}

export { getUser }
