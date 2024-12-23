// Requires censor.js injection-tooling to run

softRefresh(
  () => {
    eruda.init()
    eruda.add(WebSocketMonitor.add())
  }, {
    resources: ["https://cdn.jsdelivr.net/gh/thatrandomperson5/censorjs@4945279/src/censor.js", 
                "https://cdn.jsdelivr.net/npm/eruda", 
                "https://cdn.gisthostfor.me/thatrandomperson5-lkuPg5hRm9-object-observer.min.js", 
                "https://cdn.jsdelivr.net/gh/thatrandomperson5/eruda-websocketmonitor@master/src/websocketmonitor.js"]
  })
