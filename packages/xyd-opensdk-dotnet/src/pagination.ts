import type { OperationPlan, PageName } from '@xyd-js/opensdk-framework';

import { CS_HEADER } from './cswriter';

/**
 * The .NET page container for a planned method — all pagination gates
 * (`itemsField === "data"` + a resolvable `itemType`) come from the framework's
 * shared `planOperation()`; this adapter just passes the plan's page kind
 * through. Unlike the Python runtime (which keeps offset lists raw), the .NET
 * runtime vendors all three containers, so cursor/page/offset methods each get
 * a typed page return.
 */
export function dotnetPageName(plan: OperationPlan): PageName | null {
  return plan.pageName;
}

/**
 * Emit `Pagination.cs`: the generic page containers list methods return. Each
 * decodes the `{ "data": [...], "has_more": bool }` envelope directly via
 * System.Text.Json (`[JsonPropertyName]` maps the wire fields), so a
 * `RequestAsync<CursorPage<T>>` round-trips with no bespoke decode. Auto-pager
 * continuation (fetch-next-page) is a phase-2+ seam; the typed container + typed
 * return is the bar. Emitted only when some method paginates.
 */
export function renderPaginationFile(namespaceName: string): string {
  return `${CS_HEADER}

using System;
using System.Collections;
using System.Collections.Generic;
using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace ${namespaceName};

/// <summary>One page of a cursor-paginated list: the <c>data</c> items plus a <c>has_more</c> marker.</summary>
[JsonConverter(typeof(PageJsonConverterFactory))]
public sealed class CursorPage<T> : IEnumerable<T>
{
    /// <summary>The items on this page.</summary>
    [JsonPropertyName("data")]
    public List<T> Data { get; set; } = new();

    /// <summary>Whether another page is available.</summary>
    [JsonPropertyName("has_more")]
    public bool HasMore { get; set; }

    public IEnumerator<T> GetEnumerator() => Data.GetEnumerator();

    IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();
}

/// <summary>One page of a marker-less list: the whole collection in a single <c>data</c> envelope.</summary>
[JsonConverter(typeof(PageJsonConverterFactory))]
public sealed class Page<T> : IEnumerable<T>
{
    /// <summary>The items on this page.</summary>
    [JsonPropertyName("data")]
    public List<T> Data { get; set; } = new();

    public IEnumerator<T> GetEnumerator() => Data.GetEnumerator();

    IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();
}

/// <summary>One page of an offset-paginated list: the items in a <c>data</c> envelope.</summary>
[JsonConverter(typeof(PageJsonConverterFactory))]
public sealed class OffsetPage<T> : IEnumerable<T>
{
    /// <summary>The items on this page.</summary>
    [JsonPropertyName("data")]
    public List<T> Data { get; set; } = new();

    public IEnumerator<T> GetEnumerator() => Data.GetEnumerator();

    IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();
}

/// <summary>
/// Deserializes a page container from its <c>{ "data": [...], ... }</c> wire
/// envelope. A page implements IEnumerable&lt;T&gt;, which System.Text.Json would
/// otherwise treat as a JSON array; this reads the object envelope instead,
/// mapping each wire field by the property's [JsonPropertyName].
/// </summary>
internal sealed class PageJsonConverterFactory : JsonConverterFactory
{
    public override bool CanConvert(Type typeToConvert)
    {
        if (!typeToConvert.IsGenericType)
        {
            return false;
        }
        Type def = typeToConvert.GetGenericTypeDefinition();
        return def == typeof(CursorPage<>) || def == typeof(Page<>) || def == typeof(OffsetPage<>);
    }

    public override JsonConverter CreateConverter(Type typeToConvert, JsonSerializerOptions options)
    {
        return (JsonConverter)Activator.CreateInstance(typeof(PageJsonConverter<>).MakeGenericType(typeToConvert));
    }
}

internal sealed class PageJsonConverter<TPage> : JsonConverter<TPage> where TPage : new()
{
    public override TPage Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        using JsonDocument doc = JsonDocument.ParseValue(ref reader);
        JsonElement root = doc.RootElement;
        var page = new TPage();
        foreach (PropertyInfo prop in typeToConvert.GetProperties())
        {
            var wireName = prop.GetCustomAttribute<JsonPropertyNameAttribute>()?.Name;
            if (wireName is null || !prop.CanWrite)
            {
                continue;
            }
            if (root.TryGetProperty(wireName, out JsonElement element) && element.ValueKind != JsonValueKind.Null)
            {
                prop.SetValue(page, element.Deserialize(prop.PropertyType, options));
            }
        }
        return page;
    }

    public override void Write(Utf8JsonWriter writer, TPage value, JsonSerializerOptions options)
    {
        writer.WriteStartObject();
        foreach (PropertyInfo prop in typeof(TPage).GetProperties())
        {
            var wireName = prop.GetCustomAttribute<JsonPropertyNameAttribute>()?.Name;
            if (wireName is null || !prop.CanRead)
            {
                continue;
            }
            writer.WritePropertyName(wireName);
            JsonSerializer.Serialize(writer, prop.GetValue(value), prop.PropertyType, options);
        }
        writer.WriteEndObject();
    }
}
`;
}
