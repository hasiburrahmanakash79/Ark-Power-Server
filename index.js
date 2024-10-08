const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const { Parser } = require("json2csv");
const fs = require("fs");
const path = require("path");
const port = process.env.PORT || 3000;

// Middle ware
app.use(cors());
app.use(express.json());

/////////////JWT verify///////////
const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "unauthorized access" });
  }
  //bearer token
  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.JWT_ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ error: true, message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};

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
    const subscriberCollection = client
      .db("Ark-Power-LTD")
      .collection("subscriber");
    const footerCollection = client.db("Ark-Power-LTD").collection("footer");
    const heroImagesCollection = client
      .db("Ark-Power-LTD")
      .collection("hero-image");

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

    // delete user from database
    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });

    // find Admin from database
    app.get("/users/admin/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      if (req.decoded.email !== email) {
        return res.send({ admin: false });
      }
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const result = { admin: user?.role === "admin" };
      res.send(result);
    });

    //make admin
    app.patch("/users/:id", async (req, res) => {
      const id = req.params.id;
      const filterId = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await usersCollection.updateOne(filterId, updateDoc);
      res.send(result);
    });

    //make Suspend
    app.patch("/suspend/:id", async (req, res) => {
      const id = req.params.id;
      const filterId = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "suspend",
        },
      };
      const result = await usersCollection.updateOne(filterId, updateDoc);
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

    app.put("/career/:id", async (req, res) => {
      const { id } = req.params; // Get the career ID from URL params
      const updatedCareer = req.body; // The updated career details from the request body
    
      try {
        const filter = { _id: new ObjectId(id) }; // Find the career by its MongoDB ObjectId
        const updateDoc = {
          $set: updatedCareer, // Update the fields passed in the request body
        };
    
        const result = await careerCollection.updateOne(filter, updateDoc);
    
        if (result.modifiedCount > 0) {
          res.send({
            message: "Career updated successfully",
            result,
          });
        } else {
          res.status(404).send("Career not found or no changes were made.");
        }
      } catch (error) {
        console.error("Error updating document:", error);
        res.status(500).send("Error updating document");
      }
    });

    app.delete("/career/:id", async (req, res) => {
      const id = req.params.id;
      const deleteID = { _id: new ObjectId(id) };
      const result = await careerCollection.deleteOne(deleteID);
      res.send(result);
    });

    app.get("/subscriber", async (req, res) => {
      const result = await subscriberCollection.find().toArray();
      res.send(result);
    });
    // POST method
    app.post("/subscriber", async (req, res) => {
      const subscribe = req.body;
      const result = await subscriberCollection.insertOne(subscribe);
      res.send(result);
    });

    app.get("/subscriberDownload", async (req, res) => {
      try {
        const users = await subscriberCollection.find().toArray();
        const json2csvParser = new Parser();
        const csv = json2csvParser.parse(users);
        const filePath = path.join(__dirname, "subscriber.csv");
        fs.writeFileSync(filePath, csv);
        res.download(filePath, "subscriber.csv", (err) => {
          if (err) {
            console.log(err);
          }
          fs.unlinkSync(filePath);
        });
      } catch (err) {
        res.status(500).send(err.toString());
      }
    });
    app.get("/productsDownload", async (req, res) => {
      try {
        const users = await productsCollection.find().toArray();
        const json2csvParser = new Parser();
        const csv = json2csvParser.parse(users);
        const filePath = path.join(__dirname, "products.csv");
        fs.writeFileSync(filePath, csv);
        res.download(filePath, "products.csv", (err) => {
          if (err) {
            console.log(err);
          }
          fs.unlinkSync(filePath);
        });
      } catch (err) {
        res.status(500).send(err.toString());
      }
    });
    app.get("/usersDownload", async (req, res) => {
      try {
        const users = await usersCollection.find().toArray();
        const json2csvParser = new Parser();
        const csv = json2csvParser.parse(users);
        const filePath = path.join(__dirname, "users.csv");
        fs.writeFileSync(filePath, csv);
        res.download(filePath, "users.csv", (err) => {
          if (err) {
            console.log(err);
          }
          fs.unlinkSync(filePath);
        });
      } catch (err) {
        res.status(500).send(err.toString());
      }
    });

    app.get("/newsDownload", async (req, res) => {
      try {
        const news = await newsCollection.find().toArray();
        const json2csvParser = new Parser();
        const csv = json2csvParser.parse(news);
        const filePath = path.join(__dirname, "news.csv");
        fs.writeFileSync(filePath, csv);
        res.download(filePath, "news.csv", (err) => {
          if (err) {
            console.log(err);
          }
          fs.unlinkSync(filePath);
        });
      } catch (err) {
        res.status(500).send(err.toString());
      }
    });

    // GET method to fetch all hero images
    app.get("/hero-images", async (req, res) => {
      try {
        const result = await heroImagesCollection.find().toArray();
        res.send(result);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch hero images" });
      }
    });

    // POST method to add a new hero image
    app.post("/hero-images", async (req, res) => {
      const newImage = req.body;
      try {
        const result = await heroImagesCollection.insertOne(newImage);
        res.send(result);
      } catch (error) {
        res.status(500).json({ error: "Failed to add hero image" });
      }
    });

    // app.put("/hero-images/:id", async (req, res) => {
    //   const id = req.params.id;
    //   const query = { _id: new ObjectId(id) };
    //   const update = req.body;
    //   const updateDoc = {
    //     $set: {
    //       url: update.url,
    //     },
    //   };

    //   console.log("Updating document with ID:", id);
    //   console.log("Update document:", updateDoc);

    //   try {
    //     const result = await heroImagesCollection.updateOne(query, updateDoc);

    //     if (result.modifiedCount === 0) {
    //       res.status(404).json({ error: "No document was updated. Check if the URL is different." });
    //     } else {
    //       res.send(result);
    //     }
    //   } catch (error) {
    //     console.error("Failed to update hero image:", error);
    //     res.status(500).json({ error: "Failed to update hero image" });
    //   }
    // });
    app.put("/hero-images/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const update = req.body;

      console.log("Update body:", update);

      const updateDoc = {
        $set: {
          image: update.image,
          url: update.image,
        },
      };

      console.log("Updating document with ID:", id);
      console.log("Update document:", updateDoc);

      try {
        const result = await heroImagesCollection.updateOne(query, updateDoc);

        console.log("Update result:", result); // Log the result

        if (result.matchedCount === 0) {
          res.status(404).json({ error: "Document not found" });
        } else if (result.modifiedCount === 0) {
          res.status(200).json({ message: "No changes made to the document" });
        } else {
          res.send(result);
        }
      } catch (error) {
        console.error("Failed to update hero image:", error);
        res.status(500).json({ error: "Failed to update hero image" });
      }
    });

    // DELETE method to remove an image by id
    app.delete("/hero-images/:id", async (req, res) => {
      const { id } = req.params;
      try {
        const result = await heroImagesCollection.deleteOne({
          _id: new ObjectId(id),
        });
        res.send(result);
      } catch (error) {
        res.status(500).json({ error: "Failed to delete the image" });
      }
    });

    app.get("/footer", async (req, res) => {
      const result = await footerCollection.find().toArray();
      res.send(result);
    });
    // POST method
    app.post("/footer", async (req, res) => {
      const addFooter = req.body;
      const result = await footerCollection.insertOne(addFooter);
      res.send(result);
    });

    app.put("/footer/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const update = req.body;
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          address: update.address,
          salesContact: update.salesContact,
          supportContact: update.supportContact,
          email: update.email,
          facebookUrl: update.facebookUrl,
          youtubeUrl: update.youtubeUrl,
          instagramUrl: update.instagramUrl,
          twitterUrl: update.twitterUrl,
          telegramUrl: update.telegramUrl,
        },
      };
      const result = await footerCollection.updateOne(
        query,
        updateDoc,
        options
      );
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
