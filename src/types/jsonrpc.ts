export interface JsonRpcRequest {
  id: number;
  jsonrpc: string;
  method: string;
  params: any;
}

export interface JsonRpcResult {
  id: number;
  jsonrpc: string;
  result: any;
}

export interface JsonRpcError {
  id: number;
  jsonrpc: string;
  error: ErrorResponse;
}

export interface ErrorResponse {
  code: number;
  message: string;
}

export interface JsonRpcProvider {
  on(event: string, listener: any): void;
  once(event: string, listener: any): void;
  off(event: string, listener: any): void;
  request(payload: JsonRpcRequest): Promise<any>;
  connect(opts?: any): Promise<void>;
  disconnect(opts?: any): Promise<void>;
}
