import EventCenter from '../../lib/eventHandler/eventCenter'

let eventCenter = null
let button1 = null
let button2 = null
let mockCallback = null

beforeEach(() => {
  eventCenter = new EventCenter()
  document.body.innerHTML = `<div id="test">
  <button id="button1" >Button 1</button>
  <button id="button2" >Button 2</button>
  </div>`
  button1 = document.querySelector('#button1')
  button2 = document.querySelector('#button2')
  mockCallback = jest.fn(event => 'hello world')
})

test('EventCenter\'s method `deatchDOMEvent` and `attachDOMEvent`', () => {
  const eventId = eventCenter.attachDOMEvent(button1, 'click', mockCallback)
  button1.click()
  eventCenter.detachDOMEvent(eventId)
  button1.click()
  expect(eventId).toBe('eventId-0')
  expect(mockCallback.mock.calls.length).toBe(1)
})

test('EventCenter\'s method `detachAllDomEvents`', () => {
  const eventId1 = eventCenter.attachDOMEvent(button1, 'click', mockCallback)
  const eventId2 = eventCenter.attachDOMEvent(button2, 'click', mockCallback)
  button1.click()
  button2.click()
  eventCenter.detachAllDomEvents()
  button1.click()
  button2.click()
  expect(eventId1).toBe('eventId-0')
  expect(eventId2).toBe('eventId-1')
  expect(mockCallback.mock.calls.length).toBe(2)
})

test('EventCenter\'s method `on`, `emit` and `off`', () => {
  const CUSTOM_EVENT = 'CUSTOM_EVENT'
  eventCenter.on(CUSTOM_EVENT, mockCallback)
  eventCenter.emit(CUSTOM_EVENT, 1, 2, 3)
  eventCenter.off(CUSTOM_EVENT, mockCallback)
  eventCenter.emit(CUSTOM_EVENT, 4, 5, 6)
  expect(mockCallback.mock.calls[0][1]).toBe(2)
  expect(mockCallback.mock.calls.length).toBe(1)
})

test('EventCenter\'s method `once`, `emit`', () => {
  const CUSTOM_EVENT = 'CUSTOM_EVENT'
  eventCenter.once(CUSTOM_EVENT, mockCallback)
  eventCenter.emit(CUSTOM_EVENT, 1, 2, 3)
  eventCenter.emit(CUSTOM_EVENT, 4, 5, 6)
  expect(mockCallback.mock.calls[0][1]).toBe(2)
  expect(mockCallback.mock.calls.length).toBe(1)
})
