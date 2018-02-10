#! /usr/bin/env node

const FeedParser = require('feedparser')
const request = require('request')
const minimist = require('minimist')
const fs = require('fs-extra')
const h2p = require('html2plaintext')
const oembetter = require('oembetter')()
const slug = require('slug')
const path = require('path')
const util = require('util')
const YAML = require('yamljs')

const argv = minimist(process.argv.slice(2), {
  default: {
    'image': 'image',
    'title': 'title',
    'description': 'description',
    'layout': 'post',
    'output-dir': '_posts'
  }
})

const getPosts = (url) => {
  return new Promise((resolve, reject) => {
    const req = request(argv._[0])
    const feedparser = new FeedParser()
    const posts = []

    req.on('error', (err) => reject(err))
    feedparser.on('error', (err) => reject(err))

    req.on('response', function (res) {
      if (res.statusCode !== 200) {
        this.emit('error', new Error('Bad status code: ' + res.statusCode))
      } else {
        this.pipe(feedparser)
      }
    })

    feedparser.on('readable', function () {
      let item
      while ((item = this.read()) !== null) {
        posts.push(item)
      }
      resolve(posts)
    })
  })
}

const padZeros = (z, n) => {
  const nZ = z - (n + '').length
  let str = ''
  for (let i = 0; i < nZ; i++) {
    str += '0'
  }
  str += n
  return str
}

const makeFilename = (dateStr, title) => {
  const date = new Date(Date.parse(dateStr))
  const dateParts = [
    date.getFullYear(),
    padZeros(2, date.getMonth() + 1),
    padZeros(2, date.getDate())
  ]
  return path.join(argv['output-dir'], dateParts.join('-') + '-' + slug(title).toLowerCase() + '.html')
}

const mapPosts = (posts) => {
  return Promise.all(
    posts.map((post) => {
      return util.promisify(oembetter.fetch)(post.link)
        .then(result => {
          const title = result.author_name + ': ' + post.title
          const object = {
            frontmatter: {
              layout: argv.layout
            },
            content: result.html,
            filename: makeFilename(post.pubdate, title)
          }

          object.frontmatter[argv.title] = title

          const description = h2p(post.description)
          if (description) {
            object.frontmatter[argv.description] = description
          }

          const matches = /src="(.*)"/g.exec(post.description)
          if (matches.length === 2) {
            object.frontmatter[argv.image] = matches[1].replace('http:', 'https:')
          }

          return object
        })
    })
  )
}

const outputPosts = (posts) => {
  return Promise.all(
    posts.map((post) => {
      const str = '---\n' + YAML.stringify(post.frontmatter) + '---\n' + post.content
      return fs.writeFile(post.filename, str)
    })
  )
}

if (argv._.length > 0) {
  getPosts(argv._[0])
    .then((posts) => mapPosts(posts))
    .then((posts) => outputPosts(posts))
    .then(() => console.log('Done'))
    .catch((err) => {
      console.error(err)
      process.exit(-1)
    })
} else {
  console.error('Please provide the RSS feed URL')
}
