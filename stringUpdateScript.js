fs = require('fs');
var parsedDatasetTree = JSON.parse(fs.readFileSync('./out/src/DatasetTree.nls.metadata.json').toString());
var keysPairsDatasetTree = {};
var parsedExtension = JSON.parse(fs.readFileSync('./out/src/extension.nls.metadata.json').toString());
var keysPairsExtension = {};
var parsedProfileLoader = JSON.parse(fs.readFileSync('./out/src/ProfileLoader.nls.metadata.json').toString());
var keysPairsProfileLoader = {};
var parsedUSSTree = JSON.parse(fs.readFileSync('./out/src/USSTree.nls.metadata.json').toString());
var keysPairsUSSTree = {};
var parsedUssNodeActions = JSON.parse(fs.readFileSync('./out/src/uss/ussNodeActions.nls.metadata.json').toString());
var keysPairsUssNodeActions = {};
var parsedZoweNode = JSON.parse(fs.readFileSync('./out/src/ZoweNode.nls.metadata.json').toString());
var keysPairsZoweNode = {};
var parsedZoweUSSNode = JSON.parse(fs.readFileSync('./out/src/ZoweUSSNode.nls.metadata.json').toString());
var keysPairsZoweUSSNode = {};
var keysPairsPackage = JSON.parse(fs.readFileSync('./package.nls.json').toString());

parsedDatasetTree.keys.forEach((key, i) => keysPairsDatasetTree[key] = parsedDatasetTree.messages[i]); 
parsedExtension.keys.forEach((key, i) => keysPairsExtension[key] = parsedExtension.messages[i]); 
parsedProfileLoader.keys.forEach((key, i) => keysPairsProfileLoader[key] = parsedProfileLoader.messages[i]); 
parsedUSSTree.keys.forEach((key, i) => keysPairsUSSTree[key] = parsedUSSTree.messages[i]); 
parsedUssNodeActions.keys.forEach((key, i) => keysPairsUssNodeActions[key] = parsedUssNodeActions.messages[i]); 
parsedZoweNode.keys.forEach((key, i) => keysPairsZoweNode[key] = parsedZoweNode.messages[i]); 
parsedZoweUSSNode.keys.forEach((key, i) => keysPairsZoweUSSNode[key] = parsedZoweUSSNode.messages[i]); 

fs.writeFileSync('./i18n/sample/src/DatasetTree.i18n.json', JSON.stringify(keysPairsDatasetTree, null, 4));
fs.writeFileSync('./i18n/sample/src/extension.i18n.json', JSON.stringify(keysPairsExtension, null, 4));
fs.writeFileSync('./i18n/sample/src/ProfileLoader.i18n.json', JSON.stringify(keysPairsProfileLoader, null, 4));
fs.writeFileSync('./i18n/sample/src/USSTree.i18n.json', JSON.stringify(keysPairsUSSTree, null, 4));
fs.writeFileSync('./i18n/sample/src/uss/ussNodeActions.i18n.json', JSON.stringify(keysPairsUssNodeActions, null, 4));
fs.writeFileSync('./i18n/sample/src/ZoweNode.i18n.json', JSON.stringify(keysPairsZoweNode, null, 4));
fs.writeFileSync('./i18n/sample/src/ZoweUSSNode.i18n.json', JSON.stringify(keysPairsZoweUSSNode, null, 4));
fs.writeFileSync('./i18n/sample/package.i18n.json', JSON.stringify(keysPairsPackage, null, 4));