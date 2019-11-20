export default DeviceInfo {
    // e.g. "device" property in SauceLabs API response
    get id() {
        return this._name;
    }
    set id(name) {
        this._name = name;
    }
    // e.g. "long_name" property in SauceLabs API response
    get name() {
        return this._name;
    }
    set name(name) {
        this._name = name;
    }
    // "Android" for "api_name" value "android" or "iOS" for "api_name" value "ipad" or "iphone"
    get osName() {
        return this._osName;
    }
    set osName(name) {
        this._osName = name;
    }
    // e.g. "short_version" property in SauceLabs API response
    get osVersion() {
        return this._osVersion;
    }
    set osVersion(version) {
        this._osVersion = version;
    }
}