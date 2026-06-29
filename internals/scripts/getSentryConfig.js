/**
 * @sentry/webpack-plugin v5+ requires org/project/authToken to be passed explicitly
 * instead of being read implicitly from .sentryclirc (sentry-cli's old config format).
 * This reads the existing .sentryclirc so the prod webpack configs keep working
 * without requiring new environment variables to be configured.
 */

import fs from 'fs';
import path from 'path';

export default function getSentryConfig() {
    const rcPath = path.join(__dirname, '..', '..', '.sentryclirc');
    const contents = fs.readFileSync(rcPath, 'utf8');

    const org = contents.match(/^org\s*=\s*(.+)$/m);
    const project = contents.match(/^project\s*=\s*(.+)$/m);
    const token = contents.match(/^token\s*=\s*(.+)$/m);

    return {
        org: org ? org[1].trim() : undefined,
        project: project ? project[1].trim() : undefined,
        authToken: process.env.SENTRY_AUTH_TOKEN || (token ? token[1].trim() : undefined),
        telemetry: false,
    };
}
