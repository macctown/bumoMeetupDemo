### BUMO Dapp Demo - Mega Million on BUMO
This is a demo dapp for bumo meetup, includes smart contract and service example code

### How to Run ###
1. clone this repo
2. npm install
3. node server.js

### How to Use ###
1. Go to http://localhost:3000/retailer 
2. Click "Deploy" (This will deploy contract to test network, and return the txn hash in the format of qrcode)
3. Click the returned QR code (This will take you to the txn page), copy the contract addr
4. Paste the contract addr to the "Setup Contract Address" field and click "Setup" button (This will tell the local server what contract it will talk to)
5. Go to http://localhost:3000 (This is the page for lottery buyer)
6. Enter buyer's public key and private key, and click "Confirm" button (This will tell server the keys for signing txn)
7. Go to http://localhost:3000 (After you setup buyer's info, you can buy lottery ticket now)
8. Each ticket will charge 8 BU (You can change the ticket price in the contract deployment code, home.js line 116)
9. Go to http://localhost:3000/retailer (Now you should be able to see all ticket sale txns, it contains the buyer's public address and the number he buys)
10. Click "Draw" (For now the winning number is hard coded as: 5,28,62,65,70,5)
11. It will list all winners (if there are more than one winner) and how much BU they will get for reward
12. Click "Payout" (This will pay the reward from contract address to the winners' address)
13. Click the returned QR code (This will take you the payout txn payge)
