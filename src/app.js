const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors') // Import CORS middleware
const authRoutes = require('./routes/authRoutes')

const app = express()

// Middleware
app.use(cors()) // Enable CORS for all routes
app.use(bodyParser.json())

// Routes
app.use('/api/auth', authRoutes)

module.exports = app
