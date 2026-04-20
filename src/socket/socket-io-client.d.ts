// Stub types for socket.io-client — replaced by real types after `npm install socket.io-client`
declare module 'socket.io-client' {
  interface Socket {
    on(event: string, listener: (...args: any[]) => void): this;
    off(event: string, listener?: (...args: any[]) => void): this;
    emit(event: string, ...args: any[]): this;
    disconnect(): this;
  }
  export function io(url: string, opts?: Record<string, any>): Socket;
}
