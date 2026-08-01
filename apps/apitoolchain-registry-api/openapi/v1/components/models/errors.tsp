import "@typespec/http";

using Http;

namespace RegistryApi;

@error
model NotFoundError {
  @statusCode statusCode: 404;
  code: "not_found";
  message: string;
}

@error
model ValidationError {
  @statusCode statusCode: 422;
  code: "invalid_spec";
  message: string;
}
