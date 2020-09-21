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
  error: {
    code: number;
    message: string;
  };
}

export interface JsonRpcProvider {
  on(event: string, listener: any): void;
  request(payload: JsonRpcRequest): Promise<any>;
}
