require('./sourcemap-register.js');/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 711:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.findReleaseFiles = findReleaseFiles;
const fs_1 = __importDefault(__nccwpck_require__(896));
function findReleaseFiles(releaseDir) {
    const releaseFiles = fs_1.default
        .readdirSync(releaseDir, { withFileTypes: true })
        .filter(item => !item.isDirectory())
        .filter(item => item.name.endsWith('.apk') || item.name.endsWith('.aab'));
    console.log(`Found ${releaseFiles.length} release files.`);
    if (releaseFiles.length > 0) {
        return releaseFiles;
    }
}


/***/ }),

/***/ 730:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const core = __importStar(__nccwpck_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@actions/core'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())));
const signing_1 = __nccwpck_require__(856);
const path_1 = __importDefault(__nccwpck_require__(928));
const fs_1 = __importDefault(__nccwpck_require__(896));
const ioUtils = __importStar(__nccwpck_require__(711));
const io = __importStar(__nccwpck_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@actions/io'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())));
async function run() {
    try {
        if (process.env.DEBUG_ACTION === 'true') {
            core.debug('DEBUG FLAG DETECTED, SHORTCUTTING ACTION.');
            return;
        }
        const releaseDir = core.getInput('releaseDir')
            ? core.getInput('releaseDir')
            : process.env.ANDROID_RELEASE_DIR;
        const signingKeyBase64 = core.getInput('signingKey')
            ? core.getInput('signingKey')
            : process.env.ANDROID_SIGNING_KEY;
        const alias = core.getInput('keyAlias')
            ? core.getInput('keyAlias')
            : process.env.ANDROID_KEY_ALIAS;
        const keyStorePassword = core.getInput('keyStorePassword')
            ? core.getInput('keyStorePassword')
            : process.env.ANDROID_KEYSTORE_PASSWORD;
        const keyPassword = core.getInput('keyPassword')
            ? core.getInput('keyPassword')
            : process.env.ANDROID_KEY_PASSWORD;
        const appName = core.getInput('appName')
            ? core.getInput('appName')
            : process.env.ANDROID_APP_NAME;
        const appVersion = core.getInput('appVersion')
            ? core.getInput('appVersion')
            : process.env.ANDROID_APP_VERSION;
        const appPrefix = core.getInput('appPrefix')
            ? core.getInput('appPrefix')
            : process.env.ANDROID_APP_PREFIX;
        if (!releaseDir ||
            !signingKeyBase64 ||
            !alias ||
            !keyStorePassword ||
            !keyPassword) {
            throw new Error('Missing required input(s).');
        }
        console.log(`Preparing to sign key @ ${releaseDir} with provided signing key`);
        const releaseFiles = ioUtils.findReleaseFiles(releaseDir);
        if (releaseFiles && releaseFiles.length > 0) {
            const signingKey = path_1.default.join(releaseDir, 'signingKey.jks');
            saveSigningKey(signingKey, signingKeyBase64);
            let signedReleaseFiles = await signReleaseFiles(releaseFiles, releaseDir, signingKey, alias, keyStorePassword, keyPassword);
            if (appName || appVersion || appPrefix) {
                console.log('Renaming signed release files...');
                signedReleaseFiles = await renameSignedReleaseFiles(signedReleaseFiles, appName, appVersion, appPrefix);
            }
            setOutputVariables(signedReleaseFiles);
            console.log('Releases signed!');
        }
        else {
            throw new Error('No release files (.apk or .aab) could be found.');
        }
    }
    catch (error) {
        handleError(error);
    }
}
async function renameSignedReleaseFiles(signedReleaseFiles, name = 'app', version, prefix) {
    const architectures = [
        'arm64-v8a',
        'armeabi-v7a',
        'x86',
        'x86_64',
        'universal'
    ];
    const renamedFiles = [];
    for (const file of signedReleaseFiles) {
        const ext = path_1.default.extname(file);
        const archMatch = architectures.find(arch => file.includes(arch));
        const architecture = archMatch ? archMatch : '';
        let newFilename;
        if (signedReleaseFiles.length === 1 && !architecture) {
            newFilename = `${prefix ? `${prefix}-` : ''}${name}${version ? `-${version}` : ''}${ext}`;
        }
        else {
            newFilename = `${prefix ? `${prefix}-` : ''}${name}${version ? `-${version}` : ''}${architecture ? `-${architecture}` : ''}${ext}`;
        }
        const dir = path_1.default.dirname(file);
        let newFilePath = path_1.default.join(dir, newFilename);
        // check if file with newFilePath name already exist
        let duplicateIndex = 1;
        while (fs_1.default.existsSync(newFilePath)) {
            console.error('File already exists:', newFilePath);
            newFilePath = `${path_1.default.join(dir, path_1.default.parse(newFilePath).name)}-${duplicateIndex++}${ext}`;
        }
        await io.mv(file, newFilePath);
        console.log(`Renamed ${file} to ${newFilePath}`);
        renamedFiles.push(newFilePath);
    }
    return renamedFiles;
}
function saveSigningKey(signingKeyPath, signingKeyBase64) {
    try {
        fs_1.default.writeFileSync(signingKeyPath, signingKeyBase64, 'base64');
    }
    catch (error) {
        throw new Error(`Failed to save signing key: ${error.message}`);
    }
}
async function signReleaseFiles(releaseFiles, releaseDir, signingKey, alias, keyStorePassword, keyPassword) {
    const signedReleaseFiles = [];
    let index = 0;
    for (const releaseFile of releaseFiles) {
        core.debug(`Found release to sign: ${releaseFile.name}`);
        const releaseFilePath = path_1.default.join(releaseDir, releaseFile.name);
        let signedReleaseFile = '';
        console.log('Working on', releaseFile.name, '...');
        try {
            if (releaseFile.name.endsWith('.apk')) {
                signedReleaseFile = await (0, signing_1.signApkFile)(releaseFilePath, signingKey, alias, keyStorePassword, keyPassword);
            }
            else if (releaseFile.name.endsWith('.aab')) {
                signedReleaseFile = await (0, signing_1.signAabFile)(releaseFilePath, signingKey, alias, keyStorePassword, keyPassword);
            }
            else {
                throw new Error(`Unsupported file format: ${releaseFile.name}`);
            }
        }
        catch (error) {
            throw new Error(`Failed to sign file ${releaseFile.name}: ${error.message}`);
        }
        core.exportVariable(`ANDROID_SIGNED_FILE_${index}`, signedReleaseFile);
        core.setOutput(`signedFile${index}`, signedReleaseFile);
        signedReleaseFiles.push(signedReleaseFile);
        index++;
    }
    return signedReleaseFiles;
}
function setOutputVariables(signedReleaseFiles) {
    core.exportVariable('ANDROID_SIGNED_FILES', signedReleaseFiles.join(':'));
    core.setOutput('signedFiles', signedReleaseFiles.join(':'));
    core.exportVariable('ANDROID_SIGNED_FILES_COUNT', `${signedReleaseFiles.length}`);
    core.setOutput('signedFilesCount', `${signedReleaseFiles.length}`);
    if (signedReleaseFiles.length === 1) {
        core.exportVariable('ANDROID_SIGNED_FILE', signedReleaseFiles[0]);
        core.setOutput('signedFile', signedReleaseFiles[0]);
    }
}
function handleError(error) {
    if (error instanceof Error) {
        core.setFailed(error.message);
    }
    else {
        core.setFailed('An unknown error occurred.');
        console.error(error);
    }
}
run();


/***/ }),

