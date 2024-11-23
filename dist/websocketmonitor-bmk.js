// For bookmarklet ++

bookmarklet.config = {
  packages: {
    eruda: {
      url: "https://cdn.jsdelivr.net/npm/eruda",
      exports: ["eruda"]
    },
    censor: {
      url: "https://cdn.jsdelivr.net/gh/thatrandomperson5/censorjs@4945279/src/censor.js",
      exports: ["censor"]
    },
    objectObserver: {
      url: "https://cdn.gisthostfor.me/thatrandomperson5-lkuPg5hRm9-object-observer.min.js",
      exports: ["Observable"]
    },
    webSocketMonitor: {
      url: "https://cdn.jsdelivr.net/gh/thatrandomperson5/eruda-websocketmonitor@master/src/websocketmonitor.js",
      exports: ["WebSocketMonitor"]
    }
  },
  packageOrder: ["eruda", "censor", "objectObserver", "webSocketMonitor"]
}

bookmarklet.run = (ctx) => {
  var eruda = ctx.packages.eruda.eruda
  var WebSocketMonitor = ctx.packages.webSocketMonitor.WebSocketMonitor
  
  eruda.init()
  eruda.add(WebSocketMonitor.add())
}
