'use strict';
let globalAttribute = {};
const globalAttributeKey = 'global_attribute';
const buyerListKey = 'buyerList';
const winnersInfoKey = 'winnerInfo';

function loadGlobalAttribute(){
    if(Object.keys(globalAttribute).length === 0){
        let value = storageLoad(globalAttributeKey);
        assert(value !== false, 'Get global attribute from metadata failed.');
        globalAttribute = JSON.parse(value);
    }
}

function updateGlobalAttribute(){
    if(Object.keys(globalAttribute).length !== 0){
        storageStore(globalAttributeKey, JSON.stringify(globalAttribute));
    }
}

function init(input_str){
    let params = JSON.parse(input_str).params;

    assert(typeof params.lotteryName === 'string' && params.lotteryName.length > 0 &&
        typeof params.ticketPrice === 'string' && int64Compare(params.ticketPrice, 0) === 1, 'Args check failed.');

    globalAttribute.prize = '0';
    globalAttribute.lotteryName = params.lotteryName;
    globalAttribute.ticketPrice = params.ticketPrice;
    globalAttribute.issuer = sender;
    
    storageStore(globalAttributeKey, JSON.stringify(globalAttribute));
    
    let buyerList = [];
    storageStore(buyerListKey, JSON.stringify(buyerList));
}

function getPrize() {
    return globalAttribute.prize;
}

function getLotteryName() {
    return globalAttribute.lotteryName;
}

function getTicketPrice() {
    return globalAttribute.ticketPrice;
}

function getIssuer() {
    return globalAttribute.issuer;
}

function isAdmin(requester) {
    return requester === thisAddress;
}

function listBuyers() {
    return storageLoad(buyerListKey);
}

function listTxns() {
   let result = [];
    let buyerList = JSON.parse(storageLoad(buyerListKey));
    let index = 0;
    let length = buyerList.length;
    while (index<length) {
      let curBuyer = buyerList[index];
      
      let txnsArr = JSON.parse(storageLoad(curBuyer));
      
      let innerIndex = 0;
      let innerLength = txnsArr.length;
      
      while (innerIndex < innerLength) {
        let curTxn = txnsArr[innerIndex];
        curTxn.buyer = curBuyer;
        result.push(curTxn);
        
        innerIndex = innerIndex + 1;
      }
      index = index + 1;
    }
  
    return JSON.stringify(result);
}

function getWinners(){
    return;
}

function draw() {
    let result = {};
    //pseudo generate winner numbers
    let winnerNumbers = ['5','28','62','65','70'];
    let winnerMegaNum = '5';
    let winners = [];
    
    let buyerList = JSON.parse(storageLoad(buyerListKey));
    let index = 0;
    let length = buyerList.length;
    while (index<length) {
      let curBuyer = buyerList[index];
      
      let txnsArr = JSON.parse(storageLoad(curBuyer));
      
      let innerIndex = 0;
      let innerLength = txnsArr.length;
      
      while (innerIndex < innerLength) {
        let curTxn = txnsArr[innerIndex];
        
        if (JSON.stringify(winnerNumbers) === JSON.stringify(curTxn.numbers) && JSON.stringify(winnerMegaNum) === JSON.stringify(curTxn.megaNum)){
          winners.push(curBuyer);
        }
        
        innerIndex = innerIndex + 1;
      }
      
      index = index + 1;
    }
    
    loadGlobalAttribute();
    result.winners = winners;
    result.prize = getPrize();
    result.winnerNumbers = winnerNumbers;
    result.winnerMegaNum = winnerMegaNum;
    
    return JSON.stringify(result);
}

function getTicket(numbers, megaNum, buyer) {
  loadGlobalAttribute();
  let curPrize = getPrize();
  let curTicketPrice = getTicketPrice();
  globalAttribute.prize = int64Add(curPrize, parseInt(curTicketPrice));
  updateGlobalAttribute();
  
  let curTxn = {};
  curTxn.numbers = numbers;
  curTxn.megaNum = megaNum;
  
  let txnsStr = storageLoad(buyer);
  let txnsArr = [];
  if (txnsStr !== false) {
    txnsArr = JSON.parse(txnsStr);
  }
  txnsArr.push(curTxn);
  txnsStr = JSON.stringify(txnsArr);
  
  storageStore(buyer, txnsStr);
  
  let buyerList = JSON.parse(listBuyers());
  if (!buyerList.includes(buyer)) {
    buyerList.push(buyer);
  }
  storageStore(buyerListKey, JSON.stringify(buyerList));
  
  return true;
}

function payout(winnersInput){
  assert(winnersInput !== false, 'No Winners Info, Please Draw First.');
  
  let winners = JSON.parse(winnersInput);
  
  loadGlobalAttribute();
  let prize = parseInt(getPrize());
  
  let index = 0;
  let length = winners.length;
  let prizeEachPerson = int64Div(toBaseUnit(prize.toString()), length);
  while (index < length) {
    let curWinner = winners[index];
    
    payCoin(curWinner, prizeEachPerson, 'Payout ' + curWinner + 'with amount: ' + prizeEachPerson);
    tlog('prize payout', 'Payout ' + curWinner + 'with amount: ' + prizeEachPerson);
    index = index + 1;
  }
  
  loadGlobalAttribute();
  globalAttribute.prize = '0';
  updateGlobalAttribute();
  
  let buyerList = JSON.parse(storageLoad(buyerListKey));
     index = 0;
     length = buyerList.length;
    while (index<length) {
      let curBuyer = buyerList[index];
      
      storageDel(curBuyer);
      
      index = index + 1;
    }
    
    let newBuyerList = [];
    storageStore(buyerListKey, JSON.stringify(newBuyerList));
  return true;
}

function main(input_str){
    loadGlobalAttribute();
    let input = JSON.parse(input_str);

    if(input.method === 'getTicket'){
        assert(thisPayCoinAmount === toBaseUnit(getTicketPrice()), 'Wrong Ticket Fee');
        getTicket(input.params.numbers, input.params.megaNum, sender);
    }
    else if(input.method === 'payout'){
        assert(sender === getIssuer(), 'You dont have permission');
        payout(input.params.winners);
    }
    else{
        throw 'Main interface passes an invalid operation type';
    }
}

function query(input_str){
    loadGlobalAttribute();
    
    let input = JSON.parse(input_str);
    let result = {};
    
    if(input.method === 'getBasicInfo'){
        result.prize = getPrize();
        result.issuer = getIssuer();
        result.lotteryName = getLotteryName();
        result.ticketPrice = getTicketPrice();
        
        result = JSON.stringify(result);
    }
    else if(input.method === 'listBuyers'){
        result = listBuyers();
    }
    else if(input.method === 'listTxns'){
        result = listTxns();
    }
    else if(input.method === 'draw'){
        result = draw();
    }
    else{
        throw 'Query interface passes an invalid operation type';
    }
    
    return result;
}