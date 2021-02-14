/**
 * Taken from https://github.com/binier/tiny-typed-emitter (so really no overhead...)
 * Copyright (c) 2020 Zurab Benashvili (binier) <zura.bena@gmail.com>
 * Under MIT license https://github.com/binier/tiny-typed-emitter/raw/master/LICENSE
 */
declare type ListenerSignature<L> = {
  [E in keyof L]: (...args: any[]) => any;
};

declare type DefaultListener = {
  [k: string]: (...args: any[]) => any;
};

export declare class TypedEmitter<
  L extends ListenerSignature<L> = DefaultListener
> {
  static defaultMaxListeners: number;
  addListener<U extends keyof L>(event: U, listener: L[U]): this;
  prependListener<U extends keyof L>(event: U, listener: L[U]): this;
  prependOnceListener<U extends keyof L>(event: U, listener: L[U]): this;
  removeListener<U extends keyof L>(event: U, listener: L[U]): this;
  removeAllListeners(event?: keyof L): this;
  once<U extends keyof L>(event: U, listener: L[U]): this;
  on<U extends keyof L>(event: U, listener: L[U]): this;
  off<U extends keyof L>(event: U, listener: L[U]): this;
  emit<U extends keyof L>(event: U, ...args: Parameters<L[U]>): boolean;
  eventNames<U extends keyof L>(): U[];
  listenerCount(type: keyof L): number;
  listeners<U extends keyof L>(type: U): L[U][];
  rawListeners<U extends keyof L>(type: U): L[U][];
  getMaxListeners(): number;
  setMaxListeners(n: number): this;
}
