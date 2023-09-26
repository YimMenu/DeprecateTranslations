import fs from "fs";

/**
 * @param {string} directory The root directory to recursively grab files from.
 * @param {string[]} extensions The extensions to include
 */
const grabSourceFiles = (directory, extensions) => {
    if (!directory.endsWith('/'))
        directory += '/';

    const files = fs.readdirSync(directory);
    let collectedFiles = [];
    for (const file of files)
    {
        if (file.includes('.') && extensions.includes(file.split('.').slice(-1)[0]))
        {
            collectedFiles.push(directory + file);
        }

        if (fs.lstatSync(directory + file).isDirectory())
        {
            collectedFiles = collectedFiles.concat(grabSourceFiles(directory + file, extensions));
        }
    }

    return collectedFiles;
};

/**
 * @param {string[]} files Files to preload the contents of
 * @returns {string[]} File contents
 */
const preloadFileContents = (files) => {
    const preloadedFiles = [];
    for (const file of files) {
        preloadedFiles.push(fs.readFileSync(file, 'utf-8'));
    }
    return preloadedFiles;
}

/**
 * @param {string[]} fileContents Source file contents to check against
 * @param {string} str String to check if it exist
 */
const doesStrExistInSource = (fileContents, str) => {
    for (const contents of fileContents)
    {
        if (str.startsWith("GUI_TAB_"))
        {
            str = `TAB_DECL(${str.replace('GUI_TAB_', '')})`;
        }
        if (contents.includes(str))
        {
            return true;
        }
    }

    return false;
}

const sourceFiles = grabSourceFiles('./src/', [ 'cpp', 'hpp' ]);
console.log(`Collected ${sourceFiles.length} source files.`);
const preloadedFiles = preloadFileContents(sourceFiles);
console.log("Finished preloading files into memory.");

const json = JSON.parse(fs.readFileSync('./data/en_US.json', 'utf-8'));
const translationKeys = Object.keys(json);
console.log(`Loaded ${translationKeys.length} from en_US.json.`);

/**
 * @type {string[]}
 */
let deprecatedStrs = [];
for (const key of translationKeys)
{
    if (!doesStrExistInSource(preloadedFiles, key))
    {
        deprecatedStrs.push(key);
    }
}
console.log(`Finished checking for deprecated keys, found ${deprecatedStrs.length} deprecated keys.`);
console.log(`Deprecation percentage of ${(deprecatedStrs.length / translationKeys.length * 100).toFixed(2)}%`);

console.log("Dumping deprecated keys...");
fs.writeFileSync('./data/deprecated.json', JSON.stringify(deprecatedStrs, null, 4));
