type ParsedFieldDocumentation =
  | {
      documentation: string;
      customTypeDefinition: { literal: boolean; typeString: string } | null;
    }
  | undefined;

const customTypeRegex = /^\s*(!?)\[\s*([^\s].*)\]/;

/** Parse a field's documentation string and extract the custom type definition if it exists */
export function parseFieldDocumentation(documentation?: string): ParsedFieldDocumentation {
  if (!documentation) {
    return;
  }
  const docLines = documentation.split("\n");
  const lastLine = docLines[docLines.length - 1];
  const match = customTypeRegex.exec(lastLine);
  return {
    documentation: match ? docLines.slice(0, -1).join("\n") : documentation,
    customTypeDefinition: match
      ? { literal: Boolean(match[1]), typeString: match[2].trim() }
      : null,
  };
}

/** Sort strings based on the current locale */
export const localeSort = (a: string, b: string) => a.localeCompare(b);

/** Convert a documentation string into a multi-line documentation block */
export function documentationBlock(documentation: string | undefined, indent = 0): string {
  if (!documentation) {
    return "";
  }
  const indentation = " ".repeat(indent);
  return (
    ["/**", ...documentation.split("\n").map((line) => " " + `* ${line}`.trim()), " */"]
      .map((line) => `${indentation}${line}`)
      .join("\n") + "\n"
  );
}
