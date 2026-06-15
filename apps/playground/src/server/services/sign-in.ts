import bcrypt from 'bcrypt'
import type { Response, UserProfile } from '../../types'
import { createUser, getUserWithPasswordByNickname } from '../store'

const signIn = async (nickname: string, password: string): Promise<Response<UserProfile>> => {
  const existingUser = getUserWithPasswordByNickname(nickname)

  if (existingUser) {
    const isValidPassword = await bcrypt.compare(password, existingUser.password)
    if (isValidPassword) {
      return {
        success: true,
        data: {
          id: existingUser.id,
          nickname: existingUser.nickname,
        },
      }
    }

    return { success: false, error: 'Invalid password', code: 401 }
  }

  const hashedPassword = await bcrypt.hash(password, 12)
  const user = createUser(nickname, hashedPassword)

  return {
    success: true,
    data: user,
  }
}

export { signIn }
