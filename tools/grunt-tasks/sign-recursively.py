#!/usr/bin/env python

'''
Code-signs all nested binaries inside an app bundle in an inside-out manner.
'''

import os, sys, re
import subprocess as sp

SIGN_EXTENSIONS = ['.so', '.dylib', '.jar', '.node'] # extension-less binaries are auto-included
CODE_SIGN_OPTS  = ['--verbose', '--entitlements', 'Entitlements.plist', '--force', '--options=runtime', '--timestamp', '--sign']

def is_probably_binary(path):
    ext = os.path.splitext(path)[1]
    if ext in SIGN_EXTENSIONS:
        return True
    return (len(ext)==0) and os.access(path, os.X_OK) and not os.path.islink(path)

def is_definitely_binary(path):
    return 'Mach-O' in sp.check_output(['file', '--brief', path])

def get_signing_path(path):
    m = re.match('.*/(.*)\.framework/Versions/./(.*)', path)
    if m and (m.lastindex==2) and m.group(1)==m.group(2):
        #This is the main binary of a framework. Sign the framework version instead.
        path = path[:-(len(m.group(1))+1)]
    print path
    if path.endswith('Oxygen.app/Contents/MacOS/Oxygen'):
        # This is the main binary of the app bundle. Exclude it since it needs to be signed last
        path = None
    return path

def get_signable_binaries(path):
    all_files = [os.path.join(root, fn) for root, dirs, names in os.walk(path) for fn in names]
    bins = filter(is_probably_binary, all_files)
    bins = filter(is_definitely_binary, bins)
    bins = sorted(filter(None, map(get_signing_path, bins)), reverse=True)
    # sign Oxygen.app last
    bins.append(path)
    return bins

def code_sign_nested(identity, path, dryrun):
    signables = get_signable_binaries(path)
    if len(signables)==0:
        print "No signable binaries found."
        exit(1)
    cmd = sp.check_output if not dryrun else lambda x: ' '.join(x)
    try:
        for bin in signables:
            print cmd(['codesign']+CODE_SIGN_OPTS+[identity, bin])
    except sp.CalledProcessError:
        print 'Code signing failed.'
        exit(1)
    print '%s completed successfully.'%('Code signing' if not dryrun else 'Dry run')

def main():
    if (len(sys.argv)!=4) or (sys.argv[1] not in ('sign', 'list')):
        print 'Usage: %s sign/list signing_identity app_path'%os.path.basename(__file__)
        exit(1)
    cs_identity, app_path = sys.argv[2:]
    code_sign_nested(cs_identity, app_path, dryrun=(sys.argv[1]=='list'))

if __name__=='__main__':
    main()
