import {
  DEFINED_DEFINITION_PROPERTY_TYPE,
  type DefinitionProperty,
} from "@xyd-js/uniform";

import { enumInlineSymbol } from "./literals";

/** The label of the schema a row links to — `symbolDef.label`, which the
 * OpenAPI converter sets on every link to a component schema: the schema's
 * constant `object` value (`widget`) when it has one, else the schema name.
 * Empty when the row is not such a link. */
export function schemaLabel(property: DefinitionProperty): string {
  const label = property?.symbolDef?.label;

  return typeof label === "string" ? label : "";
}

/** The type text of a row typed by a component schema: the schema's label in
 * place of the bare `object` — as a link when the schema has a page
 * (`symbolDef.canonical`), as plain text when it has none. Only `object` gives
 * way: a row typed by a scalar schema (a string alias) keeps its primitive
 * type, an enum its literals. An array of a schema reads `array of widget`:
 * through its items when the row has an `ofProperty` (they carry the same
 * label), from its single nameless child when the items sit in `properties`. */
function linkedSchemaSymbol(property: DefinitionProperty): string {
  const label = schemaLabel(property);

  if (!label) {
    return "";
  }

  switch (property.type) {
    case DEFINED_DEFINITION_PROPERTY_TYPE.ARRAY: {
      if (property.ofProperty) {
        return "";
      }

      const [item, ...rest] = property.properties || [];
      const itemSymbol =
        item && !item.name && !rest.length ? linkedSchemaSymbol(item) : "";

      return itemSymbol ? `array of ${itemSymbol}` : "";
    }
    case "object":
    case DEFINED_DEFINITION_PROPERTY_TYPE.UNION:
    case DEFINED_DEFINITION_PROPERTY_TYPE.XOR: {
      return label;
    }
    default: {
      return "";
    }
  }
}

/** The type-column text of a property row — the symbol beside the name:
 * `string`, `array of widget`, `"a" | "b"`, `widget | null`, `string or integer`. */
