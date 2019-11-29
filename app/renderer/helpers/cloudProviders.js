const delimeter = '-';

const browserName = 'browserName';
const browserVersion = 'browserVersion';
const osName = 'osName';
const osVersion = 'osVersion';

const deviceName = 'deviceName';


const browsersLevels = [
    browserName,
    browserVersion,
    osName,
    osVersion
];

const devicesLevels = [
    osName,
    deviceName,
    osVersion
];



export const getBrowsersTarget = (tree, pos, level = 0) => {
    let result = null;

    console.log('tree', tree);

    if(pos.includes(delimeter)){
        const splitResult = pos.split(delimeter);
        const shifted = splitResult.shift();
        const item = tree[shifted];

        let getTargetResult = getBrowsersTarget(item.children, splitResult.join(delimeter), level+1);
        const key = browsersLevels[level];

        getTargetResult[key] = item.title;

        return getTargetResult;
    } else {
        const item = tree[pos];
        const key = browsersLevels[level];

        result = {
            [key]: item.title
        };
    }

    return result;
};

export const saveBrowserTarget = (target) => {
    if(target && typeof target === 'object' && Object.keys(target).length > 0){
        let result = '';
        if(target[browserName]){
            result = target[browserName];
        }
        if(target[browserVersion]){
            result += delimeter+target[browserVersion];
        }
        if(target[osName]){
            result += delimeter+target[osName];
        }
        if(target[osVersion]){
            result += delimeter+target[osVersion];
        }
        return result;
    } else {
        return target;
    }
};

export const getDevicesTarget = (tree, pos, level = 0) => {
    let result = null;

    if(pos.includes(delimeter)){
        const splitResult = pos.split(delimeter);
        const shifted = splitResult.shift();
        const item = tree[shifted];

        let getTargetResult = getDevicesTarget(item.children, splitResult.join(delimeter), level+1);
        const key = devicesLevels[level];

        getTargetResult[key] = item.title;

        return getTargetResult;
    } else {
        const item = tree[pos];
        const key = devicesLevels[level];

        result = {
            [key]: item.title
        };
    }

    return result;
};


export const saveDeviceTarget = (target) => {
    if(target && typeof target === 'object' && Object.keys(target).length > 0){
        let result = '';
        if(target[osName]){
            result = target[osName];
        }
        if(target[deviceName]){
            result += delimeter+target[deviceName];
        }
        if(target[osVersion]){
            result += delimeter+target[osVersion];
        }
        return result;
    } else {
        return target;
    }
};