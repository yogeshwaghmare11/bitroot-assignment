const express = require('express');
const mysql = require('mysql');

const app = express();
const port = process.env.PORT || 3000;

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '4321',
  database: 'contactlist',
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to database');
});

app.use(express.json());

// Create new contact
app.post('/contacts', (req, res) => {
  const { firstname, image, numbers } = req.body;

  // Insert contact details into 'contacts' table
  const contactQuery = 'INSERT INTO contacts (firstname, image) VALUES (?, ?)';

  db.query(contactQuery, [firstname, image], (err, contactResult) => {
    if (err) {
      // Check for duplicate entry error
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Name already exists' });
      }
      console.error(err);
      return res.status(500).json({ error: 'Error creating contact' });
    }

    const contactid = contactResult.insertId;

    // Insert phone numbers into 'contnumber' table
    const phoneQuery =
      'INSERT INTO contnumber (contactid, numbers) VALUES (?, ?)';
    numbers.forEach((number) => {
      db.query(phoneQuery, [contactid, number], (err, phoneResult) => {
        if (err) {
          console.error(err);
        }
      });
    });

    return res.status(201).json({ message: 'Contact created successfully' });
  });
});

// Fetch all contacts
app.get('/contacts', (req, res) => {
  const fetchContactsQuery =
    'SELECT c.*, GROUP_CONCAT(cn.numbers) AS phone_numbers FROM contacts c LEFT JOIN contnumber cn ON c.contactid = cn.contactid GROUP BY c.contactid';
  db.query(fetchContactsQuery, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error fetching contacts' });
    }

    return res.status(200).json(results);
  });
});

// Update contact
app.put('/contacts/:id', (req, res) => {
  const contactid = req.params.id;
  const { firstname, image, numbers } = req.body;

  // Update contact details in 'contacts' table
  const updateContactQuery =
    'UPDATE contacts SET firstname = ?, image = ? WHERE contactid = ?';
  db.query(updateContactQuery, [firstname, image, contactid], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error updating contact' });
    }

    // Delete old phone numbers from 'contnumber' table
    const deletePhoneQuery = 'DELETE FROM contnumber WHERE contactid = ?';
    db.query(deletePhoneQuery, [contactid], (err, result) => {
      if (err) {
        console.error(err);
      }

      // Insert updated phone numbers into 'contnumber' table
      const phoneQuery =
        'INSERT INTO contnumber (contactid, numbers) VALUES (?, ?)';
      numbers.forEach((number) => {
        db.query(phoneQuery, [contactid, number], (err, result) => {
          if (err) {
            console.error(err);
          }
        });
      });
    });

    return res.status(200).json({ message: 'Contact updated successfully' });
  });
});

// Delete contact
app.delete('/contacts/:id', (req, res) => {
  const contactid = req.params.id;

  // Delete
  const deleteContactQuery = 'DELETE FROM contacts WHERE contactid = ?';
  db.query(deleteContactQuery, [contactid], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error deleting contact' });
    }

    // Delete associated phone number
    const deletePhoneQuery = 'DELETE FROM contnumber WHERE contactid = ?';
    db.query(deletePhoneQuery, [contactid], (err, result) => {
      if (err) {
        console.error(err);
      }
    });

    return res.status(200).json({ message: 'Contact deleted successfully' });
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});