const app = require('./app')
const dotenv = require('dotenv')
const smtpServer = require('./config/smtpServer')

dotenv.config()

const PORT = process.env.PORT || 4000

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
