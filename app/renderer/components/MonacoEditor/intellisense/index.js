/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import docs from './doc';

const intellisenseJson = docs.init();

const createModuleAndMethods = (jsonData) => { // eslint-disable-line
    let methodArr = [];
    if (Object.keys(jsonData).length === 0) {
        return [];
    }

    Object.keys(jsonData).forEach((item) => {
        const theEntity = jsonData[item];

        // entity starts
        methodArr = [
            ...methodArr,
            '/**',
            `* ${theEntity.description}`,
            '*/',
            `declare var ${item} = (function(){`,
        ];

        // describe methods
        theEntity.methods.forEach((method) => {
            const mName = method.getMethod();
            const mDescription = method.getDescription();
            const mParams = method.getParams();
            const mSummary = method.getSummary();
            const mReturn = method.getReturn();
            let paramsInBrackets = '';
            let paramsDescription = [];
            if (mParams.length > 0) {
                mParams.forEach((param) => {
                    paramsInBrackets += `, ${param.name}: ${param.type}`;
                    paramsDescription = [
                        ...paramsDescription,
                        `@param {} **${param.name}** ${param.description}`
                    ];
                });
                if (paramsInBrackets.length > 1) {
                    paramsInBrackets = paramsInBrackets.substring(2);
                }
            }

            methodArr = [
                ...methodArr,
                '/**',
                mSummary ? ` * ${mSummary}` : '',
                mDescription ? ` * @description ${mDescription}` : '',
                ...paramsDescription,
                mReturn ? ` * @return ${mReturn.description}` : '',
                ' */',
                `declare function ${mName}(${paramsInBrackets}): ${mReturn ? mReturn.type : 'void'};`,
            ];
        });

        methodArr = [...methodArr, 'return {'];

        // render return
        theEntity.methods.forEach((method) => {
            const mName = method.getMethod();
            methodArr = [
                ...methodArr,
                `${mName}: ${mName}`,
            ];
        });

        methodArr = [...methodArr, '}'];

        // Entity ends
        methodArr = [...methodArr, '}());'];
    });

    return methodArr;
};

const arrdata = createModuleAndMethods(intellisenseJson);

export default function () {
    try {
        monaco.languages.typescript.javascriptDefaults.addExtraLib(arrdata.join('\n'));
    } catch(e){
        console.log('monaco.languages.typescript.javascriptDefaults error', e);
    }
    
    try {
        monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: true,
            noSyntaxValidation: true,
        });
    } catch(e){
        console.log('monaco.languages.typescript.typescriptDefaults error', e);
    }
}
