'use strict'

var opbeat = require('opbeat')({ clientLogLevel: 'warn' })

var url = require('url')
var http = require('http')
var debug = require('debug')('proxy')
var httpProxy = require('http-proxy')

var db = require('mongojs')(process.env.MONGO_URI || 'localhost/http-proxy-cache', ['cache'])

var headerOrder = [
  'host',
  'connection',
  'cache-control',
  'accept',
  'if-none-match',
  'if-modified-since',
  'user-agent',
  'referer',
  'accept-encoding',
  'accept-language',
  'cookie'
]

var removeHeaders = [
  'x-cache-preferred',
  'x-proxy-auth'
]

var password = process.env.PROXY_AUTH

var sortHeaders = function (a, b) {
  a = headerOrder.indexOf(a)
  b = headerOrder.indexOf(b)
  if (a === -1) a = Infinity
  if (b === -1) b = Infinity
  if (a > b) return 1
  if (a < b) return -1
  return 0
}

var upcaseFirstLetter = function (word) {
  return word[0].toUpperCase() + word.slice(1)
}

var camelCaseHeader = function (header) {
  return header.split('-').map(upcaseFirstLetter).join('-')
}

var proxy = httpProxy.createProxyServer({
  agent: new http.Agent({ maxSockets: Infinity })
})

proxy.on('proxyReq', function (proxyReq, req, res, options) {
  debug('event: proxyReq')
  Object.keys(req.headers).sort(sortHeaders).forEach(function (key) {
    proxyReq.removeHeader(key)
    if (~removeHeaders.indexOf(key)) return debug('removing', key)
    var header = camelCaseHeader(key)
    debug('converting header %s to %s', key, header)
    proxyReq.setHeader(header, req.headers[key])
  })
})

proxy.on('proxyRes', function (proxyRes, req, res) {
  debug('event: proxyRes')
  if (proxyRes.statusCode !== 200) return
  var buffers = []
  proxyRes.on('data', function (chunk) {
    buffers.push(chunk)
  })
  proxyRes.on('end', function () {
    var doc = {
      _id: req.url,
      ts: new Date(),
      status: proxyRes.statusCode,
      headers: proxyRes.headers,
      body: Buffer.concat(buffers)
    }
    debug('updating cache for ' + req.url)
    db.cache.update({ _id: req.url }, doc, { upsert: true }, function (err, lastErrorObject) {
      if (err) return opbeat.captureError(err)
      if (lastErrorObject.n !== 1) {
        err = new Error('Couldn\'t update cache')
        err.url = req.url
        err.n = lastErrorObject.n
        opbeat.captureError(err)
      }
    })
  })
})

var forwardRequest = function (req, res) {
  console.log('proxy %s %s', req.method, req.url)
  var result = url.parse(req.url)
  var target = result.protocol + '//' + result.host
  proxy.web(req, res, { target: target })
}

var server = http.createServer(function (req, res) {
  if (password && password !== req.headers['x-proxy-auth']) {
    res.writeHead(401)
    res.end()
    return
  }
  if (req.method === 'GET' && 'x-cache-preferred' in req.headers) {
    db.cache.findOne({ _id: req.url }, function (err, doc) {
      if (err) opbeat.captureError(err)
      if (!doc) return forwardRequest(req, res)
      console.log('cache %s %s', req.method, req.url)
      res.writeHead(doc.status, doc.headers)
      res.end(doc.body.buffer)
    })
  } else {
    forwardRequest(req, res)
  }
})

server.listen(process.env.PORT, function () {
  console.log('Proxy listening on port', server.address().port)
})
