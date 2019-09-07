if (process.env.GIT_EMAIL) {
  require('child_process').execSync(`git config user.email ${process.env.GIT_EMAIL}`)
}

const express = require('express');
const basicAuth = require('express-basic-auth')
const app = express();
require('longjohn');

const authenticated = basicAuth({
  users: { admin: process.env.ADMIN_PASSWORD },
  challenge: true,
  realm: 'bmsurge-music-request',
})

app.use(require('body-parser').json())
app.use(express.static('public'))

app.post('/discord', authenticated, async function(req, res, next) {
  try {
    res.send('meow!')
  } catch (e) {
    next(e)
  }
})
app.put('/songlist', authenticated, async function(req, res, next) {
  try {
    res.send('meow!')
  } catch (e) {
    next(e)
  }
})

const listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});