export default class DeviceInfo {
    constructor(object){
        this.id = object.id;
        this._name = object.name;
        this._apiName = object.apiName;
        this._version = object.version;
        this._osName = object.osName;
        this._osVersion = object.osVersion;
    }

    // e.g. "device" property in SauceLabs API response
    get id() {
        return this._id;
    }
    set id(id) {
        this._id = id;
    }
    // e.g. "long_name" property in SauceLabs API response
    get name() {
        return this._name;
    }
    set name(name) {
        this._name = name;
    }
    // e.g. "short_version" property in SauceLabs API response
    get version() {
        return this._version;
    }
    set version(version) {
        this._version = version;
    }
    get apiName() {
        return this._apiName;
    }
    set apiName(apiName) {
        this._apiName = apiName;
    }
    // "Android" for "api_name" value "android" or "iOS" for "api_name" value "ipad" or "iphone"
    get osName() {
        return this._osName;
    }
    set osName(name) {
        this._osName = name;
    }
    get osVersion() {
        return this._osVersion;
    }
    set osVersion(version) {
        this._osVersion = version;
    }
}