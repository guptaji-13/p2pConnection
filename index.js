import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { fileURLToPath } from 'url'
import path, { dirname } from 'path'
import nodeStatic from 'node-static'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const port = process.env.PORT || 5000

const fileServer = new nodeStatic.Server()
const app = express()
const http = createServer(app, function (req, res) {
  fileServer.serve(req, res)
}).listen(port)
const io = new Server(http, {
  allowEIO3: true
})

app.use(express.static(path.join(__dirname, '/public')))

const users = []

io.on('connection', (socket) => {
  users.push(socket.id)
  socket.broadcast.emit('update-users', { userIds: users })
  console.log('A user connected')

  socket.on('disconnect', () => {
    const userIndex = users.findIndex((user) => user === socket.id)
    users.splice(userIndex, 1)
    socket.broadcast.emit('update-users', { userIds: users })
    console.log('A user disconnected')
  })

  socket.on('mediaOffer', (data) => {
    socket.to(data.to).emit('mediaOffer', {
      from: data.from,
      offer: data.offer
    })
  })

  socket.on('mediaAnswer', (data) => {
    socket.to(data.to).emit('mediaAnswer', {
      from: data.from,
      answer: data.answer
    })
  })

  socket.on('iceCandidate', (data) => {
    socket.to(data.to).emit('remotePeerIceCandidate', {
      candidate: data.candidate
    })
  })

  socket.on('requestUserList', () => {
    socket.emit('update-users', { userIds: users })
    socket.broadcast.emit('update-users', { userIds: users })
  })
})

// http.listen(port, () => {
//   console.log(`listening on http://localhost:${port}`)
// })
