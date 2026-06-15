import { connectUser as connectMemoryUser } from '../store'

const connectUser = async (userId: string, socketId: string) => {
  connectMemoryUser(userId, socketId)
}

export { connectUser }
