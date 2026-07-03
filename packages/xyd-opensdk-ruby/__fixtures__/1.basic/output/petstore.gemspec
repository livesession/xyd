# frozen_string_literal: true

Gem::Specification.new do |spec|
  spec.name = "petstore"
  spec.version = "1.2.0"
  spec.summary = "Ruby client for the Petstore API"
  spec.description = "A tiny pet store API."
  spec.authors = ["opensdk"]
  spec.license = "MIT"
  spec.required_ruby_version = ">= 2.6.0"
  spec.files = Dir["lib/**/*.rb", "*.gemspec"]
  spec.require_paths = ["lib"]
end
