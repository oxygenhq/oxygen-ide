export default BrowserInfo {
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