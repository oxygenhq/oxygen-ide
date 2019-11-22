export default class BrowserInfo {
    constructor(object){
        this._name = object.name;
        this._version = object.version;
        this._osName = object.osName;
        this._osVersion = object.osVersion;
        this._apiName = object.apiName;
        
    }
    get name() {
        return this._name;
    }
    set name(name) {
        this._name = name;
    }
    // providerName
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