const dns = require('node:dns')
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const app = express();
const dotenv = require('dotenv');
const cors = require('cors');
dotenv.config();
const port = process.env.PORT || 3002;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = "mongodb+srv://biblio-drop:9LLVOdy216YfYfMH@cluster0.oldm8ln.mongodb.net/?appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        const database = client.db("biblio-drop");
        const booksCollection = database.collection("books");


        // get  books based on librarianId
        app.get('/api/books', async (req, res) => {
            try {
                const librarianId = req.query.librarianId;
                console.log("Received librarianId:", librarianId);
                const query = librarianId? { librarianId: librarianId } : {};
                const books = await booksCollection.find(query).toArray();
                res.status(200).json(books);
            } catch (error) {
                console.error('Error fetching books:', error);
                res.status(500).json({ message: 'Internal server error' });
            }
        });

        // add a new book 
        app.post('/api/books', async (req, res) => {
            try {
                const bookData = req.body;
                const result = await booksCollection.insertOne(bookData);
                res.status(201).json({ message: 'Book added successfully', bookId: result.insertedId });
            }
            catch (error) {
                console.error('Error adding book:', error);
                res.status(500).json({ message: 'Internal server error' });
            }
        })

        // delete a book by id
        app.delete('/api/books/:id', async (req, res) => {
            try {
                const bookId = req.params.id;
                const query = {_id: new ObjectId(bookId)};
                const result = await booksCollection.deleteOne(query);
                if (result.deletedCount === 1) {
                    res.status(200).json({ message: 'Book deleted successfully', success: true });
                } else {
                    res.status(404).json({ message: 'Book not found', success: false });
                }
            }
            catch (error) {
                console.error('Error deleting book:', error);
                res.status(500).json({ message: 'Internal server error', success: false });
            }
        })







        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});