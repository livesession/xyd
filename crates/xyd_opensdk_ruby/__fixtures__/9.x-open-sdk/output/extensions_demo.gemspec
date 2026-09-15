# frozen_string_literal: true

Gem::Specification.new do |spec|
  spec.name = "extensions_demo"
  spec.version = "1.0.0"
  spec.summary = "Ruby client for the Extensions Demo API"
  spec.description = "Exercises x-open-sdk-* naming extensions."
  spec.authors = ["opensdk"]
  spec.license = "MIT"
  spec.required_ruby_version = ">= 2.6.0"
  spec.files = Dir["lib/**/*.rb", "*.gemspec"]
  spec.require_paths = ["lib"]
end
