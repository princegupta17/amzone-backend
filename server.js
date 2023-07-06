const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require('dotenv').config();
const Products = require("./Products");
const bcrypt = require("bcrypt");
const Users = require("./Users");
const Orders = require("./Orders");
const stripe = require("stripe")(process.env.STRIPE_KEY);
const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use(cors({
  origin: ["https://amazon-frontend-2z5k.onrender.com"],
  methods: ["POST", "GET"],
  credentials: true
}));

const connection_url = process.env.CONNECT_URL
async function run() {
  // Create a new connection and connect to MongoDB...
  const conn = await mongoose.
    createConnection(connection_url).
    asPromise();
}

run();
// mongoose.connect(connection_url, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

app.get("/", (req, res) => res.status(200).send("hello"));

app.post("/products/add", (req, res) => {
  const Productdetails = req.body;

  console.log("Product Details", Productdetails);

  Products.create(Productdetails)
    .then(() => {
      res.status(201).send(Productdetails);
    })
    .catch((err) => {
      res.status(500).send(err.message);
    });
});

app.get("/products/get", (req, res) => {
  Products.find()
    .then((data) => {
      res.status(200).send(data);
    })
    .catch((err) => {
      res.status(500).send(err.message);
    });
});

app.post("/auth/signup", async (req, res) => {
  const { email, password, fullName } = req.body;

  const encrypt_password = await bcrypt.hash(password, 10);

  const userDetail = {
    email: email,
    password: encrypt_password,
    fullName: fullName,
  };

  const user_exist = await Users.findOne({ email: email });

  if (user_exist) {
    res.send({ message: "The Email is already in use !" });
  } else {
    Users.create(userDetail)
      .then(() => {
        res.send({ message: "User Created Succesfully" });
      })
      .catch((err) => {
        res.status(500).send({ message: err.message });
      });
  }
});

// API for LOGIN

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const userDetail = await Users.findOne({ email: email });

  if (userDetail) {
    if (await bcrypt.compare(password, userDetail.password)) {
      res.send(userDetail);
    } else {
      res.send({ error: "invaild Password" });
    }
  } else {
    res.send({ error: "user is not exist" });
  }
});

app.post("/payment/create", async (req, res) => {
  const total = req.body.amount;
  console.log("amount successfull", total);

  const payment = await stripe.paymentIntents.create({
    amount: total * 100,
    currency: "inr",
  });

  res.status(201).send({
    clientSecret: payment.client_secret,
  });
});

app.post("/orders/add", (req, res) => {
  const products = req.body.basket;
  const price = req.body.price;
  const email = req.body.email;
  const address = req.body.address;

  const orderdetails = {
    products: products,
    price: price,
    email: email,
    address: address,
  };

  Orders.create(orderdetails)
    .then((result) => {
      console.log("Order added to database>>>", result);
    })
    .catch((err) => {
      console.log(err);
    });
});

app.post("/orders/get", (req, res) => {
  const email = req.body.email;

  Orders.find()
    .then((result) => {
      const userOrders = result.filter((order) => order.email === email);
      res.send(userOrders);
    })
    .catch((err) => {
      console.log(err);
    });
});

app.listen(port, () => console.log("server is running on port", port));
