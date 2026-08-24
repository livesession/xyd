import "@xyd-js/typespec-opencli";

using XydCli;

@cli(#{ title: "x", description: "d" })
namespace X;

@command
@doc("run it")
op run(): void;
