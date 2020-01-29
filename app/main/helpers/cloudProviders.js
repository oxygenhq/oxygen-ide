const getUniqueOsVersions = (browsers) => {
    const result = [];

    if(browsers && Array.isArray(browsers) && browsers.length > 0){
        browsers.map((item) => {
            if(result.includes(item._osVersion)){
                // ignore
            } else {
                result.push(item._osVersion);
            }
        });
    }

    if(result && Array.isArray(result) && result.length > 1){
        return result.sort((a, b) => a.localeCompare(b, 'en-US', {numeric : true}));
    }

    return result;
};

const fillByOSVersion = (browsers, key, label) => {
    let result = [];

    if(browsers && Array.isArray(browsers) && browsers.length > 0){
        const uniqueOsVersions = getUniqueOsVersions(browsers);

        if(uniqueOsVersions && Array.isArray(uniqueOsVersions) && uniqueOsVersions.length > 0){
            uniqueOsVersions.map((item) => {    
                const saveItem = item || 'Unknown';
                const newKey = key+'-'+saveItem;
                const newLabel = label+' '+saveItem;

                result.push({
                    title: saveItem,
                    orTitle: saveItem,
                    value: newKey,
                    key: newKey,
                    label: newLabel.charAt(0).toUpperCase() + newLabel.slice(1)
                });
            });
        }
    }

    return result;
};

const getUniqueOsName = (browsers) => {
    const result = [];

    if(browsers && Array.isArray(browsers) && browsers.length > 0){
        browsers.map((item) => {
            if(result.includes(item._osName)){
                // ignore
            } else {
                result.push(item._osName);
            }
        });
    }

    if(result && Array.isArray(result) && result.length > 1){
        return result.sort((a, b) => a.localeCompare(b, 'en-US', {numeric : true}));
    }

    return result;
};

const fillByOSName = (browsers, key, label) => {
    let result = [];
    
    if(browsers && Array.isArray(browsers) && browsers.length > 0){
        const uniqueOsNames = getUniqueOsName(browsers);
                    
        if(uniqueOsNames && Array.isArray(uniqueOsNames) && uniqueOsNames.length > 0){
            uniqueOsNames.map((item) => {

                const newKey = key+'-'+item;
                const newLabel = label+' '+item;

                const browsersWithOsName = browsers.filter((browser) => browser._osName === item);

                result.push({
                    title: item,
                    orTitle: item,
                    value: newKey,
                    key: newKey,
                    label: newLabel.charAt(0).toUpperCase() + newLabel.slice(1),
                    children: fillByOSVersion(browsersWithOsName, newKey, newLabel)
                });
            });
        }
    }

    return result;
};

const getUniqueVersions = (browsers) => {
    const result = [];

    if(browsers && Array.isArray(browsers) && browsers.length > 0){
        browsers.map((item) => {
            if(result.includes(item._version)){
                // ignore
            } else {
                result.push(item._version);
            }
        });
    }

    if(result && Array.isArray(result) && result.length > 1){
        return result.sort((a, b) => a.localeCompare(b, 'en-US', {numeric : true}));
    }

    return result;
};

const fillByBrowserName = (browsers, apiName, key, label) => {
    let result = [];
    let items = [];

    if(browsers && Array.isArray(browsers) && browsers.length > 0){
        browsers.map((item) => {
            if(item && item._apiName && item._apiName === apiName){
                items.push(item);
            }
        });
    }

    if(items && Array.isArray(items) && items.length > 0){
        const uniqueVersions = getUniqueVersions(items);

        if(uniqueVersions && Array.isArray(uniqueVersions) && uniqueVersions.length > 0){
            uniqueVersions.map((item) => {    
                const newKey = key+'-'+item;
                const newLabel = label+' '+item;

                const browsersWithVersion = items.filter((browser) => browser._version === item);

                result.push({
                    title: item,
                    orTitle: item,
                    value: newKey,
                    key: newKey,
                    label: newLabel.charAt(0).toUpperCase() + newLabel.slice(1),
                    children: fillByOSName(browsersWithVersion, newKey, newLabel)
                });
            });
        }
    }

    return result;
};

