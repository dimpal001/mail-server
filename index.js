const { PrismaClient } = require('@prisma/client')
const checkUser = require('./src/services/checkUser')
const SMTPServer = require('smtp-server').SMTPServer
const fs = require('fs')

const prisma = new PrismaClient()

const pop3Server = new SMTPServer({
  secure: true,
  key: fs.readFileSync('./private.key'),
  cert: fs.readFileSync('./server.crt'),
  authOptional: true,

  onConnect(session, cb) {
    console.log('POP3 Connection established on port 995')
    cb()
  },

  onData(stream, session, cb) {
    console.log('Receiving email on port 995...')
    cb()
  },
})

const smtpServer = new SMTPServer({
  secure: false,
  authOptional: false,
  onAuth(auth, session, callback) {
    if (
      auth.username === 'admin@clothes2wear.com' &&
      auth.password === '123456'
    ) {
      callback(null, { user: auth.username })
    } else {
      callback(new Error('Invalid username or password'))
    }
  },

  onMailFrom(address, session, cb) {
    console.log('SMTP Mail From: ', address.address)
    checkUser(address.address)
      .then((isValid) => {
        if (isValid) {
          session.userEmail = address.address
          cb()
        } else {
          cb(new Error('Invalid user'))
        }
      })
      .catch((err) => {
        console.error('Error during Mail From: ', err)
        cb(new Error('Internal server error'))
      })
  },

  onRcptTo(address, session, cb) {
    console.log('SMTP Recipient: ', address.address)
    cb()
  },

  onData(stream, session, cb) {
    const chunks = []

    stream.on('data', (chunk) => {
      chunks.push(chunk)
    })

    stream.on('end', async () => {
      const message = Buffer.concat(chunks).toString()

      try {
        if (session.userEmail) {
          await prisma.message.create({
            data: {
              email: session.userEmail,
              content: message,
            },
          })
          console.log('Message stored successfully on port 25')
        }
      } catch (err) {
        console.error('Error storing SMTP message: ', err)
      }

      cb()
    })
  },
})

pop3Server.listen(995, () => {
  console.log('POP3 Server is running on port 995')
})

smtpServer.listen(25, () => {
  console.log('SMTP Server is running on port 25')
})
