// Setup basic express server
const express = require('express')
const app = express()
const path = require('path')
const server = require('http').createServer(app)
const io = require('socket.io')(server)
const port = process.env.PORT || 3000

server.listen(port, () => {
  console.log('Server listening at port %d', port)
})

// Routing
app.use(express.static(path.join(__dirname, 'public')))

// Chatroom
let amountOfUsers = 0

io.on('connection', socket => {
  let userHasBeenAdded = false

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
    });

    /**
     * Notify all clients that a new user has joined!
     */
    socket.broadcast.emit('userAdded', {
      username: socket.username,
      amountOfUsers
    });
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

  socket.on('sendMessage', (data) => {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('MessageSent', {
      username: socket.username,
      message: data
    });
  });
})
