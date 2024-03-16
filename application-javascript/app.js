/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

"use strict";

const utf8Decoder = new TextDecoder();
import { Gateway, Wallets } from "fabric-network";
import FabricCAServices from "fabric-ca-client";
import path from "path";

import CAUtil from "/home/angeline-reetu/go/src/github.com/AngelineReetuA/fabric-samples/test-application/javascript/CAUtil.js";
import AppUtil from "/home/angeline-reetu/go/src/github.com/AngelineReetuA/fabric-samples/test-application/javascript/AppUtil.js";

const { buildCAClient, registerAndEnrollUser, enrollAdmin } = CAUtil;

const { buildCCPOrg1, buildWallet } = AppUtil;

// const { Gateway, Wallets } = require('fabric-network');
// const FabricCAServices = require('fabric-ca-client');
// const path = require('path');
// const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../test-application/javascript/CAUtil.js');
// const { buildCCPOrg1, buildWallet } = require('../../test-application/javascript/AppUtil.js');

const channelName = "mychannel";
const chaincodeName = "basic";
const chaincodeName2 = "basic22";
const __dirname = path.resolve();
const mspOrg1 = "Org1MSP";
const walletPath = path.join(__dirname, "wallet");
const org1UserId = "appUser" + Date.now();

function prettyJSONString(inputString) {
  return JSON.stringify(JSON.parse(inputString), null, 2);
}

export async function start() {
  // build an in memory object with the network configuration (also known as a connection profile)
  const ccp = buildCCPOrg1();

  // build an instance of the fabric ca services client based on
  // the information in the network configuration
  const caClient = buildCAClient(FabricCAServices, ccp, "ca.org1.example.com");

  // setup the wallet to hold the credentials of the application user
  const wallet = await buildWallet(Wallets, walletPath);

  // in a real application this would be done on an administrative flow, and only once
  await enrollAdmin(caClient, wallet, mspOrg1);

  // in a real application this would be done only when a new user was required to be added
  // and would be part of an administrative flow
  await registerAndEnrollUser(
    caClient,
    wallet,
    mspOrg1,
    org1UserId,
    "org1.department1"
  );

  // Create a new gateway instance for interacting with the fabric network.
  // In a real application this would be done as the backend server session is setup for
  // a user that has been verified.
  const gateway = new Gateway();

  // setup the gateway instance
  // The user will now be able to create connections to the fabric network and be able to
  // submit transactions and query. All transactions submitted by this gateway will be
  // signed by this user using the credentials stored in the wallet.
  await gateway.connect(ccp, {
    wallet,
    identity: org1UserId,
    discovery: { enabled: true, asLocalhost: true }, // using asLocalhost as this gateway is using a fabric network deployed locally
  });

  // Build a network instance based on the channel where the smart contract is deployed
  const network = await gateway.getNetwork(channelName);

  // Get the contract from the network.
  const contract = network.getContract(chaincodeName);
  const contract2 = network.getContract(chaincodeName2);

  console.log("InitLedger - Gateway");
  console.log(await contract.submitTransaction("InitLedger"));
  console.log(await contract2.submitTransaction("InitLedger"));
  console.log("*** Result: committed");
  return [contract, contract2];
}

export async function getAllUsers(contract) {
  const resultBytes = await contract.evaluateTransaction("GetUserLedger");
  const resultJson = utf8Decoder.decode(resultBytes);
  const result = JSON.parse(resultJson);
  console.log("*** Result:", result);
  return result;
}

export async function getAllRides(contract2) {
  const resultBytes = await contract2.submitTransaction("GetAllRides");
  const resultJson = utf8Decoder.decode(resultBytes);
  const result = JSON.parse(resultJson);
  console.log("*** Result:", result);
  return result;
}

/**
 * Submit a transaction synchronously, blocking until it has been committed to the ledger.
 */
