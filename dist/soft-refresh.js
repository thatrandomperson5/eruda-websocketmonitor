// Requires censor.js injection-tooling to run

softRefresh(
  () => {
    eruda.init()
    eruda.add(WebSocketMonitor.add())
  }, {
    resources: [censorResource, 
                "https://cdn.jsdelivr.net/npm/eruda", 
                "https://cdn.gisthostfor.me/thatrandomperson5-lkuPg5hRm9-object-observer.min.js", 
                "https://cdn.jsdelivr.net/gh/thatrandomperson5/eruda-websocketmonitor@master/src/websocketmonitor.js"]
  })
