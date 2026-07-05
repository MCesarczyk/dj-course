export class UnknownCarrierTypeError extends Error {
  constructor(type: string, allowed: string[]) {
    super(`Unknown carrier type: '${type}'. Allowed: ${allowed.join(', ')}`);
    this.name = 'UnknownCarrierTypeError';
  }
}
