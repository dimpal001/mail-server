import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const checkUser = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } })

  if (user) {
    console.log('User found')
    return true
  } else {
    console.log('User not found')
    return false
  }
}

export default checkUser
