---
title: Introduction
---

# Introduction

This API reference describes the RESTful, streaming, and realtime APIs you can use to interact with the OpenAI platform. REST APIs are usable via HTTP in any environment that supports HTTP requests. Language-specific SDKs are listed on the libraries page.

---
# Authentication

The OpenAI API uses API keys for authentication. Create, manage, and learn more about API keys in your organization settings.

Remember that your API key is a secret! Do not share it with others or expose it in any client-side code (browsers, apps). API keys should be securely loaded from an environment variable or key management service on the server.

API keys should be provided via HTTP Bearer authentication.

```
Authorization: Bearer OPENAI_API_KEY
```

If you belong to multiple organizations or access projects through a legacy user API key, pass a header to specify which organization and project to use for an API request:

```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "OpenAI-Organization: YOUR_ORG_ID" \
  -H "OpenAI-Project: $PROJECT_ID"
```

Usage from these API requests counts as usage for the specified organization and project.Organization IDs can be found on your organization settings page. Project IDs can be found on your general settings page by selecting the specific project.

---
# Debugging requests
In addition to error codes returned from API responses, you can inspect HTTP response headers containing the unique ID of a particular API request or information about rate limiting applied to your requests. Below is an incomplete list of HTTP headers returned with API responses:

API meta information

openai-organization: The organization associated with the request
openai-processing-ms: Time taken processing your API request
openai-version: REST API version used for this request (currently 2020-10-01)
x-request-id: Unique identifier for this API request (used in troubleshooting)
Rate limiting information

* `x-ratelimit-limit-requests`
* `ratelimit-limit-tokens`
* `ratelimit-remaining-requests`
* `ratelimit-remaining-tokens`
* `ratelimit-reset-requests`
* `ratelimit-reset-tokens`

OpenAI recommends logging request IDs in production deployments for more efficient troubleshooting with our support team, should the need arise. Our official SDKs provide a property on top-level response objects containing the value of the x-request-id header.

---
# Backward compatibility
OpenAI is committed to providing stability to API users by avoiding breaking changes in major API versions whenever reasonably possible. This includes:

* The REST API (currently v1)
* Our first-party SDKs (released SDKs adhere to semantic versioning)
* Model families (like gpt-4o or o4-mini)

**Model prompting behavior between snapshots is subject to change.** Model outputs are by their nature variable, so expect changes in prompting and model behavior between snapshots. For example, if you moved from gpt-4o-2024-05-13 to gpt-4o-2024-08-06, the same system or user messages could function differently between versions. The best way to ensure consistent prompting behavior and model output is to use pinned model versions, and to implement evals for your applications.

Backwards-compatible API changes:

* Adding new resources (URLs) to the REST API and SDKs
* Adding new optional API parameters
* Adding new properties to JSON response objects or event data
* Changing the order of properties in a JSON response object
* Changing the length or format of opaque strings, like resource identifiers and UUIDs
* Adding new event types (in either streaming or the Realtime API)

See the changelog for a list of backwards-compatible changes and rare breaking changes.