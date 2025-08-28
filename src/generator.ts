import generatorHelper from "@prisma/generator-helper";
import { mkdir, writeFile } from "node:fs/promises";
import { getConfig } from "./config.js";
import { CustomTypes } from "./customTypes.js";
import { getEnumTs } from "./getEnumTs.js";
import { getModelTs } from "./getModelTs.js";

// Due to how some versions of "@prisma/generator-helper" are built, there are issues if we try to
// import "generatorHandler" directly, so instead we import the default export and destructure it.
const { generatorHandler } = generatorHelper;

class PrismaGeneratorTypescriptInterfacesError extends Error {
  constructor(public wrappedError: unknown) {
    super(
      "prisma-generator-typescript-interfaces error: " +
        (wrappedError instanceof Error ? wrappedError.message : String(wrappedError)),
    );
  }
}

async function onGenerate(options: generatorHelper.GeneratorOptions) {
  const config = await getConfig(options);

  const datamodel = options.dmmf.datamodel;
  const models = datamodel.models;
  const enums = datamodel.enums;
  const types = datamodel.types;
  const customTypes = new CustomTypes(config, datamodel);

  const enumNameMap = new Map<string, string>(
    enums.map((e) => [e.name, `${config.enumPrefix}${e.name}${config.enumSuffix}`]),
  );
  const modelNameMap = new Map<string, string>(
    models.map((m) => [m.name, `${config.modelPrefix}${m.name}${config.modelSuffix}`]),
  );
  const typeNameMap = new Map<string, string>(
    types.map((t) => [t.name, `${config.typePrefix}${t.name}${config.typeSuffix}`]),
  );

  const enumsTs = enums.map((e) => getEnumTs(config, e, enumNameMap));
  // Types and Models are essentially the same thing, so we can run both through getModelTs
  const modelsTs = [...models, ...types].map((m) =>
    getModelTs(config, m, modelNameMap, enumNameMap, typeNameMap, customTypes),
  );
  const typeDefinitionsTs = customTypes.getTypeDefinitions();

  let ts =
    [customTypes.getTypeImports(), ...enumsTs, ...modelsTs, ...typeDefinitionsTs]
      .filter((v) => v !== null)
      .join("\n\n") + "\n";

  if (config.headerComment) {
    const headerContent = config.headerComment
      .split("\n")
      .map((line) => `// ${line}`)
      .join("\n");
    ts = `${headerContent}\n\n${ts}`;
  }

  if (config.prettier) {
    // Prettier is imported inside this if so that it's not a required dependency
    let prettier: typeof import("prettier");
    try {
      prettier = await import("prettier");
    } catch {
      throw new Error("Unable import Prettier. Is it installed?");
    }

    const prettierOptions =
      config.prettierConfigPath === null
        ? null
        : config.prettierConfigPath === ""
          ? // Resolve config file relative to the output file (this is the default behavior)
            await prettier.resolveConfig(config.outputFile)
          : // Don't search for the config file, just use prettierConfigPath directly
            await prettier.resolveConfig("", { config: config.prettierConfigPath });

    ts = await prettier.format(ts, { ...prettierOptions, parser: "typescript" });
  }

  await mkdir(config.outputDir, { recursive: true });
  await writeFile(config.outputFile, ts);
}

generatorHandler({
  onManifest() {
    return {
      prettyName: "TypeScript Interfaces",
      defaultOutput: "interfaces.ts",
    };
  },
  async onGenerate(options) {
    // Wrap errors to include the generator name to make it clearer where they're coming from
    try {
      await onGenerate(options);
    } catch (e) {
      throw new PrismaGeneratorTypescriptInterfacesError(e);
    }
  },
});
