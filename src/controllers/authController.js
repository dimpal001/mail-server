const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const prism = new PrismaClient()

exports.register = async (req, res) => {
  const { username, email, password } = req.body

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' })
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { username, email, password: hashedPassword },
    })
    res.status(201).json({ message: 'User registered', user })
  } catch (error) {
    res.status(400).json({ error: 'User already exists or invalid data' })
  }
}

exports.login = async (req, res) => {
  const { email, password } = req.body

  try {
    const user = await prisma.user.findUnique({ where: { email } })

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: '1h',
      })
      res.status(200).json({
        message: 'Login successful',
        token,
        user: { id: user.id, username: user.username, email: user.email },
      })
    } else {
      res.status(401).json({ error: 'Invalid credentials' })
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
}
