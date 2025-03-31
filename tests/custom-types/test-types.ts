// Verify that we can import all the files that contain imports, which will verify that their import
// statements are working.
import * as importedTypes from "./__TEST_TMP__/importedTypes.js";
import * as reusedImportedType from "./__TEST_TMP__/reusedImportedType.js";
import * as importSorting from "./__TEST_TMP__/importSorting.js";

console.log(importedTypes, reusedImportedType, importSorting);
