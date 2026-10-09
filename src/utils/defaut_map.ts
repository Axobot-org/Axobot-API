export class MapWithDefault<K, V> extends Map<K, V> {
  default: () => V;

  get(key: K): V {
    if (!this.has(key)) {
      this.set(key, this.default());
    }
    return super.get(key) || this.default();
  }

  constructor(defaultFunction: () => V) {
    super();
    this.default = defaultFunction;
  }
}
