const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 3000;

// Middle ware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xvcivem.mongodb.net/?retryWrites=true&w=majority`;

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
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // await client.connect();

    const productsCollection = client
      .db("Ark-Power-LTD")
      .collection("products");
    const newsCollection = client
      .db("Ark-Power-LTD")
      .collection("newsAndEvents");
    const usersCollection = client.db("Ark-Power-LTD").collection("users");
    const careerCollection = client.db("Ark-Power-LTD").collection("career");

    //JWT
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_ACCESS_TOKEN, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send([]);
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.get("/products", async (req, res) => {
      const result = await productsCollection.find().toArray();
      res.send(result);
    });
    // POST method
    app.post("/products", async (req, res) => {
      const addProducts = req.body;
      const result = await productsCollection.insertOne(addProducts);
      res.send(result);
    });

    app.put("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const update = req.body;
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          imageUrl: update.imageUrl,
          price: update.price,
          name: update.name,
          description: update.description,
        },
      };
      const result = await productsCollection.updateOne(
        query,
        updateDoc,
        options
      );
      res.send(result);
    });

    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;
      const deleteID = { _id: new ObjectId(id) };
      const result = await productsCollection.deleteOne(deleteID);
      res.send(result);
    });

    app.get("/news", async (req, res) => {
      try {
        const result = await newsCollection.find().toArray();
        res.send(result);
      } catch (err) {
        res.status(500).send("Error fetching news");
      }
    });

    // POST method
    app.post("/news", async (req, res) => {
      const addNews = req.body;
      const result = await newsCollection.insertOne(addNews);
      res.send(result);
    });

    app.put("/news/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const update = req.body;
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          imageUrl: update.imageUrl,
          date: update.date,
          title: update.title,
          details: update.details,
        },
      };
      const result = await newsCollection.updateOne(query, updateDoc, options);
      res.send(result);
    });

    app.delete("/news/:id", async (req, res) => {
      const id = req.params.id;
      const deleteID = { _id: new ObjectId(id) };
      const result = await newsCollection.deleteOne(deleteID);
      res.send(result);
    });

    // GET route to fetch data
    app.get("/career", async (req, res) => {
      try {
        const careers = await careerCollection.find().toArray();
        res.send(careers);
      } catch (error) {
        console.error("Error fetching documents:", error);
        res.status(500).send("Error fetching documents");
      }
    });

    app.post("/career", async (req, res) => {
      try {
        const addCareer = req.body;
        const result = await careerCollection.insertOne(addCareer);
        res.send(result);
      } catch (error) {
        console.error("Error inserting document:", error);
        res.status(500).send("Error inserting document");
      }
    });

    app.delete("/career/:id", async (req, res) => {
      const id = req.params.id;
      const deleteID = { _id: new ObjectId(id) };
      const result = await careerCollection.deleteOne(deleteID);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("ARK POWER LIMITED IS RUNNING ON THIS PORT.");
});

app.listen(port, () => {
  console.log(`Ark power Server listening on port ${port}`);
});
