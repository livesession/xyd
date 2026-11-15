import React from "react";

import { MDXCommonAtlasProps } from "./types";
import { AtlasDecorator } from "./AtlasDecorator";
import { AtlasPrimary } from "./AtlasPrimary";
import { AtlasSecondary } from "./AtlasSecondary";

import * as cn from "./Atlas.styles";
import { UXAnalytics } from "openux-js";

interface AtlasProps<T> extends MDXCommonAtlasProps<T> {
  kind: "secondary" | "primary" | undefined | null;
  analytics?: boolean;
}

const noopAnalytics = {
  track: () => {},
};

export function Atlas<T>(props: AtlasProps<T>) {
  let AtlasComponent: React.FC<MDXCommonAtlasProps<T>>;

  if (props.kind === "secondary") {
    AtlasComponent = AtlasSecondary;
  } else {
    AtlasComponent = AtlasPrimary;
  }

  let references = props.references;
  {
    // TODO: find better solution - if we pass from md then its string
    if (references && typeof references === "string") {
      // TODO: DO IT BETTER
      try {
        references = JSON.parse(references);
      } catch (error) {
        console.error("Error parsing references", error);
      }
    }
  }

  const atlas = (
    <AtlasDecorator>
      <div className={cn.AtlasHost}>
        <AtlasComponent
          references={references}
          apiRefItemKind={props.apiRefItemKind}
        />
      </div>
    </AtlasDecorator>
  );

  // TODO: temporary, remove when we will have proper analytics
  // Only the analytics provider takes `analytics`: a Fragment accepts nothing
  // but `key` and `children`, and React warns on every render otherwise.
  if (props.analytics) {
    return <UXAnalytics analytics={noopAnalytics}>{atlas}</UXAnalytics>;
  }

  return atlas;
}
