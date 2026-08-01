import "@typespec/http";

using Http;

namespace PlatformApi;

@error
model NotFoundError {
  @statusCode statusCode: 404;
  code: "not_found";
  message: string;
}

@error
model ValidationError {
  @statusCode statusCode: 422;
  code: "invalid";
  message: string;
}

model MarkReadResult {
  updated: int32;
}
