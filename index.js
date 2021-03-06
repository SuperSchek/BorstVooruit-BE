// Setup basic express server
const express = require('express')
const app = express()
const path = require('path')
const server = require('http').createServer(app)
const port = 2999
const io = require('socket.io')(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})

server.listen(port, () => {
  console.log('Server listening at port %d', port)
})

// Routing
app.use(express.static(path.join(__dirname, 'public')))

// Chatroom
let amountOfUsers = 0

io.on('connection', socket => {
  let userHasBeenAdded = false

  socket.on('checkAuthentication', () => {
    socket.emit('authenticationChecked', userHasBeenAdded)
  })

  /**
   * Handle user login
   */
  socket.on('addUser', username => {
    /**
     * Don't do anything if the user has already been added
     */
    if (userHasBeenAdded)
      return

    socket.username = username
    ++amountOfUsers
    userHasBeenAdded = true

    /**
     * Emit to client that user has logged in!   
     */
    socket.emit('userHasLoggedIn', {
      amountOfUsers
    })

    console.log(`${socket.username} has logged in.`)

    /**
     * Notify all clients that a new user has joined!
     */
    socket.broadcast.emit('userAdded', {
      username: socket.username,
      amountOfUsers
    })
  })

  /**
   * Handle user disconnection
   */
  socket.on('disconnect', () => {
    if (userHasBeenAdded) {
      --amountOfUsers

      /**
       * Emit to all clients that this user has left
       */
      socket.broadcast.emit('userLeft', {
        username: socket.username,
        amountOfUsers
      })
    }
  })

  /**
   * Emits message to all connected clients
   */
  socket.on('sendMessage', (data) => {
    socket.broadcast.emit('messageSent', {
      username: socket.username,
      message: data
    })
  })
})
