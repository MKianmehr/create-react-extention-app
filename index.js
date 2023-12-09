#!/usr/bin/env node

const { execSync, spawn} = require('child_process');
const fs = require('fs');
const path = require('path');

const DEV_DEPENDENCIES = '@types/chrome clean-webpack-plugin copy-webpack-plugin html-webpack-plugin webpack-cli ts-loader';
const SCRIPTS = {
  start: "webpack --watch --progress --config webpack.dev.js",
  build: "webpack --watch --progress --config webpack.prod.js"
};

async function execCommand(command, waitForInput = false) {
    return new Promise((resolve, reject) => {
        const process = spawn(command, { shell: true, stdio: waitForInput ? ['pipe', 'inherit', 'inherit'] : 'inherit' });
        if (waitForInput) {
            process.stdin.write('y\n');
            process.stdin.end();
        }
        process.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(`Command failed: ${command}`);
            }
        });
    });
}

// Creates a new React app with TypeScript template
async function createReactApp(appName) {
    try {
        await execCommand(`npx create-react-app ${appName} --template typescript`);
        process.chdir(appName); // Consider the impact of this in your script
    } catch (error) {
        console.error('Failed to create react app:', error);
        process.exit(1);
    }
}


// Handles ejecting of the app based on the package manager used
async function handleEject(isYarnUsed) {
    console.log('Ejecting the app...');
    await execCommand(isYarnUsed ? 'yarn eject' : 'npm run eject', true);
    await execCommand(isYarnUsed ? `yarn add ${DEV_DEPENDENCIES} --dev` : `npm i --save-dev ${DEV_DEPENDENCIES}`);
}

function updateJsonFile(filePath, updateCallback) {
    try {
        const jsonData = fs.readFileSync(filePath, 'utf8');
        const dataObject = JSON.parse(jsonData);
        updateCallback(dataObject);
        fs.writeFileSync(filePath, JSON.stringify(dataObject, null, 2));
    } catch (error) {
        console.error(`Failed to update ${path.basename(filePath)}:`, error);
    }
}

function copyFileToProject(srcFileName) {
    const srcFilePath = path.join(__dirname, srcFileName);
    const destFilePath = path.join(process.cwd(), srcFileName);
  
    try {
      fs.copyFileSync(srcFilePath, destFilePath);
      console.log(`Copied ${srcFileName} to ${destFilePath}`);
    } catch (error) {
      console.error(`Failed to copy ${srcFileName}:`, error);
    }
}

function copyDirectory(dest) {
    const srcDir = path.join(__dirname, dest)
    const destDir = path.join(process.cwd(), dest)
    // Create the destination directory if it does not exist
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    // Read all the files and subdirectories from source directory
    const filesToCopy = fs.readdirSync(srcDir);

    filesToCopy.forEach(file => {
        const srcFile = path.join(srcDir, file);
        const destFile = path.join(destDir, file);

        // Check if the file is a directory
        if (fs.statSync(srcFile).isDirectory()) {
            // Recursive call for subdirectory
            copyDirectory(srcFile, destFile);
        } else {
            // Copy file
            fs.copyFileSync(srcFile, destFile);
        }
    });
}

function removeDirectory(dirPath) {
    try {
        fs.rmSync(dirPath, { recursive: true, force: true });
        console.log(`Removed directory: ${dirPath}`);
    } catch (error) {
        console.error(`Error removing directory ${dirPath}:`, error);
    }
}

function removeFile(dirName, filename){
    const filePath = path.join(process.cwd(), dirName, filename);
    console.log("filepath", filePath)

    fs.unlink(filePath, (err) => {
    if (err) {
        console.error(`Failed to remove index.html: ${err}`);
        return;
    }
    console.log('index.html removed successfully');
    });
}
// Main script execution
async function main() {
    try{
        const appName = process.argv[2];
        if (!appName) {
            throw new Error('Usage: create-react-extention-app <app-name>');
        }
        await createReactApp(appName);
        const isYarnUsed = fs.existsSync(path.join(process.cwd(), 'yarn.lock'));
        await handleEject(isYarnUsed);
        updateJsonFile(path.join(process.cwd(), 'package.json'), packageJson => {
            packageJson.scripts = SCRIPTS
        });
    
        updateJsonFile(path.join(process.cwd(), 'tsconfig.json'), tsConfigJson => {
            tsConfigJson.compilerOptions.isolatedModules = false;
            tsConfigJson.compilerOptions.noEmit = false;
        });
        removeDirectory(path.join(process.cwd(), 'public'))
        removeDirectory(path.join(process.cwd(), 'scripts'))
        copyDirectory('public');
        updateJsonFile( path.join(process.cwd(), 'public','manifest.json'), manifestJson => {
            manifestJson.name = appName
            manifestJson.action.default_title = appName
        })
        copyFileToProject("webpack.common.js");
        copyFileToProject("webpack.dev.js");
        copyFileToProject("webpack.prod.js");
        copyDirectory('src');
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
}
main()