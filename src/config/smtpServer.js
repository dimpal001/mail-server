const { SMTPServer } = require('smtp-server')
const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const server = new SMTPServer({
  name: 'smtp.clothes2wear.com',
  allowInsecureAuth: true,
  authOptional: false,

  onAuth(auth, session, cb) {
    prisma.user
      .findUnique({ where: { email: auth.username } })
      .then(async (user) => {
        if (user && (await bcrypt.compare(auth.password, user.password))) {
          cb(null, { user })
        } else {
          cb(new Error('Invalid credentials'))
        }
      })
      .catch(() => cb(new Error('Database error')))
  },
})

server.listen(25, () => console.log('SMTP Server running on port 25'))

module.exports = server
