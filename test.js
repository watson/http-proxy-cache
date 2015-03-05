'use strict'

var http = require('http')
var request = require('request')
var afterAll = require('after-all')
var test = require('tape')

require('./')

var count

request = request.defaults({
  proxy: 'http://localhost:' + process.env.PORT,
  pool: { maxSockets: Infinity }
})

var server = http.createServer(function (req, res) {
  setTimeout(function () {
    count++
    res.end()
  }, 500)
}).listen(function () {
  var target = 'http://localhost:' + server.address().port

  test('single connection', function (t) {
    count = 0
    request(target, function (err, res, body) {
      t.error(err)
      t.equal(count, 1)
      t.end()
    })
  })

  test('multiple non-blocking connections', function (t) {
    count = 0
    var total = 200
    var start = Date.now()
    var next = afterAll(function (err) {
      var runtime = Date.now() - start
      t.error(err)
      t.equal(count, total)
      t.ok(runtime < 2000, 'run time (' + runtime + ') should be below ' + 2000)
      t.end()
    })
    for (var n = 1; n <= total; n++) request(target + '/' + n, next())
  })

  test('end', function (t) {
    t.end()
    process.exit()
  })
})
