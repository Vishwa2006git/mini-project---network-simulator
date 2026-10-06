export interface PriorityQueueItem<T> {
  element: T;
  priority: number;
}

/**
 * Binary Min-Heap Priority Queue
 */
export class PriorityQueue<T> {
  private heap: PriorityQueueItem<T>[] = [];

  public get size(): number {
    return this.heap.length;
  }

  public isEmpty(): boolean {
    return this.heap.length === 0;
  }

  public enqueue(element: T, priority: number): void {
    const item: PriorityQueueItem<T> = { element, priority };
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  public dequeue(): T | undefined {
    if (this.isEmpty()) return undefined;
    const min = this.heap[0].element;
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.bubbleDown(0);
    }
    return min;
  }

  public peek(): T | undefined {
    return this.isEmpty() ? undefined : this.heap[0].element;
  }

  private bubbleUp(index: number): void {
    const item = this.heap[index];
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      const parent = this.heap[parentIndex];
      if (item.priority >= parent.priority) break;
      this.heap[index] = parent;
      index = parentIndex;
    }
    this.heap[index] = item;
  }

  private bubbleDown(index: number): void {
    const length = this.heap.length;
    const item = this.heap[index];

    while (true) {
      const leftChildIndex = 2 * index + 1;
      const rightChildIndex = 2 * index + 2;
      let smallestIndex = index;

      if (
        leftChildIndex < length &&
        this.heap[leftChildIndex].priority < this.heap[smallestIndex].priority
      ) {
        smallestIndex = leftChildIndex;
      }

      if (
        rightChildIndex < length &&
        this.heap[rightChildIndex].priority < this.heap[smallestIndex].priority
      ) {
        smallestIndex = rightChildIndex;
      }

      if (smallestIndex === index) break;

      this.heap[index] = this.heap[smallestIndex];
      this.heap[smallestIndex] = item;
      index = smallestIndex;
    }
  }
}
