// A deliberate, expected error with an HTTP status attached - thrown by any
// service layer function for business-rule failures ("email already
// exists", "product not found", "access denied", ...). Anything that
// *isn't* an AppError (a Prisma error, a bug, a network hiccup) falls
// through the error handler's default branch as a generic 500 - see
// shared/middlewares/errorHandler.ts.
export class AppError extends Error {
  public readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(message: string): AppError {
    return new AppError(400, message);
  }

  static unauthorized(message = "Unauthorized"): AppError {
    return new AppError(401, message);
  }

  static forbidden(message = "Access Denied"): AppError {
    return new AppError(403, message);
  }

  static notFound(message = "Not found"): AppError {
    return new AppError(404, message);
  }
}
