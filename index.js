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
        const paymentCollection = database.collection("payments");
        const reviewsCollection = database.collection("reviews");

        ///  ======================= review api =====================
        // post review
        app.post('/api/reviews', async (req, res) => {
            try {
                const reviewData = req.body;
                const result = await reviewsCollection.insertOne(reviewData);
                res.status(201).json({ message: 'Review added successfully', reviewId: result.insertedId });
            } catch (error) {
                console.error('Error adding review:', error);
                res.status(500).json({ message: 'Internal server error' });
            }
        });

        // get reviews by bookId

        app.get('/api/reviews/:id', async (req, res) => {
            try {
                const bookId = req.params.id;
                const query = { bookId: bookId }; 
                const reviews = await reviewsCollection.find(query).toArray();
                res.status(200).json(reviews);
            }
            catch (error) {
                console.error('Error fetching reviews:', error);
                res.status(500).json({ message: 'Internal server error' });
            }
        });

        // =================== payment status ==========================

       app.get('/api/commentable/:bookId/userId', async (req, res) => {
            try {
                const bookId = req.params.bookId;
                const userId = req.query.userId;
                console.log("Received bookId:", bookId);
                console.log("Received userId:", userId);
                const query = { bookId: bookId, userId: userId, status: "Delivered" };
                const commentable = await paymentCollection.findOne(query);
                res.status(200).json({ commentable: !!commentable });
           }
            catch (error) {
                console.error('Error checking commentable status:', error);
                res.status(500).json({ message: 'Internal server error' });
           }
        });

        // get payment data based on userId
        app.get('/api/payment-status/user', async (req, res) => {
            try {
                const userId = req.query.userId;
                console.log("Received userId:", userId);
                const query = userId ? { userId: userId } : {};
                const paymentStatus = await paymentCollection.find(query).toArray();
                res.status(200).json(paymentStatus);
            }
            catch (error) {
                console.error('Error fetching payment status:', error);
                res.status(500).json({ message: 'Internal server error' });
            }
        } );


        // get data based on librarianId
        app.get('/api/payment-status/librarian', async (req, res) => {
            try {
                const librarianId = req.query.librarianId;
                console.log("Received librarianId:", librarianId);
                const query = librarianId ? { librarianId: librarianId } : {};
                const paymentStatus = await paymentCollection.find(query).toArray();
                res.status(200).json(paymentStatus);
            }
            catch (error) {
                console.error('Error fetching payment status:', error);
                res.status(500).json({ message: 'Internal server error' });
            }
        } );

        // payment info store
        app.post('/api/payment-status', async (req, res) => {
            const { session_id } = req.body;
            const existingPayment = await paymentCollection.findOne({ session_id });
            if (existingPayment) {
                return res.status(400).json({ message: 'Payment status already exists for this session_id' });
            }
            try {
                const paymentData = req.body;
                const result = await paymentCollection.insertOne(paymentData);
                res.status(201).json({ message: 'Payment status stored successfully', paymentId: result.insertedId });
            } catch (error) {
                console.error('Error storing payment status:', error);
                res.status(500).json({ message: 'Internal server error' });
            }
        });
        

        // =================== get all books ===========================
        app.get('/api/allbooks', async (req, res) => {
            try {
                const books = await booksCollection.find({}).toArray();
                res.status(200).json(books);
            }
            catch (error) {
                console.error('Error fetching books:', error);
                res.status(500).json({ message: 'Internal server error' });
            }
        });

        // book details by id
        app.get('/api/books/:id', async (req, res) => {
            try {
                const bookId = req.params.id;
                const query = { _id: new ObjectId(bookId) };
                const book = await booksCollection.findOne(query);
                if (book) {
                    res.status(200).json(book);
                } else {
                    res.status(404).json({ message: 'Book not found' });
                }
            }
            catch (error) {
                console.error('Error fetching book details:', error);
                res.status(500).json({ message: 'Internal server error' });
            }
        });

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

        // update a book by id
        app.patch('/api/books/:id/unpublish', async (req, res) => {
            try {
                const bookId = req.params.id;
                const query = { _id: new ObjectId(bookId) };
                const update = { $set: { status: 'Unpublished' } };
                const result = await booksCollection.updateOne(query, update);
                if (result.modifiedCount === 1) {
                    res.status(200).json({ message: 'Book unpublished successfully', success: true });
                } else {
                    res.status(404).json({ message: 'Book not found', success: false });
                }
            }
            catch (error) {
                console.error('Error unsubscribing book:', error);
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