/* 
    [+] Require Express
    [+] Require Cors
    [+] call app = express()
    [+] middleware cors and express.json
    [+] Port Define
    [+] create .gitignor file
    [+] requrie dotenv

*/

const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const app = express();



// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.o5lz3b5.mongodb.net/?retryWrites=true&w=majority`;
const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



// middleware
app.use(cors());
app.use(express.json());

async function run(){
    try{
        const appointmentOptionCollection = client.db('doctorPortal').collection('appointmentOptions');
        const bookingsCollection = client.db('doctorPortal').collection('bookings');

        // Not Best Practice
        // Use aggregate to query multiple collection and  then merge data 
        app.get('/appointmentOptions', async (req, res) =>{
            const date = req.query.date;
            const query = {};
            const options = await appointmentOptionCollection.find(query).toArray();
            
            // get the bookings of the provided date
            const bookingQuery = {appointmentDate: date};
            const alreadyBooked = await bookingsCollection.find(bookingQuery).toArray();
            // Code carefully: D
            options.forEach(option => {
                const optionBooked = alreadyBooked.filter(book => book.treatment === option.name);
                const bookedSlots = optionBooked.map(book => book.slot);

                const remainingSlots = option.slots.filter(slot => !bookedSlots.includes(slot) )

                option.slots = remainingSlots;
                // console.log(date, option.name, bookedSlots);
                // console.log(optionBooked);
                // const bookedSlots = 
            })
            
            // console.log(alreadyBooked)
            res.send(options);
        })

        /* 
            Naming Convention 
            bookings
            app.get('/bookings')
            app.get('/bookings/:id')
            app.post('/bookings')
            app.patch('/bookings/:id')
            app.delete('/bookings/:id')
        */

        app.post('/bookings', async(req, res)=>{
            // console.log(req)
            const booking = req.body;
            // console.log(booking);
            const query = {
                appointmentDate: booking.appointmentDate,
                email: booking.email, 
                treatment: booking.treatment
            }
            const alreadyBooked = await bookingsCollection.find(query).toArray();
            if(alreadyBooked.length){
                const message = `You already have a booking on ${booking.appointmentDate}`;
                return res.send({acknowledged: false, message})
            }
            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        })

    }
    finally{

    }
}
run().catch(err => console.error(err))


// Initial Route
app.get('/', async(req, res)=>{
    res.send("Doctors Portal Server is Running")
})

// Port Listening
app.listen(port, ()=>{
    console.log(`Doctors Portal Server is Running on Port ${port}`)
})