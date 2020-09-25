import SauceLabsService from './SauceLabsProvider';
import TestObjectService from './TestObjectService';
import LambdaTestService from './LambdaTestService';
import TestingBotService from './TestingBotService';  
import PerfectoMobileService from './PerfectoMobileService';  
import BrowserStackService from './BrowserStackService';  

export default {
    sauceLabs: SauceLabsService,
    testObject: TestObjectService,
    lambdaTest: LambdaTestService,
    testingBot: TestingBotService,
    perfectoMobile: PerfectoMobileService,
    browserStack: BrowserStackService,
};