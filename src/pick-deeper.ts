import pickDeep from 'pick-deep';

type JsonValue =
  | boolean
  | number
  | string
  | null
  | undefined
  | JsonArray
  | JsonMap;

interface JsonMap {
  [key: string]: JsonValue;
}

interface JsonArray extends Array<JsonValue> {}

interface StringArrayMap {
  [key: string]: string[];
}

/**
 * Used to divide the array.
 * E.g. `"a.*.b"` picks all of the `b`s in the objects in the array `a`.
 */
const ARRAY_PATH_DIVIDER = '.*.';

/**
 * A _.pick that supports arrays and picking beside level 1.
 *
 * @param obj The object to pick from.
 * @param paths The paths of the properties to keep.
 * E.g. [`createdAt`, `profile.name`, `posts.*.title`] picks the
 * `createdAt` property at level 1, the `name` property inside the `profile` object
 * and the `title` properties inside the objects inside the `posts` array.
 */
export const pickDeeper = (obj: JsonMap, paths: string[]) => {
  // Distinguish between paths that contain an array and paths that don't.
  const arrayPaths = paths.filter(isArrayPath);
  const nonArrayPaths = paths.filter((path) => !isArrayPath(path));

  // Small data-structure to better parse the array props.
  // Pairs every array key with the properties that need
  // to be picked form that array.
  const arrayPathsMap = arrayPaths.reduce<StringArrayMap>((acc, arrayPath) => {
    const [arrayName, propName] = splitOnFirstOccurrence(
      arrayPath,
      ARRAY_PATH_DIVIDER
    );
    acc[arrayName] = [...(acc[arrayName] || []), propName];
    return acc;
  }, {});

  // For paths that don't contain an array, just pick those properties with pickDeep.
  const result = pickDeep(obj, nonArrayPaths);

  // For paths that contain an array, add an array that contains the properties
  // picked by pickDeeper. (recursive step)
  for (const key of Object.keys(arrayPathsMap)) {
    // No key should show up when the intended array path is not actually the path
    // of an array.
    // E.g. If `props` contains `a.*.b`, it means user wants all of the
    // `b` properties inside of the array `a`. Now, if `a` is not an array, the prop
    // `a` is skimmed out of the input object.
    if (!Array.isArray(obj[key])) continue;

    // Add an array that contains the properties picked by pickDeeper.
    result[key] = (obj[key] as JsonArray).map((jsonValue) => {
      // If `paths` contains `a.*.b`, and `obj.a` contains values that are not
      // objects, skim those values out, since natives can't have a `b` property.
      // In objects, we can just not included those properties, in arrays,
      // we include them as `undefined` to preserve the array's structure.
      if (typeof jsonValue !== 'object') return undefined;

      return pickDeeper(jsonValue as JsonMap, arrayPathsMap[key]);
    });
  }

  return result;
};

/**
 * Returns true if the given property path has an array in it,
 * otherwise false.
 */
const isArrayPath = (propertyPath: string) =>
  propertyPath.includes(ARRAY_PATH_DIVIDER);

/**
 * Split a string with `divider` only on first occurrence.
 */
const splitOnFirstOccurrence = (str: string, divider: string) => {
  const parts = str.split(divider);
  return [parts[0], parts.slice(1).join(divider)];
};