/***/ 856:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.signApkFile = signApkFile;
exports.signAabFile = signAabFile;
const exec = __importStar(__nccwpck_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@actions/exec'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())));
const core = __importStar(__nccwpck_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@actions/core'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())));
const io = __importStar(__nccwpck_require__(Object(function webpackMissingModule() { var e = new Error("Cannot find module '@actions/io'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())));
const path = __importStar(__nccwpck_require__(928));
const fs = __importStar(__nccwpck_require__(896));
async function signApkFile(apkFile, signingKeyFile, alias, keyStorePassword, keyPassword) {
    try {
        console.log('::group::Zipaligning APK file');
        const buildToolsPath = await getBuildToolsPath();
        const zipAlign = path.join(buildToolsPath, 'zipalign');
        core.debug(`Found 'zipalign' @ ${zipAlign}`);
        const alignedApkFile = await alignApkFile(apkFile, zipAlign);
        console.log('::endgroup::');
        console.log('::group::Signing APK file');
        const apkSigner = path.join(buildToolsPath, 'apksigner');
        core.debug(`Found 'apksigner' @ ${apkSigner}`);
        const signedApkFile = await signFile(apkSigner, alignedApkFile, signingKeyFile, alias, keyStorePassword, keyPassword, apkFile, '-signed.apk');
        console.log('::endgroup::');
        console.log('::group::Verifying Signed APK');
        await verifySignedFile(apkSigner, signedApkFile);
        console.log('::endgroup::');
        return signedApkFile;
    }
    catch (error) {
        console.log('::endgroup::');
        core.setFailed(`Failed to sign APK file: ${error.message}`);
        throw error;
    }
}
async function signAabFile(aabFile, signingKeyFile, alias, keyStorePassword, keyPassword) {
    try {
        console.log('::group::Signing AAB file');
        const jarSignerPath = await io.which('jarsigner', true);
        core.debug(`Found 'jarsigner' @ ${jarSignerPath}`);
        const args = [
            '-keystore',
            signingKeyFile,
            '-storepass',
            keyStorePassword,
            ...(keyPassword ? ['-keypass', keyPassword] : []),
            aabFile,
            alias
        ];
        await exec.exec(`"${jarSignerPath}"`, args);
        console.log('::endgroup::');
        return aabFile;
    }
    catch (error) {
        console.log('::endgroup::');
        core.setFailed(`Failed to sign AAB file: ${error.message}`);
        throw error;
    }
}
async function getBuildToolsPath() {
    const androidHome = process.env.ANDROID_HOME;
    if (!androidHome) {
        throw new Error('ANDROID_HOME environment variable is not set.');
    }
    const buildToolsDir = path.join(androidHome, 'build-tools');
    let buildToolsVersion = '';
    if (!(core.getInput('buildToolsVersion') ||
        process.env.ANDROID_BUILD_TOOLS_VERSION)) {
        console.log('Build tools version is not specified. AUTO-DETECTING...');
        try {
            const options = {
                listeners: {
                    stdout: (data) => {
                        buildToolsVersion += data.toString();
                    }
                }
            };
            await exec.exec('ls', [buildToolsDir], options);
            const versions = buildToolsVersion.trim().split('\n');
            buildToolsVersion = versions[versions.length - 1];
            console.log('Found! Build tools version', buildToolsVersion);
        }
        catch {
            throw new Error('Failed to detect Android build tools version.');
        }
    }
    const buildToolsPath = path.join(buildToolsDir, buildToolsVersion);
    if (!fs.existsSync(buildToolsPath)) {
        throw new Error(`Couldn't find the Android build tools @ ${buildToolsPath}`);
    }
    return buildToolsPath;
}
async function alignApkFile(apkFile, zipAlign) {
    const alignedApkFile = apkFile.replace('.apk', '-aligned.apk');
    await exec.exec(`"${zipAlign}"`, ['-c', '-v', '4', apkFile]);
    await exec.exec(`"cp"`, [apkFile, alignedApkFile]);
    return alignedApkFile;
}
async function signFile(signerPath, fileToSign, signingKeyFile, alias, keyStorePassword, keyPassword, originalFile, fileExtension) {
    const signedFile = originalFile.replace('.apk', fileExtension);
    const args = [
        'sign',
        '--ks',
        signingKeyFile,
        '--ks-key-alias',
        alias,
        '--ks-pass',
        `pass:${keyStorePassword}`,
        '--out',
        signedFile,
        ...(keyPassword ? ['--key-pass', `pass:${keyPassword}`] : []),
        fileToSign
    ];
    await exec.exec(`"${signerPath}"`, args);
    return signedFile;
}
async function verifySignedFile(signerPath, signedFile) {
    await exec.exec(`"${signerPath}"`, ['verify', signedFile]);
}


/***/ }),

/***/ 896:
/***/ ((module) => {

module.exports = require("fs");

/***/ }),

/***/ 928:
/***/ ((module) => {

module.exports = require("path");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId].call(module.exports, module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __nccwpck_require__(730);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;
//# sourceMappingURL=index.js.map