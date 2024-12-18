const { PrismaClient } = require('@prisma/client')
const checkUser = require('./src/services/checkUser')
const SMTPServer = require('smtp-server').SMTPServer
const fs = require('fs')

const prisma = new PrismaClient()

// POP3 Server (Port 995) - Handles Authentication and Email Retrieval
const pop3Server = new SMTPServer({
  secure: true,
  key: fs.readFileSync('./private.key'), // SSL Key
  cert: fs.readFileSync('./server.crt'), // SSL Certificate
  authOptional: false, // Authentication required

  onConnect(session, cb) {
    console.log('POP3 Connection established on port 995')
    cb() // Allow connection
  },

  onAuth(auth, session, callback) {
    // Validate user credentials for POP3
    if (
      auth.username === 'admin@clothes2wear.com' &&
      auth.password === '123456'
    ) {
      console.log('POP3 Authentication successful:', auth.username)
      callback(null, { user: auth.username })
    } else {
      console.log('POP3 Authentication failed for:', auth.username)
      callback(new Error('Invalid username or password'))
    }
  },

  onData(stream, session, cb) {
    console.log('Receiving email on port 995...')
    cb() // Acknowledge email retrieval (no action taken in POP3 mode)
  },
})

// SMTP Server (Port 25) - Handles Sending Emails
const smtpServer = new SMTPServer({
  secure: false, // SMTP does not require SSL on port 25 (STARTTLS can be used if needed)
  authOptional: true, // Allow sending without authentication

  onMailFrom(address, session, cb) {
    console.log('SMTP Mail From:', address.address)

    // Validate sender email
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
        console.error('Error during SMTP Mail From:', err)
        cb(new Error('Internal server error'))
      })
  },

  onRcptTo(address, session, cb) {
    console.log('SMTP Recipient:', address.address)
    cb() // Accept recipient
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
          // Store the email content in the database
          await prisma.message.create({
            data: {
              email: session.userEmail,
              content: message,
            },
          })
          console.log('SMTP Message stored successfully in the database')
        }
      } catch (err) {
        console.error('Error storing SMTP message:', err)
      }

      cb() // Acknowledge email receipt
    })
  },
})

// Start POP3 Server (Port 995)
pop3Server.listen(995, () => {
  console.log('POP3 Server is running on port 995')
})

// Start SMTP Server (Port 25)
smtpServer.listen(25, () => {
  console.log('SMTP Server is running on port 25')
})
