// For bookmarklet ++

bookmarklet.config = {
  packages: {
    ijtool: {
      url: "https://cdn.jsdelivr.net/gh/thatrandomperson5/censorjs@HEAD/release/injection-tooling.min.js",
      exports: ["softRefresh"],
    },
  },
  prefetch: {
    censor: "https://cdn.jsdelivr.net/gh/thatrandomperson5/censorjs@4945279/src/censor.js",
    eruda: "https://cdn.jsdelivr.net/npm/eruda",
    objectObserver: "https://cdn.gisthostfor.me/thatrandomperson5-lkuPg5hRm9-object-observer.min.js",
    webSocketMonitor:
      "https://cdn.jsdelivr.net/gh/thatrandomperson5/eruda-websocketmonitor@master/src/websocketmonitor.js",
  },
};

bookmarklet.run = (ctx) => {
  const softRefresh = ctx.packages.ijtool.softRefresh;
  var resources = [];
  for (const [key, value] of Object.entries(ctx.prefetch)) {
    resources.push("data:text/javascript;base64," + value);
  }

  softRefresh(
    () => {
      eruda.init();
      eruda.add(WebSocketMonitor.add());
    },
    {
      resources: resources,
    },
  );
};
