const { PrismaClient } = require('@prisma/client')
const checkUser = require('./src/services/checkUser')

const SMTPServer = require('smtp-server').SMTPServer

const prisma = new PrismaClient()

const server = new SMTPServer({
  allowInsecureAuth: true,
  authOptional: true,

  onConnect(session, cb) {
    console.log('on Connect: ', session.id)
    cb()
  },

  onMailFrom(address, session, cb) {
    console.log('onMailFrom: ', address.address, session.id)

    checkUser(address.address)
      .then((isValid) => {
        if (isValid) {
          session.userEmail = address.address
          cb()
        } else {
          console.log('Invalid user. Rejecting...')
          cb(new Error('Invalid user'))
        }
      })
      .catch((err) => {
        console.error('Error in onMailFrom: ', err)
        cb(new Error('Internal server error'))
      })
  },

  onRcptTo(address, session, cb) {
    console.log('onRcptTo: ', address.address)
    cb()
  },

  onAuth(auth, session, callback) {
    // Validate the email and password
    if (
      auth.username !== 'admin@clothes2wear.com' ||
      auth.password !== '123456'
    ) {
      return callback(new Error('Invalid username or password'))
    }

    // Successful authentication
    callback(null, { user: 123 })
  },

  onData(stream, session, cb) {
    const chunks = []

    stream.on('data', (chunk) => {
      chunks.push(chunk)
    })

    stream.on('end', async () => {
      const message = Buffer.concat(chunks).toString()

      try {
        // Store the message in the database
        if (session.userEmail) {
          await prisma.message.create({
            data: {
              email: session.userEmail,
              content: message,
            },
          })
          console.log('Message stored successfully')
        } else {
          console.log('Session user email is missing')
        }
      } catch (err) {
        console.error('Error storing message: ', err)
      }

      cb() // Acknowledge data receipt
    })
  },
})

server.listen(995, () => {
  console.log('Server is running on port 995')
})
