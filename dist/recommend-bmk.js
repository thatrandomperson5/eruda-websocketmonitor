// For bookmarklet ++

bookmarklet.config = {
  packages: {
    ijtool: {
      url: "https://cdn.jsdelivr.net/gh/thatrandomperson5/censorjs@HEAD/release/injection-tooling.min.js",
      exports: ["softRefresh"],
    },
  },
  prefetch: {
    censor:
      "https://cdn.jsdelivr.net/gh/thatrandomperson5/censorjs@4945279/src/censor.js",
    eruda: "https://cdn.jsdelivr.net/npm/eruda",
    objectObserver:
      "https://cdn.gisthostfor.me/thatrandomperson5-lkuPg5hRm9-object-observer.min.js",
    webSocketMonitor:
      "https://cdn.jsdelivr.net/gh/thatrandomperson5/eruda-websocketmonitor@master/src/websocketmonitor.js",
  },
};

bookmarklet.run = (ctx) => {
  try {
  const softRefresh = ctx.packages.ijtool.softRefresh;

  softRefresh(
    () => {
      eruda.init();
      eruda.add(WebSocketMonitor.add());
    },
    {
      resources: [],
      processor: (doc) => {
        function makeScript(value) {
          let e = doc.createElement("script");
          e.textContent = atob(value);
          doc.head.prepend(e);
        } 
        // Reverse order
        makeScript(ctx.prefetch.webSocketMonitor);
        makeScript(ctx.prefetch.eruda);
        makeScript(ctx.prefetch.censor);
        makeScript(ctx.prefetch.objectObserver);

      },
    },
  );
  } catch (error) {
    console.error(error)
  }
};
