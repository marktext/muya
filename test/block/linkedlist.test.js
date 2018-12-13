import LinkedNode from '../../lib/block/linkedNode'
import LinkedList from '../../lib/block/linkedList'

let linkedList = null

beforeEach(() => {
  linkedList = new LinkedList()
})

test('Basic use of append', () => {
  const node1 = new LinkedNode()
  linkedList.append(node1)

  expect(linkedList.length).toBe(1)
  expect(linkedList.head).toEqual(node1)
  expect(linkedList.tail).toEqual(node1)
})

test('LinkedList method `append`', () => {
  const node2 = new LinkedNode()
  const node3 = new LinkedNode()
  linkedList.append(node2, node3)

  expect(linkedList.length).toBe(2)
  expect(linkedList.head).toEqual(node2)
  expect(linkedList.tail).toEqual(node3)
})

test('LinkedList method `insertBefore`', () => {
  const node1 = new LinkedNode()
  const node2 = new LinkedNode()
  const node3 = new LinkedNode()
  linkedList.insertBefore(node1)

  expect(node1.prev).toBe(null)
  expect(node1.next).toBe(null)
  expect(linkedList.head).toEqual(node1)
  expect(linkedList.tail).toEqual(node1)
  linkedList.insertBefore(node2, node1)
  expect(node2.next).toBe(node1)
  expect(node1.prev).toBe(node2)
  expect(linkedList.head).toEqual(node2)
  expect(linkedList.tail).toEqual(node1)
  linkedList.insertBefore(node3)
  expect(node3.prev).toBe(node1)
  expect(node1.next).toBe(node3)
  expect(linkedList.tail).toBe(node3)
  expect(linkedList.length).toBe(3)
})

test('LinkedList method `contains`', () => {
  const node = new LinkedNode()
  linkedList.insertBefore(node)

  expect(linkedList.contains(node)).toBeTruthy()
})

test('LinkedList method `offset`', () => {
  const nodes = {}
  for (const i of [...new Array(5)].map((_, index) => index)) {
    nodes[`node${i}`] = new LinkedNode()
    linkedList.insertBefore(nodes[`node${i}`])
    expect(linkedList.offset(nodes[`node${i}`])).toBe(i)
  }

  const isolatedNode = new LinkedNode()
  expect(linkedList.offset(isolatedNode)).toBe(-1)
})

test('LinkedList method `remove`', () => {
  const node = new LinkedNode()
  linkedList.append(node)
  expect(linkedList.contains(node)).toBeTruthy()
  linkedList.remove(node)
  expect(linkedList.contains(node)).toBeFalsy()
})

test('LinkedList method `find`', () => {
  const node = new LinkedNode()
  linkedList.append(node)
  expect(linkedList.find(0)).toBe(node)
  expect(linkedList.find(1)).toBeFalsy()
})

test('LinkedList method `forEach`', () => {
  const nodes = {}
  for (const i of [...new Array(5)].map((_, index) => index)) {
    nodes[`node${i}`] = new LinkedNode()
    linkedList.insertBefore(nodes[`node${i}`])
  }
  linkedList.forEach((node, i) => {
    expect(nodes[`node${i}`]).toBe(node)
  })
})

test('LinkedList method `forEachAt`', () => {
  const nodes = {}
  for (const i of [...new Array(5)].map((_, index) => index)) {
    nodes[`node${i}`] = new LinkedNode()
    linkedList.insertBefore(nodes[`node${i}`])
  }
  let count = 0
  linkedList.forEachAt(1, 2, (node, i) => {
    count++
    expect(nodes[`node${i}`]).toBe(node)
  })
  expect(count).toBe(2)
})

test('LinkedList method `map`', () => {
  const nodes = {}
  for (const i of [...new Array(5)].map((_, index) => index)) {
    nodes[`node${i}`] = new LinkedNode()
    linkedList.insertBefore(nodes[`node${i}`])
  }

  const array = linkedList.map((node, i) => i)
  expect(linkedList.length).toEqual(array.length)
})

test('LinkedList method `reduce`', () => {
  const anotherLinkedList = new LinkedList()
  const nodes = {}
  for (const i of [...new Array(5)].map((_, index) => index)) {
    nodes[`node${i}`] = new LinkedNode()
    linkedList.insertBefore(nodes[`node${i}`])
  }
  linkedList.reduce((acc, node, i) => {
    anotherLinkedList.insertBefore(node)
  }, anotherLinkedList)
  for (const node of linkedList.iterator()) {
    linkedList.remove(node)
  }
  expect(anotherLinkedList.length).toBe(5)
  expect(linkedList.length).toBe(0)
})
