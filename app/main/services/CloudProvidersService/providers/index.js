import SauceLabsService from './SauceLabsProvider';
import TestObjectService from './TestObjectService';
import LambdaTestService from './LambdaTestService';
import TestingBotService from './TestingBotService';  

export default {
    sauceLabs: SauceLabsService,
    testObject: TestObjectService,
    lambdaTest: LambdaTestService,
    testingBot: TestingBotService
};