var fs = require('fs');
var path = require('path');

// Crutch for now, working around the RP reporter — strips the reportportal reporter
// wiring out of oxygen-cli's build output. Runs unconditionally (matches the original
// Gruntfile.js, which applied this patch at module-load time regardless of which task
// was invoked).
function patchReportAggregator(appDir) {
    var reportAggregatorFile = path.join(appDir, 'node_modules', 'oxygen-cli', 'build', 'reporter', 'ReportAggregator.js');
    var reportAgg = fs.readFileSync(reportAggregatorFile, { encoding: 'utf8', flag: 'r' });
    reportAgg = reportAgg
        .replace('var _reporterRp = _interopRequireDefault(require("../ox_reporters/reporter-rp"));', '')
        .replace('rp: _reporterRp.default', '');
    fs.writeFileSync(reportAggregatorFile, reportAgg);
}

module.exports = patchReportAggregator;
