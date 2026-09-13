# frozen_string_literal: true

Gem::Specification.new do |spec|
  spec.name = "union_depot"
  spec.version = "0.4.0"
  spec.summary = "Ruby client for the Union Depot API"
  spec.description = "Handcrafted IR exercising discriminated-union decode, const auto-fill and auto-pagers."
  spec.authors = ["opensdk"]
  spec.license = "MIT"
  spec.required_ruby_version = ">= 2.6.0"
  spec.files = Dir["lib/**/*.rb", "*.gemspec"]
  spec.require_paths = ["lib"]
end
