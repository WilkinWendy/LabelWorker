export interface PaintHandler<T> {
  getResult(): Promise<T>;
  dispose: () => void;
}
