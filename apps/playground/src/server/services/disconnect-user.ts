import { disconnectUser as disconnectMemoryUser } from '../store'

const disconnectUser = async (userId: string) => {
  disconnectMemoryUser(userId)
}

export { disconnectUser }
