const jwt = require('jsonwebtoken')
const conf = require('../conf-backend')

const isShibboUser = (userId, req) => userId === req.headers['eduPersonPrincipalName'].split('@')[0]

module.exports.checkAuth = async (req, res, next) => {
  const token = req.headers['x-access-token']
  if (token) {
    await jwt.verify(token, conf.TOKEN_SECRET, (err, decoded) => {
      if (!err && isShibboUser(decoded.userId, req)) {
        req.decodedToken = decoded // everything is good, save to request for use in other routes
        next()
      }
      res.status(403).end()
    })
  } else {
    res.status(403).end()
  }
}
