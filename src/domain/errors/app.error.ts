export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number,
    public readonly data?: Record<string, unknown>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;
  }
}
