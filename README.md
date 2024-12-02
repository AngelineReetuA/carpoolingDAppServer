<h3>Carpooling Decentralized Application - Backend</h3>

The following are the instructions to run the backend of the carpoolingDApp. There are two processes to it which are 
1. Starting the Hyperledger network
2. Starting the server

<b>Prerequisites:</b><br/>
For Hyperledger Fabric —> <a href="https://hyperledger-fabric.readthedocs.io/en/release-2.5/prereqs.html">Docs link</a><br/>
For this project -->
- MySQL 
- IPFS (Interplanetary File Storage)

<b>Process 1:</b><br/>
1. Start the Hyperledger network, create a channel and deploy the chain code with the following steps:<br/>
    1. Clone the fabric-samples repository from hyperledger <a href="https://hyperledger-fabric.readthedocs.io/en/release-2.5/install.html">here</a>.
    2. Up and create a channel on the test-network from fabric-samples with instructions from <a href="https://hyperledger-fabric.readthedocs.io/en/release-2.5/deploy_chaincode.html">here</a>. Follow this up until you have created a channel, and deploy the chaincode-javascript dir as chaincode to the channel using the steps given.
    3. Clone this repository to your local system and deploy the folder chaincode-javascript as the network’s channel’s chaincode.
<br/>
<b>Process 2:</b><br/>
1. Start the server<br/>
    1. Navigate to this repository and run the following commands to start the simple express server.
         <code>npm install</code>
         <code>npm run dev</code>

<br/><br/>
<b>Working of the App:</b><br/>
Three parts to the app: <br/>
1. Hyperledger Network with the chaincode (chaincode-javascript) deployed to the channel
2. Hyperledger Fabric API Gateway (application-javascript) 
3. Express.js Server (server.js)
<br/><br/>

<b>Workflow:</b><br/>
When the server receives a request, <br/>
1. It calls the imported methods from the gateway to complete the transactions
2. The gateway in turn calls the methods in the chaincode which performs IPFS actions, adds the transaction to a local SQL database and completes the transaction in the blockchain as well.
<br/>
The recorded transaction can be viewed in the blockchain with the peer chaincode queries as given <a href="https://hyperledger-fabric.readthedocs.io/en/latest/commands/peerchaincode.html#peer-chaincode-query">here</a>.
<br/><br/>
<b>Resources to understand further:</b><br/>
Official Hyperledger Fabric Docs: https://hyperledger-fabric.readthedocs.io/en/release-2.5/<br/>
A Quick Theoritical Overview: https://kctheservant.medium.com/a-quick-overview-of-hyperledger-fabric-348e8c4da451<br/>


