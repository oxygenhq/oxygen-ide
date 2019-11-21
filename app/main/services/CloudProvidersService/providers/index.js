import SauceLabsService from './SauceLabsProvider';
import LambdaTestService from './LambdaTestService';

export default {
    sauceLabs: new SauceLabsService,
    lambdaTest: new LambdaTestService
};