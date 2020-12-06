const { default: Axios } = require("axios")


fetchData = () => {
    console.log('API Call')
    const url = 'https://bankrollapireal.herokuapp.com/intelli_picks?sport=UFC&eId=5&book=draftkings&riskAmnt=25&dp=lp'
    return new Promise(function (resolve, reject) {
        Axios.get(url).then((response) => {
            var picks = response.data.data;
            console.log('Processing Request');
            console.log(picks)
            resolve(picks);
        },
            (error) => {
                reject(error);
            }
        );
    });
}

getPicks = async () => {
    var picks = await fetchData();
    // console.log(picks)
    var bankroll = 1000;
    var probData = [];
    for (i=0; i < picks.length; i++) {
        if (picks[i].suggestion.bet.team != -1){
            probData.push({
                fighter         : picks[i].suggestion.bet.team,
                winProb         : picks[i].suggestion.bet.confidence/100,
                possProfit      : (picks[i].suggestion.bet.decimalOdds
                                * picks[i].suggestion.bet.amountOfFund*bankroll)
                                - picks[i].suggestion.bet.amountOfFund*bankroll,
                lossProb        : 1-(picks[i].suggestion.bet.confidence/100),
                possLoss        : picks[i].suggestion.bet.amountOfFund*bankroll
            })
        };
    }

    var fightProbsDict = {};
    for (i=0; i < probData.length; i++) {
        var keyString = 'fighter' + i.toString()
        fightProbsDict[keyString] = {
            'fighter'  : probData[i].fighter,
            'winProb'  : probData[i].winProb,
            'profit'   : probData[i].possProfit,
            'lossProb' : probData[i].lossProb,
            'loss'     : probData[i].possLoss 
        }
    }

    var fightProbsArray = [];
    for (i=0; i < probData.length; i++) {
        // Set win dict
        var keyStringW = 'fighter'+i.toString()+'w'
        var tempDictW = {};
        tempDictW[keyStringW] = {
            'fighter': fightProbsDict['fighter'+i.toString()]['fighter'],
            'winProb': fightProbsDict['fighter'+i.toString()]['winProb'],
            'profit' : fightProbsDict['fighter'+i.toString()]['profit']
        }

        //Set loss dict
        var keyStringL = 'fighter'+i.toString()+'l'
        var tempDictL = {};
        tempDictL[keyStringL] = {
            'fighter'  : fightProbsDict['fighter'+i.toString()]['fighter'],
            'lossProb' : fightProbsDict['fighter'+i.toString()]['lossProb'],
            'loss'     : fightProbsDict['fighter'+i.toString()]['loss']
        }
        fightProbsArray.push([tempDictW[keyStringW], tempDictL[keyStringL]])
    }

    // console.log(fightProbsArray)
    const cartesian =
        (...a) => a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));
    var fightCombos = cartesian(...fightProbsArray);
    // console.log(JSON.stringify(fightCombos));
    // console.log(a.length);
   
    outcomeResults = []
    for (i=0; i < fightCombos.length; i++){
        probAcc  = 1;
        profAcc = 0;
        fightDict = {}
        for (j=0; j < probData.length; j++){
            if ('winProb' in fightCombos[i][j]){
                probAcc *= fightCombos[i][j]['winProb']
                fightDict[fightCombos[i][j]['fighter']] = 'Win'
            }
            if ('lossProb' in fightCombos[i][j]){
                probAcc *= fightCombos[i][j]['lossProb']
                fightDict[fightCombos[i][j]['fighter']] = 'Loss'
            }
            if ('profit' in fightCombos[i][j]){
                profAcc += fightCombos[i][j]['profit']
            }
            if ('loss' in fightCombos[i][j]){
                profAcc -= fightCombos[i][j]['loss']
            }

        }
        outcomeResults.push([profAcc, probAcc, fightDict])
    }
    // Sort array by profit
    outcomeResults.sort(function(a, b) {
        var valueA, valueB;
        valueA = a[0]; // Where 1 is your index, from your example
        valueB = b[0];
        if (valueA < valueB) {
            return -1;
        }
        else if (valueA > valueB) {
            return 1;
        }
        return 0;
    });
    // console.log(outcomeResults)

    outcomeResultsPDF = [...outcomeResults]
    acc = 0;
    for (i=0; i < outcomeResultsPDF.length; i++) {
        acc += outcomeResultsPDF[i][1]
        outcomeResultsPDF[i][1] = acc
    }
    console.log(outcomeResultsPDF)

}
getPicks()
