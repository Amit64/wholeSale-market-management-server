const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_ADMIN}:${process.env.DB_PASS}@cluster0.msmpdhl.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'UnAuthorized access' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'Forbidden access' })
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    await client.connect();
    const productCollection = client.db("powertools-db").collection("products");
    const orderCollection = client.db("powertools-db").collection("orders");
    const userCollection    = client.db("powertools-db").collection('users');

    //get feature product
    app.get("/limit-product", async (req, res) => {
      const query = {};
      const cursor = productCollection.find(query);
      const products = await cursor.limit(6).toArray();
      res.send(products);
    });
    // get all products
    app.get("/products",async(req,res)=>{
      const query = {};
      const products = await productCollection.find(query).toArray();
      res.send(products);
    })
    //geting data for purchase page
    app.get('/product/:id',async(req,res)=>{
      const id = req.params.id;
      const query = {_id:ObjectId(id)}
      const product = await productCollection.findOne(query);
      res.send(product);
    })
    //insert orders
    app.post('/order',async(req,res)=>{
      const orders = req.body;
      const result = await orderCollection.insertOne(orders);
      res.send(result);
   })
   //insert user
   app.put('/user/:email',async(req,res)=>{
    const email= req.params.email;
    const user = req.body;
    const filter = {email:email};
    const options = {upsert:true};
    const updateDoc = {
      $set: user,
    }
    const result = await userCollection.updateOne(filter,updateDoc,options);
    const token = jwt.sign({email:email},process.env.ACCESS_TOKEN_SECRET,{expiresIn:'1d'})
    res.send({result,token}); 
  })
  } finally {
      //
  }
}

run().catch(console.dir);
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
