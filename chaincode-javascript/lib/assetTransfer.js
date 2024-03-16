/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

"use strict";

// Deterministic JSON.stringify()
const stringify = require("json-stringify-deterministic");
const sortKeysRecursive = require("sort-keys-recursive");
const { Contract } = require("fabric-contract-api");

class AssetTransfer extends Contract {
  async InitLedger(ctx) {
    const userLedger = [];
    for (const user of userLedger) {
      user.docType = "user";
      await ctx.stub.putState(
        user.ID,
        Buffer.from(stringify(sortKeysRecursive(user)))
      );
    }
  }
  // CreateUser funtion creates a new user
  async CreateUser(
    ctx,
    userName,
    mmID,
    name,
    address,
    phoneNo,
    bg,
    emerCon,
    dlID,
    dlHash
  ) {
    console.log("CreateUser from chaincode says HI");

    const user = {
      username: userName,
      metamask: mmID,
      name: name,
      address: address,
      phoneNo: phoneNo,
      bloodGroup: bg,
      emergencyContact: emerCon,
      licenceID: dlID,
      licenceHash: dlHash,
    };

    console.log("FINAL DOCUMENT INTO HF", user);
    
    await ctx.stub.putState(
      user.metamask,
      Buffer.from(stringify(sortKeysRecursive(user)))
    );
    return JSON.stringify(user+"INSERED SUCCESSFULLY!");
  }

  // ReadUser returns the user stored in the world state with given id.
  async ReadUser(ctx, mmID) {
    const userJSON = await ctx.stub.getState(mmID);
    if (!userJSON || userJSON.length === 0) {
      throw new Error(`The user ${mmID} does not exist`);
    }
    return userJSON.toString();
  }

  // AssetExists returns true when user with given ID exists in world state.
  async UserNameExists(ctx, mmID) {
    const userJSON = await ctx.stub.getState(mmID);
    console.log("userjson---", userJSON.toString());
    if (userJSON && userJSON.length > 0) {
      return userJSON;
    } else {
      return false;
    }
  }

  // UpdateRide updates the details of a ride
  // // UpdateAsset updates an existing asset in the world state with provided parameters.
  // async UpdateAsset(ctx, id, color, size, owner, appraisedValue) {
  //     const exists = await this.AssetExists(ctx, id);
  //     if (!exists) {
  //         throw new Error(`The asset ${id} does not exist`);
  //     }

  //     // overwriting original asset with new asset
  //     const updatedAsset = {
  //         ID: id,
  //         Color: color,
  //         Size: size,
  //         Owner: owner,
  //         AppraisedValue: appraisedValue,
  //     };
  //     // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
  //     return ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(updatedAsset))));
  // }

  // DeleteAsset deletes an given asset from the world state.
  async DeleteAsset(ctx, id) {
    const exists = await this.AssetExists(ctx, id);
    if (!exists) {
      throw new Error(`The asset ${id} does not exist`);
    }
    return ctx.stub.deleteState(id);
  }

  // TransferAsset updates the owner field of asset with given id in the world state.
  async TransferAsset(ctx, id, newOwner) {
    const assetString = await this.ReadAsset(ctx, id);
    const asset = JSON.parse(assetString);
    const oldOwner = asset.Owner;
    asset.Owner = newOwner;
    // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
    await ctx.stub.putState(
      id,
      Buffer.from(stringify(sortKeysRecursive(asset)))
    );
    return oldOwner;
  }

  // GetUserLedger returns all users found in the world state.
  async GetUserLedger(ctx) {
    const allResults = [];
    // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
    const iterator = await ctx.stub.getStateByRange("", "");
    let result = await iterator.next();
    while (!result.done) {
      const strValue = Buffer.from(result.value.value.toString()).toString(
        "utf8"
      );
      let record;
      try {
        record = JSON.parse(strValue);
      } catch (err) {
        console.log(err);
        record = strValue;
      }
      allResults.push(record);
      result = await iterator.next();
    }
    console.log("ALL RESULTS", allResults);
    return JSON.stringify(allResults);
  }
}

module.exports = AssetTransfer;
