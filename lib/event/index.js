class EventCenter {
  constructor () {
    this.events = []
    this.listeners = {}
    this.id = 0
  }

  get eventId () {
    return `eventId-${this.id++}`
  }

  /**
   * [attachDOMEvent] bind event listener to target, and return a unique ID,
   * this ID
   */
  attachDOMEvent (target, event, listener, capture) {
    if (this.checkHasBind(target, event, listener, capture)) {
      return false
    }

    const eventId = this.eventId
    target.addEventListener(event, listener, capture)
    this.events.push({
      eventId,
      target,
      event,
      listener,
      capture
    })

    return eventId
  }

  /**
   * [detachDOMEvent removeEventListener]
   * @param  {[type]} eventId [unique eventId]
   */
  detachDOMEvent (eventId) {
    if (!eventId) {
      return false
    }

    const removeEvent = this.events.find(e => e.eventId === eventId)
    if (removeEvent) {
      const { target, event, listener, capture } = removeEvent
      target.removeEventListener(event, listener, capture)
      const index = this.events.findIndex(e => e.eventId === eventId)
      this.events.splice(index, 1)
    }
  }

  /**
   * [detachAllDomEvents remove all the DOM events handler]
   */
  detachAllDomEvents () {
    for (const removedEvent of this.events) {
      const { target, event, listener, capture } = removedEvent
      target.removeEventListener(event, listener, capture)
    }

    this.events = []
  }

  /**
   * inner method for on and once
   */
  subscribe (event, listener, once = false) {
    const listeners = this.listeners[event]
    const handler = { listener, once }
    if (listeners && Array.isArray(listeners)) {
      listeners.push(handler)
    } else {
      this.listeners[event] = [handler]
    }
  }

  /**
   * [on] on custom event
   */
  on (event, listener) {
    this.subscribe(event, listener)
  }

  /**
   * [off] off custom event
   */
  off (event, listener) {
    const listeners = this.listeners[event]
    if (Array.isArray(listeners) && listeners.find(l => l.listener === listener)) {
      const index = listeners.findIndex(l => l.listener === listener)
      listeners.splice(index, 1)
    }
  }

  /**
   * [once] usbscribe event and listen once
   */
  once (event, listener) {
    this.subscribe(event, listener, true)
  }

  /**
   * emit custom event
   */
  emit (event, ...data) {
    const eventListener = this.listeners[event]

    if (eventListener && Array.isArray(eventListener)) {
      eventListener.forEach(({ listener, once }) => {
        listener(...data)
        if (once) {
          this.off(event, listener)
        }
      })
    }
  }

  // Determine whether the event has been bind
  checkHasBind (cTarget, cEvent, cListener, cCapture) {
    for (const { target, event, listener, capture } of this.events) {
      if (target === cTarget && event === cEvent && listener === cListener && capture === cCapture) {
        return true
      }
    }

    return false
  }
}

export default EventCenter
