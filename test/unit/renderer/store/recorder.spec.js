import configureStore from '../../../../app/renderer/store/configureStore';
import * as actions from '../../../../app/renderer/store/recorder/actions';

function setupStore() {
    return configureStore.configureStore();
}

describe('Store: recorder', () => {
    let store = null;
    beforeAll(() => {
        store = setupStore();
    });
    afterAll(() => { 
        store = null;
    });
    describe('Init state', () => {
        let state = null;
        beforeAll(() => {
            state = store.getState().recorder;
        });    
        it('should have "isRecordingChrome" property equal to "false"', () => {
            expect(state.isRecordingChrome).toEqual(false);
        });
        it('should have "activeFile" property equal to "null"', () => {
            expect(state.activeFile).toBeNull();
        });
        it('should have "steps" property to be an array', () => {
            expect(state.steps).toEqual([]);
        });
    });
    describe('Actions - startRecorder', () => {
        let state = null;
        beforeAll(() => {
            let newState = store.dispatch(actions.startRecorder());
            console.dir(newState);
            state = store.getState().recorder;      
        }); 
        it('should have "isRecordingChrome" property equal to "true"', () => {
            setTimeout(() => {
                expect(state.isRecordingChrome).toEqual(true);
            }, 1000);
      
        });   
    });
});