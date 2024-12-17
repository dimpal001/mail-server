const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Register User
const registerUser = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' })
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists' })
  }

  // Hash the password before saving
  const hashedPassword = await bcrypt.hash(password, 10)

  // Create new user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
    },
  })

  res.status(201).json({ message: 'User registered successfully', user })
}

// Login User
const loginUser = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' })
  }

  // Find user by email
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return res.status(400).json({ message: 'Invalid email or password' })
  }

  // Compare the hashed password with the one provided
  const isPasswordValid = await bcrypt.compare(password, user.password)
  if (!isPasswordValid) {
    return res.status(400).json({ message: 'Invalid email or password' })
  }

  res.status(200).json({ message: 'Login successful', user })
}

module.exports = { registerUser, loginUser }
