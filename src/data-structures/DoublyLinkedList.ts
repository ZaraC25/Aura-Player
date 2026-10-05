class Node<T> {
  data: T;
  next: Node<T> | null = null;
  prev: Node<T> | null = null;

  constructor(data: T) {
    this.data = data;
  }
}

export class DoublyLinkedList<T extends { id: string }> {
  private head: Node<T> | null = null;
  private tail: Node<T> | null = null;
  private current: Node<T> | null = null;
  private size: number = 0;

  addFirst(data: T): void {
    const node = new Node(data);
    if (this.head === null) {
      this.head = node;
      this.tail = node;
      this.current = node;
    } else {
      node.next = this.head;
      this.head.prev = node;
      this.head = node;
    }
    this.size++;
  }

  addLast(data: T): void {
    const node = new Node(data);
    if (this.tail === null) {
      this.head = node;
      this.tail = node;
      this.current = node;
    } else {
      node.prev = this.tail;
      this.tail.next = node;
      this.tail = node;
    }
    this.size++;
  }

  addAt(index: number, data: T): void {
    if (index < 0 || index > this.size) {
      throw new RangeError(`Index ${index} is out of bounds for size ${this.size}`);
    }
    if (index === 0) {
      this.addFirst(data);
      return;
    }
    if (index === this.size) {
      this.addLast(data);
      return;
    }
    const node = new Node(data);
    let cursor = this.head;
    for (let i = 0; i < index; i++) {
      cursor = cursor!.next;
    }
    const before = cursor!.prev!;
    before.next = node;
    node.prev = before;
    node.next = cursor;
    cursor!.prev = node;
    this.size++;
  }

  remove(id: string): void {
    let cursor = this.head;
    while (cursor !== null) {
      if (cursor.data.id === id) {
        if (cursor.prev !== null) {
          cursor.prev.next = cursor.next;
        } else {
          this.head = cursor.next;
        }
        if (cursor.next !== null) {
          cursor.next.prev = cursor.prev;
        } else {
          this.tail = cursor.prev;
        }
        if (this.current === cursor) {
          this.current = cursor.next ?? cursor.prev;
        }
        this.size--;
        return;
      }
      cursor = cursor.next;
    }
  }

  next(): T | null {
    if (this.current === null || this.current.next === null) {
      return null;
    }
    this.current = this.current.next;
    return this.current.data;
  }

  prev(): T | null {
    if (this.current === null || this.current.prev === null) {
      return null;
    }
    this.current = this.current.prev;
    return this.current.data;
  }

  getCurrent(): T | null {
    return this.current ? this.current.data : null;
  }

  getSize(): number {
    return this.size;
  }

  isEmpty(): boolean {
    return this.size === 0;
  }

  toArray(): T[] {
    const result: T[] = [];
    let cursor = this.head;
    while (cursor !== null) {
      result.push(cursor.data);
      cursor = cursor.next;
    }
    return result;
  }
}
