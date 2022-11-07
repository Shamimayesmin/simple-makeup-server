const express = require("express")
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const jwt = require('jsonwebtoken')

const app = express()
const port = process.env.PORT || 5000;

// midleware 
app.use(cors());
app.use(express.json());


// user : simpleMakeup
// password : DiHpggYd1WIw7bHY

console.log(process.env.DB_USER);
console.log(process.env.DB_PASSWORD);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ui8slz3.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


// verify jwt: 
function verifyJWT(req, res,next){
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(401).send({message : 'unauthorized access'})
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded){
        if(err){
            return res.status(401).send({message : 'unauthorized access'}) 
        }
        req.decoded = decoded;
        next()

    })
 }

// CRUD operation 
async function run(){
    try{

    const productCollection = client.db('simpleMakeup').collection('products')
    const orderCollection = client.db('simpleMakeup').collection('orders')

    // jwt token access 
    app.post('/jwt', (req, res) =>{
        const user = req.body;
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn :'1d'})
        res.send({token})
    })

    // product api
        app.get('/products', async(req,res)=>{
            const query = {}
            const cursor = productCollection.find(query)
            const products = await cursor.toArray()
            res.send(products);
        })

        app.get('/products/:id', async(req, res) =>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)}
            const product = await productCollection.findOne(query)
            res.send(product)
        })


        // product order api 
        app.get('/orders',verifyJWT, async(req,res) =>{
            const decoded = req.decoded;
            console.log('inside orders api', decoded);
            if(decoded.email !== req.query.email){
                res.status(403).send({message : 'unathorized access'})
            }

            //query email pawa jai /orders?email=e@gmail.com
            let query = {}
            if(req.query.email){
                query = {
                    email : req.query.email
                }
            }
            const cursor = orderCollection.find(query);
            const orders = await cursor.toArray();
            console.log(orders);
            res.send(orders)

        })

        //order api checkout page
        app.post('/orders', async(req,res) =>{
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result)
        })


        // update order (approve or pending) 
        app.patch('/orders/:id', async(req,res)=>{
            const id = req.params.id;
            const status = req.body.status;
            const query = {_id : ObjectId(id)}
            const updatedDoc = {
                $set: {
                    status : status
                }
            }
            const result = await orderCollection.updateOne(query, updatedDoc)
            res.send(result)
        })

        // delete order 
        app.delete('/orders/:id', async(req, res) =>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)}
            const result = await orderCollection.deleteOne(query)
            res.send(result)
        })
    }
    finally{

    }
}
run().catch(err => console.error(err))



app.get('/', (req,res) =>{
    res.send('makeup website server is running')
})

app.listen(port, ()=>{
    console.log(`makeup website server is running on ${port}`)
})