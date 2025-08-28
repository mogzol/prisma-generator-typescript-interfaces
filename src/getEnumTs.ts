import type { DMMF } from "@prisma/generator-helper";
import type { Config } from "./config.js";
import { documentationBlock } from "./utils.js";

/** Get the TypeScript code representing a Prisma Enum */
export function getEnumTs(
  config: Config,
  enumData: DMMF.DatamodelEnum,
  enumNameMap: Map<string, string>,
): string {
  const exportKwd = config.exportEnums ? "export " : "";
  const enumName = enumNameMap.get(enumData.name);
  const documentation = config.includeComments ? documentationBlock(enumData.documentation) : "";

  switch (config.enumType) {
    case "enum": {
      const enumValues = enumData.values.map(({ name }) => `  ${name} = "${name}"`).join(",\n");
      return `${documentation}${exportKwd}enum ${enumName} {\n${enumValues}\n}`;
    }
    case "stringUnion": {
      const enumValues = enumData.values.map(({ name }) => `"${name}"`).join(" | ");
      return `${documentation}${exportKwd}type ${enumName} = ${enumValues};`;
    }
    case "object": {
      const enumValues = enumData.values.map(({ name }) => `  ${name}: "${name}"`).join(",\n");
      const enumObjectName = `${config.enumObjectPrefix}${enumName}${config.enumObjectSuffix}`;
      const enumType = enumData.values.map(({ name }) => `"${name}"`).join(" | ");
      return (
        `${documentation}${exportKwd}type ${enumName} = ${enumType};\n\n` +
        `${exportKwd}const ${enumObjectName} = {\n${enumValues}\n` +
        `} satisfies Record<string, ${enumName}>;`
      );
    }
    default:
      throw new Error(`Unknown enumType: ${config.enumType}`);
  }
}
