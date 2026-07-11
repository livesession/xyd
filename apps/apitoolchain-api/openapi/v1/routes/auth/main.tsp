import "@typespec/http";
import "@typespec/http-server-js";
import "@apitoolchain/schemas";
import "../../components/models/errors.tsp";

using Http;
using Apitoolchain;

namespace PlatformApi;

/**
 * Email+password auth. `register`/`login` are public and return an opaque
 * session token the web stores in an httpOnly cookie + forwards as a bearer;
 * `me`/`logout` require that bearer.
 */
@route("/auth")
interface Auth {
  @route("/register") @post register(@body input: RegisterInput): AuthSession | ValidationError;
  @route("/login") @post login(@body input: LoginInput): AuthSession | ValidationError;
  @route("/logout") @post logout(): void;
  @route("/me") @get me(): User;
}