const getUniqueApiNames = (browsers) => {
    const result = [];

    if(browsers && Array.isArray(browsers) && browsers.length > 0){
        browsers.map((item) => {
            if(result.includes(item._apiName)){
                // ignore
            } else {
                result.push(item._apiName);
            }
        });
    }

    if(result && Array.isArray(result) && result.length > 1){
        return result.sort((a, b) => a.localeCompare(b, 'en-US', {numeric : true}));
    }

    return result;
};

export const creteBrowsersTree = (browsers) => {
    let result = [];

    if(browsers && Array.isArray(browsers) && browsers.length > 0){
        let uniqueApiNames = getUniqueApiNames(browsers);

        if(uniqueApiNames && Array.isArray(uniqueApiNames) && uniqueApiNames.includes('firefox-unbranded')){
            uniqueApiNames = uniqueApiNames.filter((item) => item !== 'firefox-unbranded');
        }

        if(uniqueApiNames && Array.isArray(uniqueApiNames) && uniqueApiNames.length > 0){
            result = uniqueApiNames.map((item) => {
                return {
                    title: item.charAt(0).toUpperCase() + item.slice(1),
                    orTitle: item,
                    value: item,
                    key: item,
                    label: item.charAt(0).toUpperCase() + item.slice(1),
                    children: fillByBrowserName(browsers, item, item, item)
                };
            });
        }
    }

    return result;
};

const fillByVersion = (devices, key, label) => {
    let result = [];
    

    if(devices && Array.isArray(devices) && devices.length > 0){
        const uniqueVersions = getUniqueVersions(devices);

        if(uniqueVersions && Array.isArray(uniqueVersions) && uniqueVersions.length > 0){
            uniqueVersions.map((item) => {

                const newKey = key+'-'+item;
                const newLabel = label+' '+item;

                result.push({
                    title: item,
                    orTitle: item,
                    value: newKey,
                    key: newKey,
                    label: newLabel.charAt(0).toUpperCase() + newLabel.slice(1)
                });
            });
        }
    }

    return result;
};

const getUniqueNames = (devices) => {
    const result = [];

    if(devices && Array.isArray(devices) && devices.length > 0){
        devices.map((item) => {
            if(result.includes(item.name)){
                // ignore
            } else {
                result.push(item.name);
            }
        });
    }

    if(result && Array.isArray(result) && result.length > 1){
        return result.sort((a, b) => a.localeCompare(b, 'en-US', {numeric : true}));
    }

    return result;
};

const fillByDevicesName = (devices, apiName, key, label) => {
    let result = [];
    let items = [];

    if(devices && Array.isArray(devices) && devices.length > 0){
        devices.map((item) => {
            if(item && item._apiName && item._apiName === apiName){
                items.push(item);
            }
        });
    }

    if(items && Array.isArray(items) && items.length > 0){
        const uniqueNames = getUniqueNames(items);
        
        if(uniqueNames && Array.isArray(uniqueNames) && uniqueNames.length > 0){
            uniqueNames.map((item) => {

                const newKey = key+'-'+item;
                const newLabel = label+' '+item;
                
                const devicesWithVersion = items.filter((device) => device._name === item);

                result.push({
                    title: item,
                    orTitle: item,
                    value: newKey,
                    key: newKey,
                    label: newLabel.charAt(0).toUpperCase() + newLabel.slice(1),
                    children: fillByVersion(devicesWithVersion, newKey, newLabel)
                });
            });
        }
    }

    return result;
};

export const creteDevicesTree = (devices) => {
    let result = [];
    
    if(devices && Array.isArray(devices) && devices.length > 0){
        
        const uniqueApiNames = getUniqueApiNames(devices);

        if(uniqueApiNames){
            result = uniqueApiNames.map((item) => {
                return {
                    title: item,
                    orTitle: item,
                    value: item,
                    key: item,
                    label: item.charAt(0).toUpperCase() + item.slice(1),
                    children: fillByDevicesName(devices, item, item, item)
                };
            });
        }
    }

    return result;
};