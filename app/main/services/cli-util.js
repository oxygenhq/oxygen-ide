import { util as oxutil } from 'oxygen-cli';
import fs from 'fs';
import path from 'path';
import ElectronService from './ElectronService';
const electronService = new ElectronService();

const OXYGEN_CONFIG_FILE_NAME = 'oxygen.conf';
const OXYGEN_ENV_FILE_NAME = 'oxygen.env';
const OXYGEN_PAGE_OBJECT_FILE_NAME = 'oxygen.po';

export async function prepareTestData(options) {
    let capsArr = options.capabilities || [{}];
    // check if capabilities object is an array or a hashtable
    if (!(capsArr instanceof Array)) {
        capsArr = [capsArr];
    }
    // start launcher
    try {
        return {
            options: options,
            caps: capsArr
        };
    }
    catch (e) {
        console.log('e', e);
    }
}

export async function generateTestOptions(config, argv) {
    const options = { ...config };
    options.env = await loadEnvironmentVariables(config, argv);
    options.po = await getPageObjectFilePath(config, argv);
    return options;
}

export async function loadEnvironmentVariables(config, argv) {
    const target = config.target;
    const envName = argv.env || 'default';
    const cwd = target.cwd || process.cwd();
    const defaultEnvFile = path.join(cwd, `${OXYGEN_ENV_FILE_NAME}.js`);
    if (fs.existsSync(defaultEnvFile)) {
        let env = await electronService.orgRequire(defaultEnvFile);
        if(typeof env === 'object'){
            //ignore
        } else if(typeof env === 'string') {
            env = JSON.parse(env.replace(/'/g, '"'));
        }

        console.log('env', env);
        if (env && typeof env === 'object' && Object.prototype.hasOwnProperty.call(env, envName)) {
            return env[envName];
        }
    }
    // try to resolve a dedicated environment file in 'env' sub folder
    const dedicatedEnvFileJs = path.join(cwd, 'env', `${envName}.js`);
    const dedicatedEnvFileJson = path.join(cwd, 'env', `${envName}.json`);
    if (fs.existsSync(dedicatedEnvFileJs)) {
        let env = await electronService.orgRequire(dedicatedEnvFileJs);
        env = JSON.parse(env.replace(/'/g, '"'));
        if(typeof env === 'object'){
            //ignore
        } else if(typeof env === 'string') {
            env = JSON.parse(env.replace(/'/g, '"'));
        }
        return env;
    }
    else if (fs.existsSync(dedicatedEnvFileJson)) {
        let env = await electronService.orgRequire(dedicatedEnvFileJson);
        env = JSON.parse(env.replace(/'/g, '"'));
        if(typeof env === 'object'){
            //ignore
        } else if(typeof env === 'string') {
            env = JSON.parse(env.replace(/'/g, '"'));
        }
        return env;
    }
    return {};
}

export function getPageObjectFilePath(config, argv = {}) {
    const target = config.target;
    const poFileName = argv.po || `${OXYGEN_PAGE_OBJECT_FILE_NAME}.js`;
    const cwd = target.cwd || process.cwd();
    const poFilePath = path.resolve(cwd, poFileName);
    return fs.existsSync(poFilePath) ? poFilePath : null;
}

export function processTargetPath(inputTargetPath) {
    let targetPath = inputTargetPath;
    // get current working directory if user has not provided path
    if (typeof(targetPath) === 'undefined') {
        targetPath = process.cwd();
    }
    // user's path might be relative to the current working directory - make sure the relative path will work
    else {
        targetPath = oxutil.resolvePath(targetPath, process.cwd());
    }
    const stats = fs.lstatSync(targetPath);
    const isDirector = stats.isDirectory();
    if (isDirector) {
        // append oxygen config file name to the directory, if no test case file was provided
        let configFilePath = path.join(targetPath, OXYGEN_CONFIG_FILE_NAME + '.js');
        if (!fs.existsSync(configFilePath)) {
            configFilePath = path.join(targetPath, OXYGEN_CONFIG_FILE_NAME + '.json');
            if (!fs.existsSync(configFilePath)) {
                return null;
            }
        }
        targetPath = configFilePath;
    }
    if (!fs.existsSync(targetPath)) {
        return null;
    }
    return {
        // path to the config or .js file
        path: targetPath,
        // working directory
        cwd: path.dirname(targetPath),
        // name of the target file without extension
        name: oxutil.getFileNameWithoutExt(targetPath),        
        // name including extension
        fullName: path.basename(targetPath),
        // parent folder's name
        baseName: path.basename(path.dirname(targetPath)),
        // target file extension
        extension: path.extname(targetPath)
    };
}

export async function getConfigurations(target, argv) {
    // process command line arguments
    const startupOpts = {
        name: argv.name || null,
        cwd: target.cwd,
        target: target,
        browserName : argv.b || argv.browser || 'chrome',
        seleniumUrl : argv.s || argv.server || 'http://localhost:4444/wd/hub',
        host: argv.host || 'localhost',
        port: argv.port || 4723,
        reopenSession: argv.reopen ? argv.reopen === 'true' : false,
        iterations : argv.i ? parseInt(argv.i) : (argv.iter ? parseInt(argv.iter) : null),
        debugPort: argv.dbgport || null,
        delay: argv.delay || null,
        collectDeviceLogs: false,
        collectAppiumLogs: false,
        collectBrowserLogs: false,
        reporting: {
            reporters: ['html']
        },
        parameters : {
            file: argv.p || argv.param || null,
            mode: argv.pm || 'seq'
        },
    };
    // set reporters if set by user through comnand line (--rf switch)
    if (argv.rf && typeof argv.rf === 'string' && argv.rf.length > 0) {
        const reporters = argv.rf.split(',');
        startupOpts.reporting.reporters = reporters;
    }
    // set a list of modules to be loaded, if set by user through comnand line (--modules switch)
    if (argv.modules && typeof argv.modules === 'string' && argv.modules.length > 0) {
        const modules = argv.modules.split(',');
        startupOpts.modules = modules;
    }
    // if the target is oxygen config file, merge its content with the default options
    let moreOpts = {};
    if (target.name === OXYGEN_CONFIG_FILE_NAME && (target.extension === '.js' || target.extension === '.json')) {
        moreOpts = await electronService.orgRequire(target.path);        
        if(typeof moreOpts === 'object'){
            //ignore
        } else if(typeof moreOpts === 'string') {
            moreOpts = JSON.parse(moreOpts.replace(/'/g, '"'));
        }
        console.log('moreOpts', moreOpts);
    } 

    // determine test name
    let name = startupOpts.name || moreOpts.name || null;
    if (!name) {
        name = target.name !== OXYGEN_CONFIG_FILE_NAME ? target.name : target.baseName;
    }

    return { ...startupOpts, ...moreOpts, name: name };
}