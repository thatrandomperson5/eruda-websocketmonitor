class WebSocketMonitor extends eruda.Tool {
  censor
  archive
  sockets
  settings
  currentSocket = "none"
  viewingArchive = false
  $dataGrid

  #lunaDataGrid = eruda._devTools._tools.network._requestDataGrid.constructor
  #resizeSensor = eruda._devTools._tools.network._resizeSensor.constructor
  #eventNameMap = {
    "message-in": "Message Received",
    "message-out": "Message Sent",
    close: "Socket Closed",
    open: "Socket Opened",
    error: "Socket Error",
  }
  #$ = eruda._$el.constructor

  $(...args) {
    return new this.#$(...args)
  }

  static uuidv4() {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
      (
        +c ^
        (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))
      ).toString(16),
    )
  }

  static add(settings) {
    return () => {
      return new WebSocketMonitor(settings)
    }
  }

  showSources(type, data) {
    const sources = eruda.get("sources")
    if (!sources) return
    sources.set(type, data)

    eruda.show("sources")
  }

  changeHandle(changes) {
    changes.forEach((change) => {
      if (change.path.length === 3 && change.path[1] === "events") {
        if (change.type === "insert" && change.path[0] === this.currentSocket) {
          if (change.object.length > this.settings.maxCacheLength) {
            change.object.splice(100)
            this.refreshGrid()
          } else {
            this.appendDataGrid(
              change.object.length,
              this.gridConvData(change.value),
            )
          }
        }
      }
      if (change.path.length === 1) {
        if (change.type === "insert") {
          let opt = document.createElement("option")
          opt.id = "websocketmonitor-eruda-" + change.value.uuid
          opt.value = ""
          if (change.value.inArchive) {
            opt.textContent = "Archived "
            opt.value = "archive-"
            opt.id += "-archive"
          }
          opt.textContent += change.value.id
          opt.value += change.value.id
          this._$socketSelect.append(opt)
        } else if (change.type === "delete") {
          setTimeout(() => {
            console.log(change.oldValue.uuid)
            this._$socketSelect
              .find("#websocketmonitor-eruda-" + change.oldValue.uuid)
              .get(0)
              .remove()
          }, 500)
        }
      }
    })
  }
  gridConvData(data) {
    var dataDetail = data.data
      ? data.data.toString().replace(/(?:\r\n|\r|\n)/g, " ")
      : "None"
    return {
      event: this.#eventNameMap[data.name],
      message: data.message,
      timestamp: data.timestamp,
      "detail-button": dataDetail,
      cascade: data.isCascade ? "Yes" : "No",
    }
  }
  genDataGrid(id, src = "sockets") {
    var data = []
    this[src][id].events.forEach((e) => {
      data.push(this.gridConvData(e))
    })
    return data
  }

  appendDataGrid(index, obj) {
    if (!(obj.cascade === "Yes" && !this.settings.doCascade)) {
      var node = this._$dataGrid.append(obj, { selectable: true })
      this.$(node.container).data("id", index)
    }
  }

  refreshGrid() {
    var id = this._$socketSelect.get(0).value
    this.currentSocket = id
    if (id === "none") {
      this._$dataGrid.clear()
    } else {
      var src = "sockets"
      if (id.startsWith("archive-")) {
        id = id.slice(8)
        // console.log(id)
        src = "archive"
        this.viewingArchive = true
        this.currentSocket = id
      } else {
        this.viewingArchive = false
      }
      this._$dataGrid.setData(this.genDataGrid(id, src))
    }
  }

  constructor(settings = { maxCacheLength: 500 }) {
    super()
    if (!this.#lunaDataGrid.prototype.setData) {
      this.#lunaDataGrid.prototype.setData = (data) => {
        this._$dataGrid.clear()
        data.forEach((obj, i) => {
          this.appendDataGrid(i, obj)
        })
      }
    }

    this.archive = Observable.from({})
    this.sockets = Observable.from({})
    Observable.observe(this.sockets, this.changeHandle.bind(this))
    Observable.observe(this.archive, this.changeHandle.bind(this))
    this.settings = settings
    this.name = "WebSocket Monitor"
    this.style = eruda.util.evalCss(
      [
        ".eruda-dev-tools .eruda-tools .eruda-WebSocket-Monitor {padding: 3px;}",
        ".container {display: flex; flex-direction: column; height: 100%;}",
        ".header {display: flex; justify-content: space-between;}",
      ].join(".eruda-dev-tools .eruda-tools .eruda-WebSocket-Monitor "),
    )
    this.initCensor()
  }
  handleClose(ctx) {
    var code, reason, wasClean, ws
    if (ctx instanceof CloseEvent) {
      let event = ctx
      reason = event.reason
      code = event.code
      wasClean = event.wasClean
      ws = event.target
    } else {
      code = ctx.args[0] ?? 1000
      reason = ctx.args[1] ?? ""
      wasClean = true
      ws = ctx.subject
      ctx.pass()
    }
    if (this.settings.noArchive) {
      console.error(`WebSocket ${ws.__id} closed ${{ code, reason, wasClean }}`)
    } else {
      if (this.sockets.hasOwnProperty(ws.__id)) {
        this.sockets[ws.__id].events.push({
          name: "close",
          message: `Socket closed with ${code}: ${reason}`,
          isCascade: false,
          data: { code, reason, wasClean },
          timestamp: Date.now(),
        })
        delete this.sockets[ws.__id]["socket"]
        this.archive[ws.__id] = {
          inArchive: true,
          uuid: ws.__uuid,
          id: ws.__id,
          timestamp: Date.now(),
        }
        Object.assign(this.archive[ws.__id], this.sockets[ws.__id]) // Shallow copy
        delete this.sockets[ws.__id]
      }
    }
  }
  handleEvent(ctx, event) {
    // console.log(event.type + " Event: ", this.sockets, ctx)
    let ws = ctx.subject
    var target = this.archive.hasOwnProperty(ws.__id)
      ? this.archive
      : this.sockets
    target[ws.__id].events.push({
      name: event.type,
      isCascade: true,
      message: "Handled by " + ctx.callback.name + "()",
      data: ctx.callback,
      timestamp: Date.now(),
    })

    var result = ctx.pass()
    return result
  }
  initCensor() {
    const _this = this
    this.censor = censor(WebSocket, "WebSocket")
    for (const event of ["open", "close", "error", "message"]) {
      this.censor.on(event, this.handleEvent.bind(this))
    }

    // Actual handles
    this.censor.whenCreate((ctx) => {
      var ws = ctx.pass()
      ws.__uuid = WebSocketMonitor.uuidv4()
      ws.__id = ws.url + " " + ws.__uuid
      ws.addEventListener("open", (event) => {
        _this.sockets[ws.__id] = {
          id: ws.__id,
          uuid: ws.__uuid,
          socket: ws,
          events: [
            {
              name: "open",
              message: "Socket opened at " + ws.url,
              isCascade: false,
              data: null,
              timestamp: Date.now(),
            },
          ],
        }
      })
      ws.addEventListener("close", this.handleClose.bind(this))
      ws.addEventListener("message", (event) => {
        _this.sockets[ws.__id].events.push({
          name: "message-in",
          message: ["string", "number", "boolean"].includes(typeof event.data)
            ? event.data
            : "Binary Data",
          isCascade: false,
          data: event.data,
          timestamp: Date.now(),
        })
        // console.log("Message:", _this.sockets)
      })
      ws.addEventListener("error", (event) => {
        _this.sockets[ws.__id].events.push({
          name: "error",
          message: "An error occured. ",
          isCascade: false,
          data: event,
          timestamp: Date.now(),
        })
      })
      return ws
    })

    this.censor.whenCall("send", (ctx, obj) => {
      _this.sockets[ctx.subject.__id].events.push({
        name: "message-out",
        message: ["string", "number", "boolean"].includes(typeof obj)
          ? obj
          : "Binary Data",
        isCascade: false,
        data: obj,
        timestamp: Date.now(),
      })
      // console.log("Send:", _this.sockets)
      return ctx.pass()
    })
    this.censor.whenCall("close", this.handleClose.bind(this))
  }
  init($el) {
    super.init($el)
    $el.html(`<div class="container"><div class="header">
      <select class="socketSelect">
        <option value="none">None</option>
      </select>
      <div>
        <button class="archiveButton">Archive</button>
        <input class="cascadeInput" type="checkbox" ${this.settings.doCascade ? "checked" : ""}>
        <label>Enable Cascade</label>
      </div>
    </div>
    <div class="wrapper"></div>
    </div>`)
    this._$header = $el.find(".header")
    this._$archiveButton = $el.find(".archiveButton")
    this._$archiveButton.on("click", () => {
      const id = this.currentSocket
      console.log(id)
      if (id !== "none") {
        this.archive[id] = {
          inArchive: true,
          uuid: this.sockets[id].uuid,
          id: id,
          timestamp: Date.now(),
        }
        Object.assign(this.archive[id], this.sockets[id])
      }
    })

    this._$socketSelect = $el.find(".socketSelect")
    this._$socketSelect.on("change", this.refreshGrid.bind(this))
    this._$cascadeInput = $el.find(".cascadeInput")
    this._$cascadeInput.on("change", () => {
      const v = this._$cascadeInput.get(0).checked
      this.settings.doCascade = v
      this.refreshGrid()
    })
    this._$dataGrid = new this.#lunaDataGrid($el.find(".wrapper").get(0), {
      columns: [
        {
          id: "event",
          title: "Event",
          sortable: true,
          weight: 24,
        },
        {
          id: "message",
          title: "Message",
          weight: 75,
        },
        {
          id: "detail-button",
          title: "Details",
          weight: 20,
        },
        {
          id: "cascade",
          title: "Cascade",
          weight: 10,
        },
        {
          id: "timestamp",
          title: "Timestamp",
          weight: 10,
          sortable: true,
        },
      ],
    })
    this._$dataGrid.on("select", (node) => {
      let index = this.$(node.container).data("id")
      var base = this.sockets[this.currentSocket]
      if (this.viewingArchive) {
        base = this.archive[this.currentSocket]
      }
      if (this.currentSocket !== "none") {
        var type = "object"
        var data = base.events[index].data
        if (
          [
            "function",
            "number",
            "symbol",
            "bitint",
            "boolean",
            "undefined",
          ].includes(typeof data)
        ) {
          type = "js"
          data = data.toString()
        } else if (typeof data === "string") {
          type = "raw"
        }
        this.showSources(type, data)
      }
    })

    this._resize = new this.#resizeSensor($el.get(0))
    this._resize.addListener(this.updateGridHeight.bind(this))
    // console.log($el.get(0))
    // console.log(eruda._devTools._tools.settings._$el.get(0))
  }
  updateGridHeight() {
    const height = this._$el.offset().height - this._$header.offset().height
    this._$dataGrid.setOption({
      minHeight: height,
      maxHeight: height,
    })
  }
  destroy() {
    super.destroy()
    eruda.util.evalCss.remove(this.style)
  }
}