export function resolvePropertySymbol(property: DefinitionProperty): string {
  function resolvePropertySymbolInner(property: DefinitionProperty) {
    if (property?.ofProperty) {
      switch (property.ofProperty.type) {
        case DEFINED_DEFINITION_PROPERTY_TYPE.ARRAY: {
          let ofOfSymbols: string[] = [];

          if (property.type) {
            ofOfSymbols.push(property.type);
          }

          if (property.ofProperty.ofProperty) {
            const symbol = groupSymbol(property.ofProperty.ofProperty);

            if (symbol) {
              ofOfSymbols.push(symbol);
            }
          }

          const atomicDefinedSymbol = atomicDefinedPropertySymbol(
            property.ofProperty
          );
          const ofPrefix = [atomicDefinedSymbol, "of"];

          return [[...ofPrefix, ...ofOfSymbols].join(" ")];
        }
        case DEFINED_DEFINITION_PROPERTY_TYPE.UNION:
        case DEFINED_DEFINITION_PROPERTY_TYPE.ENUM:
        case DEFINED_DEFINITION_PROPERTY_TYPE.XOR: {
          // an array of an enum spells the values out: `array of "a" | "b"`
          if (property.ofProperty.type === DEFINED_DEFINITION_PROPERTY_TYPE.ENUM) {
            const inline = enumInlineSymbol(property.ofProperty);
            const atomicDefinedSymbol = atomicDefinedPropertySymbol(property);

            if (inline && atomicDefinedSymbol) {
              return [[atomicDefinedSymbol, "of", inline].join(" ")];
            }
          }

          if (property.ofProperty.properties?.length) {
            const atomicDefinedSymbol = atomicDefinedPropertySymbol(property);

            if (atomicDefinedSymbol) {
              let unionSymbol = "";
              if (
                property.ofProperty.type ===
                  DEFINED_DEFINITION_PROPERTY_TYPE.ENUM &&
                property.ofProperty.ofProperty?.type
              ) {
                unionSymbol = groupSymbol({
                  name: "",
                  description: "",
                  type: property.ofProperty.ofProperty?.type,
                  properties: property.ofProperty.properties || [],
                });
              }

              if (!unionSymbol) {
                unionSymbol = groupSymbol({
                  name: "",
                  description: "",
                  type: DEFINED_DEFINITION_PROPERTY_TYPE.UNION,
                  properties: property.ofProperty.properties || [],
                });
              }

              if (unionSymbol?.length && unionSymbol.includes("$$")) {
                return [atomicDefinedSymbol];
              }

              return [[atomicDefinedSymbol, "of", unionSymbol].join(" ")];
            }

            return [property.type, groupSymbol(property.ofProperty)];
          }

          if (property.ofProperty?.ofProperty) {
            return [property.ofProperty?.ofProperty?.type];
          }

          return [];
        }
        default: {
          if (!property.ofProperty.name) {
            const defined = atomicDefinedPropertySymbol(property);
            const symbol = atomicPropertySymbol(property);

            if (symbol?.startsWith?.("$$")) {
              return [property.ofProperty.type];
            }

            const chains = [symbol];

            if (defined) {
              chains.push("of");
            }

            chains.push(groupSymbol(property.ofProperty));

            return chains;
          }

          return [property.ofProperty.type];
        }
      }
    }

    switch (property.type) {
      case (DEFINED_DEFINITION_PROPERTY_TYPE.UNION,
      DEFINED_DEFINITION_PROPERTY_TYPE.XOR): {
        if (property.properties?.length) {
          const respMap = {};
          let resp: string[] = [];
          for (const prop of property.properties) {
            // a branch typed by a component schema reads as that schema
            const linked = linkedSchemaSymbol(prop);
            let symbols = linked ? [linked] : resolvePropertySymbolInner(prop);

            if (prop.ofProperty && symbols.length > 1) {
              symbols = [
                [symbols[0], ...symbols.slice(1, symbols.length)].join(""),
              ];
            }

            resp.push(...symbols);
          }

          let hasOr = false; // TODO: in the future better
          for (const symbol of resp) {
            if (symbol.trim() === "or") {
              hasOr = true;
              break;
            }
            respMap[symbol] = true;
          }

          if (!hasOr) {
            resp = Object.keys(respMap);
          }

          return [resp.join(" or ")];
        }

        break;
      }

      case DEFINED_DEFINITION_PROPERTY_TYPE.ARRAY: {
        return ["array"];
      }

      case DEFINED_DEFINITION_PROPERTY_TYPE.ENUM: {
        return ["enum"];
      }
    }

    if (property.type?.startsWith?.("$$")) {
      return [];
    }

    return [property.type];
  }

  // An enum row prints its values — the one value of a constant (`"widget"`),
  // else the list (`"active" | "archived"`) — in place of the base type; a row
  // typed by a component schema prints that schema's label (`widget`).
  const inline = enumInlineSymbol(property);
  const symbol =
    inline ||
    linkedSchemaSymbol(property) ||
    resolvePropertySymbolInner(property).join(" ");

  // A nullable row reads as a union, `… | null`, whatever its type.
  if (nullableProperty(property)) {
    return symbol ? `${symbol} | null` : "null";
  }

  return symbol;
}

function atomicDefinedPropertySymbol(property: DefinitionProperty): string {
  switch (property.type) {
    case DEFINED_DEFINITION_PROPERTY_TYPE.ARRAY: {
      return "array";
    }
    case DEFINED_DEFINITION_PROPERTY_TYPE.UNION:
    case DEFINED_DEFINITION_PROPERTY_TYPE.ENUM:
    case DEFINED_DEFINITION_PROPERTY_TYPE.XOR: {
      return "";
    }

    default: {
      return "";
    }
  }
}

function groupSymbol(property: DefinitionProperty) {
  const symbol = resolvePropertySymbol(property);
  if (symbol?.startsWith?.("$$")) {
    return "";
  }

  return symbol;
}

function atomicPropertySymbol(property: DefinitionProperty): string {
  const defined = atomicDefinedPropertySymbol(property);

  if (!defined) {
    return property.type;
  }

  return defined;
}

/** The `nullable` meta — a row that also admits `null`. */
export function nullableProperty(property: DefinitionProperty): boolean {
  return (
    property.meta?.some((m) => m.name === "nullable" && m.value === "true") ||
    false
  );
}
