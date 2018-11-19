var async = require('async');
var apiCaller = require('request-promise');
const BumoSDK = require('bumo-sdk');
var cheerio = require('cheerio');
var request = require('request');
const options = {
  host: 'seed1.bumotest.io:26002',
};
const sdk = new BumoSDK(options);
const BigNumber = require('bignumber.js');
var _winners = "";

var homeController = {

    home : function(req, res) {
        var renderRes = res;
        if (process.env.contractAddr == undefined) {
            renderRes.render('retailer', {
                title: 'BUMO Mega Million - Retailer',
                contractTxn: false,
                hasTxnInfo: false,
                currentContractAddr: "You need to deploy and setup contract first"
            });
        } else {

            if (process.env.userPublicKey === undefined && process.env.userPrivateKey === undefined){
                renderRes.render('ticketSale', {
                    title: 'BUMO Mega Million - Ticket Sale',
                    hasUser: false,
                    currentContractAddr: process.env.contractAddr,
                    currentUser: 'need to setup user info first'
                });
            } else {
                const callOperation = async () => {
                    console.log(process.env.contractAddr);
                    let data = await sdk.contract.call({
                        optType: 2,
                        contractAddress: process.env.contractAddr,
                        input: JSON.stringify({
                            method: 'getBasicInfo'
                        }),
                    });
                    console.log(data.result.query_rets[0].result.value);
        
                    var basicInfo = JSON.parse(data.result.query_rets[0].result.value); 
        
                    renderRes.render('ticketSale', {
                        title: 'BUMO Mega Million - Ticket Sale',
                        prize: basicInfo.prize,
                        currentContractAddr: process.env.contractAddr,
                        hasUser: true,
                        currentUser: process.env.userPublicKey
                    });
                }
                callOperation();
            }
        }
    },

    retailer : function(req, res) {
        var renderRes = res;
        if (process.env.contractAddr == undefined) {
            renderRes.render('retailer', {
                title: 'BUMO Mega Million - Retailer',
                contractTxn: false,
                hasTxnInfo: false,
                currentContractAddr: "not setup yet"
            });
        } else {
            const callOperation = async () => {
                let data = await sdk.contract.call({
                    optType: 2,
                    contractAddress: process.env.contractAddr,
                    input: JSON.stringify({
                        method: 'listTxns'
                    }),
                });
                console.log(JSON.parse(data.result.query_rets[0].result.value));
    
                var txnInfo = JSON.parse(data.result.query_rets[0].result.value); 
    
                renderRes.render('retailer', {
                    title: 'BUMO Mega Million - Retailer',
                    contractTxn: false,
                    hasTxnInfo: true,
                    txnInfo: txnInfo
                });
            }
            callOperation();
        }
    },

    deploy: function(req, res) {
        var renderRes = res;
        var nonce = 0;
        var blob;
        var senderAddr = "buQeXJ4fMuJEnyTtMimmoeFsPdwuVg1zAYwx";
        const senderPrivateKey = 'privbtCUM5riKdjhi3DrLnNyeD6WAaVLYABKhS9Dqo3rUzQQob3e6BwG';
        const creationOperation = async () => {
            var ress = await sdk.account.getNonce(senderAddr);

            if (ress.errorCode !== 0) {
                nonce = null;
                console.log(ress.errorDesc);
                return;
            } else {
                nonce = ress.result.nonce;
                nonce = new BigNumber(nonce).plus(1).toString(10);
                console.log("getNonce succesfully");
                console.log(nonce);
            }

            var contract = {};
            var initInput = {};

            initInput = "{\"params\":{\"lotteryName\":\"Mega Million 1\",\"ticketPrice\":\"8\"}}";
            contract.sourceAddress = senderAddr;
            contract.initInput = initInput;
            contract.payload = "'use strict';let globalAttribute={};const globalAttributeKey='global_attribute';const buyerListKey='buyerList';const winnersInfoKey='winnerInfo';function loadGlobalAttribute(){if(Object.keys(globalAttribute).length===0){let value=storageLoad(globalAttributeKey);assert(value!==false,'Get global attribute from metadata failed.');globalAttribute=JSON.parse(value);}}function updateGlobalAttribute(){if(Object.keys(globalAttribute).length!==0){storageStore(globalAttributeKey,JSON.stringify(globalAttribute));}}function init(input_str){let params=JSON.parse(input_str).params;assert(typeof params.lotteryName==='string'&&params.lotteryName.length>0&&typeof params.ticketPrice==='string'&&int64Compare(params.ticketPrice,0)===1,'Args check failed.');globalAttribute.prize='0';globalAttribute.lotteryName=params.lotteryName;globalAttribute.ticketPrice=params.ticketPrice;globalAttribute.issuer=sender;storageStore(globalAttributeKey,JSON.stringify(globalAttribute));let buyerList=[];storageStore(buyerListKey,JSON.stringify(buyerList));}function getPrize(){return globalAttribute.prize;}function getLotteryName(){return globalAttribute.lotteryName;}function getTicketPrice(){return globalAttribute.ticketPrice;}function getIssuer(){return globalAttribute.issuer;}function isAdmin(requester){return requester===thisAddress;}function listBuyers(){return storageLoad(buyerListKey);}function listTxns(){let result=[];let buyerList=JSON.parse(storageLoad(buyerListKey));let index=0;let length=buyerList.length;while(index<length){let curBuyer=buyerList[index];let txnsArr=JSON.parse(storageLoad(curBuyer));let innerIndex=0;let innerLength=txnsArr.length;while(innerIndex<innerLength){let curTxn=txnsArr[innerIndex];curTxn.buyer=curBuyer;result.push(curTxn);innerIndex=innerIndex+1;}index=index+1;}return JSON.stringify(result);}function getWinners(){return;}function draw(){let result={};let winnerNumbers=['5','28','62','65','70'];let winnerMegaNum='5';let winners=[];let buyerList=JSON.parse(storageLoad(buyerListKey));let index=0;let length=buyerList.length;while(index<length){let curBuyer=buyerList[index];let txnsArr=JSON.parse(storageLoad(curBuyer));let innerIndex=0;let innerLength=txnsArr.length;while(innerIndex<innerLength){let curTxn=txnsArr[innerIndex];if(JSON.stringify(winnerNumbers)===JSON.stringify(curTxn.numbers)&&JSON.stringify(winnerMegaNum)===JSON.stringify(curTxn.megaNum)){winners.push(curBuyer);}innerIndex=innerIndex+1;}index=index+1;}loadGlobalAttribute();result.winners=winners;result.prize=getPrize();result.winnerNumbers=winnerNumbers;result.winnerMegaNum=winnerMegaNum;return JSON.stringify(result);}function getTicket(numbers,megaNum,buyer){loadGlobalAttribute();let curPrize=getPrize();let curTicketPrice=getTicketPrice();globalAttribute.prize=int64Add(curPrize,parseInt(curTicketPrice));updateGlobalAttribute();let curTxn={};curTxn.numbers=numbers;curTxn.megaNum=megaNum;let txnsStr=storageLoad(buyer);let txnsArr=[];if(txnsStr!==false){txnsArr=JSON.parse(txnsStr);}txnsArr.push(curTxn);txnsStr=JSON.stringify(txnsArr);storageStore(buyer,txnsStr);let buyerList=JSON.parse(listBuyers());if(!buyerList.includes(buyer)){buyerList.push(buyer);}storageStore(buyerListKey,JSON.stringify(buyerList));return true;}function payout(winnersInput){assert(winnersInput!==false,'No Winners Info, Please Draw First.');let winners=JSON.parse(winnersInput);loadGlobalAttribute();let prize=parseInt(getPrize());let index=0;let length=winners.length;let prizeEachPerson=int64Div(toBaseUnit(prize.toString()),length);while(index<length){let curWinner=winners[index];payCoin(curWinner,prizeEachPerson,'Payout '+curWinner+'with amount: '+prizeEachPerson);tlog('prize payout','Payout '+curWinner+'with amount: '+prizeEachPerson);index=index+1;}loadGlobalAttribute();globalAttribute.prize='0';updateGlobalAttribute();let buyerList=JSON.parse(storageLoad(buyerListKey));index=0;length=buyerList.length;while(index<length){let curBuyer=buyerList[index];storageDel(curBuyer);index=index+1;}let newBuyerList=[];storageStore(buyerListKey,JSON.stringify(newBuyerList));return true;}function main(input_str){loadGlobalAttribute();let input=JSON.parse(input_str);if(input.method==='getTicket'){assert(thisPayCoinAmount===toBaseUnit(getTicketPrice()),'Wrong Ticket Fee');getTicket(input.params.numbers,input.params.megaNum,sender);}else if(input.method==='payout'){assert(sender===getIssuer(),'You dont have permission');payout(input.params.winners);}else{throw'Main interface passes an invalid operation type';}}function query(input_str){loadGlobalAttribute();let input=JSON.parse(input_str);let result={};if(input.method==='getBasicInfo'){result.prize=getPrize();result.issuer=getIssuer();result.lotteryName=getLotteryName();result.ticketPrice=getTicketPrice();result=JSON.stringify(result);}else if(input.method==='listBuyers'){result=listBuyers();}else if(input.method==='listTxns'){result=listTxns();}else if(input.method==='draw'){result=draw();}else{throw'Query interface passes an invalid operation type';}return result;}";
            contract.initBalance = "100000000";
            contract.metadata = "bumo mega test 1";

            const operationInfo = sdk.operation.contractCreateOperation(contract);

            if (operationInfo.errorCode !== 0) {
                console.log(operationInfo);
                return;
            } else {
                console.log("contractCreateOperation succesfully");
                console.log(operationInfo);
            }

            const operationItem = operationInfo.result.operation;

            try {
                var ress = await sdk.transaction.buildBlob({
                    sourceAddress: senderAddr,
                    gasPrice: '3000',
                    feeLimit: '3018409000',
                    nonce: nonce,
                    operations: [ operationItem ]
                });

                if (ress.errorCode !== 0) {
                    nonce = null;
                    console.log(ress.errorDesc);
                    return;
                } else {
                    blob = ress.result.transactionBlob;
                    console.log("buildBlob succesfully");
                    console.log(blob);
                }
            } catch(err){
                console.error(err) 
            }   
            
            let signatureInfo = sdk.transaction.sign({
                privateKeys: [ senderPrivateKey ],
                blob
            });
        
            if (signatureInfo.errorCode !== 0) {
                console.log(signatureInfo);
                return;
            } else {
                console.log("signatureInfo succesfully");
            }

            const signature = signatureInfo.result.signatures;
            console.log(signature);

            const transactionInfo = await sdk.transaction.submit({
                blob,
                signature: signature,
            });
        
            if (transactionInfo.errorCode !== 0) {
                console.log(transactionInfo);
            } else {
                console.log("submit succesfully");
                console.log(transactionInfo.result.hash);
                process.env['contractTxn'] = transactionInfo.result.hash;
                renderRes.render('retailer', {
                    title: 'BUMO Mega Million - Retailer',
                    contractTxn: true,
                    txn: transactionInfo.result.hash,
                    hasTxnInfo:false
                });
            }
        }
        creationOperation();
    },

    buyTicket: function(req, res) {
        var renderRes = res;
        var num1 = req.body.num1;
        var num2 = req.body.num2;
        var num3 = req.body.num3;
        var num4 = req.body.num4;
        var num5 = req.body.num5;

        var megaNum = req.body.num6;
        var numbers = [num1,num2,num3,num4,num5];

        console.log(numbers);
        var nonce = 0;
        var blob;
        var txnHash;
        var senderAddr = "buQeXJ4fMuJEnyTtMimmoeFsPdwuVg1zAYwx";
        const senderPrivateKey = 'privbtCUM5riKdjhi3DrLnNyeD6WAaVLYABKhS9Dqo3rUzQQob3e6BwG';

        const callOperation = async () => {
            var ress = await sdk.account.getNonce(senderAddr);

            if (ress.errorCode !== 0) {
                nonce = null;
                console.log(ress.errorDesc);
                return;
            } else {
                nonce = ress.result.nonce;
                nonce = new BigNumber(nonce).plus(1).toString(10);
                console.log("getNonce succesfully");
                //console.log(nonce);
            }

            let operationInfo = await sdk.operation.contractInvokeByBUOperation({
                contractAddress: process.env.contractAddr,
                sourceAddress: senderAddr,
                input: JSON.stringify({
                  method: "getTicket",
                  params: {
                      numbers: numbers,
                      megaNum: megaNum
                    }
                }),
                buAmount: sdk.util.buToMo('8'),
                metadata: "Buy Ticket from: " + senderAddr
              });
              
            if (operationInfo.errorCode !== 0) {
                console.log(operationInfo);
                return;
            } else {
                console.log("buInvokeOperation succesfully");
                //console.log(operationInfo);
            }

            const operationItem = operationInfo.result.operation;

            try {
                var ress = await sdk.transaction.buildBlob({
                    sourceAddress: senderAddr,
                    gasPrice: '3000',
                    feeLimit: '18409000',
                    nonce: nonce,
                    operations: [ operationItem ]
                });

                if (ress.errorCode !== 0) {
                    nonce = null;
                    console.log(ress.errorDesc);
                    return;
                } else {
                    blob = ress.result.transactionBlob;
                    console.log("buildBlob succesfully");
                    //console.log(blob);
                }
            } catch(err){
                console.error(err) 
            }   
            
            let signatureInfo = sdk.transaction.sign({
                privateKeys: [ senderPrivateKey ],
                blob
            });
        
            if (signatureInfo.errorCode !== 0) {
                console.log(signatureInfo);
                return;
            } else {
                console.log("signatureInfo succesfully");
            }

            const signature = signatureInfo.result.signatures;
            //console.log(signature);

            const transactionInfo = await sdk.transaction.submit({
                blob,
                signature: signature,
            });
        
            if (transactionInfo.errorCode !== 0) {
                console.log(transactionInfo);
            } else {
                console.log("submit succesfully");
                console.log(transactionInfo.result);
                txnHash = transactionInfo.result.hash;
            }

            try{
                renderRes.render('ticketReceipt', {
                    num1: num1,
                    num2: num2,
                    num3: num3,
                    num4: num4,
                    num5: num5,
                    megaNum: megaNum,
                    txnHash: txnHash,
                    title: 'BUMO Mega Million - Ticket Receipt'
                });
            } catch(err){
                console.log(err);
                renderRes.render("ticketReceipt", {
                    title: 'BUMO Mega Million - Ticket Receipt'
                })
            }
        }

        callOperation(); 
    },

    draw: function(req, res) {
        var renderRes = res;
        const callOperation = async () => {
            let data = await sdk.contract.call({
                optType: 2,
                contractAddress: process.env.contractAddr,
                input: JSON.stringify({
                    method: 'draw'
                }),
            });
            console.log(data.result.query_rets[0].result.value);

            var drawInfo = JSON.parse(data.result.query_rets[0].result.value); 
            _winners = drawInfo.winners;
            renderRes.render('draw', {
                title: 'BUMO Mega Million - Winners',
                num1: drawInfo.winnerNumbers[0],
                num2: drawInfo.winnerNumbers[1],
                num3: drawInfo.winnerNumbers[2],
                num4: drawInfo.winnerNumbers[3],
                num5: drawInfo.winnerNumbers[4],
                megaNum: drawInfo.winnerMegaNum,
                prize: drawInfo.prize,
                winners: drawInfo.winners,
                prizePerPerson: parseFloat(drawInfo.prize)*1.0/drawInfo.winners.length
            });
        }
        callOperation();
    },

    setAddr: function(req, res) {
        console.log(req.body.contractAddr);
        process.env['contractAddr'] = req.body.contractAddr;
        res.render('retailer', {
            title: 'BUMO Mega Million - Retailer',
            contractTxn: true,
            txn: process.env.contractTxn == undefined ? "null" : process.env.contractTxn,
            hasTxnInfo:false,
            currentContractAddr: process.env.contractAddr
        });
    },

    setUser: function(req, res) {
        console.log(req.body.publicKey);
        process.env['userPublicKey'] = req.body.publicKey;
        process.env['userPrivateKey'] = req.body.privateKey;
        res.redirect('/');
    },

    payout: function(req, res) {
        var renderRes = res;
        var nonce = 0;
        var blob;
        var txnHash;
        var senderAddr = "buQeXJ4fMuJEnyTtMimmoeFsPdwuVg1zAYwx";
        const senderPrivateKey = 'privbtCUM5riKdjhi3DrLnNyeD6WAaVLYABKhS9Dqo3rUzQQob3e6BwG';

        const callOperation = async () => {
            var ress = await sdk.account.getNonce(senderAddr);

            if (ress.errorCode !== 0) {
                nonce = null;
                console.log(ress.errorDesc);
                return;
            } else {
                nonce = ress.result.nonce;
                nonce = new BigNumber(nonce).plus(1).toString(10);
                console.log("getNonce succesfully");
                //console.log(nonce);
            }

            let operationInfo = await sdk.operation.contractInvokeByBUOperation({
                contractAddress: process.env.contractAddr,
                sourceAddress: senderAddr,
                input: JSON.stringify({
                  method: "payout",
                  params: {
                    winners: JSON.stringify(_winners)
                  }
                })
              });
              
            if (operationInfo.errorCode !== 0) {
                console.log(operationInfo);
                return;
            } else {
                console.log("buInvokeOperation succesfully");
                //console.log(operationInfo);
            }

            const operationItem = operationInfo.result.operation;

            try {
                var ress = await sdk.transaction.buildBlob({
                    sourceAddress: senderAddr,
                    gasPrice: '3000',
                    feeLimit: '18409000',
                    nonce: nonce,
                    operations: [ operationItem ]
                });

                if (ress.errorCode !== 0) {
                    nonce = null;
                    console.log(ress.errorDesc);
                    return;
                } else {
                    blob = ress.result.transactionBlob;
                    console.log("buildBlob succesfully");
                    //console.log(blob);
                }
            } catch(err){
                console.error(err) 
            }   
            
            let signatureInfo = sdk.transaction.sign({
                privateKeys: [ senderPrivateKey ],
                blob
            });
        
            if (signatureInfo.errorCode !== 0) {
                console.log(signatureInfo);
                return;
            } else {
                console.log("signatureInfo succesfully");
            }

            const signature = signatureInfo.result.signatures;
            //console.log(signature);

            const transactionInfo = await sdk.transaction.submit({
                blob,
                signature: signature,
            });
        
            if (transactionInfo.errorCode !== 0) {
                console.log(transactionInfo);
            } else {
                console.log("submit succesfully");
                console.log(transactionInfo.result);
                txnHash = transactionInfo.result.hash;
            }

            renderRes.render('payout', {
                txnHash: txnHash
            });
        }

        callOperation();
    }

};


module.exports = homeController;
