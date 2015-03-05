# http-proxy-cache

A caching HTTP forward proxy.

[![Build status](https://travis-ci.org/watson/http-proxy-cache.svg?branch=master)](https://travis-ci.org/watson/http-proxy-cache)

[![js-standard-style](https://raw.githubusercontent.com/feross/standard/master/badge.png)](https://github.com/feross/standard)

**Features:**

- 100% transparent
- Keeps consistent header order similar to Google Chrome (see
  `headerOrder` in index.js)
- Ensures all headers sent to the target is properly cased (e.g.
  `User-Agent` instead of `user-agent`)
- Stores all 200 responses in a MongoDB database
- Forwards all requests to the target by default (i.e. cache not used)
- Prefers the content in the cache if the `X-Cache-Preferred` header is
  present (this header is never sent to the target)
- If environment variable `PROXY_AUTH` is set, the proxy will reject all
  incoming requests that doesn't have a header `X-Proxy-Auth` with the
  same value

## Prerequisites

- MongoDB - Use the environment variable `MONGO_URI` to specify
  connection string (defaults to: `localhost/http-proxy-cache`)
- Optional: [Opbeat](https://opbeat.com) account for error logging
  configured using environment variables

## Installation

```
npm install http-proxy-cache -g
```

## Start

To start the proxy, simply run:

```
http-proxy-cache
```

## Example usage

This is an example app that uses the
[request module](https://github.com/request/request) to perform a HTTP
request via the proxy to [httpbin](http://httpbin.org) which will echo
the HTTP request back as the reponse body:

```js
var request = require('request')

request({
  uri: 'http://httpbin.org/get',
  proxy: 'http://<your-proxy-domain-here>'
}, function (err, res, body) {
  if (err) throw err
  console.log(body)
})
```

## Debug

Set the environment variable `DEBUG=proxy` to enable debug mode.

## License

MIT
