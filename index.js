const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT;

// middleware
app.use(cors());
app.use(express.json());

const createJWT = (user) => {
  const token = jwt.sign(
    {
      email: user?.email,
    },
    "secret",
    { expiresIn: "7d" }
  );
  return token;
};

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization.split(" ")[1];

  const verify = jwt.verify(token, "secret");
  if (!verify) {
    return res.send({ message: "You are not Unauthorized" });
  }
  req.email = verify.email;
  next();
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.o2yxo5l.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const user_Collection = client.db("userDB").collection("users");
    const bike_collection = client.db("bikeDB").collection("bikes");

    // user
    app.post("/user", async (req, res) => {
      const user = req.body;
      const token = createJWT(user);

      const existUser = await user_Collection.findOne({ email: user?.email });
      if (existUser) {
        return res.send({
          status: "success",
          message: "Login successfull",
          token,
        });
      }
      await user_Collection.insertOne(user);
      res.send({ token });
    });

    app.get("/user/get/:id", async (req, res) => {
      const id = req.params.id;
      const result = await user_Collection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const findUser = await user_Collection.findOne({ email });
      res.send(findUser);
    });

    app.patch("/user/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const updateUser = req.body;
      const result = await user_Collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateUser },
        { upsert: true }
      );
      res.send(result);
    });

    // bikes
    app.post("/bikes", verifyToken, async (req, res) => {
      const body = req.body;
      const result = await bike_collection.insertOne(body);
      res.send(result);
    });

    app.patch("/bikes/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const updateCard = req.body;
      const result = await bike_collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateCard },
        { upsert: true }
      );

      res.send(result);
    });

    app.get("/bikes", async (req, res) => {
      const result = await bike_collection.find().toArray();
      res.send(result);
    });

    app.get("/bikes/:id", async (req, res) => {
      const id = req.params.id;
      const result = await bike_collection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.delete("/bikes/:id", async (req, res) => {
      const id = req.params.id;
      const result = await bike_collection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    console.log("You successfully connected to MongoDB!");
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello from bikerz zone website");
});

app.listen(port, () => {
  console.log(`Bikerz zone website running on port : ${port}`);
});
