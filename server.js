if (process.env.GIT_EMAIL) {
  require('child_process').execSync(`git config user.email ${process.env.GIT_EMAIL}`)
}

const express = require('express');
const basicAuth = require('express-basic-auth')
const app = express();
const algoliasearch = require('algoliasearch')
const algolia = algoliasearch('GDXU17NOOL', process.env.ALGOLIA_ADMIN_API_KEY)
const axios = require('axios')
require('longjohn')

const authenticated = basicAuth({
  users: { admin: process.env.ADMIN_PASSWORD },
  challenge: true,
  realm: 'bmsurge-music-request',
})

app.use(require('body-parser').json({ limit: '8mb' }))
app.use(express.static('public'))

const logAnalytics = event => {
  return axios.get(`https://api.amplitude.com/httpapi`, {
    params: {
      api_key: process.env.AMPLITUDE_API_KEY,
      event: JSON.stringify(event)
    }
  })
}

const poweredByAlgolia = ` (Search powered by Algolia)`
app.post('/discord', authenticated, async function(req, res, next) {
  try {
    const userId = 'discord_' + req.body.userId
    if (req.body.content === '!login') {
      const response = await axios.post(`${process.env.DJ_URL}/token`, {
        userId: userId,
        username: req.body.username,
      })
      res.send(`Paste this token in https://bmsurge-music-request.glitch.me (this token expires in 1 hour):\n\`\`\`${response.data.token}\`\`\``)
      logAnalytics({
        user_id: userId,
        event_type: 'Get login token',
        event_properties: {
        }
      })
      return
    }
    const index = algolia.initIndex('songs')
    const query = req.body.content
    const result = await index.search({ query, hitsPerPage: 1000 })
    const hits = result.hits
    if (!hits.length) {
      logAnalytics({
        user_id: userId,
        event_type: 'Request miss',
        event_properties: { query }
      })
      res.send(
        `Did not find any song matching your query, sorry...` + poweredByAlgolia
      )
      return
    }
    const random = Math.floor(Math.pow(Math.random(), 2) * hits.length)
    const song = hits[random]
    try {
      const response = await axios.post(`${process.env.DJ_URL}/requests`, {
        userId: userId,
        username: req.body.username,
        songId: song.songId,
        content: req.body.content
      })
      logAnalytics({
        user_id: userId,
        event_type: 'Request hit',
        event_properties: {
          query,
          songId: song.songId,
          title: song.title,
          artist: song.artist,
          genre: song.genre,
          event: song.event,
          hits: result.nbHits,
        }
      })
      res.send(`${response.data.text}` + (response.data.queued ? poweredByAlgolia : ''))
    } catch (e) {
      res.send(`Sorry, cannot process your request... ${e}`)
    }
  } catch (e) {
    next(e)
  }
})

app.patch('/songlist', authenticated, async function(req, res, next) {
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