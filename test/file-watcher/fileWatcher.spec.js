import configureStore from '../../app/renderer/store/configureStore';
import * as fsActions from '../../app/renderer/store/fs/actions';
function setupStore() {
    return configureStore.configureStore();
}

const rootPath = '/Users/developer/oxygen-ide';
const foldenName = 'fld';
const filenName = 'qwe.js';

const file = {
    ext: '.js',
    name: 'qwe.js',
    parentPath: rootPath,
    path: `${rootPath}/${filenName}`,
    type: 'file'
};

const folder = {
    ext: '',
    name: foldenName,
    parentPath: rootPath,
    path: `${rootPath}/${foldenName}`,
    type: 'folder'
};

const removedFoldenPath = `${rootPath}/${foldenName}`;
const removedFilePath = `${rootPath}/${filenName}`;

describe('File watcher', () => {
    describe('root', () => {
        let store = null;
        beforeEach(() => {
            store = setupStore();
        });
        afterEach(() => { 
            global.store = null;
            store = null;
        });
        it('Add file to empty root', () => {
            store.dispatch(fsActions.setTreeRootPath(rootPath));
            store.dispatch(fsActions.addFileOrFolder(file));
            const fsState = store.getState().fs; 
            expect(fsState.tree.data[0]).toEqual(file);
        });
        it('Add same file twice to empty root', () => {
            store.dispatch(fsActions.setTreeRootPath(rootPath));
            store.dispatch(fsActions.addFileOrFolder(file));
            store.dispatch(fsActions.addFileOrFolder(file));
            const fsState = store.getState().fs; 
            expect(fsState.tree.data.length).toEqual(1);
        });
        it('Add empty file or folder to empty root', () => {
            store.dispatch(fsActions.setTreeRootPath(rootPath));
            const fsStateBefore = store.getState().fs;
            store.dispatch(fsActions.addFileOrFolder());
            const fsStateAfter = store.getState().fs; 
            expect(fsStateAfter).toEqual(fsStateBefore);
        });
        it('Add folder to empty root', () => {
            store.dispatch(fsActions.setTreeRootPath(rootPath));
            store.dispatch(fsActions.addFileOrFolder(folder));
            store.dispatch(fsActions.addFileOrFolder(folder));
            const fsState = store.getState().fs; 
            expect(fsState.tree.data[0]).toEqual(folder);
        });
        it('Add same folder twice to empty root', () => {
            store.dispatch(fsActions.setTreeRootPath(rootPath));
            store.dispatch(fsActions.addFileOrFolder(folder));
            const fsState = store.getState().fs; 
            expect(fsState.tree.data.length).toEqual(1);
        });
        it('Remove folder', () => {
            store.dispatch(fsActions.setTreeRootPath(rootPath));
            const fsStateBefore = store.getState().fs;
            store.dispatch(fsActions.addFileOrFolder(folder));
            const fsState = store.getState().fs; 
            store.dispatch(fsActions._delete_Success(removedFoldenPath));
            const fsStateAfter = store.getState().fs; 

            expect(fsStateAfter.tree.data).toEqual(fsStateBefore.tree.data);
        });
        it('Remove folder twice', () => {
            store.dispatch(fsActions.setTreeRootPath(rootPath));
            const fsStateBefore = store.getState().fs;
            store.dispatch(fsActions.addFileOrFolder(folder));
            const fsState = store.getState().fs; 
            store.dispatch(fsActions._delete_Success(removedFoldenPath));
            store.dispatch(fsActions._delete_Success(removedFoldenPath));
            const fsStateAfter = store.getState().fs; 

            expect(fsStateAfter.tree.data).toEqual(fsStateBefore.tree.data);
        });
        it('Remove file', () => {
            store.dispatch(fsActions.setTreeRootPath(rootPath));
            const fsStateBefore = store.getState().fs;
            store.dispatch(fsActions.addFileOrFolder(file));
            const fsState = store.getState().fs; 
            store.dispatch(fsActions._delete_Success(removedFilePath));
            const fsStateAfter = store.getState().fs; 

            expect(fsStateAfter.tree.data).toEqual(fsStateBefore.tree.data);
        });
        it('Remove file twice', () => {
            store.dispatch(fsActions.setTreeRootPath(rootPath));
            const fsStateBefore = store.getState().fs;
            store.dispatch(fsActions.addFileOrFolder(file));
            const fsState = store.getState().fs; 
            store.dispatch(fsActions._delete_Success(removedFilePath));
            store.dispatch(fsActions._delete_Success(removedFilePath));
            const fsStateAfter = store.getState().fs; 

            expect(fsStateAfter.tree.data).toEqual(fsStateBefore.tree.data);
        });
        it('Remove with empty params', () => {
            store.dispatch(fsActions.setTreeRootPath(rootPath));
            store.dispatch(fsActions.addFileOrFolder(file));
            store.dispatch(fsActions.addFileOrFolder(folder));
            const fsState = store.getState().fs; 
            const fsStateBefore = store.getState().fs;
            store.dispatch(fsActions._delete_Success());
            const fsStateAfter = store.getState().fs; 

            expect(fsStateAfter.tree.data).toEqual(fsStateBefore.tree.data);
        });
    });
    describe('deep', () => {
        let store = null;
        beforeEach(() => {
            store = setupStore();
        });
        afterEach(() => { 
            global.store = null;
            store = null;
        });
        it('Add folder to exist folder', () => {
            store.dispatch(fsActions.setTreeRootPath(rootPath));
            let newState = store.dispatch(fsActions.addFileOrFolder(folder));
            const name = 'deepFolder';
            const deepFolder = { 
                ...folder, 
                name,
                parentPath: `${rootPath}/${foldenName}`,
                path: `${rootPath}/${foldenName}/${name}`
            };
            store.dispatch(fsActions.addFileOrFolder(deepFolder));
            const fsState = store.getState().fs; 
            expect(fsState.tree.data[0].children[0]).toEqual(deepFolder);
        });
        it('Add folder twice to exist folder', () => {
            store.dispatch(fsActions.setTreeRootPath(rootPath));
            store.dispatch(fsActions.addFileOrFolder(folder));
            const name = 'deepFolder';
            const deepFolder = { 
                ...folder, 
                name,
                parentPath: `${rootPath}/${foldenName}`,
                path: `${rootPath}/${foldenName}/${name}`
            };
            store.dispatch(fsActions.addFileOrFolder(deepFolder));
            store.dispatch(fsActions.addFileOrFolder(deepFolder));
            const fsState = store.getState().fs;
            expect(fsState.tree.data[0].children.length).toEqual(1);
        });
        it('Add file to exist folder', () => {
            store.dispatch(fsActions.setTreeRootPath(rootPath));
            store.dispatch(fsActions.addFileOrFolder(folder));
            const name = 'deepFile.js';
            const deepFile = { 
                ...folder, 
                name,
                parentPath: `${rootPath}/${foldenName}`,
                path: `${rootPath}/${foldenName}/${name}`
            };
            store.dispatch(fsActions.addFileOrFolder(deepFile));
            const fsState = store.getState().fs; 
            expect(fsState.tree.data[0].children[0]).toEqual(deepFile);
        });
        it('Add file twice to exist folder', () => {
            store.dispatch(fsActions.setTreeRootPath(rootPath));
            store.dispatch(fsActions.addFileOrFolder(folder));
            const name = 'deepFile.js';
            const deepFile = { 
                ...folder, 
                name,
                parentPath: `${rootPath}/${foldenName}`,
                path: `${rootPath}/${foldenName}/${name}`
            };
            store.dispatch(fsActions.addFileOrFolder(deepFile));
            store.dispatch(fsActions.addFileOrFolder(deepFile));
            const fsState = store.getState().fs; 
            expect(fsState.tree.data[0].children.length).toEqual(1);
        });
        it('Add deep without params to exist folder', () => {
            store.dispatch(fsActions.setTreeRootPath(rootPath));
            store.dispatch(fsActions.addFileOrFolder(folder));
            const fsStateBefore = store.getState().fs;
            store.dispatch(fsActions.addFileOrFolder());
            const fsStateAfter = store.getState().fs; 
            expect(fsStateAfter.tree.data[0]).toEqual(fsStateBefore.tree.data[0]);
        });
        it('Remove folder to exist folder', () => {
            store.dispatch(fsActions.setTreeRootPath(rootPath));
            store.dispatch(fsActions.addFileOrFolder(folder));
            const name = 'deepFolder';
            const deepFolder = { 
                ...folder, 
                name,
                parentPath: `${rootPath}/${foldenName}`,
                path: `${rootPath}/${foldenName}/${name}`
            };
            const fsStateBefore = store.getState().fs;
            store.dispatch(fsActions.addFileOrFolder(deepFolder));
            store.dispatch(fsActions._delete_Success(deepFolder.path));
            const fsStateAfter = store.getState().fs; 
            expect(fsStateAfter.tree.data[0]).toEqual(fsStateBefore.tree.data[0]);
        });
        it('Remove folder to exist folder twice', () => {
            store.dispatch(fsActions.setTreeRootPath(rootPath));
            store.dispatch(fsActions.addFileOrFolder(folder));
            const name = 'deepFolder';
            const deepFolder = { 
                ...folder, 
                name,
                parentPath: `${rootPath}/${foldenName}`,
                path: `${rootPath}/${foldenName}/${name}`
            };
            const fsStateBefore = store.getState().fs;
            store.dispatch(fsActions.addFileOrFolder(deepFolder));
            store.dispatch(fsActions._delete_Success(deepFolder.path));
            store.dispatch(fsActions._delete_Success(deepFolder.path));
            const fsStateAfter = store.getState().fs; 
            expect(fsStateAfter.tree.data[0]).toEqual(fsStateBefore.tree.data[0]);
        });
        it('Remove file to exist folder', () => {
            store.dispatch(fsActions.setTreeRootPath(rootPath));
            let newState = store.dispatch(fsActions.addFileOrFolder(folder));
            const name = 'deepFile.js';
            const deepFile = { 
                ...folder, 
                name,
                parentPath: `${rootPath}/${foldenName}`,
                path: `${rootPath}/${foldenName}/${name}`
            };
            const fsStateBefore = store.getState().fs;
            store.dispatch(fsActions.addFileOrFolder(deepFile));
            store.dispatch(fsActions._delete_Success(deepFile.path));
            const fsStateAfter = store.getState().fs; 
            expect(fsStateAfter.tree.data[0]).toEqual(fsStateBefore.tree.data[0]);
        });
        it('Remove file to exist folder twice', () => {
            store.dispatch(fsActions.setTreeRootPath(rootPath));
            let newState = store.dispatch(fsActions.addFileOrFolder(folder));
            const name = 'deepFile.js';
            const deepFile = { 
                ...folder, 
                name,
                parentPath: `${rootPath}/${foldenName}`,
                path: `${rootPath}/${foldenName}/${name}`
            };
            const fsStateBefore = store.getState().fs;
            store.dispatch(fsActions.addFileOrFolder(deepFile));
            store.dispatch(fsActions._delete_Success(deepFile.path));
            store.dispatch(fsActions._delete_Success(deepFile.path));
            const fsStateAfter = store.getState().fs; 
            expect(fsStateAfter.tree.data[0]).toEqual(fsStateBefore.tree.data[0]);
        });
        it('Remove folder witch have childs', () => {
            store.dispatch(fsActions.setTreeRootPath(rootPath));
            const fsStateBefore = store.getState().fs;
            let newState = store.dispatch(fsActions.addFileOrFolder(folder));
            const name = 'deepFolder';
            const deepFolder = { 
                ...folder, 
                name,
                parentPath: `${rootPath}/${foldenName}`,
                path: `${rootPath}/${foldenName}/${name}`
            };
            store.dispatch(fsActions.addFileOrFolder(deepFolder));
            store.dispatch(fsActions._delete_Success(folder.path));
            const fsStateAfter = store.getState().fs; 
            expect(fsStateAfter.tree.data).toEqual(fsStateBefore.tree.data);
        });
        it('Remove folder witch have childs twice', () => {
            store.dispatch(fsActions.setTreeRootPath(rootPath));
            const fsStateBefore = store.getState().fs;
            let newState = store.dispatch(fsActions.addFileOrFolder(folder));
            const name = 'deepFolder';
            const deepFolder = { 
                ...folder, 
                name,
                parentPath: `${rootPath}/${foldenName}`,
                path: `${rootPath}/${foldenName}/${name}`
            };
            store.dispatch(fsActions.addFileOrFolder(deepFolder));
            store.dispatch(fsActions._delete_Success(folder.path));
            store.dispatch(fsActions._delete_Success(folder.path));
            const fsStateAfter = store.getState().fs; 
            expect(fsStateAfter.tree.data).toEqual(fsStateBefore.tree.data);
        });
    });
});