export async function createUser(contract, { obj }) {
  try {
    console.log("Creating a new user - Gateway", obj);
    const username = obj.uName;
    const metamask = obj.metamask;
    const name = obj.name;
    const address = obj.address;
    const phoneNo = obj.phno;
    const bg = obj.bloodGroup;
    const emer = obj.emerCon;
    const dlID = obj.dlno;
    const dlHash = obj.dlHash;
    let tx = contract.createTransaction("CreateUser");
    tx.setEndorsingPeers(["peer0.org1.example.com", "peer0.org2.example.com"]);
    await contract.submitTransaction(
      "CreateUser",
      username,
      metamask,
      name,
      address,
      phoneNo,
      bg,
      emer,
      dlID,
      dlHash
    );
    console.log("*** Transaction committed successfully");
    return true;
  } catch (error) {
    console.error("Error submitting transaction:", error);
    return false;
  }
}

export async function checkStatus(contract, mmID) {
  try {
    console.log("Checking for user ", mmID);
    const result = await contract.submitTransaction("UserNameExists", mmID);
    console.log("RESULT", result.toString());
    if (result.toString() === "false") {
      console.log("USER DOES NOT EXIST");
      return false;
    } else {
      console.log("USER EXISTS!!", result);
      return true;
    }
  } catch (error) {
    console.log(error);
  }
}
export async function RetrieveUserDetails(contract, mmID) {
  try {
    console.log("Checking for user ", mmID);
    const result = await contract.submitTransaction("ReadUser", mmID);
    console.log("RESULT", result.toString());
    console.log("USER EXISTS!!", result);
    return JSON.parse(result);
  } catch (error) {
    console.log(error);
    return false;
  }
}
export async function createRide(contract2, { obj }) {
  try {
    console.log("Creating a new ride - Gateway", obj);
    const rideID = obj.rideID;
    const username = obj.name;
    const metamask = obj.mm;
    const phone = obj.phoneNo;
    const date = obj.date;
    const time = obj.startTime;
    const startLoc = obj.startArea;
    const via = obj.via;
    const endingLoc = obj.destin;
    const carpoolers = obj.tagg;
    const rideUnames = obj.rideUnames;
    const rideStatus = obj.rideStatus;
    let tx = contract2.createTransaction("CreateRide");
    tx.setEndorsingPeers(["peer0.org1.example.com", "peer0.org2.example.com"]);
    await contract2.submitTransaction(
      "CreateRide",
      rideID,
      metamask,
      username,
      phone,
      time,
      date,
      startLoc,
      via,
      endingLoc,
      carpoolers,
      rideUnames,
      rideStatus
    );
    console.log("*** Transaction committed successfully");
    return true;
  } catch (error) {
    console.error("Error submitting transaction:", error);
    return false;
  }
}

export async function updateRide(contract2, { obj }) {
  try {
    console.log("Creating a new ride - Gateway", obj);
    const rideID = obj.ID;
    const username = obj.DriverUName;
    const metamask = obj.DriverID;
    const phone = obj.DriverPhone;
    const date = obj.On;
    const time = obj.StartingTime;
    const startLoc = obj.StartingPoint;
    const via = obj.Via;
    const endingLoc = obj.EndingPoint;
    const carpoolers = obj.Carpoolers;
    const rideUnames = obj.RidersUnames;
    const rideStatus = obj.RideStatus;
    let tx = contract2.createTransaction("UpdateRide");
    tx.setEndorsingPeers(["peer0.org1.example.com", "peer0.org2.example.com"]);
    await contract2.submitTransaction(
      "UpdateRide",
      rideID,
      metamask,
      username,
      phone,
      time,
      date,
      startLoc,
      via,
      endingLoc,
      carpoolers,
      rideUnames,
      rideStatus
    );
    console.log("*** Transaction updated successfully");
    return true;
  } catch (error) {
    console.error("Error submitting transaction:", error);
    return false;
  }
}

export async function RetrieveRide(contract2, rideID) {
  try {
    console.log("Checking for ride ", rideID);
    const result = await contract2.submitTransaction("RetrieveRide", rideID);
    console.log("RESULT", result.toString());
    console.log("RIDE EXISTS!!", result);
    return JSON.parse(result);
  } catch (error) {
    console.log(error);
    return false;
  }
}
