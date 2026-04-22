# CS595FinalProject

## Setup

### Start your postgresql database

1. create new postgresql database or just enter the psql shell
2. if your database doesn't contain the following tables (check by running `\dt` in the psql shell) then run the following code to create them
3. create the consents table with: `CREATE TABLE consents (id SERIAL PRIMARY KEY, participant TEXT NOT NULL, requester_id INTEGER NOT NULL, granted_at TIMESTAMP, revoked_at TIMESTAMP);`
4. create access_requests table with: `CREATE TABLE access_requests (id SERIAL PRIMARY KEY, participant TEXT NOT NULL, requester_id INTEGER NOT NULL, requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`

### Populating your .env file

1. Deploy the contract on the sepolia testnet and that will give you the contract address
2. Get your wallet private key using metamask and clicking on the 3 dots next to the list of your addresses and follow the steps to export your private key (make sure to add 0x prefix if it isn't given to you automatically)
3. Create an app on alchemy and copy the RPC url that ends with your api key for the RPC URL
4. update the database section of the .env file based on information about your database

Also, copy the abi that you get when you compile and deploy the contract in the Remix IDE. Then, paste that abi into a json file within the abi folder.

## Running the app

1. `cd backend`
2. `npm start`
3. in a separate terminal can run `npm test` to test the curl GET request route