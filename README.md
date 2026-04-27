# CS595FinalProject

## Setup

### Start your postgresql database

1. create new postgresql database or just enter the psql shell
2. if your database doesn't contain the following tables (check by running `\dt` in the psql shell) then run the following code to create them
3. create the consents table with: `CREATE TABLE consents (id SERIAL PRIMARY KEY,participant TEXT NOT NULL, requester_id INTEGER NOT NULL, granted_at TIMESTAMP, revoked_at TIMESTAMP, CONSTRAINT unique_participant_requester UNIQUE (participant, requester_id));`
4. create access_requests table with: `CREATE TABLE access_requests (id SERIAL PRIMARY KEY, participant TEXT NOT NULL, requester_id INTEGER NOT NULL, requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`
5. create users table for auth with: `CREATE TABLE users (address TEXT PRIMARY KEY, role TEXT CHECK (role IN ('participant','requester')), nonce TEXT);`

### Populating your .env file

```
ADMIN_PRIVATE_KEY=<Instruction 2>
CONTRACT_ADDRESS=<Instruction 1>
RPC_URL=https://eth-sepolia.g.alchemy.com/v2/<Instruction 3>

DB_PASSWORD=
DB_PORT=5432
DB_HOST=localhost
DB_USER=ernestorivera
DB_NAME=postgres
```

Note: you must also populate frontend/.env.local with the contract address value from instruction 1

1. Deploy the contract on the sepolia testnet and that will give you the contract address
2. Get your wallet private key using metamask and clicking on the 3 dots next to the list of your addresses and follow the steps to export your private key (make sure to add 0x prefix if it isn't given to you automatically)
3. Create an app on alchemy and copy the RPC url that ends with your api key for the RPC URL. Go through this: https://dashboard.alchemy.com/?a=
4. update the database section of the .env file based on information about your database. Most likeley you will need to change DB_Name to postgres, and then run `whoami` in your terminal to get the DB_USER, and if you install postgres sql through `homebrew` you don't need a password.

Also, create a file: `backend/abi/DynamicConsent.json` and copy the abi that you get when you compile and deploy the contract in the Remix IDE. Then, paste that abi into a json file within the abi folder.

## Running the app

1. in one terminal run `cd backend` then `npm start`
2. in a separate terminal run `cd frontend` then `npm run dev`

## Running with Docker

1. Complete the contract deployment and ABI steps above
2. Create `privatekey.env` at the project root (it is gitignored):

   ```env
   ADMIN_PRIVATE_KEY=0xYourWalletPrivateKey
   RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
   CONTRACT_ADDRESS=0xYourDeployedContractAddress
   ```

3. Run `docker compose up --build`

This starts all three services — the database schema is initialized automatically, no manual SQL setup needed.

- Backend: [http://localhost:3000](http://localhost:3000)
- Frontend: [http://localhost:5173](http://localhost:5173)
