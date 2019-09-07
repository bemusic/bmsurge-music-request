if (process.env.GIT_EMAIL) {
  require('child_process').execSync(`git config user.email ${process.env.GIT_EMAIL}`)
}

const express = require('express');
const basicAuth = require('express-basic-auth')
const app = express();
const algoliasearch = require('algoliasearch')
const algolia = algoliasearch('GDXU17NOOL', process.env.ALGOLIA_ADMIN_API_KEY)
require('longjohn')

const authenticated = basicAuth({
  users: { admin: process.env.ADMIN_PASSWORD },
  challenge: true,
  realm: 'bmsurge-music-request',
})

app.use(require('body-parser').json({ limit: '8mb' }))
app.use(express.static('public'))

app.post('/discord', authenticated, async function(req, res, next) {
  try {
    const index = algolia.initIndex('songs')
    const result = await index.search({ query: req.body.content })
    const hits = result.hits
    const x = 
    console.log(result.hits)
    res.send('meow!')
  } catch (e) {
    next(e)
  }
})

app.put('/songlist', authenticated, async function(req, res, next) {
  try {
    const index = algolia.initIndex('songs')
    const data = req.body.map(s => {
      return {
        md5: s.md5,
        songId: s.songId,
        genre: s.genre,
        title: s.title,
        artist: s.artist,
        event: s.event,
        objectID: s.songId,
      }
    })
    await index.addObjects(data)
    res.send('Indexed ' + data.length + ' items')
  } catch (e) {
    next(e)
  }
})

const listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});