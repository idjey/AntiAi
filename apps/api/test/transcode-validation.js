"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var child_process_1 = require("child_process");
var phash_1 = require("@antiai/phash");
var fs = __importStar(require("fs"));
var path = __importStar(require("path"));
var THRESHOLD = 12;
var ANCHORS = [0.2, 0.5, 0.8];
function getVideoDuration(filePath) {
    return __awaiter(this, void 0, void 0, function () {
        var output;
        return __generator(this, function (_a) {
            output = (0, child_process_1.execSync)("ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 \"".concat(filePath, "\""), { encoding: 'utf8' });
            return [2 /*return*/, parseFloat(output.trim())];
        });
    });
}
function extractFrameBuffer(videoPath, time) {
    return __awaiter(this, void 0, void 0, function () {
        var tempFile, buffer;
        return __generator(this, function (_a) {
            tempFile = path.join(process.cwd(), "temp_".concat(Date.now(), "_").concat(Math.random(), ".png"));
            try {
                (0, child_process_1.execSync)("ffmpeg -y -ss ".concat(time, " -i \"").concat(videoPath, "\" -vframes 1 -q:v 2 \"").concat(tempFile, "\""), { stdio: 'ignore' });
                buffer = fs.readFileSync(tempFile);
                return [2 /*return*/, buffer];
            }
            finally {
                if (fs.existsSync(tempFile))
                    fs.unlinkSync(tempFile);
            }
            return [2 /*return*/];
        });
    });
}
function computeVideoHashes(videoPath) {
    return __awaiter(this, void 0, void 0, function () {
        var duration, hashes, _i, ANCHORS_1, fraction, time, frameBuffer, hash;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getVideoDuration(videoPath)];
                case 1:
                    duration = _a.sent();
                    hashes = [];
                    _i = 0, ANCHORS_1 = ANCHORS;
                    _a.label = 2;
                case 2:
                    if (!(_i < ANCHORS_1.length)) return [3 /*break*/, 6];
                    fraction = ANCHORS_1[_i];
                    time = duration * fraction;
                    return [4 /*yield*/, extractFrameBuffer(videoPath, time)];
                case 3:
                    frameBuffer = _a.sent();
                    return [4 /*yield*/, (0, phash_1.computePhash)(frameBuffer)];
                case 4:
                    hash = _a.sent();
                    hashes.push({ fraction: fraction, hash: hash });
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 2];
                case 6: return [2 /*return*/, hashes];
            }
        });
    });
}
function runSimulated() {
    return __awaiter(this, void 0, void 0, function () {
        var corpusDir, files, allOrigHashes, _i, files_1, file, originalPath, origHashes, variants, results, _loop_1, _a, variants_1, variant, _b, results_1, res, i, _loop_2, j;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    console.log('--- RUNNING SIMULATED CORPUS ---');
                    corpusDir = path.join(__dirname, 'corpus');
                    if (!fs.existsSync(corpusDir)) {
                        console.error('Corpus directory not found:', corpusDir);
                        return [2 /*return*/];
                    }
                    files = fs.readdirSync(corpusDir).filter(function (f) { return f.endsWith('.mp4') && !f.includes('_1080p') && !f.includes('_720p') && !f.includes('_480p'); });
                    allOrigHashes = [];
                    _i = 0, files_1 = files;
                    _c.label = 1;
                case 1:
                    if (!(_i < files_1.length)) return [3 /*break*/, 8];
                    file = files_1[_i];
                    console.log("\nProcessing Original: ".concat(file));
                    originalPath = path.join(corpusDir, file);
                    return [4 /*yield*/, computeVideoHashes(originalPath)];
                case 2:
                    origHashes = _c.sent();
                    allOrigHashes.push({ file: file, hashes: origHashes });
                    variants = [
                        { name: '1080p', scale: '1920:1080', crf: 23 },
                        { name: '720p', scale: '1280:720', crf: 28 },
                        { name: '480p', scale: '854:480', crf: 32 }
                    ];
                    results = [];
                    _loop_1 = function (variant) {
                        var variantPath, varHashes, distances, matchingAnchors, isMatch;
                        return __generator(this, function (_d) {
                            switch (_d.label) {
                                case 0:
                                    variantPath = path.join(corpusDir, "".concat(file, "_").concat(variant.name, ".mp4"));
                                    console.log("  Generating ".concat(variant.name, " variant..."));
                                    (0, child_process_1.execSync)("ffmpeg -y -i \"".concat(originalPath, "\" -vf scale=").concat(variant.scale, " -c:v libx264 -crf ").concat(variant.crf, " -preset fast -c:a copy \"").concat(variantPath, "\""), { stdio: 'ignore' });
                                    return [4 /*yield*/, computeVideoHashes(variantPath)];
                                case 1:
                                    varHashes = _d.sent();
                                    distances = origHashes.map(function (orig, i) { return (0, phash_1.hammingDistance)(orig.hash, varHashes[i].hash); });
                                    matchingAnchors = distances.filter(function (d) { return d <= THRESHOLD; }).length;
                                    isMatch = matchingAnchors >= 2;
                                    results.push({ name: variant.name, distances: distances, isMatch: isMatch });
                                    // Cleanup simulated variant
                                    fs.unlinkSync(variantPath);
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _a = 0, variants_1 = variants;
                    _c.label = 3;
                case 3:
                    if (!(_a < variants_1.length)) return [3 /*break*/, 6];
                    variant = variants_1[_a];
                    return [5 /*yield**/, _loop_1(variant)];
                case 4:
                    _c.sent();
                    _c.label = 5;
                case 5:
                    _a++;
                    return [3 /*break*/, 3];
                case 6:
                    // Print Markdown Table
                    console.log('\n| Variant | Anchor 0.2 Dist | Anchor 0.5 Dist | Anchor 0.8 Dist | Match (Y/N) |');
                    console.log('|---------|-----------------|-----------------|-----------------|-------------|');
                    for (_b = 0, results_1 = results; _b < results_1.length; _b++) {
                        res = results_1[_b];
                        console.log("| ".concat(res.name.padEnd(7), " | ").concat(res.distances[0].toString().padEnd(15), " | ").concat(res.distances[1].toString().padEnd(15), " | ").concat(res.distances[2].toString().padEnd(15), " | ").concat(res.isMatch ? 'Y' : 'N', "           |"));
                    }
                    _c.label = 7;
                case 7:
                    _i++;
                    return [3 /*break*/, 1];
                case 8:
                    console.log('\n--- CROSS-CLIP COLLISION MATRIX ---');
                    console.log('| Video A | Video B | Min Anchor Distance | Pass (> 12) |');
                    console.log('|---------|---------|---------------------|-------------|');
                    for (i = 0; i < allOrigHashes.length; i++) {
                        _loop_2 = function (j) {
                            var clipA = allOrigHashes[i];
                            var clipB = allOrigHashes[j];
                            var distances = clipA.hashes.map(function (hashA, k) { return (0, phash_1.hammingDistance)(hashA.hash, clipB.hashes[k].hash); });
                            var minDistance = Math.min.apply(Math, distances);
                            var pass = minDistance > THRESHOLD;
                            console.log("| ".concat(clipA.file.padEnd(7), " | ").concat(clipB.file.padEnd(7), " | ").concat(minDistance.toString().padEnd(19), " | ").concat(pass ? 'Y' : 'N', "           |"));
                        };
                        for (j = i + 1; j < allOrigHashes.length; j++) {
                            _loop_2(j);
                        }
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function runSpotCheck(originalFile, variantFiles) {
    return __awaiter(this, void 0, void 0, function () {
        var origHashes, results, _loop_3, _i, variantFiles_1, variantFile, _a, results_2, res;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log('--- RUNNING REAL YOUTUBE SPOT-CHECK ---');
                    console.log("Original: ".concat(originalFile));
                    return [4 /*yield*/, computeVideoHashes(originalFile)];
                case 1:
                    origHashes = _b.sent();
                    results = [];
                    _loop_3 = function (variantFile) {
                        var varHashes, distances, matchingAnchors, isMatch, name_1;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    console.log("\nEvaluating real variant: ".concat(variantFile));
                                    return [4 /*yield*/, computeVideoHashes(variantFile)];
                                case 1:
                                    varHashes = _c.sent();
                                    distances = origHashes.map(function (orig, i) { return (0, phash_1.hammingDistance)(orig.hash, varHashes[i].hash); });
                                    matchingAnchors = distances.filter(function (d) { return d <= THRESHOLD; }).length;
                                    isMatch = matchingAnchors >= 2;
                                    name_1 = path.basename(variantFile);
                                    results.push({ name: name_1, distances: distances, isMatch: isMatch });
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, variantFiles_1 = variantFiles;
                    _b.label = 2;
                case 2:
                    if (!(_i < variantFiles_1.length)) return [3 /*break*/, 5];
                    variantFile = variantFiles_1[_i];
                    return [5 /*yield**/, _loop_3(variantFile)];
                case 3:
                    _b.sent();
                    _b.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5:
                    console.log('\n| Variant | Anchor 0.2 Dist | Anchor 0.5 Dist | Anchor 0.8 Dist | Match (Y/N) |');
                    console.log('|---------|-----------------|-----------------|-----------------|-------------|');
                    for (_a = 0, results_2 = results; _a < results_2.length; _a++) {
                        res = results_2[_a];
                        console.log("| ".concat(res.name.padEnd(25), " | ").concat(res.distances[0].toString().padEnd(15), " | ").concat(res.distances[1].toString().padEnd(15), " | ").concat(res.distances[2].toString().padEnd(15), " | ").concat(res.isMatch ? 'Y' : 'N', "           |"));
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function runRealCorpus() {
    return __awaiter(this, void 0, void 0, function () {
        var corpusDir, originalFiles, allOrigHashes, _loop_4, _i, originalFiles_1, file, i, _loop_5, j;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('--- RUNNING REAL YOUTUBE CORPUS ---');
                    corpusDir = path.join(__dirname, 'corpus');
                    if (!fs.existsSync(corpusDir)) {
                        console.error('Corpus directory not found:', corpusDir);
                        return [2 /*return*/];
                    }
                    originalFiles = fs.readdirSync(corpusDir).filter(function (f) { return f.endsWith('.mp4') && !f.includes('_yt_') && !f.includes('_1080p') && !f.includes('_720p') && !f.includes('_480p'); });
                    allOrigHashes = [];
                    _loop_4 = function (file) {
                        var originalPath, origHashes, baseName, allFiles, ytVariants, results, _loop_6, _b, ytVariants_1, ytFile, _c, results_3, res;
                        return __generator(this, function (_d) {
                            switch (_d.label) {
                                case 0:
                                    console.log("\nProcessing Real Original: ".concat(file));
                                    originalPath = path.join(corpusDir, file);
                                    return [4 /*yield*/, computeVideoHashes(originalPath)];
                                case 1:
                                    origHashes = _d.sent();
                                    allOrigHashes.push({ file: file, hashes: origHashes });
                                    baseName = file.replace('.mp4', '');
                                    allFiles = fs.readdirSync(corpusDir);
                                    ytVariants = allFiles.filter(function (f) { return f.startsWith(baseName + '_yt_') && f.endsWith('.mp4'); });
                                    if (ytVariants.length === 0) {
                                        console.log("  No YouTube variants found for ".concat(file, " (expected e.g., ").concat(baseName, "_yt_1080p.mp4)"));
                                        return [2 /*return*/, "continue"];
                                    }
                                    results = [];
                                    _loop_6 = function (ytFile) {
                                        var variantPath, varHashes, distances, matchingAnchors, isMatch;
                                        return __generator(this, function (_e) {
                                            switch (_e.label) {
                                                case 0:
                                                    variantPath = path.join(corpusDir, ytFile);
                                                    return [4 /*yield*/, computeVideoHashes(variantPath)];
                                                case 1:
                                                    varHashes = _e.sent();
                                                    distances = origHashes.map(function (orig, i) { return (0, phash_1.hammingDistance)(orig.hash, varHashes[i].hash); });
                                                    matchingAnchors = distances.filter(function (d) { return d <= THRESHOLD; }).length;
                                                    isMatch = matchingAnchors >= 2;
                                                    results.push({ name: ytFile, distances: distances, isMatch: isMatch });
                                                    return [2 /*return*/];
                                            }
                                        });
                                    };
                                    _b = 0, ytVariants_1 = ytVariants;
                                    _d.label = 2;
                                case 2:
                                    if (!(_b < ytVariants_1.length)) return [3 /*break*/, 5];
                                    ytFile = ytVariants_1[_b];
                                    return [5 /*yield**/, _loop_6(ytFile)];
                                case 3:
                                    _d.sent();
                                    _d.label = 4;
                                case 4:
                                    _b++;
                                    return [3 /*break*/, 2];
                                case 5:
                                    console.log('\n| Variant | Anchor 0.2 Dist | Anchor 0.5 Dist | Anchor 0.8 Dist | Match (Y/N) |');
                                    console.log('|---------|-----------------|-----------------|-----------------|-------------|');
                                    for (_c = 0, results_3 = results; _c < results_3.length; _c++) {
                                        res = results_3[_c];
                                        console.log("| ".concat(res.name.padEnd(25), " | ").concat(res.distances[0].toString().padEnd(15), " | ").concat(res.distances[1].toString().padEnd(15), " | ").concat(res.distances[2].toString().padEnd(15), " | ").concat(res.isMatch ? 'Y' : 'N', "           |"));
                                    }
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, originalFiles_1 = originalFiles;
                    _a.label = 1;
                case 1:
                    if (!(_i < originalFiles_1.length)) return [3 /*break*/, 4];
                    file = originalFiles_1[_i];
                    return [5 /*yield**/, _loop_4(file)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    // 2. Collision Logic (Cross-Clip Guard)
                    console.log('\n--- CROSS-CLIP COLLISION MATRIX (REAL CONTENT) ---');
                    console.log('| Video A                   | Video B                   | Dist 0.2 | Dist 0.5 | Dist 0.8 | 2-of-3 Match? (FALSE POSITIVE) |');
                    console.log('|---------------------------|---------------------------|----------|----------|----------|--------------------------------|');
                    for (i = 0; i < allOrigHashes.length; i++) {
                        _loop_5 = function (j) {
                            var clipA = allOrigHashes[i];
                            var clipB = allOrigHashes[j];
                            var distances = clipA.hashes.map(function (hashA, k) { return (0, phash_1.hammingDistance)(hashA.hash, clipB.hashes[k].hash); });
                            var matchingAnchors = distances.filter(function (d) { return d <= THRESHOLD; }).length;
                            var isMatch = matchingAnchors >= 2;
                            console.log("| ".concat(clipA.file.padEnd(25), " | ").concat(clipB.file.padEnd(25), " | ").concat(distances[0].toString().padEnd(8), " | ").concat(distances[1].toString().padEnd(8), " | ").concat(distances[2].toString().padEnd(8), " | ").concat(isMatch ? 'Y (DANGER)' : 'N (SAFE)', "                       |"));
                        };
                        for (j = i + 1; j < allOrigHashes.length; j++) {
                            _loop_5(j);
                        }
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var args, originalFile, variants;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    args = process.argv.slice(2);
                    if (!args.includes('--mode=simulated')) return [3 /*break*/, 2];
                    return [4 /*yield*/, runSimulated()];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 7];
                case 2:
                    if (!args.includes('--mode=real')) return [3 /*break*/, 4];
                    originalFile = args[args.indexOf('--mode=real') + 1];
                    variants = args.slice(args.indexOf('--mode=real') + 2);
                    if (!originalFile || variants.length === 0) {
                        console.error('Usage: npx ts-node transcode-validation.ts --mode=real <original.mp4> <variant1.mp4> [variant2.mp4 ...]');
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, runSpotCheck(originalFile, variants)];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 7];
                case 4:
                    if (!args.includes('--mode=real-corpus')) return [3 /*break*/, 6];
                    return [4 /*yield*/, runRealCorpus()];
                case 5:
                    _a.sent();
                    return [3 /*break*/, 7];
                case 6:
                    console.log('Usage: npx ts-node transcode-validation.ts --mode=simulated');
                    console.log('Usage: npx ts-node transcode-validation.ts --mode=real <original.mp4> <variant1.mp4> [variant2.mp4 ...]');
                    console.log('Usage: npx ts-node transcode-validation.ts --mode=real-corpus');
                    _a.label = 7;
                case 7: return [2 /*return*/];
            }
        });
    });
}
main().catch(console.error);
