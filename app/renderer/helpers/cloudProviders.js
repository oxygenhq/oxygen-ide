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



export const getBrowsersTarget = (tree, pos, level = 0, prevValue = '') => {
    let result = null;
    if(pos.includes(delimeter)){
        const splitResult = pos.split(delimeter);
        const shifted = splitResult.shift();
        
        const value = prevValue && prevValue.length ? prevValue+delimeter+shifted : shifted;
        const item = tree.find((treeItem) => treeItem.value === value);

        let getTargetResult = getBrowsersTarget(item.children, splitResult.join(delimeter), level+1, value);
        const key = browsersLevels[level];

        getTargetResult[key] = item.orTitle;

        return getTargetResult;
    } else {
        const value = prevValue && prevValue.length ? prevValue+delimeter+pos : pos;

        const item = tree.find((treeItem) => treeItem.value === value);
        const key = browsersLevels[level];

        result = {
            [key]: item.orTitle
        };
        
        if(level < browsersLevels.length && Array.isArray(item.children) && item.children.length > 0){
            const poss = item.children[item.children.length - 1].orTitle;
            let fillResult = getBrowsersTarget(item.children, poss, level+1, value);
            
            if(fillResult && typeof fillResult === 'object' && Object.keys(fillResult)){
                const keys = Object.keys(fillResult);
                keys.map((key) => {
                    result[key] = fillResult[key];
                });
            }
        }

    }

    return result;
};

export const saveBrowserTarget = (target) => {
    let returnResult;

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
        returnResult = result;
    } else {
        returnResult = target;
    }

    return returnResult;
};

export const getDevicesTarget = (tree, pos, level = 0, prevValue = '') => {
    let result = null;

    if(pos.includes(delimeter)){
        const splitResult = pos.split(delimeter);
        const shifted = splitResult.shift();

        const value = prevValue && prevValue.length ? prevValue+delimeter+shifted : shifted;
        
        const item = tree.find((treeItem) => treeItem.value === value);

        let getTargetResult = getDevicesTarget(item.children, splitResult.join(delimeter), level+1, value);
        const key = devicesLevels[level];

        getTargetResult[key] = item.orTitle;

        return getTargetResult;
    } else {
        const value = prevValue && prevValue.length ? prevValue+delimeter+pos : pos;

        const item = tree.find((treeItem) => treeItem.value === value);
        const key = devicesLevels[level];

        result = {
            [key]: item.orTitle
        };
        
        if(level < devicesLevels.length && Array.isArray(item.children) && item.children.length > 0){
            const poss = item.children[item.children.length - 1].orTitle;
            let fillResult = getDevicesTarget(item.children, poss, level+1, value);

            if(fillResult && typeof fillResult === 'object' && Object.keys(fillResult)){
                const keys = Object.keys(fillResult);
                keys.map((key) => {
                    result[key] = fillResult[key];
                });
            }
        }
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