const { sendEmail } = require('../services/emailService')

// Send Email
const sendEmailController = async (req, res) => {
  const { sender, recipient, subject, body, userId } = req.body

  if (!sender || !recipient || !subject || !body || !userId) {
    return res.status(400).json({ message: 'All fields are required' })
  }

  try {
    await sendEmail(sender, recipient, subject, body, userId)
    res.status(200).json({ message: 'Email sent successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Error sending email', error })
  }
}

module.exports = { sendEmailController }
