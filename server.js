"use strict";
import path from "path";
import { createServer } from "http";
import express from "express";
const app = express();
import bodyParser from "body-parser";
import cors from "cors";
import fileupload from "express-fileupload";
import { create } from "ipfs-http-client";
import {
  start,
  createUser,
  checkStatus,
  getAllRides,
  RetrieveUserDetails,
  createRide,
  updateRide,
} from "./application-javascript/app.js";

// support parsing of application/json type post data
app.use(bodyParser.json());

//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({ extended: true }));

let contracts;
let contract;
let contract2;
app.options("*", cors());
app.use(
  cors({
    origin: "http://localhost:5173",
    preflightContinue: true,
  })
);
app.use(fileupload());
app.use(express.json());

const port = 4000;
const ipfs = create({
  host: "127.0.0.1",
  port: "5001",
  protocol: "http",
  apiPath: "/api/v0",
});

let hashDoc;

app.post("/uploadfiles", async (req, res) => {
  // Get the uploaded files from the request
  const files = req.files;
  console.log("FILES FROM API", files);
  hashDoc = await uploadToIPFS(files.dl);
  console.log("IPFS DONE", hashDoc);
  return res.status(201).json(hashDoc);
});

app.post("/addToHF", async (req, res) => {
  const obj = req.body;
  if (obj) {
    console.log("FINAL DOC FOR HF:", obj);
    const ress = await checkStatus(contract, obj.metamask);
    if (ress != false) {
      console.log("NO REGISTRATION CAUSE USER ALREADY EXISTS");
    } else {
      const result = await createUser(contract, { obj });
      console.log("TRUE OR FALSE", result);
      if (result === true) {
        console.log("Done");
        res.status(201).send(result);
      } else {
        console.log("Nope");
        res.status(400).send(result);
      }
    }
  } else {
    console.log("OBJ NOT FOUND");
  }
});

app.post("/checkUser", async (req, res) => {
  const mm = req.body;
  console.log("CHECK USER", mm.account);
  const result = await checkStatus(contract, mm.account);
  if (result == true) {
    console.log("ALREADY EXISTS IN CHECK USER");
    res.sendStatus(200);
  } else {
    res.sendStatus(401);
  }
});

app.post("/get-user-details-and-post", async (req, res) => {
  const body = req.body;
  const obj = {
    rideID: body.rideID,
    date: body.date,
    startTime: body.startTime,
    startArea: body.startArea,
    via: body.via,
    destin: body.dest,
    tagg: body.taggers,
    mm: body.metamaskAddress,
  };
  console.log("OBJ BEFORE", obj);
  const mm = obj.mm;
  console.log("Retrieving details of user", mm);
  const result = await RetrieveUserDetails(contract, mm);
  console.log("RESULT FROM GET USER DETAILS", result);
  if (result === false) {
    res.sendStatus(404);
  } else {
    console.log(result);
    obj.name = result.name;
    obj.phoneNo = result.phoneNo;
    obj.rideUnames = "";
    obj.rideStatus = "notDone";
    console.log("OBJ AFTER", obj);
    await createRide(contract2, { obj });
    res.status(200).json({ message: "Ride committed successfully" });
  }
});

app.post("/update-ride-details", async (req, res) => {
  console.log("HI");
  const body = req.body;
  console.log(body);
  const rideID = body.ID;
  const metamask = body.metamaskAddress;
  console.log(rideID, metamask);
  try {
    let result = await contract2.submitTransaction("RetrieveRide", rideID);
    result = JSON.parse(result.toString());
    console.log("RESULTT", result);
    //add metamask to riderUnames
    let riderUnames = result.RidersUnames;
    riderUnames = riderUnames + ";" + metamask;

    // reduce carpooler number
    let carpool = parseInt(result.Carpoolers);
    carpool = carpool - 1;

    const updatedRide = {
      ID: result.ID,
      DriverID: result.DriverID,
      DriverUName: result.DriverUName,
      DriverPhone: result.DriverPhone,
      StartingTime: result.StartingTime,
      On: result.On,
      StartingPoint: result.StartingPoint,
      Via: result.Via,
      EndingPoint: result.EndingPoint,
      Carpoolers: carpool.toString(),
      RidersUnames: riderUnames,
      RideStatus: result.RideStatus,
    };

    console.log("UPDATED RIDE", updatedRide);
    console.log("RIDERS UNAMES", riderUnames);
    const respp = await updateRide(contract2, { obj: updatedRide });
    if (respp === true) {
      res.status(200).json({ message: "Ride updated successfully" });
    } else {
      res.status(400).json({ message: "Error" });
    }
  } catch (error) {
    console.log("ERROR IN UPDATING", error);
    res.sendStatus(400);
  }
});

app.get("/get-contract", function (req, res) {
  res.header("Content-Type", "application/json");
  res.sendFile(path.resolve("./tagjsonABI.json"));
});

app.get("/get-rides", async (req, res) => {
  try {
    const rides = await getAllRides(contract2);
    console.log("RIDES", rides);
    res.status(200).json(rides);
  } catch (error) {
    console.log("ERROR IN GET RIDES", error);
    res.status(400).json({ message: "Error" });
  }
});

// Error handling
app.use((req, res) => res.status(404).send("Router not found"));

var server = createServer(app).listen(port, async () => {
  contracts = await start();
  contract = contracts[0];
  contract2 = contracts[1];
  console.log(`Server with HF started on ${port}`);
});

server.timeout = 240000;

const uploadToIPFS = async (fileList) => {
  var jsonStr = "[";
  console.log("uploadToIPFS starting");
  try {
    var fileAdded;

    // Single file comes as JSON object
    if (fileList.name !== undefined) {
      fileList = [fileList];
    }

    // Process multiple files
    if (fileList.length) {
      for (let i = 0; i < fileList.length; i++) {
        console.log("FILE LIST: ", fileList);
        var file = fileList[i];
        const fileName = file.name;
        const buffer = await file.data;
        try {
          console.log("Trying to add files");
          fileAdded = await ipfs.add(buffer);
        } catch (err) {
          console.log(err);
          return err.message;
        }

        if (fileAdded.path !== "") {
          jsonStr +=
            '{"name":"' +
            fileName +
            '","value":"' +
            fileAdded.path +
            '","mimetype":"' +
            file.mimetype +
            '"},';

          console.log("JSON STRING OF FILE DETAILS: ", jsonStr);
          console.log("FILE SUCCESSFULLY ADDED!!");
        } else {
          console.log("Process failed");
          return "Could not upload the file to ipfs network";
        }
      }
      // Remove the last comma from the string.
      jsonStr = jsonStr.replace(/,\s*$/, "") + "]";
      return {
        filePath: fileAdded.path,
      };
    }
  } catch (err) {
    console.log(err);
    message.error(err.message);
  }
};
