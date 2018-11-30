import configureStore from '../../../../app/renderer/store/configureStore';
import * as actions from '../../../../app/renderer/store/logger/actions';

function setupStore() {
  return configureStore.configureStore();
}

describe('Store: logger', () => {
  let store = null;
  beforeAll(() => {
    store = setupStore();
  });
  afterAll(() => { 
    store = null;
  });
  describe('Actions - addLog', () => {
    let state = null;
    beforeAll(() => {
      let newState = store.dispatch(actions.addLog("Message", "INFO","general"));
      state = store.getState().logger;      
    });  
    describe('state.logger', () => {
        it('should have at least one log entry in logs.general', () => {
            expect(state.logs.general.length).toBeGreaterThan(0);
        });
        it('should contain "message" in logs.general', () => {
            expect(state.logs.general[state.logs.general.length - 1].message).toEqual("Message");
        });    
    });
  });
});