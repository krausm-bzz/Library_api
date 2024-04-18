const express = require('express')
const app = express()
const port = 3001
const swaggerUi = require('swagger-ui-express')
const swaggerDocument = require('./swagger.json')
const session = require('express-session') // Pfade entsprechend anpassen
app.use('/swagger-ui/', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: {}
}))

function auhtentication (req, res, next) {
  if (isAuthenticated) {
    next()
  } else {
    res.status(401).send('Unautorisiert')
  }
}

const books = [
  { ISBN: '9780743273565', title: 'The Great Gatsby', year: 1925, author: 'F. Scott Fitzgerald' },
  { ISBN: '9780142437209', title: 'Moby-Dick', year: 1851, author: 'Herman Melville' },
  { ISBN: '9781982141238', title: '1984', year: 1949, author: 'George Orwell' },
  { ISBN: '9780553212454', title: 'Pride and Prejudice', year: 1813, author: 'Jane Austen' },
  { ISBN: '9780553299999', title: 'Blubla', year: 1999, author: 'Huha Hiha' },
  { ISBN: '9780451524935', title: 'To Kill a Mockingbird', year: 1960, author: 'Harper Lee' },
  { ISBN: '9780812504372', title: 'The Hobbit', year: 1937, author: 'J.R.R. Tolkien' },
  { ISBN: '9780061120084', title: 'The Catcher in the Rye', year: 1951, author: 'J.D. Salinger' },
  { ISBN: '9780062915094', title: 'The Alchemist', year: 1988, author: 'Paulo Coelho' },
  { ISBN: '9780739345007', title: 'The Da Vinci Code', year: 2003, author: 'Dan Brown' }
]

app.get('/books', (req, res) => {
  res.send(books)
})

app.get('/books/:isbn', (req, res) => {
  const isbn = req.params.isbn
  const book = books.find(book => book.ISBN === isbn)
  if (!book) {
    res.status(404).json({ error: 'Buch nicht gefunden' })
    return
  }
  res.json(book)
})

app.post('/books', (req, res) => {
  const { title, author } = req.body
  if (!title) {
    res.status(422).json({ error: 'Buchtitel ist erforderlich' })
    return
  }
  const book = { ...req.body }
  books.push(book)
  res.status(201).send(book)
})

app.put('/books/:isbn', (req, res) => {
  const isbn = req.params.isbn
  const index = books.findIndex(book => book.ISBN === isbn)
  const book = books[index]
  const newBook = { ...book, ...req.body }
  books[index] = newBook
  res.send(newBook)
})

app.delete('/books/:isbn', (req, res) => {
  const isbn = req.params.isbn
  const index = books.findIndex(book => book.ISBN === isbn)
  books.splice(index, 1)
})

app.patch('/books/:isbn', (req, res) => {
  const isbn = req.params.isbn
  const index = books.findIndex(book => book.ISBN === isbn)
  const book = books[index]
  const updatetBook = { ...book, ...req.body }
  books[index] = updatetBook
  res.send(updatetBook)
})
// -----------------------------------------------------------
// Lend
// -----------------------------------------------------------

app.use('/lends', auhtentication)

const lends = [
  {
    id: '1',
    customer_id: '123',
    isbn: '9780743273565',
    borrowed_at: new Date().toISOString(),
    returned_at: null
  },
  {
    id: '2',
    customer_id: '456',
    isbn: '9780142437209',
    borrowed_at: new Date().toISOString(),
    returned_at: null
  },
  {
    id: '3',
    customer_id: '789',
    isbn: '9781982141238',
    borrowed_at: new Date().toISOString(),
    returned_at: null
  },
  {
    id: '4',
    customer_id: '101',
    isbn: '9780553212454',
    borrowed_at: new Date().toISOString(),
    returned_at: null
  }
]

app.get('/lends', (req, res) => {
  res.send(lends)
})

app.get('/lends/:id', (req, res) => {
  const id = req.params.id
  const customer = lends.find(customer => customer.id === id)
  res.json(customer)
})

app.post('/lends', (req, res) => {
  const { customerId, isbn } = req.body
  if (!customerId || !isbn) {
    res.status(422).json({ error: 'Nicht alles ausgefüllt' })
  }
  const existingLend = lends.find(lend => lend.isbn === isbn && lend.returned_at === null)
  if (existingLend) {
    return res.status(400).json({ error: 'Buch ist bereits ausgeliehen' })
  }
  const existingBook = books.find(book => book.ISBN === isbn)
  if (!existingBook) {
    res.status(404).json({ error: 'Buch nicht gefunden' })
    return
  }
  const amountLends = lends.find(lend => lend.customer_id === customerId && lend.returned_at === null)
  if (amountLends >= 3) {
    return res.status(400).json({ error: 'Sie haben beriets 3 Bücher ausgeliehen' })
  }
  const id = (lends.length + 1).toString()
  const borrowedAt = new Date().toISOString()
  const newLend = { id, customerId, isbn, borrowedAt, returned_at: null }
  lends.push(newLend)
  res.json(newLend)
})

app.delete('/lends/:id', (req, res) => {
  const id = req.params.id
  const lend = lends.find(lend => lend.id === id)
  lend.returned_at = new Date().toISOString()
  res.json(lend)
})

// -----------------------------------------------------------
// Authentication
// -----------------------------------------------------------

const loginData = [{ email: 'desk@library.example', password: 'm295' }]
let isAuthenticated = false

app.post('/login', (req, res) => {
  const { email, password } = req.body
  const user = loginData.find(user => user.email === email && user.password === password)
  if (user) {
    req.session.user = user
    isAuthenticated = true
    res.status(201).json({ email: user.email })
  } else {
    res.status(401).send('Unautorisiert')
  }
})

app.get('/verify', (req, res) => {
  if (isAuthenticated) {
    res.status(201).json({ email: req.session.user.email })
  } else {
    res.status(401).send('Unautorisiert')
  }
})

app.delete('/logout', (req, res) => {
  isAuthenticated = false
  res.status(204).send('Unautorisiert')
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
