import type { DMMF } from "@prisma/generator-helper";
import type { Config } from "./config.js";

/** Get the Typescript code representing a Prisma Enum */
export function getEnumTs(
  config: Config,
  enumData: DMMF.DatamodelEnum,
  enumNameMap: Map<string, string>,
): string {
  const exportKwd = config.exportEnums ? "export " : "";
  switch (config.enumType) {
    case "enum": {
      const enumValues = enumData.values.map(({ name }) => `  ${name} = "${name}"`).join(",\n");
      return `${exportKwd}enum ${enumNameMap.get(enumData.name)} {\n${enumValues}\n}`;
    }
    case "stringUnion": {
      const enumValues = enumData.values.map(({ name }) => `"${name}"`).join(" | ");
      return `${exportKwd}type ${enumNameMap.get(enumData.name)} = ${enumValues};`;
    }
    case "object": {
      const enumValues = enumData.values.map(({ name }) => `  ${name}: "${name}"`).join(",\n");
      const enumName = enumNameMap.get(enumData.name);
      const enumObjectName = `${config.enumObjectPrefix}${enumName}${config.enumObjectSuffix}`;
      const enumType = enumData.values.map(({ name }) => `"${name}"`).join(" | ");
      return `${exportKwd}type ${enumName} = ${enumType};\n\n${exportKwd}const ${enumObjectName} = {\n${enumValues}\n} satisfies Record<string, ${enumName}>;`;
    }
    default:
      throw new Error(`Unknown enumType: ${config.enumType}`);
  }
}
