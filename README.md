# http-proxy-cache

A caching HTTP forward proxy.

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

## Prerequisites

- MongoDB (use the environment variable `MONGO_URI` to specify
  connection string - defaults to: `localhost/http-proxy-cache`)
- Optional: [Opbeat](https://opbeat.com) account for error logging
  configured using environment variables

## Installation

To setup a simple http-proxy-cache on Heroku just click this button:

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

Alternatively, to install locally just run:

```
npm install http-proxy-cache -g
```

And then start the proxy using the command `http-proxy-cache`.

## Debug

Set the environment variable `DEBUG=proxy` to enable debug mode.

## License

MIT
